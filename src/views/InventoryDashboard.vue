<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import axiosInstance from '../service/AxiosInstance';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '../store/storeconstants';
import ApexChart from 'vue3-apexcharts';

const store = useStore();
const toast = useToast();
const { isDarkTheme } = useLayout();

// Core state
const totalProducts = ref(0);
const mostUsedItems = ref([]);
const lowStockItems = ref([]);
const outOfStockItems = ref([]);
const statistics = ref([]);

const loading = ref(false);
const error = ref(null);

// Search / filtering
const outOfStockSearch = ref('');
const filteredOutOfStockItems = computed(() => {
    if (!outOfStockSearch.value) return outOfStockItems.value;
    const q = outOfStockSearch.value.toLowerCase();
    return outOfStockItems.value.filter(i =>
        i.name?.toLowerCase().includes(q) ||
        i.category?.name?.toLowerCase().includes(q)
    );
});

// ApexCharts config
const chartHeight = 360; // slightly taller
const barSeries = ref([]);
const lineSeries = ref([]);
const barOptionsApex = ref({
    chart: { type: 'bar', height: chartHeight, toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: [], labels: { rotate: -15 } },
    yaxis: { labels: { formatter: v => Math.round(v) } },
    grid: { strokeDashArray: 4 },
    tooltip: { y: { formatter: v => `${v}` } },
    legend: { show: true },
    theme: { mode: 'light' }
});
const lineOptionsApex = ref({
    chart: { type: 'line', height: chartHeight, toolbar: { show: false }, fontFamily: 'inherit' },
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 5, strokeWidth: 2 },
    dataLabels: { enabled: false },
    xaxis: { categories: [] },
    yaxis: { labels: { formatter: v => Math.round(v) } },
    grid: { strokeDashArray: 4 },
    tooltip: { y: { formatter: v => `${v}` } },
    theme: { mode: 'light' }
});

const formatCurrency = (v) => {
    if (v === null || v === undefined || v === '') return '₦0';
    try {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(v));
    } catch (e) { return `₦${v}`; }
};

const applyTheme = (dark) => {
    const labelColor = dark ? '#CBD5E1' : '#475569';
    const gridColor = dark ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
    const mode = dark ? 'dark' : 'light';
    barOptionsApex.value = {
        ...barOptionsApex.value,
        theme: { mode },
        xaxis: { ...barOptionsApex.value.xaxis, labels: { ...barOptionsApex.value.xaxis.labels, style: { colors: labelColor } } },
        yaxis: { labels: { style: { colors: labelColor } } },
        grid: { ...barOptionsApex.value.grid, borderColor: gridColor }
    };
    lineOptionsApex.value = {
        ...lineOptionsApex.value,
        theme: { mode },
        xaxis: { ...lineOptionsApex.value.xaxis, labels: { style: { colors: labelColor } } },
        yaxis: { labels: { style: { colors: labelColor } } },
        grid: { ...lineOptionsApex.value.grid, borderColor: gridColor }
    };
};
watch(isDarkTheme, v => applyTheme(v), { immediate: true });

const statisticsInventory = async () => {
    const token = JSON.parse(localStorage.getItem('userData') || 'null')?.token;
    if (!token) { error.value = 'Authentication required'; return; }
    loading.value = true; error.value = null;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        const { data } = await axiosInstance.get('/admin/statistics/inventory', { headers: { Authorization: `Bearer ${token}` } });
        totalProducts.value = data?.totalProducts ?? 0;
        mostUsedItems.value = data?.mostUsedItems ?? [];
        lowStockItems.value = data?.lowStockItems ?? [];
        outOfStockItems.value = data?.outOfStockItems ?? [];
        statistics.value = data?.statistics ?? [];
        updateChartData(statistics.value);
    } catch (e) {
        console.error(e); error.value = 'Failed to load inventory statistics';
        toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 4000 });
    } finally { loading.value = false; store.commit(LOADING_SPINNER_SHOW_MUTATION, false); }
};

