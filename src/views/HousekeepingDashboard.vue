<template>
    <div class="housekeeping-dashboard">
        <!-- Dashboard Header -->
        <div class="dashboard-header">
            <div class="header-content">
                <div class="header-title">
                    <h2>Housekeeping Management</h2>
                    <p>Real-time room status tracking and task assignments</p>
                </div>
                <div class="header-actions">
                    <Button 
                        label="Export Report" 
                        icon="pi pi-download" 
                        @click="exportHousekeepingReport"
                        class="p-button-outlined"
                    />
                    <Button 
                        label="Refresh" 
                        icon="pi pi-refresh" 
                        @click="refreshAllData"
                        :loading="refreshing"
                    />
                </div>
            </div>
        </div>

        <!-- Housekeeping Overview -->
        <div class="overview-section">
            <div class="overview-cards">
                <div class="overview-card total-rooms">
                    <div class="card-icon">
                        <i class="pi pi-home"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-value">{{ housekeepingStats.totalRooms }}</div>
                        <div class="card-label">Total Rooms</div>
                    </div>
                </div>

                <div class="overview-card clean-rooms">
                    <div class="card-icon">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-value">{{ housekeepingStats.cleanRooms }}</div>
                        <div class="card-label">Clean Rooms</div>
                        <div class="card-percentage">{{ cleanPercentage }}%</div>
                    </div>
                </div>

                <div class="overview-card dirty-rooms">
                    <div class="card-icon">
                        <i class="pi pi-times-circle"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-value">{{ housekeepingStats.dirtyRooms }}</div>
                        <div class="card-label">Dirty Rooms</div>
                        <div class="card-percentage">{{ dirtyPercentage }}%</div>
                    </div>
                </div>

                <div class="overview-card in-progress">
                    <div class="card-icon">
                        <i class="pi pi-clock"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-value">{{ housekeepingStats.inProgressRooms }}</div>
                        <div class="card-label">In Progress</div>
                        <div class="card-percentage">{{ inProgressPercentage }}%</div>
                    </div>
                </div>

                <div class="overview-card housekeepers">
                    <div class="card-icon">
                        <i class="pi pi-users"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-value">{{ housekeepingStats.activeHousekeepers }}</div>
                        <div class="card-label">Active Housekeepers</div>
                        <div class="card-detail">{{ housekeepingStats.totalHousekeepers }} total</div>
                    </div>
                </div>

                <div class="overview-card efficiency">
                    <div class="card-icon">
                        <i class="pi pi-chart-line"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-value">{{ housekeepingStats.efficiency }}%</div>
                        <div class="card-label">Efficiency Rate</div>
                        <div class="card-change positive" v-if="housekeepingStats.efficiencyChange >= 0">
                            +{{ housekeepingStats.efficiencyChange }}% vs yesterday
                        </div>
                        <div class="card-change negative" v-else>
                            {{ housekeepingStats.efficiencyChange }}% vs yesterday
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Room Status Tracker -->
            <div class="content-section full-width">
                <RoomStatusTracker 
                    :auto-refresh="true"
                    :refresh-interval="60000"
                    :status-counts="statusCounts"
                    @status-updated="onRoomStatusUpdated"
                    @room-selected="onRoomSelected"
                />
            </div>

            <!-- Housekeeper Assignments -->
            <div class="content-section full-width">
                <HousekeeperAssignments 
                    :auto-refresh="false"
                    :refresh-interval="300000"
                    @assignment-updated="onAssignmentUpdated"
                    @rooms-assigned="onRoomsAssigned"
                />
            </div>

            <!-- Performance Metrics -->
            <div class="content-section half-width">
                <div class="card">
                    <div class="card-header">
                        <h5>Performance Metrics</h5>
                        <Dropdown 
                            v-model="selectedPeriod" 
                            :options="periodOptions" 
                            option-label="label" 
                            option-value="value"
                            @change="loadPerformanceMetrics"
                            class="period-selector"
                        />
                    </div>
                    <div class="performance-content">
                        <div class="metric-item">
                            <div class="metric-header">
                                <span class="metric-name">Average Cleaning Time</span>
                                <span class="metric-value">{{ performanceMetrics.avgCleaningTime }} min</span>
                            </div>
                            <ProgressBar 
                                :value="avgCleaningTimeProgress" 
                                class="metric-progress"
                            />
                        </div>

                        <div class="metric-item">
                            <div class="metric-header">
                                <span class="metric-name">Rooms Cleaned Today</span>
                                <span class="metric-value">{{ performanceMetrics.roomsCleanedToday }}</span>
                            </div>
                            <ProgressBar 
                                :value="roomsCleanedProgress" 
                                class="metric-progress"
                            />
                        </div>

                        <div class="metric-item">
                            <div class="metric-header">
                                <span class="metric-name">Quality Score</span>
                                <span class="metric-value">{{ performanceMetrics.qualityScore }}%</span>
                            </div>
                            <ProgressBar 
                                :value="performanceMetrics.qualityScore" 
                                class="metric-progress"
                            />
                        </div>

                        <div class="metric-item">
                            <div class="metric-header">
                                <span class="metric-name">On-Time Completion</span>
                                <span class="metric-value">{{ performanceMetrics.onTimeCompletion }}%</span>
                            </div>
                            <ProgressBar 
                                :value="performanceMetrics.onTimeCompletion" 
                                class="metric-progress"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Performers -->
            <div class="content-section half-width">
                <div class="card">
                    <div class="card-header">
                        <h5>Top Performers</h5>
                        <Button 
                            label="View All" 
                            icon="pi pi-external-link" 
                            @click="viewAllPerformers"
                            class="p-button-sm p-button-text"
                        />
                    </div>
                    <div class="performers-content">
                        <div 
                            v-for="(performer, index) in topPerformers" 
                            :key="performer.id"
                            class="performer-item"
                        >
                            <div class="performer-rank">
                                <div class="rank-badge" :class="`rank-${index + 1}`">
                                    {{ index + 1 }}
                                </div>
                            </div>
                            <div class="performer-info">
                                <div class="performer-name">{{ performer.name }}</div>
                                <div class="performer-stats">
                                    <span>{{ performer.roomsCleaned }} rooms</span>
                                    <span>{{ performer.avgTime }} min avg</span>
                                    <span>{{ performer.score }}% score</span>
                                </div>
                            </div>
                            <div class="performer-score">
                                <div class="score-circle" :class="getScoreClass(performer.score)">
                                    {{ performer.score }}%
                                </div>
                            </div>
                        </div>

                        <div v-if="topPerformers.length === 0" class="no-performers">
                            <i class="pi pi-users"></i>
                            <p>No performance data available</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activities -->
            <div class="content-section full-width">
                <div class="card">
                    <div class="card-header">
                        <h5>Recent Housekeeping Activities</h5>
                        <div class="activity-filters">
                            <MultiSelect 
                                v-model="activityFilters" 
                                :options="activityTypeOptions"
                                option-label="label"
                                option-value="value"
                                placeholder="Filter activities"
                                class="activity-filter"
                            />
                            <Button 
                                label="Clear" 
                                icon="pi pi-times" 
                                @click="clearActivityFilters"
                                :disabled="activityFilters.length === 0"
                                class="p-button-sm p-button-text"
                            />
                        </div>
                    </div>
                    <div class="activities-content">
                        <DataTable 
                            :value="filteredActivities" 
                            :paginator="true" 
                            :rows="10"
                            responsive-layout="scroll"
                            class="activities-table"
                        >
                            <Column field="timestamp" header="Time" :sortable="true">
                                <template #body="{ data }">
                                    {{ formatDateTime(data.timestamp) }}
                                </template>
                            </Column>
                            <Column field="type" header="Activity Type" :sortable="true">
                                <template #body="{ data }">
                                    <div class="activity-type" :class="data.type">
                                        <i :class="getActivityIcon(data.type)"></i>
                                        {{ formatActivityType(data.type) }}
                                    </div>
                                </template>
                            </Column>
                            <Column field="room" header="Room" :sortable="true">
                                <template #body="{ data }">
                                    <span class="room-number">{{ data.room }}</span>
                                </template>
                            </Column>
                            <Column field="housekeeper" header="Housekeeper" :sortable="true" />
                            <Column field="description" header="Description" />
                            <Column field="duration" header="Duration">
                                <template #body="{ data }">
                                    <span v-if="data.duration">{{ data.duration }} min</span>
                                    <span v-else>-</span>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>

        <!-- Export Dialog -->
        <Dialog 
            v-model:visible="showExportDialog" 
            modal 
            header="Export Housekeeping Report"
            :style="{ width: '400px' }"
        >
            <div class="export-options">
                <div class="export-field">
                    <label>Report Type:</label>
                    <Dropdown 
                        v-model="exportConfig.type" 
                        :options="exportTypeOptions" 
                        option-label="label" 
                        option-value="value"
                        placeholder="Select report type"
                    />
                </div>
                <div class="export-field">
                    <label>Date Range:</label>
                    <Calendar 
                        v-model="exportConfig.dateRange" 
                        selection-mode="range" 
                        show-icon
                        placeholder="Select date range"
                    />
                </div>
                <div class="export-field">
                    <label>Format:</label>
                    <Dropdown 
                        v-model="exportConfig.format" 
                        :options="exportFormatOptions" 
                        option-label="label" 
                        option-value="value"
                        placeholder="Select format"
                    />
                </div>
            </div>
            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    @click="showExportDialog = false" 
                    class="p-button-text"
                />
                <Button 
                    label="Export" 
                    icon="pi pi-download" 
                    @click="performExport"
                    :loading="exporting"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import RoomStatusTracker from '@/components/housekeeping/RoomStatusTracker.vue';
