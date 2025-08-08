<template>
    <div class="housekeeper-assignments">
        <div class="card">
            <div class="card-header">
                <h5>Housekeeper Task Assignments</h5>
                <div class="assignment-controls">
                    <Button 
                        label="Refresh" 
                        icon="pi pi-refresh" 
                        @click="fetchData"
                        :loading="loading"
                        class="p-button-sm"
                    />
                    <Button 
                        label="Auto Assign" 
                        icon="pi pi-cog" 
                        @click="autoAssignRooms"
                        :disabled="unassignedRooms.length === 0"
                        class="p-button-sm p-button-outlined"
                    />
                </div>
            </div>

            <div class="assignment-content" v-if="!loading">
                <div class="assignment-layout">
                    <!-- Unassigned Rooms -->
                    <div class="unassigned-section">
                        <div class="section-header">
                            <h6>Unassigned Rooms ({{ unassignedRooms.length }})</h6>
                            <Button 
                                icon="pi pi-filter" 
                                @click="showFilters = !showFilters"
                                class="p-button-sm p-button-text"
                            />
                        </div>

                        <div v-if="showFilters" class="filters">
                            <div class="filter-group">
                                <label>Filter by Status:</label>
                                <MultiSelect 
                                    v-model="statusFilter" 
                                    :options="statusOptions"
                                    option-label="label"
                                    option-value="value"
                                    placeholder="All Statuses"
                                    class="filter-multiselect"
                                />
                            </div>
                            <div class="filter-group">
                                <label>Filter by Room Type:</label>
                                <MultiSelect 
                                    v-model="roomTypeFilter" 
                                    :options="roomTypeOptions"
                                    option-label="label"
                                    option-value="value"
                                    placeholder="All Room Types"
                                    class="filter-multiselect"
                                />
                            </div>
                        </div>

                        <div 
                            class="rooms-list unassigned-rooms"
                            @drop="onDropToUnassigned"
                            @dragover.prevent
                            @dragenter.prevent
                            @scroll="handleRoomsScroll"
                        >
                            <div 
                                v-for="room in filteredUnassignedRooms" 
                                :key="room.id"
                                class="room-item"
                                :class="[`status-${room.status.toLowerCase().replace(/[\s-]/g, '-')}`, { 'occupied': room.occupied }]"
                                draggable="true"
                                @dragstart="onDragStart(room, 'unassigned')"
                            >
                                <div class="room-info">
                                    <div class="room-number">{{ room.name }}</div>
                                    <div class="room-details">
                                        <span class="room-type">{{ room.roomType }}</span>
                                        <span class="room-status" :class="getStatusClass(room.status)">
                                            {{ room.status }}
                                        </span>
                                    </div>
                                </div>
                                <div class="room-meta">
                                    <div v-if="room.checkOutTime" class="checkout-time">
                                        <i class="pi pi-clock"></i>
                                        {{ formatTime(room.checkOutTime) }}
                                    </div>
                                    <div v-if="room.priority" class="priority" :class="`priority-${room.priority}`">
                                        {{ room.priority }} Priority
                                    </div>
                                </div>
                            </div>
                            
                            <div v-if="filteredUnassignedRooms.length === 0" class="empty-list">
                                <i class="pi pi-check-circle"></i>
                                <p>No unassigned rooms</p>
                            </div>
                        </div>
                    </div>

                    <!-- Housekeepers with Assignments -->
                    <div class="housekeepers-section">
                        <div class="section-header">
                            <h6>Housekeepers</h6>
                            <div class="housekeeper-summary">
                                {{ housekeepers.length }} housekeepers, {{ totalAssignedRooms }} assigned rooms
                            </div>
                        </div>

                        <div class="housekeepers-grid" @scroll="handleHousekeepersScroll">
                            <div 
                                v-for="housekeeper in housekeepers" 
                                :key="housekeeper.id"
                                class="housekeeper-card"
                                :class="{ 'overloaded': housekeeper.assignedRooms.length > housekeeper.maxCapacity }"
                            >
                                <div class="housekeeper-header">
                                    <div class="housekeeper-info">
                                        <div class="housekeeper-name">{{ housekeeper.name }}</div>
                                        <div class="housekeeper-status">
                                            <span class="status-indicator" :class="housekeeper.status"></span>
                                            {{ housekeeper.status }}
                                        </div>
                                    </div>
                                    <div class="assignment-count">
                                        {{ housekeeper.assignedRooms.length }}/{{ housekeeper.maxCapacity }}
                                    </div>
                                </div>

                                <div 
                                    class="assigned-rooms"
                                    @drop="onDropToHousekeeper($event, housekeeper)"
                                    @dragover.prevent
                                    @dragenter.prevent
                                >
                                    <div 
                                        v-for="room in housekeeper.assignedRooms" 
                                        :key="room.id"
                                        class="room-item assigned"
                                        :class="[`status-${room.status.toLowerCase().replace(/[\s-]/g, '-')}`, { 'occupied': room.occupied }]"
                                        draggable="true"
                                        @dragstart="onDragStart(room, housekeeper.id)"
                                    >
                                        <div class="room-info">
                                            <div class="room-number">{{ room.name }}</div>
                                            <div class="room-details">
                                                <span class="room-type">{{ room.roomType }}</span>
                                                <span class="room-status" :class="getStatusClass(room.status)">
                                                    {{ room.status }}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="assignment-actions">
                                            <Button 
                                                icon="pi pi-times" 
                                                @click="unassignRoom(room, housekeeper)"
                                                class="p-button-sm p-button-rounded p-button-text p-button-danger"
                                                v-tooltip="'Unassign room'"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div v-if="housekeeper.assignedRooms.length === 0" class="empty-assignments">
                                        <i class="pi pi-plus-circle"></i>
                                        <p>Drag rooms here to assign</p>
                                    </div>
                                </div>

                                <div class="housekeeper-actions">
                                    <Button 
                                        label="Clear All" 
                                        icon="pi pi-trash" 
                                        @click="clearAllAssignments(housekeeper)"
                                        :disabled="housekeeper.assignedRooms.length === 0"
                                        class="p-button-sm p-button-text p-button-danger"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="loading-state">
                <ProgressSpinner />
                <p>Loading assignments...</p>
            </div>
        </div>

        <!-- Confirmation Dialog -->
        <ConfirmDialog />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { HousekeepingV2Service } from '@/service/HousekeepingV2Service';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