const updateChartData = (stats = []) => {
    const labels = stats.map(s => s.category_name);
    const quantities = stats.map(s => s.total_quantity);
    const colors = stats.map(s => s.chart_color || '#6366F1');
    barSeries.value = [{ name: 'Quantity', data: quantities }];
    barOptionsApex.value = { ...barOptionsApex.value, xaxis: { ...barOptionsApex.value.xaxis, categories: labels }, colors };
    lineSeries.value = [{ name: 'Quantity', data: quantities }];
    lineOptionsApex.value = { ...lineOptionsApex.value, xaxis: { ...lineOptionsApex.value.xaxis, categories: labels }, colors: ['#6366F1'] };
};

onMounted(() => { statisticsInventory(); });
</script>

<template>
    <div class="grid">
        <!-- Charts -->
        <div class="col-12 xl:col-7 md:col-7 lg:col-7">
            <div class="card h-full shadow-1">
                <div class="flex align-items-center justify-content-between mb-2">
                    <h5 class="font-bold text-600 m-0">Inventory By Category (Bar)</h5>
                    <Button icon="pi pi-refresh" class="p-button-text p-button-sm" :disabled="loading" @click="statisticsInventory" />
                </div>
                <div v-if="error" class="p-3 surface-100 text-red-500 border-round text-sm">{{ error }}</div>
                <div class="inventory-chart" :style="{height: chartHeight + 'px'}">
                    <ApexChart v-if="!error" type="bar" :options="barOptionsApex" :series="barSeries" :height="chartHeight" width="100%" />
                    <Skeleton v-else height="100%" />
                </div>
            </div>
        </div>
        <div class="col-12 xl:col-5 md:col-5 lg:col-5">
            <div class="card h-full shadow-1">
                <h5 class="font-bold text-600">Inventory By Category (Line)</h5>
                <div class="inventory-chart" :style="{height: chartHeight + 'px'}">
                    <ApexChart v-if="!error" type="line" :options="lineOptionsApex" :series="lineSeries" :height="chartHeight" width="100%" />
                    <Skeleton v-else height="100%" />
                </div>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="col-12 xl:col-7 md:col-7 lg:col-7">
            <div class="card h-full shadow-1">
                <h5 class="font-bold text-600 mb-6">Overall Inventory</h5>
                <div class="grid">
                    <div class="col-12 md:col-6 lg:col-4">
                        <div class="surface-card border-right-2 surface-border">
                            <div class="flex justify-content-between mb-3">
                                <div>
                                    <span class="block text-yellow-500 font-bold mb-3">Total Products</span>
                                    <div class="text-500 font-bold text-xl">
                                        <Skeleton width="5rem" v-if="loading" />
                                        <span v-else>{{ totalProducts }}</span>
                                    </div>
                                </div>
                            </div>
                            <span class="text-500 text-xs">Snapshot</span>
                        </div>
                    </div>
                    <div class="col-12 md:col-6 lg:col-4">
                        <div class="surface-card border-right-2 surface-border">
                            <div class="flex justify-content-between mb-3">
                                <div>
                                    <span class="block text-purple-500 font-bold mb-3">Most Used Items</span>
                                    <div class="text-500 font-bold text-xl">
                                        <Skeleton width="5rem" v-if="loading" />
                                        <span v-else>{{ mostUsedItems.length }}</span>
                                    </div>
                                </div>
                            </div>
                            <span class="text-500 text-xs">Top consumption</span>
                        </div>
                    </div>
                    <div class="col-12 md:col-6 lg:col-4">
                        <div class="surface-card">
                            <div class="flex justify-content-between mb-3">
                                <div>
                                    <span class="block text-red-500 font-bold mb-3">Low Stocks</span>
                                    <div class="text-500 font-bold text-xl">
                                        <Skeleton width="5rem" v-if="loading" />
                                        <span v-else>{{ lowStockItems.length }}</span>
                                    </div>
                                </div>
                            </div>
                            <span class="text-500 text-xs">Below threshold</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Low Quantity -->
        <div class="col-12 xl:col-5 md:col-5 lg:col-5">
            <div class="card h-full shadow-1">
                <div class="grid">
                    <div class="col-8">
                        <h5 class="font-bold text-600 w-full md:w-9">Low Quantity Stock</h5>
                    </div>
                    <div class="col-4 pt-2 text-right">
                        <Button label="See All" class="p-button-text p-button-sm" />
                    </div>
                </div>

                <div v-if="loading">
                    <div v-for="n in 3" :key="n" class="flex align-items-center gap-4 mb-4">
                        <Skeleton width="50px" height="50px" borderRadius="6px" />
                        <div style="flex:1">
                            <Skeleton width="70%" class="mb-2" />
                            <Skeleton width="50%" />
                        </div>
                        <Skeleton width="70px" height="24px" />
                    </div>
                </div>

                <div v-else-if="!lowStockItems.length" class="text-500 text-sm">No low stock items.</div>

                <div v-else v-for="item in lowStockItems" :key="item.id || item.name" class="flex align-items-center gap-4 mb-4">
                    <div
                        class="p-0 c-shadow img-fit img-fluid"
                        :style="{backgroundImage: `url(${item.image_url || '/img/noimage.gif'})`, height: '50px', width: '50px', borderRadius: '5px', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}">
                    </div>
                    <div class="flex-1">
                        <div class="font-bold text-600 text-sm mb-1 truncate">{{ item.name }}</div>
                        <div class="font-medium text-600 text-xs">Remaining: {{ item.inventory?.quantity ?? 0 }} units</div>
                    </div>
                    <Tag class="px-2 py-1 text-xs" severity="warning" value="LOW" />
                </div>
            </div>
        </div>

        <!-- Out Of Stock Table -->
        <div class="col-12">
            <div class="card h-full shadow-1">
                <DataTable :value="filteredOutOfStockItems" :rows="5" :paginator="true" responsiveLayout="scroll" :loading="loading" dataKey="id" :rowHover="true" :emptyMessage="loading ? '' : 'No out of stock items'">
                    <template #header>
                        <div class="flex flex-wrap gap-2 align-items-center justify-content-between w-full">
                            <h4 class="m-0 text-600">Out Of Stock Items</h4>
                            <div class="flex align-items-center gap-2">
                                <IconField iconPosition="left">
                                    <InputIcon>
                                        <i class="pi pi-search" />
                                    </InputIcon>
                                    <InputText v-model="outOfStockSearch" placeholder="Search..." />
                                </IconField>
                                <Button icon="pi pi-refresh" class="p-button-text p-button-sm" :disabled="loading" @click="statisticsInventory" />
                            </div>
                        </div>
                    </template>
                    <template #loading>
                        <span class="text-sm">Loading inventory...</span>
                    </template>
                    <Column style="width: 10%">
                        <template #header>Image</template>
                        <template #body="slotProps">
                            <img :src="slotProps.data.image_url || '/img/noimage.gif'" :alt="slotProps.data.name" width="46" height="46" class="c-shadow border-round" style="object-fit:cover" />
                        </template>
                    </Column>
                    <Column field="name" header="Name" sortable style="width: 25%" />
                    <Column header="Category" sortable style="width: 20%">
                        <template #body="slotProps">{{ slotProps.data.category?.name || '-' }}</template>
                    </Column>
                    <Column field="unit_price" header="Unit Price" sortable style="width: 15%">
                        <template #body="slotProps">{{ formatCurrency(slotProps.data.unit_price) }}</template>
                    </Column>
                    <Column style="width: 15%">
                        <template #header>Status</template>
                        <template #body>
                            <Tag class="px-2 py-1 text-xs" severity="danger" value="OUT" />
                        </template>
                    </Column>
                    <Column style="width: 15%">
                        <template #header>View</template>
                        <template #body>
                            <Button icon="pi pi-eye" type="button" class="p-button-text p-button-sm" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<style scoped>
.inventory-chart { position: relative; width: 100%; }
</style>