import HousekeeperAssignments from '@/components/housekeeping/HousekeeperAssignments.vue';
import { HousekeepingV2Service } from '@/service/HousekeepingV2Service';

const housekeepingService = new HousekeepingV2Service();

const router = useRouter();
const toast = useToast();

const refreshing = ref(false);
const selectedPeriod = ref('today');
const activityFilters = ref([]);
const showExportDialog = ref(false);
const exporting = ref(false);

// Data
const housekeepingStats = ref({
    totalRooms: 200,
    cleanRooms: 156,
    dirtyRooms: 32,
    inProgressRooms: 8,
    outOfServiceRooms: 4,
    activeHousekeepers: 12,
    totalHousekeepers: 15,
    efficiency: 87,
    efficiencyChange: 3.2
});

// Status counts to feed RoomStatusTracker (sourced from backend stats via service)
const statusCounts = ref({ clean: 0, dirty: 0, inProgress: 0, maintenance: 0 });

const performanceMetrics = ref({
    avgCleaningTime: 35,
    roomsCleanedToday: 45,
    targetRooms: 60,
    qualityScore: 92,
    onTimeCompletion: 88
});

const topPerformers = ref([
    {
        id: 1,
        name: 'Sarah Johnson',
        roomsCleaned: 8,
        avgTime: 28,
        score: 96
    },
    {
        id: 2,
        name: 'Michael Chen',
        roomsCleaned: 7,
        avgTime: 32,
        score: 94
    },
    {
        id: 3,
        name: 'Maria Rodriguez',
        roomsCleaned: 6,
        avgTime: 30,
        score: 91
    },
    {
        id: 4,
        name: 'James Wilson',
        roomsCleaned: 6,
        avgTime: 35,
        score: 89
    },
    {
        id: 5,
        name: 'Emily Davis',
        roomsCleaned: 5,
        avgTime: 33,
        score: 87
    }
]);

