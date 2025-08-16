<template>
    <div class="revpar-widget">
        <div class="card">
            <div class="card-header">
                <h5>Revenue per Available Room (RevPAR)</h5>
                <div class="revpar-controls">
                    <Dropdown 
                        v-model="selectedPeriod" 
                        :options="periodOptions" 
                        option-label="label" 
                        option-value="value"
                        placeholder="Select Period"
                        @change="onPeriodChange"
                    />
                    <Calendar 
                        v-if="selectedPeriod === 'custom'"
                        v-model="customDateRange" 
                        selection-mode="range" 
                        show-icon
                        placeholder="Custom range"
                        @update:model-value="onCustomDateSelect"
                        :max-date="maxDate"
                    />
                    <Button 
                        label="Refresh" 
                        icon="pi pi-refresh" 
                        @click="refreshData"
                        :loading="loading"
                    />
                </div>
            </div>

            <div class="revpar-content" v-if="!loading && revparData">
                <div class="revpar-metrics">
                    <div class="metric-card primary-metric">
                        <div class="metric-icon">
                            <i class="pi pi-dollar"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value">₦{{ formatCurrency(revparData.revpar) }}</div>
                            <div class="metric-label">RevPAR</div>
                            <div class="metric-change" :class="revparChangeClass">
                                <i :class="revparChangeIcon"></i>
                                {{ revparData.revparChange }}% vs previous period
                            </div>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="pi pi-chart-line"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value">₦{{ formatCurrency(revparData.totalRevenue) }}</div>
                            <div class="metric-label">Total Revenue</div>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="pi pi-home"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value">{{ revparData.availableRooms }}</div>
                            <div class="metric-label">Available Rooms</div>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="pi pi-percentage"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value">{{ revparData.occupancyRate }}%</div>
                            <div class="metric-label">Occupancy Rate</div>
                        </div>
                    </div>
                </div>

                <div class="revpar-breakdown" v-if="revparData.breakdown && revparData.breakdown.length > 0">
                    <h6>RevPAR by Room Type</h6>
                    <div class="breakdown-grid">
                        <div 
                            v-for="roomType in revparData.breakdown" 
                            :key="roomType.roomTypeId"
                            class="breakdown-item"
                        >
                            <div class="breakdown-header">
                                <span class="room-type-name">{{ roomType.roomTypeName }}</span>
                                <span class="room-type-revpar">₦{{ formatCurrency(roomType.revpar) }}</span>
                            </div>
                            <div class="breakdown-details">
                                <div class="detail-item">
                                    <span>Revenue:</span>
                                    <span>₦{{ formatCurrency(roomType.revenue) }}</span>
                                </div>
                                <div class="detail-item">
                                    <span>Available:</span>
                                    <span>{{ roomType.availableRooms }} rooms</span>
                                </div>
                                <div class="detail-item">
                                    <span>Occupancy:</span>
                                    <span>{{ roomType.occupancyRate }}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="revpar-chart" v-if="chartData">
                    <h6>Revenue Trend</h6>
                    <Chart 
                        type="line" 
                        :data="chartData" 
                        :options="chartOptions" 
                        style="height: 300px;"
                    />
                </div>
            </div>

            <div v-else-if="loading" class="loading-state">
                <ProgressSpinner />
                <p>Loading RevPAR data...</p>
            </div>

            <div v-else class="empty-state">
                <i class="pi pi-chart-bar" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                <p>No RevPAR data available for the selected period</p>
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
const selectedPeriod = ref('today');
const customDateRange = ref([]);
const revparData = ref(null);
const maxDate = ref(new Date());

const periodOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Custom Range', value: 'custom' }
];

const revparChangeClass = computed(() => {
    if (!revparData.value || typeof revparData.value.revparChange !== 'number') return '';
    if (revparData.value.revparChange === 0) return ''; // neutral styling when exactly zero
    return revparData.value.revparChange > 0 ? 'positive' : 'negative';
});

const revparChangeIcon = computed(() => {
    if (!revparData.value || typeof revparData.value.revparChange !== 'number') return '';
    if (revparData.value.revparChange === 0) return 'pi pi-minus';
    return revparData.value.revparChange > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
});

