<template>
    <div class="availability-calendar">
        <div class="card">
            <div class="card-header">
                <h5>Room Availability & Pricing Calendar</h5>
                <div class="calendar-controls">
                    <Calendar 
                        v-model="dateRange" 
                        selection-mode="range" 
                        :inline="false"
                        show-icon
                        placeholder="Select date range"
                        @date-select="fetchAvailabilityData"
                    />
                    <Button 
                        label="Refresh" 
                        icon="pi pi-refresh" 
                        @click="refreshData"
                        :loading="loading"
                    />
                </div>
            </div>

            <div class="calendar-content" v-if="!loading">
                <div class="calendar-table">
                    <div class="table-header">
                        <div class="room-type-column">Room Type</div>
                        <div 
                            v-for="date in calendarDates" 
                            :key="date"
                            class="date-column"
                        >
                            {{ formatDateHeader(date) }}
                        </div>
                    </div>

                    <div 
                        v-for="roomType in roomTypes" 
                        :key="roomType.id"
                        class="table-row"
                    >
                        <div class="room-type-cell">
                            <div class="room-type-name">{{ roomType.name }}</div>
                            <div class="room-type-total">{{ roomType.totalRooms }} rooms</div>
                        </div>
                        
                        <div 
                            v-for="date in calendarDates" 
                            :key="`${roomType.id}-${date}`"
                            class="availability-cell"
                            :class="getAvailabilityClass(roomType.id, date)"
                        >
                            <div class="availability-info">
                                <div class="available-count">
                                    {{ getAvailableCount(roomType.id, date) }} available
                                </div>
                                <div class="daily-rate">
                                    ₦{{ formatCurrency(getDailyRate(roomType.id, date)) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="loading-state">
                <ProgressSpinner />
                <p>Loading availability data...</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { DashboardV2Service } from '@/service/DashboardV2Service';
import { useToast } from 'primevue/usetoast';

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

const emit = defineEmits(['data-loaded', 'error']);

const dashboardService = new DashboardV2Service();
const toast = useToast();

const loading = ref(false);
const dateRange = ref([new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);
const availabilityData = ref({});
const roomTypes = ref([]);

const calendarDates = computed(() => {
    if (!dateRange.value || dateRange.value.length < 2) return [];
    
    const start = new Date(dateRange.value[0]);
    const end = new Date(dateRange.value[1]);
    const dates = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
    }
    
    return dates;
});

onMounted(() => {
    fetchAvailabilityData();
    
    if (props.autoRefresh) {
        setInterval(fetchAvailabilityData, props.refreshInterval);
    }
});

const fetchAvailabilityData = async () => {
    if (!dateRange.value || dateRange.value.length < 2) return;
    
    loading.value = true;
    try {
        const startDate = dateRange.value[0].toISOString().split('T')[0];
        const endDate = dateRange.value[1].toISOString().split('T')[0];
        
        const response = await dashboardService.getAvailabilityCalendar(startDate, endDate);
        
        if (response.success) {
            availabilityData.value = response.data.availability;
            roomTypes.value = response.data.roomTypes;
            emit('data-loaded', response.data);
        } else {
            throw new Error(response.message || 'Failed to fetch availability data');
        }
    } catch (error) {
        console.error('Error fetching availability data:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load availability data',
            life: 3000
        });
        emit('error', error);
    } finally {
        loading.value = false;
    }
};

const refreshData = () => {
    fetchAvailabilityData();
};

const formatDateHeader = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
};

const getAvailableCount = (roomTypeId, date) => {
    return availabilityData.value[roomTypeId]?.[date]?.available || 0;
};

const getDailyRate = (roomTypeId, date) => {
    return availabilityData.value[roomTypeId]?.[date]?.rate || 0;
};

const getAvailabilityClass = (roomTypeId, date) => {
    const available = getAvailableCount(roomTypeId, date);
    const total = roomTypes.value.find(rt => rt.id === roomTypeId)?.totalRooms || 0;
    const percentage = total > 0 ? (available / total) * 100 : 0;
    
    if (percentage === 0) return 'no-availability';
    if (percentage <= 25) return 'low-availability';
    if (percentage <= 50) return 'medium-availability';
    return 'high-availability';
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG').format(amount);
};
</script>

<style scoped>
.availability-calendar {
    margin-bottom: 2rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--surface-border);
}

.calendar-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.calendar-content {
    padding: 1rem;
}

.calendar-table {
    overflow-x: auto;
    border: 1px solid var(--surface-border);
    border-radius: 8px;
}

.table-header {
    display: flex;
    background-color: var(--surface-50);
    border-bottom: 2px solid var(--surface-border);
}

.table-row {
    display: flex;
    border-bottom: 1px solid var(--surface-border);
}

.room-type-column,
.room-type-cell {
    width: 200px;
    min-width: 200px;
    padding: 1rem;
    border-right: 1px solid var(--surface-border);
}

.room-type-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.room-type-total {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.date-column,
.availability-cell {
    width: 120px;
    min-width: 120px;
    padding: 0.75rem;
    border-right: 1px solid var(--surface-border);
    text-align: center;
}

.availability-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.available-count {
    font-size: 0.875rem;
    font-weight: 500;
}

.daily-rate {
    font-size: 0.75rem;
    color: var(--primary-color);
    font-weight: 600;
}

.no-availability {
    background-color: #fef2f2;
    color: #dc2626;
}

.low-availability {
    background-color: #fef3c7;
    color: #d97706;
}

.medium-availability {
    background-color: #dbeafe;
    color: #2563eb;
}

.high-availability {
    background-color: #dcfce7;
    color: #16a34a;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
}

@media (max-width: 768px) {
    .card-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
    
    .calendar-controls {
        justify-content: center;
    }
    
    .room-type-column,
    .room-type-cell {
        width: 150px;
        min-width: 150px;
    }
    
    .date-column,
    .availability-cell {
        width: 100px;
        min-width: 100px;
    }
}
</style>
