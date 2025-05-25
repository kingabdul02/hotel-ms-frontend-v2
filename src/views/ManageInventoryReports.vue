<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { ProductService } from '@/service/ProductService';
import { useLayout } from '@/layout/composables/layout';
import axiosInstance from '../service/AxiosInstance';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '../store/storeconstants';

const store = useStore();
const toast = useToast();
const { isDarkTheme } = useLayout();
const statistics = ref([]);
const statisticsInventoryResponse = ref({});

const statisticsInventory = async () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        const response = await axiosInstance.get('/admin/statistics/inventory', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        statisticsInventoryResponse.value = response.data;
        statistics.value = statisticsInventoryResponse.value.statistics;

        updateLineData(statisticsInventoryResponse.value.statistics);
        console.log('statisticsInventoryResponse.value', statisticsInventoryResponse.value);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch booking statistics', life: 3000 });
        console.error('Error fetching booking statistics:', error);
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

const updateLineData = (statistics) => {
    const labels = statistics.map(stat => stat.category_name);
    const data = statistics.map(stat => stat.total_quantity);
    const colors = statistics.map(stat => stat.chart_color);

    lineData.labels = labels;
    lineData.datasets = statistics.map((stat, index) => ({
        label: stat.category_name,
        data: [stat.total_quantity],
        fill: false,
        backgroundColor: colors[index],
        borderColor: colors[index],
        tension: 0.4
    }));
};

const lineData = reactive({
    labels: [],
    datasets: []
});

const items = ref([
    { label: 'Add New', icon: 'pi pi-fw pi-plus' },
    { label: 'Remove', icon: 'pi pi-fw pi-minus' }
]);
const lineOptions = ref(null);
const productService = new ProductService();

onMounted(() => {
    statisticsInventory();
});

const formatCurrency = (value) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};
// const applyLightTheme = () => {
//     lineOptions.value = {
//         plugins: {
//             legend: {
//                 labels: {
//                     color: '#495057'
//                 }
//             }
//         },
//         scales: {
//             x: {
//                 ticks: {
//                     color: '#495057'
//                 },
//                 grid: {
//                     color: '#ebedef'
//                 }
//             },
//             y: {
//                 ticks: {
//                     color: '#495057'
//                 },
//                 grid: {
//                     color: '#ebedef'
//                 }
//             }
//         }
//     };
// };

// const applyDarkTheme = () => {
//     lineOptions.value = {
//         plugins: {
//             legend: {
//                 labels: {
//                     color: '#ebedef'
//                 }
//             }
//         },
//         scales: {
//             x: {
//                 ticks: {
//                     color: '#ebedef'
//                 },
//                 grid: {
//                     color: 'rgba(160, 167, 181, .3)'
//                 }
//             },
//             y: {
//                 ticks: {
//                     color: '#ebedef'
//                 },
//                 grid: {
//                     color: 'rgba(160, 167, 181, .3)'
//                 }
//             }
//         }
//     };
// };

// watch(
//     isDarkTheme,
//     (val) => {
//         if (val) {
//             applyDarkTheme();
//         } else {
//             applyLightTheme();
//         }
//     },
//     { immediate: true }
// );
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card h-full shadow-1">
                <h5 class="font-bold text-600">Inventory Report</h5>
                <Chart type="line" :data="lineData" :options="lineOptions" />
            </div>
        </div>
        <div class="col-12 xl:col-7 md:col-7 lg:col-7">
            <div class="card h-full shadow-1">
                <h5 class="font-bold text-600">Sales & Purchase</h5>
                <Chart type="bar" :data="lineData" :options="lineOptions" />
            </div>
        </div>
        <div class="col-12 xl:col-5 md:col-5 lg:col-5">
            <div class="card h-full shadow-1">
                <h5 class="font-bold text-600">Availability Summary</h5>
                <Chart type="line" :data="lineData" :options="lineOptions" />
            </div>
        </div>
    </div>
</template>