const recentActivities = ref([
    {
        id: 1,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        type: 'status_update',
        room: '205',
        housekeeper: 'Sarah Johnson',
        description: 'Room marked as clean',
        duration: 28
    },
    {
        id: 2,
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        type: 'assignment',
        room: '308',
        housekeeper: 'Michael Chen',
        description: 'Room assigned for cleaning',
        duration: null
    },
    {
        id: 3,
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        type: 'status_update',
        room: '102',
        housekeeper: 'Maria Rodriguez',
        description: 'Cleaning started',
        duration: null
    },
    {
        id: 4,
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
        type: 'status_update',
        room: '415',
        housekeeper: 'James Wilson',
        description: 'Room marked as clean',
        duration: 42
    },
    {
        id: 5,
        timestamp: new Date(Date.now() - 48 * 60 * 1000),
        type: 'maintenance',
        room: '301',
        housekeeper: 'Emily Davis',
        description: 'Maintenance request submitted',
        duration: null
    }
]);

const exportConfig = ref({
    type: '',
    dateRange: [],
    format: 'pdf'
});

// Options
const periodOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' }
];

const activityTypeOptions = [
    { label: 'Status Updates', value: 'status_update' },
    { label: 'Assignments', value: 'assignment' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Quality Check', value: 'quality_check' }
];

const exportTypeOptions = [
    { label: 'Performance Report', value: 'performance' },
    { label: 'Room Status Report', value: 'room_status' },
    { label: 'Staff Report', value: 'staff' },
    { label: 'Complete Report', value: 'complete' }
];

const exportFormatOptions = [
    { label: 'PDF', value: 'pdf' },
    { label: 'Excel', value: 'xlsx' },
    { label: 'CSV', value: 'csv' }
];

// Computed
const cleanPercentage = computed(() => {
    return housekeepingStats.value.cleanPct ?? Math.round((housekeepingStats.value.cleanRooms / housekeepingStats.value.totalRooms) * 100);
});

const dirtyPercentage = computed(() => {
    return housekeepingStats.value.dirtyPct ?? Math.round((housekeepingStats.value.dirtyRooms / housekeepingStats.value.totalRooms) * 100);
});

const inProgressPercentage = computed(() => {
    return housekeepingStats.value.inProgressPct ?? Math.round((housekeepingStats.value.inProgressRooms / housekeepingStats.value.totalRooms) * 100);
});

// Round progress values to whole percent and clamp 0-100
const avgCleaningTimeProgress = computed(() => {
    const v = (performanceMetrics.value.avgCleaningTime / 60) * 100;
    return Math.max(0, Math.min(100, Math.round(v)));
});

const roomsCleanedProgress = computed(() => {
    const denom = performanceMetrics.value.targetRooms || 1;
    const v = (performanceMetrics.value.roomsCleanedToday / denom) * 100;
    return Math.max(0, Math.min(100, Math.round(v)));
});

const filteredActivities = computed(() => {
    if (activityFilters.value.length === 0) {
        return recentActivities.value;
    }
    return recentActivities.value.filter(activity => 
        activityFilters.value.includes(activity.type)
    );
});

// Derived counts for RoomStatusTracker from backend stats
onMounted(() => {
    loadHousekeepingData();
});

// Methods
const loadHousekeepingData = async ({ date } = {}) => {
    try {
        const stats = await housekeepingService.getHousekeepingStats(date ? { date } : {});
        // Map primary dashboard stats
        housekeepingStats.value = {
            totalRooms: stats.totalRooms ?? 0,
            cleanRooms: stats.cleanRooms?.count ?? 0,
            dirtyRooms: stats.dirtyRooms?.count ?? 0,
            inProgressRooms: stats.inProgressRooms?.count ?? 0,
            maintenanceRooms: stats.maintenanceRooms?.count ?? 0,
            outOfServiceRooms: 0, // not provided by current API
            activeHousekeepers: stats.activeHousekeepers?.active ?? 0,
            totalHousekeepers: stats.activeHousekeepers?.total ?? 0,
            efficiency: stats.efficiencyRate?.percentage ?? 0,
            efficiencyChange: stats.efficiencyRate?.deltaVsYesterday ?? 0,
            // Use backend-provided percentages when available
            cleanPct: stats.cleanRooms?.percentage ?? null,
            dirtyPct: stats.dirtyRooms?.percentage ?? null,
            inProgressPct: stats.inProgressRooms?.percentage ?? null,
            maintenancePct: stats.maintenanceRooms?.percentage ?? null,
            asOf: stats.asOf
        };
        // Derive summary counts via reusable service helper
        statusCounts.value = housekeepingService.getStatusCountsFromStats(stats);

        // Update Performance Metrics using available fields from stats
        performanceMetrics.value = {
            avgCleaningTime: performanceMetrics.value.avgCleaningTime, // not provided by API yet
            roomsCleanedToday: stats.cleanRooms?.count ?? performanceMetrics.value.roomsCleanedToday,
            targetRooms: stats.totalRooms ?? performanceMetrics.value.targetRooms,
            qualityScore: performanceMetrics.value.qualityScore, // not provided by API yet
            onTimeCompletion: stats.efficiencyRate?.percentage ?? performanceMetrics.value.onTimeCompletion
        };
    } catch (error) {
        console.error('Error loading housekeeping stats:', error);
        toast.add({
            severity: 'error',
            summary: 'Load Failed',
            detail: 'Could not load housekeeping stats',
            life: 3000,
        });
    }
};

const refreshAllData = async () => {
    refreshing.value = true;
    try {
        await loadHousekeepingData();
        toast.add({
            severity: 'success',
            summary: 'Data Refreshed',
            detail: 'All housekeeping data has been updated',
            life: 3000
        });
    } catch (error) {
        console.error('Error refreshing data:', error);
        toast.add({
            severity: 'error',
            summary: 'Refresh Failed',
            detail: 'Failed to refresh housekeeping data',
            life: 3000
        });
    } finally {
        refreshing.value = false;
    }
};

const loadPerformanceMetrics = async () => {
    // Use stats endpoint with a date derived from selectedPeriod
    let dateStr = new Date();
    if (selectedPeriod.value === 'yesterday') {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        dateStr = d;
    } else {
        // For 'today', 'week', 'month' default to today for now (API accepts a single date)
        dateStr = new Date();
    }
    const date = dateStr.toISOString().slice(0, 10);
    await loadHousekeepingData({ date });
};

const exportHousekeepingReport = () => {
    showExportDialog.value = true;
};

const performExport = async () => {
    exporting.value = true;
    try {
        // Simulate export process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast.add({
            severity: 'success',
            summary: 'Export Complete',
            detail: 'Housekeeping report has been downloaded',
            life: 3000
        });
        
        showExportDialog.value = false;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Export Failed',
            detail: 'Failed to export housekeeping report',
            life: 3000
        });
    } finally {
        exporting.value = false;
    }
};

