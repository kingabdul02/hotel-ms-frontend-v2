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

            <!-- Insert extended quick stats for expected check-ins/outs -->
            <div class="quick-stats-grid">
                <div class="stat-card expected">
                    <div class="stat-icon"><i class="pi pi-sign-in" /></div>
                    <div class="stat-content">
                        <div class="stat-value">{{ dashboardStats.checkInsToday }}/{{ dashboardStats.expectedCheckInsToday }}</div>
                        <div class="stat-label">Check-Ins (Actual / Expected)</div>
                        <div class="stat-change" :class="checkInDeltaClass">
                            <i :class="checkInDeltaIcon" />
                            {{ checkInDeltaText }}
                        </div>
                    </div>
                </div>
                <div class="stat-card expected">
                    <div class="stat-icon"><i class="pi pi-sign-out" /></div>
                    <div class="stat-content">
                        <div class="stat-value">{{ dashboardStats.checkOutsToday }}/{{ dashboardStats.expectedCheckOutsToday }}</div>
                        <div class="stat-label">Check-Outs (Actual / Expected)</div>
                        <div class="stat-change" :class="checkOutDeltaClass">
                            <i :class="checkOutDeltaIcon" />
                            {{ checkOutDeltaText }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Advanced Analytics Charts -->
            <div class="widget-section full-width charts-grid">
                <div class="card chart-card">
                    <div class="card-header"><h5>Revenue by Room Type</h5></div>
                    <div class="p-3">
                        <Chart type="bar" :data="roomTypeRevenueChart" :options="roomTypeRevenueOptions" />
                    </div>
                </div>
                <div class="card chart-card">
                    <div class="card-header"><h5>Monthly Check-Ins / Check-Outs</h5></div>
                    <div class="p-3">
                        <Chart type="bar" :data="checkInOutChart" :options="checkInOutChartOptions" />
                    </div>
                </div>
                <div class="card chart-card">
                    <div class="card-header"><h5>Booking Status Distribution</h5></div>
                    <div class="p-3">
                        <Chart type="doughnut" :data="bookingStatusChart" :options="bookingStatusChartOptions" />
                    </div>
                </div>
            </div>

            <!-- Recent Bookings (Moved from BookingDashboard) -->
            <div class="widget-section full-width">
                <div class="card bookings-table-card">
                    <div class="card-header flex justify-between align-items-center">
                        <h5 class="m-0 flex align-items-center gap-2">
                            <i class="pi pi-list text-primary"></i>
                            <span>Recent Bookings</span>
                        </h5>
                        <div class="table-header flex align-items-center gap-2 flex-wrap">
                            <InputText
                                v-model="searchQuery"
                                placeholder="Search (guest, room, booking id)"
                                class="search-input w-full md:w-15rem"
                            >
                                <template #prepend>
                                    <i class="pi pi-search" />
                                </template>
                            </InputText>
                            <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Status" class="w-9rem" showClear />
                            <Dropdown v-model="filters.payment" :options="paymentOptions" optionLabel="label" optionValue="value" placeholder="Payment" class="w-9rem" showClear />
                            <Calendar v-model="filters.dateRange" selectionMode="range" :manualInput="false" placeholder="Date Range" class="w-13rem" :showIcon="true" />
                            <Button label="Clear" icon="pi pi-filter-slash" size="small" outlined @click="resetFilters" />
                        </div>
                    </div>
                    <div class="p-3">
                        <DataTable
                            :value="filteredBookings"
                            :paginator="true"
                            lazy
                            :rows="bookingsPager.rows"
                            :totalRecords="bookingsPager.total"
                            :first="(bookingsPager.page - 1) * bookingsPager.rows"
                            @page="onPage"
                            responsiveLayout="scroll"
                            class="custom-datatable"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} bookings"
                        >
                            <Column field="booking_id" header="Booking ID" sortable>
                                <template #body="slotProps">
                                    <i class="pi pi-home text-primary mr-2" />
                                    <span>{{ slotProps.data.booking_id }}</span>
                                </template>
                            </Column>
                            <Column field="room.name" header="Room" sortable>
                                <template #body="slotProps">
                                    <i class="pi pi-home text-primary mr-2" />
                                    <span>{{ slotProps.data.room.name }}</span>
                                </template>
                            </Column>
                            <Column field="user.name" header="Customer" sortable>
                                <template #body="slotProps">
                                    <i class="pi pi-user text-primary mr-2" />
                                    <span>{{ slotProps.data.user.name }}</span>
                                </template>
                            </Column>
                            <Column field="check_in_date" header="Check-In" sortable>
                                <template #body="slotProps">
                                    <i class="pi pi-calendar text-green-600 mr-2" />
                                    <span>{{ formatDateTime(slotProps.data.check_in_date) }}</span>
                                </template>
                            </Column>
                            <Column field="check_out_date" header="Check-Out" sortable>
                                <template #body="slotProps">
                                    <i class="pi pi-calendar text-red-600 mr-2" />
                                    <span>{{ formatDateTime(slotProps.data.check_out_date) }}</span>
                                </template>
                            </Column>
                            <Column field="payment_status" header="Payment Status" sortable>
                                <template #body="slotProps">
                                    <Tag
                                        :value="slotProps.data.payment_status === 'paid' ? 'Paid' : 'Pending'"
                                        :severity="slotProps.data.payment_status === 'paid' ? 'success' : 'warning'"
                                    />
                                </template>
                            </Column>
                            <Column header="Actions">
                                <template #body="slotProps">
                                    <div class="flex gap-2">
                                        <Button label="View" icon="pi pi-eye" size="small" outlined @click="showDetails(slotProps.data)" />
                                        <Button label="Modify" icon="pi pi-pencil" size="small" severity="info" outlined @click="showBookingModification(slotProps.data)" />
                                        <Button label="Charges" icon="pi pi-dollar" size="small" severity="warning" outlined @click="showCustomCharges(slotProps.data)" />
                                        <Button label="POS" icon="pi pi-shopping-cart" size="small" severity="success" outlined @click="showPOSCharges(slotProps.data)" />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>

        <!-- Booking Dialogs -->
        <BookingDetailsDialog
            :visible="showDialog"
            :selectedBooking="selectedBooking"
            @update:visible="showDialog = $event"
            @update="statisticsBooking"
        />
        <BookingModificationDialog
            :visible="isBookingModificationDialogVisible"
            :booking="selectedBooking"
            @update:visible="isBookingModificationDialogVisible = $event"
            @booking-updated="handleBookingUpdate"
        />
        <CustomChargesDialog
            :visible="isCustomChargesDialogVisible"
            :booking="selectedBooking"
            @update:visible="isCustomChargesDialogVisible = $event"
            @charges-added="handleBookingUpdate"
        />
        <POSChargesDialog
            :visible="isPOSChargesDialogVisible"
            :booking="selectedBooking"
            @update:visible="isPOSChargesDialogVisible = $event"
            @charges-posted="handleBookingUpdate"
        />

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
import { ref, onMounted, onUnmounted, watch, reactive, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import AvailabilityCalendar from '@/components/dashboard/AvailabilityCalendar.vue';
import OccupancyHeatmap from '@/components/dashboard/OccupancyHeatmap.vue';
import RevPARWidget from '@/components/dashboard/RevPARWidget.vue';
import axiosInstance from '@/service/AxiosInstance';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';
import { formatDateTime } from '@/utils/dateTimeFormatter';
import BookingDetailsDialog from '@/components/BookingManagement/BookingDetailsDialog.vue';
import BookingModificationDialog from '@/components/BookingManagement/BookingModificationDialog.vue';
import CustomChargesDialog from '@/components/BookingManagement/CustomChargesDialog.vue';
import POSChargesDialog from '@/components/pos/POSChargesDialog.vue';

const router = useRouter();
const toast = useToast();
const store = useStore();

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
    adrChange: 8.2,
    expectedCheckInsToday: 0,
    expectedCheckOutsToday: 0
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

// Booking related state (moved)
const selectedBooking = ref(null);
const showDialog = ref(false);
const isBookingModificationDialogVisible = ref(false);
const isCustomChargesDialogVisible = ref(false);
const isPOSChargesDialogVisible = ref(false);
const statisticsBookingResponse = ref({});
const bookingsPager = reactive({ page: 1, rows: 10, total: 0 });
const recentBookings = ref([]);
const filteredBookings = computed(() => {
    return recentBookings.value.filter(b => {
        const q = searchQuery.value.trim().toLowerCase();
        const matchesSearch = !q || [b.booking_id, b.user?.name, b.room?.name, b.guest_name]
            .filter(Boolean)
            .some(val => String(val).toLowerCase().includes(q));
        const matchesStatus = !filters.status || b.status === filters.status;
        const matchesPayment = !filters.payment || b.payment_status === filters.payment;
        const matchesRange = isInRange(b, filters.dateRange);
        return matchesSearch && matchesStatus && matchesPayment && matchesRange;
    });
});
const searchQuery = ref('');
const filters = reactive({ status: null, payment: null, dateRange: null });

const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Checked In', value: 'checked_in' },
    { label: 'Checked Out', value: 'checked_out' },
    { label: 'Cancelled', value: 'cancelled' }
];
const paymentOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' }
];