const props = defineProps({
    autoRefresh: {
        type: Boolean,
        default: false
    },
    refreshInterval: {
        type: Number,
        default: 300000 // 5 minutes
    }
});

const emit = defineEmits(['assignment-updated', 'rooms-assigned']);

const housekeepingService = new HousekeepingV2Service();
const toast = useToast();
const confirm = useConfirm();

const loading = ref(false);
const showFilters = ref(false);
const housekeepers = ref([]);
const unassignedRooms = ref([]);
const statusFilter = ref([]);
const roomTypeFilter = ref([]);
const draggedRoom = ref(null);
const dragSource = ref(null);

const housekeepersPage = ref(1);
const roomsPage = ref(1);
const hasMoreHousekeepers = ref(true);
const hasMoreRooms = ref(true);
const loadingMoreHousekeepers = ref(false);
const loadingMoreRooms = ref(false);

const statusOptions = [
    { label: 'Dirty', value: 'Dirty' },
    { label: 'In Progress', value: 'In-Progress' },
    { label: 'Out of Service', value: 'Out-of-Service' }
];

const roomTypeOptions = ref([]);

const filteredUnassignedRooms = computed(() => {
    let filtered = unassignedRooms.value;
    
    if (statusFilter.value.length > 0) {
        filtered = filtered.filter(room => statusFilter.value.includes(room.status));
    }
    
    if (roomTypeFilter.value.length > 0) {
        filtered = filtered.filter(room => roomTypeFilter.value.includes(room.roomType));
    }
    
    return filtered;
});

