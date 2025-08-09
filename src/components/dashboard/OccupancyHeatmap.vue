<template>
    <div class="occupancy-heatmap">
        <div class="card">
            <div class="card-header">
                <h5>Occupancy Heatmap</h5>
                <div class="heatmap-controls">
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
                        @date-select="onDateSelect"
                    />
                    <Button 
                        label="Refresh" 
                        icon="pi pi-refresh" 
                        @click="refreshData"
                        :loading="loading"
                    />
                </div>
            </div>

            <div class="heatmap-content" v-if="!loading && heatmapData.length > 0">
                <div class="heatmap-legend">
                    <span class="legend-label">Low</span>
                    <div class="legend-scale">
                        <div class="legend-color" style="background-color: #dcfce7"></div>
                        <div class="legend-color" style="background-color: #bbf7d0"></div>
                        <div class="legend-color" style="background-color: #86efac"></div>
                        <div class="legend-color" style="background-color: #4ade80"></div>
                        <div class="legend-color" style="background-color: #22c55e"></div>
                        <div class="legend-color" style="background-color: #16a34a"></div>
                        <div class="legend-color" style="background-color: #15803d"></div>
                    </div>
                    <span class="legend-label">High</span>
                </div>

                <div class="heatmap-grid" :class="gridClass">
                    <div 
                        v-for="dataPoint in heatmapData" 
                        :key="dataPoint.date"
                        class="heatmap-cell"
                        :style="{ backgroundColor: getHeatmapColor(dataPoint.occupancy_rate) }"
                        :title="`${formatDate(dataPoint.date)}: ${dataPoint.occupancy_rate}% occupancy`"
                    >
                        <div class="cell-date">{{ formatCellDate(dataPoint.date) }}</div>
                        <div class="cell-occupancy">{{ dataPoint.occupancy_rate }}%</div>
                    </div>
                </div>

                <div class="heatmap-stats">
                    <div class="stat-item">
                        <span class="stat-label">Average Occupancy:</span>
                        <span class="stat-value">{{ averageOccupancy }}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Peak Occupancy:</span>
                        <span class="stat-value">{{ peakOccupancy }}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Low Occupancy:</span>
                        <span class="stat-value">{{ lowOccupancy }}%</span>
                    </div>
                </div>
            </div>

            <div v-else-if="loading" class="loading-state">
                <ProgressSpinner />
                <p>Loading occupancy data...</p>
            </div>

            <div v-else class="empty-state">
                <i class="pi pi-chart-bar" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                <p>No occupancy data available for the selected period</p>
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
const selectedPeriod = ref('weekly'); // default changed to weekly
const customDateRange = ref([]);
const heatmapData = ref([]);
const statistics = ref(null);

const periodOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Custom Range', value: 'custom' }
];

const gridClass = computed(() => {
    switch (selectedPeriod.value) {
        case 'weekly':
            return 'grid-weekly';
        case 'monthly':
            return 'grid-monthly';
        default:
            return 'grid-daily';
    }
});

const averageOccupancy = computed(() => {
    return statistics.value ? Math.round(statistics.value.average_occupancy) : 0;
});

const peakOccupancy = computed(() => {
    return statistics.value ? statistics.value.peak_occupancy : 0;
});

const lowOccupancy = computed(() => {
    return statistics.value ? statistics.value.lowest_occupancy : 0;
});

onMounted(() => {
    fetchHeatmapData();
    
    if (props.autoRefresh) {
        setInterval(fetchHeatmapData, props.refreshInterval);
    }
});

// Helper to format a Date as YYYY-MM-DD in local time (avoids UTC shift from toISOString)
const formatDateForApi = (d) => {
    if (!(d instanceof Date)) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const fetchHeatmapData = async () => {
    loading.value = true;
    try {
        let startDate = null;
        let endDate = null;
        
        if (selectedPeriod.value === 'custom' && customDateRange.value.length === 2) {
            // Use local date parts instead of toISOString to prevent off-by-one (timezone) errors
            startDate = formatDateForApi(customDateRange.value[0]);
            endDate = formatDateForApi(customDateRange.value[1]);
        }
        
        const response = await dashboardService.getOccupancyHeatmap(
            selectedPeriod.value,
            startDate,
            endDate
        );
        
        if (response.success) {
            heatmapData.value = response.data.heatmap;
            statistics.value = response.data.statistics;
            emit('data-loaded', response.data.heatmap);
        } else {
            throw new Error(response.message || 'Failed to fetch heatmap data');
        }
    } catch (error) {
        console.error('Error fetching heatmap data:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load occupancy heatmap',
            life: 3000
        });
        emit('error', error);
    } finally {
        loading.value = false;
    }
};

const refreshData = () => {
    fetchHeatmapData();
};

const getHeatmapColor = (occupancy) => {
    // Color scale from light green (low) to dark green (high)
    const colors = [
        '#dcfce7', // 0-14%
        '#bbf7d0', // 15-29%
        '#86efac', // 30-44%
        '#4ade80', // 45-59%
        '#22c55e', // 60-74%
        '#16a34a', // 75-89%
        '#15803d'  // 90-100%
    ];
    
    const index = Math.min(Math.floor(occupancy / 15), colors.length - 1);
    return colors[index];
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatCellDate = (date) => {
    switch (selectedPeriod.value) {
        case 'weekly':
            return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        case 'monthly':
            return new Date(date).toLocaleDateString('en-US', { month: 'short' });
        default:
            return new Date(date).getDate().toString();
    }
};

const onPeriodChange = () => {
    if (selectedPeriod.value !== 'custom') {
        fetchHeatmapData();
    } else {
        // Reset range & data when entering custom mode
        customDateRange.value = [];
        heatmapData.value = [];
        statistics.value = null;
    }
};

const onDateSelect = () => {
    // PrimeVue range selection updates array incrementally; wait until both dates picked
    if (
        selectedPeriod.value === 'custom' &&
        customDateRange.value &&
        customDateRange.value.length === 2 &&
        customDateRange.value[0] instanceof Date &&
        customDateRange.value[1] instanceof Date
    ) {
        fetchHeatmapData();
    }
};
</script>

<style scoped>
.occupancy-heatmap {
    margin-bottom: 2rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--surface-border);
}

.heatmap-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.heatmap-content {
    padding: 1.5rem;
}

.heatmap-legend {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    gap: 0.5rem;
}

.legend-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.legend-scale {
    display: flex;
    gap: 2px;
}

.legend-color {
    width: 20px;
    height: 20px;
    border-radius: 4px;
}

.heatmap-grid {
    display: grid;
    gap: 4px;
    margin-bottom: 1.5rem;
}

.grid-daily {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
}

.grid-weekly {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}

.grid-monthly {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.heatmap-cell {
    border-radius: 8px;
    padding: 0.75rem;
    text-align: center;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.heatmap-cell:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.cell-date {
    font-size: 0.75rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
    color: rgba(0, 0, 0, 0.8);
}

.cell-occupancy {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.9);
}

.heatmap-stats {
    display: flex;
    gap: 2rem;
    justify-content: center;
    flex-wrap: wrap;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
}

.stat-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary-color);
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
    
    .heatmap-controls {
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .heatmap-stats {
        gap: 1rem;
    }
    
    .heatmap-cell {
        min-height: 60px;
        padding: 0.5rem;
    }
}
</style>