const viewAllPerformers = () => {
    router.push('/housekeeping/performance');
};

const clearActivityFilters = () => {
    activityFilters.value = [];
};

const onRoomStatusUpdated = (event) => {
    console.log('Room status updated:', event);
    toast.add({
        severity: 'info',
        summary: 'Room Status Updated',
        detail: `Room ${event.roomNumber} status changed to ${event.newStatus}`,
        life: 3000
    });
    
    // Update stats
    loadHousekeepingData();
};

const onRoomSelected = (room) => {
    console.log('Room selected:', room);
};

const onAssignmentUpdated = (event) => {
    console.log('Assignment updated:', event);
    
    if (event.action === 'assigned') {
        toast.add({
            severity: 'success',
            summary: 'Room Assigned',
            detail: `Room ${event.room.number} assigned to ${event.housekeeperName}`,
            life: 3000
        });
    } else if (event.action === 'unassigned') {
        toast.add({
            severity: 'info',
            summary: 'Room Unassigned',
            detail: `Room ${event.room.number} has been unassigned`,
            life: 3000
        });
    }
};

const onRoomsAssigned = (event) => {
    toast.add({
        severity: 'success',
        summary: 'Auto Assignment Complete',
        detail: `${event.assignedCount} rooms assigned automatically`,
        life: 3000
    });
};