const totalAssignedRooms = computed(() => {
    return housekeepers.value.reduce((total, hk) => total + hk.assignedRooms.length, 0);
});

onMounted(() => {
    fetchData();
    
    if (props.autoRefresh) {
        setInterval(fetchData, props.refreshInterval);
    }
});

const fetchData = async (isInitial = true) => {
    if (isInitial) {
        loading.value = true;
        housekeepersPage.value = 1;
        roomsPage.value = 1;
        hasMoreHousekeepers.value = true;
        hasMoreRooms.value = true;
        housekeepers.value = [];
        unassignedRooms.value = [];
    }

    try {
        const [housekeepersResponse, roomsResponse, assignmentsResponse] = await Promise.all([
            housekeepingService.getAvailableHousekeepers({ page: housekeepersPage.value }),
            housekeepingService.getRoomsWithStatus({ page: roomsPage.value }),
            housekeepingService.getHousekeepingAssignments()
        ]);

        if (housekeepersResponse && roomsResponse) {
            // Process housekeepers (normalize id & capacity)
            const newHousekeepers = (housekeepersResponse.data?.data || housekeepersResponse.data || []).map(hk => ({
                ...hk,
                id: hk.id ?? hk.housekeeperId ?? hk.user_id,
                maxCapacity: hk.maxCapacity ?? hk.capacity ?? hk.max_capacity ?? 10,
                assignedRooms: []
            }));
            housekeepers.value = isInitial ? newHousekeepers : [...housekeepers.value, ...newHousekeepers];
            hasMoreHousekeepers.value = !!(housekeepersResponse.links?.next || housekeepersResponse.next_page_url);

            // Process rooms
            const allRooms = roomsResponse.data || [];

            // Build assigned from assignments
            const assignedRoomIds = new Set();
            if (assignmentsResponse && assignmentsResponse.data) {
                const assignments = assignmentsResponse.data;
                assignments.forEach(assignment => {
                    const hkId = String(assignment.housekeeperId);
                    const housekeeper = housekeepers.value.find(hk => String(hk.id ?? hk.housekeeperId ?? hk.user_id) === hkId);
                    if (housekeeper) {
                        assignment.rooms.forEach(r => {
                            const room = {
                                id: r.id,
                                name: r.name ?? r.number ?? `Room ${r.id}`,
                                status: r.status,
                                roomType: typeof r.roomType === 'string' ? r.roomType : (r.roomType?.name ?? ''),
                                occupied: !!r.occupied,
                                checkOutTime: r.checkOutTime ?? r.check_out ?? null,
                                priority: r.priority ?? 'medium'
                            };
                            if (!housekeeper.assignedRooms.some(existing => existing.id === room.id)) {
                                housekeeper.assignedRooms.push(room);
                            }
                            assignedRoomIds.add(room.id);
                        });
                    }
                });
            }

            const newUnassignedRooms = allRooms
                .filter(room => !assignedRoomIds.has(room.id) && ['dirty', 'in-progress', 'out-of-service'].includes(String(room.status).toLowerCase()))
                .map(room => ({
                    id: room.id,
                    name: room.name,
                    status: room.status,
                    roomType: typeof room.roomType === 'string' ? room.roomType : (room.roomType?.name ?? ''),
                    occupied: !room.is_available,
                    checkOutTime: room.check_out,
                    priority: room.priority || 'medium'
                }));

            unassignedRooms.value = isInitial ? newUnassignedRooms : [...unassignedRooms.value, ...newUnassignedRooms];
            hasMoreRooms.value = !!(roomsResponse.links?.next || roomsResponse.next_page_url);

            // Extract room types for filter
            if (isInitial) {
                const roomTypes = [...new Set(allRooms.map(room => (typeof room.roomType === 'string' ? room.roomType : (room.roomType?.name ?? ''))))];
                roomTypeOptions.value = roomTypes.map(type => ({ label: type, value: type }));
            }
        } else {
            throw new Error('Failed to fetch assignment data');
        }
    } catch (error) {
        console.error('Error fetching assignment data:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load assignment data',
            life: 3000
        });
    } finally {
        loading.value = false;
        loadingMoreHousekeepers.value = false;
        loadingMoreRooms.value = false;
    }
};

