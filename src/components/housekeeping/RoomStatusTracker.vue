<template>
    <div class="room-status-tracker">
        <div class="card">
            <div class="card-header">
                <h5>Room Status Tracker</h5>
                <div class="status-controls">
                    <div class="status-legend">
                        <div class="legend-item">
                            <div class="status-indicator clean"></div>
                            <span>Clean</span>
                        </div>
                        <div class="legend-item">
                            <div class="status-indicator dirty"></div>
                            <span>Dirty</span>
                        </div>
                        <div class="legend-item">
                            <div class="status-indicator in-progress"></div>
                            <span>In Progress</span>
                        </div>
                        <div class="legend-item">
                            <div class="status-indicator maintenance"></div>
                            <span>Maintenance</span>
                        </div>
                    </div>
                    <Button 
                        label="Refresh" 
                        icon="pi pi-refresh" 
                        @click="fetchRoomStatuses"
                        :loading="loading"
                        class="p-button-sm"
                    />
                    <!-- Inline small spinner to indicate background fetching without unmounting content -->
                    <ProgressSpinner v-if="loading" style="width: 18px; height: 18px" strokeWidth="8" />
                </div>
            </div>

            <!-- Always render content; avoid v-if that unmounts inputs on loading -->
            <div class="room-status-content">
                <div class="status-summary">
                    <div class="summary-card clean">
                        <div class="summary-count">{{ displayCounts.clean }}</div>
                        <div class="summary-label">Clean</div>
                    </div>
                    <div class="summary-card dirty">
                        <div class="summary-count">{{ displayCounts.dirty }}</div>
                        <div class="summary-label">Dirty</div>
                    </div>
                    <div class="summary-card in-progress">
                        <div class="summary-count">{{ displayCounts.inProgress }}</div>
                        <div class="summary-label">In Progress</div>
                    </div>
                    <div class="summary-card maintenance">
                        <div class="summary-count">{{ displayCounts.maintenance }}</div>
                        <div class="summary-label">Maintenance</div>
                    </div>
                </div>

                <!-- Search and Filter Controls -->
                <div class="search-filter-controls">
                    <div class="search-field">
                        <InputText 
                            v-model="searchTerm" 
                            placeholder="Search by room number or type"
                            @input="onFilterInput"
                        />
                    </div>
                    <div class="status-filter">
                        <Dropdown 
                            v-model="statusFilter" 
                            :options="filterStatusOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="Filter by status"
                            @change="onFilterChange"
                        />
                    </div>
                </div>

                <div class="rooms-grid">
                    <div 
                        v-for="room in rooms" 
                        :key="room.id"
                        class="room-card"
                        :class="[`status-${room.status.toLowerCase().replace(/[\s-]/g, '-')}`, { 'occupied': room.occupied }]"
                        @click="showRoomDetails(room)"
                    >
                        <div class="room-header">
                            <div class="room-number">{{ room.number }}</div>
                            <div class="room-type">{{ room.roomType }}</div>
                        </div>
                        
                        <div class="room-status">
                            <div class="status-badge" :class="getStatusClass(room.status)">
                                {{ room.status }}
                            </div>
                            <div v-if="room.occupied" class="occupancy-badge">
                                Occupied
                            </div>
                        </div>
                        
                        <div class="room-details">
                            <div v-if="room.housekeeper" class="housekeeper-info">
                                <i class="pi pi-user"></i>
                                {{ room.housekeeper.name }}
                            </div>
                            <div v-if="room.lastCleaned" class="last-cleaned">
                                <i class="pi pi-clock"></i>
                                {{ formatDateTime(room.lastCleaned) }}
                            </div>
                            <div v-if="room.checkOutTime" class="checkout-time">
                                <i class="pi pi-sign-out"></i>
                                Check-out: {{ formatTime(room.checkOutTime) }}
                            </div>
                        </div>
                        
                        <div class="room-actions">
                            <Button 
                                icon="pi pi-pencil" 
                                @click.stop="editRoomStatus(room)"
                                class="p-button-sm p-button-outlined"
                                :disabled="updatingRoomId === room.id"
                            />
                        </div>
                    </div>
                </div>

                <!-- Pagination Controls -->
                <div class="pagination-controls">
                    <Button 
                        icon="pi pi-chevron-left" 
                        @click="changePage(pagination.current_page - 1)" 
                        :disabled="pagination.current_page === 1"
                        class="p-button-sm"
                    />
                    <span>Page {{ pagination.current_page }} of {{ pagination.last_page }}</span>
                    <Button 
                        icon="pi pi-chevron-right" 
                        @click="changePage(pagination.current_page + 1)" 
                        :disabled="pagination.current_page === pagination.last_page"
                        class="p-button-sm"
                    />
                </div>
            </div>

            <!-- Removed v-else loading-state that unmounted inputs on each fetch -->
        </div>

        <!-- Room Status Update Dialog -->
        <Dialog 
            v-model:visible="showStatusDialog" 
            modal 
            :style="{ width: '400px' }"
            header="Update Room Status"
        >
            <div class="status-form" v-if="selectedRoom">
                <div class="form-field">
                    <label>Room: {{ selectedRoom.number }} ({{ selectedRoom.roomType }})</label>
                </div>
                
                <div class="form-field">
                    <label for="newStatus">New Status</label>
                    <Dropdown 
                        id="newStatus"
                        v-model="newStatus" 
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Select Status"
                    />
                </div>
                
                <div class="form-field">
                    <label for="statusNotes">Notes (Optional)</label>
                    <Textarea 
                        id="statusNotes"
                        v-model="statusNotes" 
                        rows="3"
                        placeholder="Enter any notes about this status change"
                    />
                </div>
            </div>

            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    @click="showStatusDialog = false" 
                    class="p-button-text"
                />
                <Button 
                    label="Update Status" 
                    icon="pi pi-check" 
                    @click="updateRoomStatus"
                    :loading="updatingRoomId === selectedRoom?.id"
                />
            </template>
        </Dialog>

        <!-- Room Details Dialog -->
        <Dialog 
            v-model:visible="showDetailsDialog" 
            modal 
            :style="{ width: '600px' }"
            header="Room Details"
        >
            <div class="room-details-content" v-if="selectedRoom">
                <div class="details-grid">
                    <div class="detail-item">
                        <strong>Room Number:</strong>
                        <span>{{ selectedRoom.number }}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Room Type:</strong>
                        <span>{{ selectedRoom.roomType }}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Current Status:</strong>
                        <span class="status-badge" :class="getStatusClass(selectedRoom.status)">
                            {{ selectedRoom.status }}
                        </span>
                    </div>
                    <div class="detail-item">
                        <strong>Occupancy:</strong>
                        <span>{{ selectedRoom.occupied ? 'Occupied' : 'Vacant' }}</span>
                    </div>
                    <div class="detail-item" v-if="selectedRoom.housekeeper">
                        <strong>Assigned Housekeeper:</strong>
                        <span>{{ selectedRoom.housekeeper.name }}</span>
                    </div>
                    <div class="detail-item" v-if="selectedRoom.lastCleaned">
                        <strong>Last Cleaned:</strong>
                        <span>{{ formatDateTime(selectedRoom.lastCleaned) }}</span>
                    </div>
                    <div class="detail-item" v-if="selectedRoom.guestName">
                        <strong>Guest:</strong>
                        <span>{{ selectedRoom.guestName }}</span>
                    </div>
                    <div class="detail-item" v-if="selectedRoom.checkInTime">
                        <strong>Check-in:</strong>
                        <span>{{ formatDateTime(selectedRoom.checkInTime) }}</span>
                    </div>
                    <div class="detail-item" v-if="selectedRoom.checkOutTime">
                        <strong>Check-out:</strong>
                        <span>{{ formatDateTime(selectedRoom.checkOutTime) }}</span>
                    </div>
                </div>
                
                <div v-if="selectedRoom.notes" class="room-notes">
                    <strong>Notes:</strong>
                    <p>{{ selectedRoom.notes }}</p>
                </div>
            </div>

            <template #footer>
                <Button 
                    label="Close" 
                    icon="pi pi-times" 
                    @click="showDetailsDialog = false" 
                    class="p-button-text"
                />
                <Button 
                    label="Update Status" 
                    icon="pi pi-pencil" 
                    @click="editRoomStatusFromDetails"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { HousekeepingV2Service } from '@/service/HousekeepingV2Service';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    autoRefresh: {
        type: Boolean,
        default: true
    },
    refreshInterval: {
        type: Number,
        default: 60000 // 1 minute
    },
    // New: optionally receive precomputed counts from parent dashboard
    statusCounts: {
        type: Object,
        default: () => ({ clean: 0, dirty: 0, inProgress: 0, maintenance: 0 })
    }
});