const getScoreClass = (score) => {
    if (score >= 95) return 'excellent';
    if (score >= 90) return 'good';
    if (score >= 80) return 'average';
    return 'poor';
};

const getActivityIcon = (type) => {
    switch (type) {
        case 'status_update': return 'pi pi-refresh';
        case 'assignment': return 'pi pi-user-plus';
        case 'maintenance': return 'pi pi-wrench';
        case 'quality_check': return 'pi pi-star';
        default: return 'pi pi-circle';
    }
};

const formatActivityType = (type) => {
    return type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
</script>

<style scoped>
.housekeeping-dashboard {
    padding: 1.5rem;
    background: var(--surface-ground);
    min-height: 100vh;
}

.dashboard-header {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: var(--surface-card);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-title h2 {
    margin: 0 0 0.5rem 0;
    color: var(--text-color);
    font-size: 1.75rem;
}

.header-title p {
    margin: 0;
    color: var(--text-color-secondary);
    font-size: 1rem;
}

.header-actions {
    display: flex;
    gap: 0.75rem;
}

.overview-section {
    margin-bottom: 2rem;
}

.overview-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.overview-card {
    background: var(--surface-card);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.2s ease;
}

.overview-card:hover {
    transform: translateY(-2px);
}

.overview-card.total-rooms {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    color: white;
}

.overview-card.clean-rooms {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
}

.overview-card.dirty-rooms {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
}

.overview-card.in-progress {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
}

.overview-card.housekeepers {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
}

.overview-card.efficiency {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
}

.card-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    font-size: 1.25rem;
}

.card-content {
    flex: 1;
}

.card-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
}