const loadMoreHousekeepers = () => {
    if (loadingMoreHousekeepers.value || !hasMoreHousekeepers.value) return;
    loadingMoreHousekeepers.value = true;
    housekeepersPage.value += 1;
    fetchData(false);
};

const loadMoreRooms = () => {
    if (loadingMoreRooms.value || !hasMoreRooms.value) return;
    loadingMoreRooms.value = true;
    roomsPage.value += 1;
    fetchData(false);
};

const handleHousekeepersScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    if (scrollTop + clientHeight >= scrollHeight - 5) { // 5px buffer
        loadMoreHousekeepers();
    }
};

const handleRoomsScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    if (scrollTop + clientHeight >= scrollHeight - 5) { // 5px buffer
        loadMoreRooms();
    }
};

const onDragStart = (room, source) => {
    draggedRoom.value = room;
    dragSource.value = source;
};

const onDropToHousekeeper = async (event, housekeeper) => {
    event.preventDefault();
    
    if (!draggedRoom.value || dragSource.value === housekeeper.id) return;
    
    try {
        // Remove from source
        if (dragSource.value === 'unassigned') {
            const index = unassignedRooms.value.findIndex(r => r.id === draggedRoom.value.id);
            if (index !== -1) {
                unassignedRooms.value.splice(index, 1);
            }
        } else {
            const sourceHousekeeper = housekeepers.value.find(hk => hk.id === dragSource.value);
            if (sourceHousekeeper) {
                const index = sourceHousekeeper.assignedRooms.findIndex(r => r.id === draggedRoom.value.id);
                if (index !== -1) {
                    sourceHousekeeper.assignedRooms.splice(index, 1);
                }
            }
        }
        
        // Add to target housekeeper
        housekeeper.assignedRooms.push(draggedRoom.value);
        
        // Update backend
        await updateAssignment(housekeeper.id, housekeeper.assignedRooms.map(r => r.id));
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Room ${draggedRoom.value.name} assigned to ${housekeeper.name}`,
            life: 3000
        });
        
        emit('assignment-updated', {
            housekeeperId: housekeeper.id,
            housekeeperName: housekeeper.name,
            room: draggedRoom.value,
            action: 'assigned'
        });
        
    } catch (error) {
        console.error('Error assigning room:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to assign room',
            life: 3000
        });
        
        // Refresh data to restore state
        fetchData();
    }
    
    draggedRoom.value = null;
    dragSource.value = null;
};

const onDropToUnassigned = async (event) => {
    event.preventDefault();
    
    if (!draggedRoom.value || dragSource.value === 'unassigned') return;
    
    try {
        // Remove from source housekeeper
        const sourceHousekeeper = housekeepers.value.find(hk => hk.id === dragSource.value);
        if (sourceHousekeeper) {
            const index = sourceHousekeeper.assignedRooms.findIndex(r => r.id === draggedRoom.value.id);
            if (index !== -1) {
                sourceHousekeeper.assignedRooms.splice(index, 1);
            }
            
            // Update backend
            await updateAssignment(sourceHousekeeper.id, sourceHousekeeper.assignedRooms.map(r => r.id));
        }
        
        // Add to unassigned
        unassignedRooms.value.push(draggedRoom.value);
        
        toast.add({
            severity: 'info',
            summary: 'Room Unassigned',
            detail: `Room ${draggedRoom.value.name} moved to unassigned`,
            life: 3000
        });
        
        emit('assignment-updated', {
            room: draggedRoom.value,
            action: 'unassigned'
        });
        
    } catch (error) {
        console.error('Error unassigning room:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to unassign room',
            life: 3000
        });
        
        // Refresh data to restore state
        fetchData();
    }
    
    draggedRoom.value = null;
    dragSource.value = null;
};

const unassignRoom = async (room, housekeeper) => {
    try {
        const index = housekeeper.assignedRooms.findIndex(r => r.id === room.id);
        if (index !== -1) {
            housekeeper.assignedRooms.splice(index, 1);
            unassignedRooms.value.push(room);
            
            await updateAssignment(housekeeper.id, housekeeper.assignedRooms.map(r => r.id));
            
            toast.add({
                severity: 'info',
                summary: 'Room Unassigned',
                detail: `Room ${room.name} unassigned from ${housekeeper.name}`,
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error unassigning room:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to unassign room',
            life: 3000
        });
    }
};

const clearAllAssignments = (housekeeper) => {
    confirm.require({
        message: `Clear all room assignments for ${housekeeper.name}?`,
        header: 'Confirm Clear All',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                unassignedRooms.value.push(...housekeeper.assignedRooms);
                housekeeper.assignedRooms = [];
                
                await updateAssignment(housekeeper.id, []);
                
                toast.add({
                    severity: 'info',
                    summary: 'Assignments Cleared',
                    detail: `All assignments cleared for ${housekeeper.name}`,
                    life: 3000
                });
            } catch (error) {
                console.error('Error clearing assignments:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to clear assignments',
                    life: 3000
                });
            }
        }
    });
};

const autoAssignRooms = () => {
    confirm.require({
        message: 'Automatically assign unassigned rooms to available housekeepers?',
        header: 'Auto Assignment',
        icon: 'pi pi-question-circle',
        accept: async () => {
            try {
                // Simple auto-assignment logic: distribute rooms evenly
                const availableHousekeepers = housekeepers.value.filter(hk => 
                    hk.status === 'available' && hk.assignedRooms.length < hk.maxCapacity
                );
                
                if (availableHousekeepers.length === 0) {
                    toast.add({
                        severity: 'warn',
                        summary: 'No Available Housekeepers',
                        detail: 'All housekeepers are at capacity or unavailable',
                        life: 3000
                    });
                    return;
                }
                
                const roomsToAssign = [...unassignedRooms.value];
                let housekeeperIndex = 0;
                
                for (const room of roomsToAssign) {
                    const housekeeper = availableHousekeepers[housekeeperIndex];
                    
                    if (housekeeper.assignedRooms.length < housekeeper.maxCapacity) {
                        housekeeper.assignedRooms.push(room);
                        const roomIndex = unassignedRooms.value.findIndex(r => r.id === room.id);
                        if (roomIndex !== -1) {
                            unassignedRooms.value.splice(roomIndex, 1);
                        }
                        
                        await updateAssignment(housekeeper.id, housekeeper.assignedRooms.map(r => r.id));
                    }
                    
                    housekeeperIndex = (housekeeperIndex + 1) % availableHousekeepers.length;
                }
                
                toast.add({
                    severity: 'success',
                    summary: 'Auto Assignment Complete',
                    detail: `Assigned ${roomsToAssign.length} rooms automatically`,
                    life: 3000
                });
                
                emit('rooms-assigned', {
                    assignedCount: roomsToAssign.length,
                    method: 'auto'
                });
                
            } catch (error) {
                console.error('Error in auto assignment:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Auto Assignment Failed',
                    detail: 'Failed to automatically assign rooms',
                    life: 3000
                });
            }
        }
    });
};

const updateAssignment = async (housekeeperId, roomIds) => {
    const response = await housekeepingService.assignRoomsToHousekeeper(housekeeperId, roomIds);
    const ok = response?.status === 'success' || response?.success === true;
    if (!ok) {
        // Revert optimistic update on failure
        fetchData();
        throw new Error(response?.message || 'Failed to update assignment');
    }
    return response;
};

const getStatusClass = (status) => {
    return `status-${status.toLowerCase().replace(/[\s-]/g, '-')}`;
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
.housekeeper-assignments {
    margin-bottom: 2rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--surface-border);
}

.assignment-controls {
    display: flex;
    gap: 0.5rem;
}

.assignment-content {
    padding: 1.5rem;
}

.assignment-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    height: 70vh;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--surface-border);
}

.section-header h6 {
    margin: 0;
    color: var(--text-color);
}

.housekeeper-summary {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.filters {
    background: var(--surface-50);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.filter-group {
    margin-bottom: 1rem;
}

.filter-group:last-child {
    margin-bottom: 0;
}

.filter-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--text-color);
}

.filter-multiselect {
    width: 100%;
}

.rooms-list {
    max-height: calc(70vh - 200px);
    overflow-y: auto;
    padding: 0.5rem;
    border: 2px dashed var(--surface-border);
    border-radius: 8px;
    min-height: 150px;
}

.unassigned-rooms {
    background: #fef2f2;
    border-color: #fecaca;
}

.room-item {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    cursor: grab;
    transition: all 0.2s ease;
    position: relative;
}

.room-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.room-item:active {
    cursor: grabbing;
}

.room-item.status-clean {
    border-left: 4px solid #10b981;
}

.room-item.status-dirty {
    border-left: 4px solid #ef4444;
}

.room-item.status-in-progress {
    border-left: 4px solid #f59e0b;
}

.room-item.status-out-of-service {
    border-left: 4px solid #6b7280;
}

.room-item.occupied {
    background: linear-gradient(135deg, var(--surface-card) 0%, rgba(59, 130, 246, 0.1) 100%);
}

.room-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.room-number {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-color);
}

.room-details {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
}

.room-type {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.room-status {
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
}

.room-status.status-clean {
    background-color: #ecfdf5;
    color: #059669;
}

.room-status.status-dirty {
    background-color: #fef2f2;
    color: #dc2626;
}

.room-status.status-in-progress {
    background-color: #fffbeb;
    color: #d97706;
}

.room-status.status-out-of-service {
    background-color: #f9fafb;
    color: #4b5563;
}

.room-meta {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.checkout-time {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.priority {
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-weight: 600;
    text-transform: uppercase;
}

.priority-high {
    background-color: #fef2f2;
    color: #dc2626;
}

.priority-medium {
    background-color: #fffbeb;
    color: #d97706;
}

.priority-low {
    background-color: #f0f9ff;
    color: #0369a1;
}

.empty-list, .empty-assignments {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--text-color-secondary);
    text-align: center;
}

.empty-list i, .empty-assignments i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
}

.housekeepers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    max-height: calc(70vh - 100px);
    overflow-y: auto;
}

.housekeeper-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    height: fit-content;
}

.housekeeper-card.overloaded {
    border-color: #ef4444;
    background: linear-gradient(135deg, var(--surface-card) 0%, rgba(239, 68, 68, 0.1) 100%);
}

.housekeeper-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--surface-border);
}

.housekeeper-name {
    font-weight: 600;
    color: var(--text-color);
}

.housekeeper-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-indicator.available {
    background-color: #10b981;
}

.status-indicator.busy {
    background-color: #f59e0b;
}

.status-indicator.unavailable {
    background-color: #ef4444;
}

.assignment-count {
    font-weight: 600;
    color: var(--primary-color);
}

.assigned-rooms {
    flex: 1;
    min-height: 150px;
    max-height: 300px;
    overflow-y: auto;
    padding: 0.5rem;
    border: 2px dashed var(--surface-border);
    border-radius: 8px;
    background: #f0fdf4;
    border-color: #bbf7d0;
    margin-bottom: 1rem;
}

.room-item.assigned {
    position: relative;
}

.assignment-actions {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
}

.housekeeper-actions {
    display: flex;
    justify-content: flex-end;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
}

@media (max-width: 1024px) {
    .assignment-layout {
        grid-template-columns: 1fr;
        height: auto;
    }
    
    .housekeepers-grid {
        max-height: none;
    }
}

@media (max-width: 768px) {
    .card-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
    
    .assignment-controls {
        justify-content: center;
    }
    
    .housekeepers-grid {
        grid-template-columns: 1fr;
    }
    
    .section-header {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }
}
</style>
