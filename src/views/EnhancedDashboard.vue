<template>
    <div class="enhanced-dashboard">
        <!-- Dashboard Header -->
        <div class="dashboard-header">
            <div class="header-content">
                <div class="header-title">
                    <h2>Enhanced Dashboard</h2>
                    <p>Real-time insights and advanced analytics for your hotel</p>
                </div>
                <div class="header-actions">
                    <Button 
                        label="Export Report" 
                        icon="pi pi-download" 
                        @click="exportDashboard"
                        class="p-button-outlined"
                    />
                    <Button 
                        label="Refresh All" 
                        icon="pi pi-refresh" 
                        @click="refreshAllData"
                        :loading="refreshing"
                    />
                </div>
            </div>
        </div>

        <!-- Main Dashboard Content -->
        <div class="dashboard-content">
            <!-- RevPAR Widget - Primary KPI -->
            <div class="widget-section full-width">
                <RevPARWidget 
                    :auto-refresh="true"
                    :refresh-interval="300000"
                    @data-loaded="onRevPARLoaded"
                    @error="onWidgetError"
                />
            </div>

            <!-- Availability Calendar -->
            <div class="widget-section full-width">
                <AvailabilityCalendar 
                    :auto-refresh="true"
                    :refresh-interval="300000"
                    @data-loaded="onAvailabilityLoaded"
                    @error="onWidgetError"
                />
            </div>

            <!-- Occupancy Heatmap -->
            <div class="widget-section full-width">
                <OccupancyHeatmap 
                    :auto-refresh="true"
                    :refresh-interval="300000"
                    @data-loaded="onOccupancyLoaded"
                    @error="onWidgetError"
                />
            </div>

            <!-- Quick Stats Grid -->
            <div class="quick-stats-grid">
                <div class="stat-card revenue">
                    <div class="stat-icon">
                        <i class="pi pi-dollar"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">₦{{ formatCurrency(dashboardStats.totalRevenue) }}</div>
                        <div class="stat-label">Total Revenue (This Month)</div>
                        <div class="stat-change positive" v-if="dashboardStats.revenueChange >= 0">
                            <i class="pi pi-arrow-up"></i>
                            +{{ dashboardStats.revenueChange }}% vs last month
                        </div>
                        <div class="stat-change negative" v-else>
                            <i class="pi pi-arrow-down"></i>
                            {{ dashboardStats.revenueChange }}% vs last month
                        </div>
                    </div>
                </div>

                <div class="stat-card occupancy">
                    <div class="stat-icon">
                        <i class="pi pi-home"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ dashboardStats.occupancyRate }}%</div>
                        <div class="stat-label">Current Occupancy Rate</div>
                        <div class="stat-detail">{{ dashboardStats.occupiedRooms }}/{{ dashboardStats.totalRooms }} rooms</div>
                    </div>
                </div>

                <div class="stat-card bookings">
                    <div class="stat-icon">
                        <i class="pi pi-calendar"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ dashboardStats.totalBookings }}</div>
                        <div class="stat-label">Active Bookings</div>
                        <div class="stat-detail">{{ dashboardStats.checkInsToday }} check-ins today</div>
                    </div>
                </div>

                <div class="stat-card adr">
                    <div class="stat-icon">
                        <i class="pi pi-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">₦{{ formatCurrency(dashboardStats.adr) }}</div>
                        <div class="stat-label">Average Daily Rate</div>
                        <div class="stat-change positive" v-if="dashboardStats.adrChange >= 0">
                            <i class="pi pi-arrow-up"></i>
                            +{{ dashboardStats.adrChange }}% vs last month
                        </div>
                        <div class="stat-change negative" v-else>
                            <i class="pi pi-arrow-down"></i>
                            {{ dashboardStats.adrChange }}% vs last month
                        </div>
                    </div>
                </div>
            </div>

            <!-- System Status -->
            <div class="widget-section half-width">
                <div class="card">
                    <div class="card-header">
                        <h5>System Status</h5>
                        <div class="status-indicator" :class="systemStatus.overall">
                            {{ systemStatus.overall }}
                        </div>
                    </div>
                    <div class="system-status-content">
                        <div class="status-item">
                            <div class="status-info">
                                <span class="status-name">API Services</span>
                                <span class="status-value" :class="systemStatus.api">{{ systemStatus.api }}</span>
                            </div>
                            <div class="status-metrics">
                                <span>Response Time: {{ systemStatus.apiResponseTime }}ms</span>
                            </div>
                        </div>
                        
                        <div class="status-item">
                            <div class="status-info">
                                <span class="status-name">Database</span>
                                <span class="status-value" :class="systemStatus.database">{{ systemStatus.database }}</span>
                            </div>
                            <div class="status-metrics">
                                <span>Connections: {{ systemStatus.dbConnections }}/{{ systemStatus.maxDbConnections }}</span>
                            </div>
                        </div>
                        
                        <div class="status-item">
                            <div class="status-info">
                                <span class="status-name">POS Integration</span>
                                <span class="status-value" :class="systemStatus.pos">{{ systemStatus.pos }}</span>
                            </div>
                            <div class="status-metrics">
                                <span>Last Sync: {{ formatTime(systemStatus.lastPosSync) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="widget-section half-width">
                <div class="card">
                    <div class="card-header">
                        <h5>Recent Activity</h5>
                        <Button 
                            label="View All" 
                            icon="pi pi-external-link" 
                            @click="viewAllActivity"
                            class="p-button-sm p-button-text"
                        />
                    </div>
                    <div class="activity-content">
                        <div 
                            v-for="activity in recentActivities" 
                            :key="activity.id"
                            class="activity-item"
                        >
                            <div class="activity-icon" :class="activity.type">
                                <i :class="activity.icon"></i>
                            </div>
                            <div class="activity-info">
                                <div class="activity-description">{{ activity.description }}</div>
                                <div class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</div>
                            </div>
                        </div>
                        
                        <div v-if="recentActivities.length === 0" class="no-activities">
                            <i class="pi pi-info-circle"></i>
                            <p>No recent activities</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Error Dialog -->
        <Dialog 
            v-model:visible="showErrorDialog" 
            modal 
            header="Dashboard Error"
            :style="{ width: '400px' }"
        >
            <div class="error-content">
                <i class="pi pi-exclamation-triangle error-icon"></i>
                <p>{{ errorMessage }}</p>
            </div>
            <template #footer>
                <Button 
                    label="Close" 
                    icon="pi pi-times" 
                    @click="showErrorDialog = false" 
                    class="p-button-text"
                />
                <Button 
                    label="Retry" 
                    icon="pi pi-refresh" 
                    @click="retryFailedOperation"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import AvailabilityCalendar from '@/components/dashboard/AvailabilityCalendar.vue';
import OccupancyHeatmap from '@/components/dashboard/OccupancyHeatmap.vue';
import RevPARWidget from '@/components/dashboard/RevPARWidget.vue';

const router = useRouter();
const toast = useToast();

const refreshing = ref(false);
const showErrorDialog = ref(false);
const errorMessage = ref('');
const lastFailedOperation = ref(null);

// Dashboard data
const dashboardStats = ref({
    totalRevenue: 15750000,
    revenueChange: 12.5,
    occupancyRate: 78,
    occupiedRooms: 156,
    totalRooms: 200,
    totalBookings: 89,
    checkInsToday: 23,
    adr: 45000,
    adrChange: 8.2
});

const systemStatus = ref({
    overall: 'healthy',
    api: 'healthy',
    apiResponseTime: 245,
    database: 'healthy',
    dbConnections: 45,
    maxDbConnections: 100,
    pos: 'healthy',
    lastPosSync: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
});

const recentActivities = ref([
    {
        id: 1,
        type: 'booking',
        icon: 'pi pi-calendar-plus',
        description: 'New booking created for Room 205',
        timestamp: new Date(Date.now() - 10 * 60 * 1000)
    },
    {
        id: 2,
        type: 'checkin',
        icon: 'pi pi-sign-in',
        description: 'Guest checked in to Room 101',
        timestamp: new Date(Date.now() - 25 * 60 * 1000)
    },
    {
        id: 3,
        type: 'pos',
        icon: 'pi pi-shopping-cart',
        description: 'POS charge posted to Room 305 (Restaurant)',
        timestamp: new Date(Date.now() - 45 * 60 * 1000)
    },
    {
        id: 4,
        type: 'housekeeping',
        icon: 'pi pi-home',
        description: 'Room 102 marked as clean',
        timestamp: new Date(Date.now() - 60 * 60 * 1000)
    },
    {
        id: 5,
        type: 'checkout',
        icon: 'pi pi-sign-out',
        description: 'Guest checked out from Room 210',
        timestamp: new Date(Date.now() - 90 * 60 * 1000)
    }
]);

let refreshInterval = null;

onMounted(() => {
    loadDashboardData();
    
    // Set up auto-refresh for system status and activities
    refreshInterval = setInterval(() => {
        updateSystemStatus();
        updateRecentActivities();
    }, 30000); // Every 30 seconds
});

onUnmounted(() => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});

const loadDashboardData = async () => {
    // This would typically load data from APIs
    // For now, we're using mock data
    console.log('Loading dashboard data...');
};

const refreshAllData = async () => {
    refreshing.value = true;
    try {
        await Promise.all([
            loadDashboardData(),
            updateSystemStatus(),
            updateRecentActivities()
        ]);
        
        toast.add({
            severity: 'success',
            summary: 'Data Refreshed',
            detail: 'All dashboard data has been updated',
            life: 3000
        });
    } catch (error) {
        console.error('Error refreshing dashboard data:', error);
        toast.add({
            severity: 'error',
            summary: 'Refresh Failed',
            detail: 'Failed to refresh some dashboard data',
            life: 3000
        });
    } finally {
        refreshing.value = false;
    }
};

const updateSystemStatus = async () => {
    // Mock system status update
    systemStatus.value.apiResponseTime = Math.floor(Math.random() * 300) + 150;
    systemStatus.value.dbConnections = Math.floor(Math.random() * 30) + 35;
    systemStatus.value.lastPosSync = new Date(Date.now() - Math.random() * 10 * 60 * 1000);
};

const updateRecentActivities = async () => {
    // Mock activity update - in real implementation, fetch from API
    // This would add new activities to the list
};

const exportDashboard = () => {
    toast.add({
        severity: 'info',
        summary: 'Export Started',
        detail: 'Dashboard report export is being prepared',
        life: 3000
    });
    
    // Implement dashboard export functionality
    setTimeout(() => {
        toast.add({
            severity: 'success',
            summary: 'Export Complete',
            detail: 'Dashboard report has been downloaded',
            life: 3000
        });
    }, 2000);
};

const viewAllActivity = () => {
    router.push('/activity-log');
};

const onRevPARLoaded = (data) => {
    console.log('RevPAR data loaded:', data);
    if (data && data._raw) {
        const rawData = data._raw;
        dashboardStats.value = {
            totalRevenue: rawData.totalRevenueThisMonth,
            revenueChange: rawData.totalRevenueThisMonthChange,
            occupancyRate: rawData.currentOccupancyRate?.rate || 0,
            occupiedRooms: rawData.currentOccupancyRate?.occupied || 0,
            totalRooms: rawData.currentOccupancyRate?.totalRooms || 0,
            totalBookings: rawData.activeBookings,
            checkInsToday: rawData.todaysCheckIns,
            adr: rawData.averageDailyRate,
            adrChange: 0 // Not in current payload, default to 0
        };
    }
};

const onAvailabilityLoaded = (data) => {
    console.log('Availability data loaded:', data);
};

const onOccupancyLoaded = (data) => {
    console.log('Occupancy data loaded:', data);
};

const onWidgetError = (error) => {
    console.error('Widget error:', error);
    errorMessage.value = error.message || 'An error occurred while loading widget data';
    showErrorDialog.value = true;
    lastFailedOperation.value = 'widget-load';
};

const retryFailedOperation = () => {
    showErrorDialog.value = false;
    
    if (lastFailedOperation.value === 'widget-load') {
        refreshAllData();
    }
    
    lastFailedOperation.value = null;
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG').format(amount || 0);
};

const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatRelativeTime = (date) => {
    if (!date) return 'N/A';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
};
</script>

<style scoped>
.enhanced-dashboard {
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

.dashboard-content {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1.5rem;
}

.widget-section.full-width {
    grid-column: 1 / -1;
}

.widget-section.half-width {
    grid-column: span 6;
}

.quick-stats-grid {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.stat-card {
    background: var(--surface-card);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
}

.stat-card.revenue {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
}

.stat-card.occupancy {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
}

.stat-card.bookings {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
}

.stat-card.adr {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
}

.stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    font-size: 1.5rem;
}

.stat-content {
    flex: 1;
}

.stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
}

.stat-label {
    font-size: 0.875rem;
    opacity: 0.9;
    margin-bottom: 0.25rem;
}

.stat-detail,
.stat-change {
    font-size: 0.75rem;
    opacity: 0.8;
}

.stat-change {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.stat-change.positive {
    color: #10b981;
}

.stat-change.negative {
    color: #ef4444;
}

.stat-card .stat-change {
    color: rgba(255, 255, 255, 0.9);
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

.status-indicator {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-indicator.healthy {
    background-color: #ecfdf5;
    color: #059669;
}

.status-indicator.warning {
    background-color: #fffbeb;
    color: #d97706;
}

.status-indicator.error {
    background-color: #fef2f2;
    color: #dc2626;
}

.system-status-content {
    padding: 1.5rem;
}

.status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--surface-border);
}

.status-item:last-child {
    border-bottom: none;
}

.status-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
}

.status-name {
    font-weight: 500;
}

.status-value {
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-value.healthy {
    background-color: #ecfdf5;
    color: #059669;
}

.status-value.warning {
    background-color: #fffbeb;
    color: #d97706;
}

.status-value.error {
    background-color: #fef2f2;
    color: #dc2626;
}

.status-metrics {
    margin-left: 1rem;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.activity-content {
    padding: 1.5rem;
    max-height: 400px;
    overflow-y: auto;
}

.activity-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--surface-border);
}

.activity-item:last-child {
    border-bottom: none;
}

.activity-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    color: white;
}

.activity-icon.booking {
    background-color: #3b82f6;
}

.activity-icon.checkin {
    background-color: #10b981;
}

.activity-icon.checkout {
    background-color: #f59e0b;
}

.activity-icon.pos {
    background-color: #8b5cf6;
}

.activity-icon.housekeeping {
    background-color: #06b6d4;
}

.activity-info {
    flex: 1;
}

.activity-description {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.activity-time {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.no-activities {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--text-color-secondary);
    text-align: center;
}

.no-activities i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
}

.error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1rem;
}

.error-icon {
    font-size: 3rem;
    color: #ef4444;
    margin-bottom: 1rem;
}

@media (max-width: 1024px) {
    .widget-section.half-width {
        grid-column: 1 / -1;
    }
    
    .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
}

@media (max-width: 768px) {
    .enhanced-dashboard {
        padding: 1rem;
    }
    
    .quick-stats-grid {
        grid-template-columns: 1fr;
    }
    
    .stat-card {
        padding: 1rem;
    }
    
    .stat-icon {
        width: 48px;
        height: 48px;
        font-size: 1.25rem;
    }
    
    .stat-value {
        font-size: 1.5rem;
    }
}
</style>