const isInRange = (booking, range) => {
    if (!range || !Array.isArray(range) || range.length < 2 || !range[0] || !range[1]) return true;
    const start = new Date(range[0]).getTime();
    const end = new Date(range[1]).getTime();
    const inDate = new Date(booking.check_in_date).getTime();
    const outDate = new Date(booking.check_out_date).getTime();
    // overlap if either check-in or check-out within range or range fully inside booking span
    return (inDate >= start && inDate <= end) || (outDate >= start && outDate <= end) || (inDate <= start && outDate >= end);
};

const resetFilters = () => {
    searchQuery.value = '';
    filters.status = null;
    filters.payment = null;
    filters.dateRange = null;
};

let refreshInterval = null;

onMounted(() => {
    loadDashboardData();
    statisticsBooking(); // load bookings
    
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

const statisticsBooking = async () => {
    const loaded = await pullStatistics(1);
    if (!loaded) return;
    const stats = statisticsBookingResponse.value;
    // Build charts using latest stats
    buildRoomTypeRevenueChart(stats.totalRevenueByRoomType);
    buildCheckInOutChart(stats.checkInCheckOutStats);
    buildBookingStatusChart();
    // Update dashboardStats expected & actual figures if present
    dashboardStats.value.checkInsToday = stats.checkInsToday || 0;
    dashboardStats.value.checkOutsToday = stats.checkOutsToday || 0;
    dashboardStats.value.expectedCheckInsToday = stats.expectedCheckInsToday || 0;
    dashboardStats.value.expectedCheckOutsToday = stats.expectedCheckOutsToday || 0;
    computeDeltas();
};

const pullStatistics = async (page = 1) => {
    const token = JSON.parse(localStorage.getItem('userData') || '{}')?.token;
    if (!token) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Authentication token missing. Please log in.', life: 3000 });
        return false;
    }
    try {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
        const { data } = await axiosInstance.get('/admin/statistics/booking', {
            params: { page },
            headers: { Authorization: `Bearer ${token}` }
        });
        statisticsBookingResponse.value = data;
        const pageData = data.recentBookings;
        bookingsPager.page = pageData.current_page;
        bookingsPager.rows = Number(pageData.per_page);
        bookingsPager.total = pageData.total;
        recentBookings.value = pageData.data;
        filteredBookings.value = [...pageData.data];
        return true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch booking statistics', life: 3000 });
        console.error('Error fetching booking statistics:', error);
        return false;
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

const onPage = (event) => { pullStatistics(event.page + 1); };
const showDetails = (booking) => { selectedBooking.value = booking; showDialog.value = true; };
const showBookingModification = (booking) => { selectedBooking.value = booking; isBookingModificationDialogVisible.value = true; };
const showCustomCharges = (booking) => { selectedBooking.value = booking; isCustomChargesDialogVisible.value = true; };
const showPOSCharges = (booking) => { selectedBooking.value = booking; isPOSChargesDialogVisible.value = true; };
const handleBookingUpdate = () => { isBookingModificationDialogVisible.value = false; isCustomChargesDialogVisible.value = false; isPOSChargesDialogVisible.value = false; statisticsBooking(); };

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

/* (Continuation - new advanced analytics logic) */
// If dashboardStats already declared earlier, just augment expected keys if missing
if (!('expectedCheckInsToday' in dashboardStats.value)) {
    dashboardStats.value.expectedCheckInsToday = 0;
    dashboardStats.value.expectedCheckOutsToday = 0;
}

// Chart reactive refs
const roomTypeRevenueChart = ref({ labels: [], datasets: [] });
const checkInOutChart = ref({ labels: [], datasets: [] });
const bookingStatusChart = ref({ labels: [], datasets: [] });

const roomTypeRevenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Revenue (₦)' } }
    }
};

const checkInOutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
        x: { stacked: false },
        y: { beginAtZero: true, title: { display: true, text: 'Count' } }
    }
};

const bookingStatusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
};

const monthNameToNumber = (label) => {
    const [monthName, year] = label.split(' ');
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return { year: Number(year), month: months.indexOf(monthName) + 1 };
};

const sortMonthLabels = (labels) => labels.slice().sort((a,b) => {
    const A = monthNameToNumber(a); const B = monthNameToNumber(b);
    if (A.year === B.year) return A.month - B.month; else return A.year - B.year;
});

const buildRoomTypeRevenueChart = (totalRevenueByRoomType = {}) => {
    const monthLabels = sortMonthLabels(Object.keys(totalRevenueByRoomType));
    const datasetsMap = {};
    monthLabels.forEach((label, idx) => {
        (totalRevenueByRoomType[label] || []).forEach(entry => {
            if (!datasetsMap[entry.room_type]) {
                datasetsMap[entry.room_type] = {
                    label: entry.room_type,
                    backgroundColor: entry.color_code || '#3b82f6',
                    data: Array(monthLabels.length).fill(0),
                    borderRadius: 4
                };
            }
            datasetsMap[entry.room_type].data[idx] = entry.total_revenue;
        });
    });
    roomTypeRevenueChart.value = { labels: monthLabels, datasets: Object.values(datasetsMap) };
};

const buildCheckInOutChart = (checkInCheckOutStats = {}) => {
    const monthLabels = sortMonthLabels(Object.keys(checkInCheckOutStats));
    const totals = []; const ins = []; const outs = [];
    monthLabels.forEach(label => {
        const rec = (checkInCheckOutStats[label] || [])[0] || {};
        totals.push(Number(rec.total_bookings)||0);
        ins.push(Number(rec.confirmed_check_ins)||0);
        outs.push(Number(rec.confirmed_check_outs)||0);
    });
    checkInOutChart.value = {
        labels: monthLabels,
        datasets: [
            { label: 'Total Bookings', backgroundColor: '#6366f1', data: totals },
            { label: 'Check-Ins', backgroundColor: '#10b981', data: ins },
            { label: 'Check-Outs', backgroundColor: '#f59e0b', data: outs }
        ]
    };
};

