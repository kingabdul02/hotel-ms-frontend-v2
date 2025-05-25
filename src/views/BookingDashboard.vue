<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { useLayout } from '@/layout/composables/layout';

import axiosInstance from '../service/AxiosInstance';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '../store/storeconstants';
import { formatDateTime } from '@/utils/dateTimeFormatter';

const store = useStore();
const toast = useToast();
const statisticsBookingResponse = ref({});
const checkInsToday = ref(0);
const checkOutsToday = ref(0);
const availableRoomCount = ref(0);
const recentBookingsCount = ref(0);
const recentBookings = ref([]);

const statisticsBooking = async () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;

    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        const response = await axiosInstance.get('/admin/statistics/booking', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        statisticsBookingResponse.value = response.data;

        checkInsToday.value = statisticsBookingResponse.value.checkInsToday;
        checkOutsToday.value = statisticsBookingResponse.value.checkOutsToday;
        availableRoomCount.value = statisticsBookingResponse.value.availableRoomCount;
        recentBookingsCount.value = statisticsBookingResponse.value.recentBookings.length;
        recentBookings.value = statisticsBookingResponse.value.recentBookings;

        const totalRevenueByRoomType = statisticsBookingResponse.value.totalRevenueByRoomType;
        const labels = Object.keys(totalRevenueByRoomType);
        const datasets = {};

        for (const [monthYear, revenues] of Object.entries(totalRevenueByRoomType)) {
            revenues.forEach(revenue => {
                const roomType = revenue.room_type;
                if (!datasets[roomType]) {
                    datasets[roomType] = {
                        label: roomType,
                        data: Array(labels.length).fill(0), // Initialize data array with zeros
                        fill: false,
                        backgroundColor: revenue.color_code,
                        tension: 0.4
                    };
                }
                const monthIndex = labels.indexOf(monthYear);
                datasets[roomType].data[monthIndex] = revenue.total_revenue;
            });
        }

        lineData.labels = labels;
        lineData.datasets = Object.values(datasets); // Convert datasets object to array

    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch booking statistics', life: 3000 });
        console.error('Error fetching booking statistics:', error);
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

// Helper function to generate random colors
const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

const { isDarkTheme } = useLayout();

const lineData = reactive({
    labels: [],
    datasets: []
});

const lineOptions = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
        },
    },
    interaction: {
        mode: 'index',
        intersect: false,
    },
    scales: {
        x: {
            display: true,
            title: {
                display: true,
                text: 'Month'
            }
        },
        y: {
            display: true,
            title: {
                display: true,
                text: 'Revenue'
            }
        }
    }
};

onMounted(() => {
    statisticsBooking();
});

const formatCurrency = (value) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'NGN' });
};
const applyLightTheme = () => {
    lineOptions.value = {
        plugins: {
            legend: {
                labels: {
                    color: '#495057'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#495057'
                },
                grid: {
                    color: '#ebedef'
                }
            },
            y: {
                ticks: {
                    color: '#495057'
                },
                grid: {
                    color: '#ebedef'
                }
            }
        }
    };
};

const applyDarkTheme = () => {
    lineOptions.value = {
        plugins: {
            legend: {
                labels: {
                    color: '#ebedef'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#ebedef'
                },
                grid: {
                    color: 'rgba(160, 167, 181, .3)'
                }
            },
            y: {
                ticks: {
                    color: '#ebedef'
                },
                grid: {
                    color: 'rgba(160, 167, 181, .3)'
                }
            }
        }
    };
};

watch(
    isDarkTheme,
    (val) => {
        if (val) {
            applyDarkTheme();
        } else {
            applyLightTheme();
        }
    },
    { immediate: true }
);

const value = ref(50);
</script>