// Transform backend response (which provides revenue-centric data) into revpar-focused structure
const transformRevPARResponse = (raw) => {
    if (!raw) return null;

    // Derive total rooms
    const totalRoomsFromOccupancy = raw.currentOccupancyRate?.totalRooms || 0;
    const totalRoomsFromBreakdown = Array.isArray(raw.breakdown)
        ? raw.breakdown.reduce((sum, r) => sum + (r.availableRooms || 0), 0)
        : 0;
    const totalRooms = totalRoomsFromOccupancy || totalRoomsFromBreakdown || 0;

    // Compute RevPAR (revenue per available room) for the overall period
    const totalRevenue = raw.totalRevenue || 0;
    const revpar = totalRooms ? totalRevenue / totalRooms : 0;

    // Use revenueChange as revparChange (assuming same comparative period logic) if present
    const revparChange = typeof raw.revenueChange === 'number' ? raw.revenueChange : null;

    // Build breakdown with revpar per room type
    const breakdown = (raw.breakdown || []).map(item => ({
        ...item,
        revpar: item.availableRooms ? item.revenue / item.availableRooms : 0
    }));

    // Trend: backend provides revenue per day; convert to revpar per day
    const roomsForTrend = totalRooms || (breakdown.reduce((s, b) => s + (b.availableRooms || 0), 0));
    const trend = (raw.trend || []).map(item => ({
        date: item.date,
        revpar: roomsForTrend ? (item.revenue || 0) / roomsForTrend : 0,
        revenue: item.revenue || 0
    }));

    return {
        revpar: Number(revpar.toFixed(2)),
        revparChange, // percentage
        totalRevenue,
        availableRooms: totalRooms,
        occupancyRate: raw.currentOccupancyRate?.rate || 0,
        breakdown,
        trend,
        // Keep any other fields if needed later
        _raw: raw
    };
};

const chartData = computed(() => {
    if (!revparData.value || !revparData.value.trend) return null;
    return {
        labels: revparData.value.trend.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [
            {
                label: 'Revenue',
                data: revparData.value.trend.map(item => item.revenue || 0),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    };
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (ctx) => `₦${ctx.parsed.y.toLocaleString()}`
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback(value) { return '₦' + Number(value).toLocaleString(); }
            }
        }
    }
};

onMounted(() => {
    fetchRevPARData();
    
    if (props.autoRefresh) {
        setInterval(fetchRevPARData, props.refreshInterval);
    }
});

const onPeriodChange = () => {
    if (selectedPeriod.value !== 'custom') {
        customDateRange.value = [];
        fetchRevPARData();
    }
};

const onCustomDateSelect = () => {
    if (customDateRange.value && customDateRange.value.length === 2 && customDateRange.value[1]) {
        fetchRevPARData();
    }
};

const fetchRevPARData = async () => {
    // Do not fetch if custom range is selected but not complete
    if (selectedPeriod.value === 'custom' && (!customDateRange.value || customDateRange.value.length < 2 || !customDateRange.value[1])) {
        return;
    }

    loading.value = true;
    try {
        let startDate = null;
        let endDate = null;
        
        if (selectedPeriod.value === 'custom' && customDateRange.value.length === 2) {
            startDate = customDateRange.value[0].toISOString().split('T')[0];
            endDate = customDateRange.value[1].toISOString().split('T')[0];
        }
        
        const response = await dashboardService.getRevPAR(
            selectedPeriod.value,
            startDate,
            endDate
        );
        
        if (response.success) {
            revparData.value = transformRevPARResponse(response.data);
            emit('data-loaded', revparData.value);
        } else {
            throw new Error(response.message || 'Failed to fetch RevPAR data');
        }
    } catch (error) {
        console.error('Error fetching RevPAR data:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load RevPAR data',
            life: 3000
        });
        emit('error', error);
    } finally {
        loading.value = false;
    }
};

const refreshData = () => {
    fetchRevPARData();
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG').format(amount);
};
</script>

<style scoped>
.revpar-widget {
    margin-bottom: 2rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--surface-border);
}

.revpar-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.revpar-content {
    padding: 1.5rem;
}

.revpar-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.metric-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.2s ease;
}

.metric-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.primary-metric {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
}

.metric-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    font-size: 1.5rem;
}

.primary-metric .metric-icon {
    background: rgba(255, 255, 255, 0.2);
}

.metric-content {
    flex: 1;
}

.metric-value {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
}

.metric-label {
    font-size: 0.875rem;
    opacity: 0.8;
    margin-bottom: 0.5rem;
}

.metric-change {
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.metric-change.positive {
    color: #10b981;
}

.metric-change.negative {
    color: #ef4444;
}

.primary-metric .metric-change {
    color: rgba(255, 255, 255, 0.9);
}

.revpar-breakdown {
    margin-bottom: 2rem;
}

.revpar-breakdown h6 {
    margin-bottom: 1rem;
    color: var(--text-color);
    font-weight: 600;
}

.breakdown-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}

.breakdown-item {
    background: var(--surface-50);
    border-radius: 8px;
    padding: 1rem;
}

.breakdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--surface-border);
}

.room-type-name {
    font-weight: 600;
    color: var(--text-color);
}

.room-type-revpar {
    font-weight: 700;
    color: var(--primary-color);
}

.breakdown-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
}

.detail-item span:first-child {
    color: var(--text-color-secondary);
}

.detail-item span:last-child {
    font-weight: 500;
}

.revpar-chart h6 {
    margin-bottom: 1rem;
    color: var(--text-color);
    font-weight: 600;
}

.loading-state, .empty-state {
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
    
    .revpar-controls {
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .revpar-metrics {
        grid-template-columns: 1fr;
    }
    
    .breakdown-grid {
        grid-template-columns: 1fr;
    }
}
</style>