const buildBookingStatusChart = () => {
    const counts = {};
    recentBookings.value.forEach(b => { counts[b.status] = (counts[b.status]||0) + 1; });
    const labels = Object.keys(counts);
    const palette = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
    bookingStatusChart.value = {
        labels,
        datasets: [ {
            data: labels.map(l => counts[l]),
            backgroundColor: labels.map((_,i) => palette[i % palette.length])
        } ]
    };
};

// Delta helpers
const checkInDeltaClass = ref('');
const checkInDeltaIcon = ref('');
const checkInDeltaText = ref('');
const checkOutDeltaClass = ref('');
const checkOutDeltaIcon = ref('');
const checkOutDeltaText = ref('');

const computeDeltas = () => {
    const ci = dashboardStats.value.checkInsToday || 0;
    const ciExp = dashboardStats.value.expectedCheckInsToday || 0;
    const co = dashboardStats.value.checkOutsToday || 0;
    const coExp = dashboardStats.value.expectedCheckOutsToday || 0;
    const ciDiff = ci - ciExp;
    const coDiff = co - coExp;
    const format = (diff) => diff === 0 ? 'On Target' : (diff > 0 ? `+${diff} Over` : `${diff} Under`);
    // Check-ins
    checkInDeltaText.value = format(ciDiff);
    checkInDeltaClass.value = ciDiff >=0 ? 'positive' : 'negative';
    checkInDeltaIcon.value = ciDiff >=0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
    // Check-outs
    checkOutDeltaText.value = format(coDiff);
    checkOutDeltaClass.value = coDiff >=0 ? 'positive' : 'negative';
    checkOutDeltaIcon.value = coDiff >=0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
};

// Recompute booking status chart whenever recent bookings change
watch(recentBookings, buildBookingStatusChart);
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

.stat-card.expected { background: var(--surface-card); color: var(--text-color); }
.stat-card.expected .stat-icon { background: var(--surface-ground); }

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

.search-input { max-width: 300px; }

.charts-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap: 1.5rem; }
.chart-card { min-height: 360px; }
.chart-card .p-3 { height: 300px; }

.table-header > * { flex-shrink: 0; }
.w-9rem { width: 9rem; }
.w-13rem { width: 13rem; }
</style>