<template>
    <div class="grid mb-3">
        <div class="col-12 lg:col-6 xl:col-3">
            <div class="card mb-0 shadow-1 h-full">
                <div class="flex align-items-center gap-4">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-calendar-plus text-red-500 text-6xl"></i>
                    </div>
                    <div class="flex justify-content-between mb-1">
                        <div>
                            <span class="text-900 block font-bold text-3xl mb-1">{{ recentBookingsCount }}</span>
                            <div class="text-500 font-bold">New Booking</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 lg:col-6 xl:col-3">
            <div class="card mb-0 shadow-1 h-full">
                <div class="flex align-items-center gap-4">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-calendar-plus text-blue-500 text-6xl"></i>
                    </div>
                    <div class="flex justify-content-between mb-1">
                        <div>
                            <span class="text-900 block font-bold text-3xl mb-1">{{ availableRoomCount }}</span>
                            <div class="text-500 font-bold">Available Rooms</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 lg:col-6 xl:col-3">
            <div class="card mb-0 shadow-1 h-full">
                <div class="flex align-items-center gap-4">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-calendar-plus text-green-500 text-6xl"></i>
                    </div>
                    <div class="flex justify-content-between mb-1">
                        <div>
                            <span class="text-900 block font-bold text-3xl mb-1">{{ checkInsToday }}</span>
                            <div class="text-500 font-bold">Check-In Today</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 lg:col-6 xl:col-3">
            <div class="card mb-0 shadow-1 h-full">
                <div class="flex align-items-center gap-4">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-calendar-plus text-purple-500 text-6xl"></i>
                    </div>
                    <div class="flex justify-content-between mb-1">
                        <div>
                            <span class="text-900 block font-bold text-3xl mb-1">{{ checkOutsToday }}</span>
                            <div class="text-500 font-bold">Check-Out Today</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="grid mb-3">
        <div class="col-12 xl:col-7 md:col-7 lg:col-7">
            <div class="card h-full shadow-1">
                <h5 class="font-bold text-600">Sales & Purchase</h5>
                <Chart type="line" :data="lineData" :options="lineOptions" />
            </div>
        </div>
        <div class="col-12 xl:col-5 md:col-5 lg:col-5">
            <div class="card h-full shadow-1">
                <h5 class="font-bold text-600">Order Summary</h5>
                <Chart type="bar" :data="lineData" :options="lineOptions" />
            </div>
        </div>
    </div>
    <div class="grid mb-3">
        <div class="col-12 lg:col-6 xl:col-3">
            <div class="card mb-0 shadow-1 h-full">
                <div class="flex align-items-center gap-4">
                    <div class="flex align-items-center justify-content-center">
                        <Knob v-model="value" readonly />
                    </div>
                    <div class="flex justify-content-between mb-1">
                        <div>
                            <span class="text-500 font-bold mb-1">Check-In</span>
                            <div class="text-900 block font-bold text-3xl">20.3K</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 lg:col-6 xl:col-3">
            <div class="card mb-0 shadow-1 h-full">
                <div class="flex align-items-center gap-4">
                    <div class="flex align-items-center justify-content-center">
                        <Knob v-model="value" valueColor="Purple" readonly />
                    </div>
                    <div class="flex justify-content-between mb-1">
                        <div>
                            <span class="text-500 font-bold mb-1">Check-In</span>
                            <div class="text-900 block font-bold text-3xl">20.3K</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 lg:col-6 xl:col-3">
            <div class="card mb-0 shadow-1 h-full">
                <div class="flex align-items-center gap-4">
                    <div class="flex align-items-center justify-content-center">
                        <Knob v-model="value" valueColor="Red" readonly />
                    </div>
                    <div class="flex justify-content-between mb-1">
                        <div>
                            <span class="text-500 font-bold mb-1">Check-In</span>
                            <div class="text-900 block font-bold text-3xl">20.3K</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 lg:col-6 xl:col-3">
            <div class="card mb-0 shadow-1 h-full">
                <div class="flex align-items-center gap-4">
                    <div class="flex align-items-center justify-content-center">
                        <Knob v-model="value" valueColor="Green" readonly />
                    </div>
                    <div class="flex justify-content-between mb-1">
                        <div>
                            <span class="text-500 font-bold mb-1">Check-In</span>
                            <div class="text-900 block font-bold text-3xl">20.3K</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="grid mb-3">
        <div class="col-12">
            <div class="card h-full shadow-1">
                <DataTable :value="recentBookings" :rows="5" :paginator="true" responsiveLayout="scroll">
                    <Column field="room.name" header="Room"></Column>
                    <Column field="user.name" header="Customer Name"></Column>
                    <Column field="check_in_date" header="Check-In time">
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.check_in_date) }}
                        </template>
                    </Column>
                    <Column field="check_out_date" header="Check-Out time">
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.check_in_date) }}
                        </template>
                    </Column>
                    <Column field="special_requests" header="Special Request"></Column>
                    <Column field="total_amount" header="Amount">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.total_amount) }}
                        </template>
                    </Column>
                    <template #header>
                        <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                            <h4 class="m-0 text-900">Recent Bookings</h4>
                            <div class="grid">
                                <router-link to="/admin/booking/management">
                                    <Button label="Show All Bookings" class="p-button-text p-button-secondary" />
                                </router-link>
                            </div>
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>
    </div>
</template>