const emit = defineEmits(['status-updated', 'room-selected']);

const housekeepingService = new HousekeepingV2Service();
const toast = useToast();

const loading = ref(false);
const rooms = ref([]);
const selectedRoom = ref(null);
const showStatusDialog = ref(false);
const showDetailsDialog = ref(false);
const newStatus = ref('');
const statusNotes = ref('');
const updatingRoomId = ref(null);

// Add pagination and filters
const page = ref(1);
const perPage = ref(8);
const searchTerm = ref('');
const statusFilter = ref('');
// Debounce timer for search input
let filterTimer;
// Interval id for auto refresh
let refreshTimerId;

const filterStatusOptions = [
    { label: 'All', value: '' },
   { label: 'Clean', value: 'clean' },
    { label: 'Dirty', value: 'dirty' },
    { label: 'In Progress', value: 'In-Progress' },
    { label: 'Maintenance', value: 'Maintenance' }
];
const pagination = ref({ current_page: 1, last_page: 1, per_page: perPage.value, total: 0 });

// Change page
const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.value.last_page) {
        page.value = newPage;
        fetchRoomStatuses();
    }
};

// Apply filters and reset page (used for dropdown changes or explicit actions)
const onFilterChange = () => {
    page.value = 1;
    fetchRoomStatuses();
};