.card-label {
    font-size: 0.875rem;
    opacity: 0.9;
    margin-bottom: 0.25rem;
}

.card-percentage,
.card-detail,
.card-change {
    font-size: 0.75rem;
    opacity: 0.8;
}

.card-change {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.main-content {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1.5rem;
}

.content-section.full-width {
    grid-column: 1 / -1;
}

.content-section.half-width {
    grid-column: span 6;
}

.card {
    background: var(--surface-card);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.card-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--surface-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h5 {
    margin: 0;
    color: var(--text-color);
    font-weight: 600;
}

.performance-content {
    padding: 1.5rem;
}

.metric-item {
    margin-bottom: 1.5rem;
}

.metric-item:last-child {
    margin-bottom: 0;
}

.metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.metric-name {
    font-weight: 500;
    color: var(--text-color);
}

.metric-value {
    font-weight: 600;
    color: var(--primary-color);
}

.metric-progress {
    height: 8px;
}

.performers-content {
    padding: 1.5rem;
    max-height: 400px;
    overflow-y: auto;
}

.performer-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--surface-border);
}

.performer-item:last-child {
    border-bottom: none;
}

.performer-rank {
    width: 40px;
    text-align: center;
}

.rank-badge {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: white;
}

.rank-badge.rank-1 {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.rank-badge.rank-2 {
    background: linear-gradient(135deg, #94a3b8, #64748b);
}

.rank-badge.rank-3 {
    background: linear-gradient(135deg, #fdba74, #ea580c);
}

.rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
    background: linear-gradient(135deg, #a1a1aa, #71717a);
}

.performer-info {
    flex: 1;
}

.performer-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.performer-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.performer-score {
    width: 60px;
    text-align: center;
}

.score-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.75rem;
    color: white;
}

.score-circle.excellent {
    background: linear-gradient(135deg, #10b981, #059669);
}

.score-circle.good {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.score-circle.average {
    background: linear-gradient(135deg, #f59e0b, #d97706);
}

.score-circle.poor {
    background: linear-gradient(135deg, #ef4444, #dc2626);
}

.no-performers {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--text-color-secondary);
    text-align: center;
}

.no-performers i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
}

.activities-content {
    padding: 1.5rem;
}

.activity-filters {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.activity-filter {
    width: 200px;
}

.activity-type {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
}

.activity-type.status_update {
    background-color: #dbeafe;
    color: #1d4ed8;
}

.activity-type.assignment {
    background-color: #dcfce7;
    color: #059669;
}

.activity-type.maintenance {
    background-color: #fef3c7;
    color: #d97706;
}

.activity-type.quality_check {
    background-color: #fae8ff;
    color: #a855f7;
}

.room-number {
    font-weight: 600;
    color: var(--primary-color);
}

.export-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.export-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.export-field label {
    font-weight: 500;
    color: var(--text-color);
}

@media (max-width: 1024px) {
    .content-section.half-width {
        grid-column: 1 / -1;
    }
    
    .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
}

@media (max-width: 768px) {
    .housekeeping-dashboard {
        padding: 1rem;
    }
    
    .overview-cards {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
    
    .overview-card {
        padding: 1rem;
    }
    
    .card-icon {
        width: 40px;
        height: 40px;
        font-size: 1rem;
    }
    
    .card-value {
        font-size: 1.25rem;
    }
    
    .performer-stats {
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .activity-filters {
        flex-direction: column;
        align-items: stretch;
    }
    
    .activity-filter {
        width: 100%;
    }
}
</style>
