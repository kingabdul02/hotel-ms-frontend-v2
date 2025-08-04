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
const statisticsInventoryResponse = ref({});
const totalProducts = ref(0);
const mostUsedItems = ref([]);
const lowStockItems = ref([]);
const outOfStockItems = ref([]);
const products = ref([]);
const statistics = ref([]);

const statisticsInventory = async () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        const response = await axiosInstance.get('/admin/statistics/inventory', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        statisticsInventoryResponse.value = response.data;
        totalProducts.value = statisticsInventoryResponse.value.totalProducts;
        mostUsedItems.value = statisticsInventoryResponse.value.mostUsedItems;
        lowStockItems.value = statisticsInventoryResponse.value.lowStockItems;
        outOfStockItems.value = statisticsInventoryResponse.value.outOfStockItems;
        products.value = statisticsInventoryResponse.value.products.data;
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
    const labels = statistics.map((stat) => stat.category_name);
    const data = statistics.map((stat) => stat.total_quantity);
    const colors = statistics.map((stat) => stat.chart_color);

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
        <div class="col-12 xl:col-7 md:col-7 lg:col-7">
            <div class="card h-full shadow-1">
                <h5 class="font-bold text-600">Inventory Stats by Category</h5>
                <Chart type="bar" :data="lineData" />
            </div>
        </div>
        <div class="col-12 xl:col-5 md:col-5 lg:col-5">
            <div class="card h-full shadow-1">
                <h5 class="font-bold text-600">Inventory Stats by Category</h5>
                <Chart type="line" :data="lineData" />
            </div>
        </div>
        <div class="col-12 xl:col-7 md:col-7 lg:col-7">
            <div class="card h-full shadow-1">
                <h5 class="font-bold text-600 mb-6">Overall Inventory</h5>
                <div class="grid">
                    <div class="col-12 md:col-6 lg:col-4">
                        <div class="surface-card border-right-2 surface-border">
                            <div class="flex justify-content-between mb-3">
                                <div>
                                    <span class="block text-yellow-500 font-bold mb-3">Total Products</span>
                                    <div class="text-500 font-bold text-xl">{{ totalProducts }}</div>
                                </div>
                            </div>
                            <span class="text-500">Last 7 days</span>
                        </div>
                    </div>
                    <div class="col-12 md:col-6 lg:col-4">
                        <div class="surface-card border-right-2 surface-border">
                            <div class="flex justify-content-between mb-3">
                                <div>
                                    <span class="block text-purple-500 font-bold mb-3">Most Used Items</span>
                                    <div class="text-500 font-bold text-xl">{{ mostUsedItems.length }}</div>
                                </div>
                            </div>
                            <span class="text-500">Last 7 days</span>
                        </div>
                    </div>
                    <div class="col-12 md:col-6 lg:col-4">
                        <div class="surface-card">
                            <div class="flex justify-content-between mb-3">
                                <div>
                                    <span class="block text-red-500 font-bold mb-3">Low Stocks</span>
                                    <div class="text-500 font-bold text-xl">{{ lowStockItems.length }}</div>
                                </div>
                            </div>
                            <span class="text-500">Not in stock</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 xl:col-5 md:col-5 lg:col-5">
            <div class="card h-full shadow-1">
                <div class="grid">
                    <div class="col-8">
                        <h5 class="font-bold text-600 w-full md:w-9">Low Quantity Stock</h5>
                    </div>
                    <div class="col-4 pt-2">
                        <Button label="See All" class="p-button-text"></Button>
                    </div>
                </div>

                <div v-for="item in lowStockItems" :key="item.name">
                    <div class="flex align-items-center gap-4 mb-4">
                        <div
                            style="background-image: url('/img/building/nbte-21.jpeg'); height: 50px; width: 50px; border-radius: 5px; background-size: cover; background-position: center; background-repeat: no-repeat"
                            class="p-0 c-shadow img-fit img-fluid"
                        ></div>
                        <div class="">
                            <div class="font-bold text-600 text-xl mb-2">{{ item.name }}</div>
                            <div class="font-medium text-600">Remaining Quantity : {{ item.inventory.quantity }} units</div>
                        </div>
                        <Tag class="px-4" severity="warning" value="LOWSTOCK"></Tag>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12">
            <div class="card h-full shadow-1">
                <DataTable :value="outOfStockItems" :rows="5" :paginator="true" responsiveLayout="scroll">
                    <template #header>
                        <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                            <h4 class="m-0 text-600">Out Of Stock Items</h4>
                            <!-- <div class="grid">
                                <Button label="Add Product" icon="pi pi-plus" class="mr-2" iconPos="left" />
                                <IconField iconPosition="left">
                                    <InputIcon>
                                        <i class="pi pi-search" />
                                    </InputIcon>
                                    <InputText placeholder="Search..." />
                                </IconField>
                            </div> -->
                        </div>
                    </template>
                    <Column style="width: 10%">
                        <template #header> Image </template>
                        <template #body="slotProps">
                            <img :src="slotProps.data.image_url || '/img/noimage.gif'" :alt="slotProps.data.image_url" width="50" class="c-shadow border-round" />
                        </template>
                    </Column>
                    <Column field="name" header="Name" :sortable="true" style="width: 30%"></Column>
                    <Column field="category.name" header="Category" :sortable="true" style="width: 30%"></Column>
                    <Column field="unit_price" header="Unit Price" :sortable="true" style="width: 15%">
                        <template #body="slotProps"> ₦{{ slotProps.data.unit_price }} </template>
                    </Column>
                    <Column style="width: 20%">
                        <template #header> Status </template>
                        <template #body>
                            <Tag class="px-1" severity="danger" value="OUTOFSTOCK"></Tag>
                        </template>
                    </Column>
                    <Column style="width: 15%">
                        <template #header> View </template>
                        <template #body>
                            <Button icon="pi pi-eye" type="button" class="p-button-text"></Button>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>