// Debounced fetch for text input to avoid triggering a fetch on every key and UI flicker
const onFilterInput = () => {
    page.value = 1;
    if (filterTimer) clearTimeout(filterTimer);
    filterTimer = setTimeout(() => {
        fetchRoomStatuses();
    }, 400);
};

const statusOptions = [
     { label: 'Clean', value: 'clean' },
    { label: 'Dirty', value: 'dirty' },
    { label: 'In Progress', value: 'In-Progress' },
    { label: 'Maintenance', value: 'Maintenance' }
];

// Previously computed counts from rooms list
const calculatedCounts = computed(() => {
    const counts = {
        clean: 0,
        dirty: 0,
        inProgress: 0,
        maintenance: 0
    };
    rooms.value.forEach(room => {
        switch (room.status) {
            case 'Clean':
                counts.clean++;
                break;
            case 'Dirty':
                counts.dirty++;
                break;
            case 'In-Progress':
                counts.inProgress++;
                break;
            case 'Maintenance':
                counts.maintenance++;
                break;
        }
    });
    return counts;
});

// Display counts prioritize prop from dashboard stats
const displayCounts = computed(() => {
    const fromProps = props.statusCounts || {};
    const hasFromProps = ['clean','dirty','inProgress','maintenance'].some(k => typeof fromProps[k] === 'number' && fromProps[k] > 0);
    return hasFromProps ? fromProps : calculatedCounts.value;
});

onMounted(() => {
    fetchRoomStatuses();
    if (props.autoRefresh) {
        refreshTimerId = setInterval(fetchRoomStatuses, props.refreshInterval);
    }
});

onUnmounted(() => {
    if (refreshTimerId) clearInterval(refreshTimerId);
    if (filterTimer) clearTimeout(filterTimer);
});

const fetchRoomStatuses = async () => {
    loading.value = true;
    try {
        // Fetch with pagination, search, and status filter
        const params = { page: page.value, per_page: perPage.value };
        if (searchTerm.value) params.search = searchTerm.value;
        if (statusFilter.value) params.status = statusFilter.value;
        const response = await housekeepingService.getRoomsWithStatus(params);
        if (response) {
            // update pagination meta
            pagination.value.current_page = response.meta.current_page;
            pagination.value.last_page = response.meta.last_page;
            pagination.value.per_page = response.meta.per_page;
            pagination.value.total = response.meta.total;
            // map room items
            rooms.value = response.data.map(item => {
                const status = item.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
                const checkIn = item.check_in ? new Date(item.check_in) : null;
                const checkOut = item.check_out ? new Date(item.check_out) : null;
                const now = new Date();
                const occupied = checkIn && checkOut && now >= checkIn && now < checkOut;
                return {
                    id: item.id,
                    number: item.name,
                    roomType: item.roomType?.name || '',
                    status,
                    occupied: !!occupied,
                    housekeeper: null,
                    lastCleaned: null,
                    checkInTime: item.check_in,
                    checkOutTime: item.check_out,
                    guestName: null,
                    notes: null
                };
            });
        } else {
            throw new Error(response.message || 'Failed to fetch room statuses');
        }
    } catch (error) {
        console.error('Error fetching room statuses:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load room statuses',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const showRoomDetails = (room) => {
    selectedRoom.value = room;
    showDetailsDialog.value = true;
    emit('room-selected', room);
};

const editRoomStatus = (room) => {
    selectedRoom.value = room;
    newStatus.value = room.status;
    statusNotes.value = '';
    showStatusDialog.value = true;
};

const editRoomStatusFromDetails = () => {
    showDetailsDialog.value = false;
    editRoomStatus(selectedRoom.value);
};

const updateRoomStatus = async () => {
    if (!selectedRoom.value || !newStatus.value) return;
    
    updatingRoomId.value = selectedRoom.value.id;
    try {
        const response = await housekeepingService.updateRoomStatus(
            selectedRoom.value.id, 
            newStatus.value
        );
        
        if (response.status === 'success') {
            // Update local room status
            const roomIndex = rooms.value.findIndex(r => r.id === selectedRoom.value.id);
            if (roomIndex !== -1) {
                rooms.value[roomIndex].status = newStatus.value;
                rooms.value[roomIndex].lastUpdated = new Date().toISOString();
            }
            
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: `Room ${selectedRoom.value.number} status updated to ${newStatus.value}`,
                life: 3000
            });
            
            emit('status-updated', {
                roomId: selectedRoom.value.id,
                roomNumber: selectedRoom.value.number,
                oldStatus: selectedRoom.value.status,
                newStatus: newStatus.value,
                notes: statusNotes.value
            });
            
            showStatusDialog.value = false;
        } else {
            throw new Error(response.message || 'Failed to update room status');
        }
    } catch (error) {
        console.error('Error updating room status:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to update room status',
            life: 5000
        });
    } finally {
        updatingRoomId.value = null;
    }
};

const getStatusClass = (status) => {
    return `status-${status.toLowerCase().replace(/[\s-]/g, '-')}`;
};

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};
</script>

<style scoped>
.room-status-tracker {
    margin-bottom: 2rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--surface-border);
}

.status-controls {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.status-legend {
    display: flex;
    gap: 1rem;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.status-indicator.clean { background-color: #10b981; }
.status-indicator.dirty { background-color: #ef4444; }
.status-indicator.in-progress { background-color: #f59e0b; }
.status-indicator.maintenance { background-color: #6b7280; }

.room-status-content {
    padding: 1.5rem;
}

.status-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.summary-card {
    text-align: center;
    padding: 1rem;
    border-radius: 8px;
    border: 2px solid;
}

.summary-card.clean { 
    background-color: #ecfdf5; 
    border-color: #10b981; 
    color: #059669;
}

.summary-card.dirty { 
    background-color: #fef2f2; 
    border-color: #ef4444; 
    color: #dc2626;
}

.summary-card.in-progress { 
    background-color: #fffbeb; 
    border-color: #f59e0b; 
    color: #d97706;
}

.summary-card.maintenance { 
    background-color: #f9fafb; 
    border-color: #6b7280; 
    color: #4b5563;
}

.summary-count {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
}

.summary-label {
    font-size: 0.875rem;
    font-weight: 500;
}

.search-filter-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.search-field {
    flex: 1;
    min-width: 200px;
}

.status-filter {
    min-width: 150px;
}

.rooms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
}

.room-card {
    background: var(--surface-card);
    border: 2px solid var(--surface-border);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.room-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.room-card.status-clean {
    border-left-color: #10b981;
    border-left-width: 4px;
}

.room-card.status-dirty {
    border-left-color: #ef4444;
    border-left-width: 4px;
}

.room-card.status-in-progress {
    border-left-color: #f59e0b;
    border-left-width: 4px;
}

.room-card.status-maintenance {
    border-left-color: #6b7280;
    border-left-width: 4px;
}

.room-card.occupied {
    background: linear-gradient(135deg, var(--surface-card) 0%, rgba(59, 130, 246, 0.1) 100%);
}

.room-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.room-number {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-color);
}

.room-type {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.room-status {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-badge.status-clean {
    background-color: #ecfdf5;
    color: #059669;
}

.status-badge.status-dirty {
    background-color: #fef2f2;
    color: #dc2626;
}

.status-badge.status-in-progress {
    background-color: #fffbeb;
    color: #d97706;
}

.status-badge.status-maintenance {
    background-color: #f9fafb;
    color: #4b5563;
}

.occupancy-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    background-color: #dbeafe;
    color: #1d4ed8;
}

.room-details {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin-bottom: 0.75rem;
}

.room-details > div {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
}

.room-details > div:last-child {
    margin-bottom: 0;
}

.room-actions {
    display: flex;
    justify-content: flex-end;
}

.status-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-field label {
    font-weight: 500;
    color: var(--text-color);
}

.room-details-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.detail-item strong {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

.room-notes {
    padding: 1rem;
    background: var(--surface-50);
    border-radius: 8px;
}

.room-notes p {
    margin: 0.5rem 0 0 0;
    color: var(--text-color-secondary);
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
}

.pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
}

@media (max-width: 768px) {
    .card-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
    
    .status-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }
    
    .status-legend {
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .rooms-grid {
        grid-template-columns: 1fr;
    }
    
    .details-grid {
        grid-template-columns: 1fr;
    }
}
</style>
