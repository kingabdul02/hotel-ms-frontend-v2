<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import axiosInstance from '../service/AxiosInstance';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '../store/storeconstants';
import { formatDateTime } from '@/utils/dateTimeFormatter';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';

const store = useStore();
const toast = useToast();
const statisticsBookingResponse = ref({});
const checkInsToday = ref(0);
const checkOutsToday = ref(0);
const availableRoomCount = ref(0);
const recentBookingsCount = ref(0);
const recentBookings = ref([]);
const filteredBookings = ref([]);
const searchQuery = ref('');
const selectedBooking = ref(null);
const showDialog = ref(false);

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
        filteredBookings.value = recentBookings.value;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch booking statistics', life: 3000 });
        console.error('Error fetching booking statistics:', error);
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

const searchBookings = () => {
    if (searchQuery.value) {
        filteredBookings.value = recentBookings.value.filter(booking =>
            booking.room.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            booking.user.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
    } else {
        filteredBookings.value = recentBookings.value;
    }
};

const showDetails = (booking) => {
    selectedBooking.value = booking;
    showDialog.value = true;
};

const handleCheckIn = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    try {
        await axiosInstance.get(`/admin/check-in-booking/${selectedBooking.value.booking_id}`, null, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        toast.add({ severity: 'success', summary: 'Success', detail: 'Booking checked in successfully', life: 3000 });
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
        showDialog.value = false;
        statisticsBooking();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to check in booking', life: 3000 });
        console.error('Error checking in booking:', error);
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

const handleCheckOut = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    try {
        await axiosInstance.get(`/admin/check-out-booking/${selectedBooking.value.booking_id}`, null, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        toast.add({ severity: 'success', summary: 'Success', detail: 'Booking checked out successfully', life: 3000 });
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
        showDialog.value = false;
        statisticsBooking();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to check out booking', life: 3000 });
        console.error('Error checking out booking:', error);
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

onMounted(() => {
    statisticsBooking();
});

watch(searchQuery, searchBookings);

const { isDarkTheme } = useLayout();

const formatCurrency = (value) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'NGN' });
};

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
        <div class="col-12">
            <div class="card h-full shadow-1">
                <DataTable :value="filteredBookings" :rows="5" :paginator="true" responsiveLayout="scroll">
                    <Column field="room.name" header="Room"></Column>
                    <Column field="user.name" header="Customer Name"></Column>
                    <Column field="check_in_date" header="Check-In time">
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.check_in_date) }}
                        </template>
                    </Column>
                    <Column field="check_out_date" header="Check-Out time">
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.check_out_date) }}
                        </template>
                    </Column>
                    <Column field="payment_status" header="Payment status">
                        <template #body="slotProps">
                            <Tag style="width: 100px;" v-if="slotProps.data.payment_status === 'paid'"
                                severity="success" class="px-3" value="Paid"></Tag>
                            <Tag style="width: 100px;" v-else severity="danger" class="px-3" value="Pending"></Tag>
                        </template>
                    </Column>
                    <Column header="Actions">
                        <template #body="slotProps">
                            <Button label="Details" @click="showDetails(slotProps.data)" />
                        </template>
                    </Column>
                    <template #header>
                        <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                            <h4 class="m-0 text-900">Recent Bookings</h4>
                            <div class="grid">
                                <InputText v-model="searchQuery" placeholder="Search..." class="" />
                            </div>
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>
    </div>
    <Dialog v-model:visible="showDialog" header="Booking Details" :modal="true" :style="{ width: '60vw' }">
        <div v-if="selectedBooking">
            <div class="surface-section border-2 border-dashed surface-border p-3">
                <div class="flex align-items-start flex-column lg:justify-content-between lg:flex-row">
                    <div>
                        <div class="font-medium text-3xl text-700"><i
                                class="pi pi-user mr-2 text-2xl font-bold"></i><span>{{
                                    selectedBooking.user.name }}</span></div>
                        <div class="flex align-items-center text-700 flex-wrap">
                            <div class="mr-5 flex align-items-center mt-3">
                                <i class="pi pi-sign-in mr-2"></i>
                                <span>
                                    <Tag v-if="selectedBooking.is_checked_in === true" severity="success" class="px-3"
                                        value="Checked In"></Tag>
                                    <Tag v-else-if="selectedBooking.is_checked_out === true" severity="contrast" class="px-3" value="Checked Out">
                                    </Tag>
                                    <Tag v-else severity="contrast" class="px-3" value="Not Checked in">
                                    </Tag>
                                </span>
                            </div>
                            <div class="mr-5 flex align-items-center mt-3">
                                <i class="pi pi-money-bill mr-2"></i>
                                <span>{{ formatCurrency(selectedBooking.room.price ) }}</span>
                            </div>
                            <div class="flex align-items-center mt-3">
                                <i class="pi pi-clock mr-2"></i>
                                <span>{{ formatDateTime(selectedBooking.check_in_date) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 lg:mt-0">
                        <Button v-if="selectedBooking.is_checked_out === false && selectedBooking.is_checked_in === false" label="Check in guest" class="mr-2" icon="pi pi-sign-in" @click="handleCheckIn" />
                        <Button v-if="selectedBooking.is_checked_out === false && selectedBooking.is_checked_in === true" label="Check out guest" class="p-button-danger" icon="pi pi-sign-out" @click="handleCheckOut" />
                        <p v-if="selectedBooking.is_checked_out === true">Already Checkd Out</p>
                    </div>
                </div>
            </div>
            <div class="mt-4">
                <p><strong>Room:</strong> {{ selectedBooking.room.name }}</p>
                <p><strong>Room Capacity:</strong> {{ selectedBooking.room.no_of_guests }}</p>
                <p><strong>No. of nights:</strong> {{ selectedBooking.no_of_nights }}</p>
                <p><strong>Check-In Time:</strong> {{ formatDateTime(selectedBooking.check_in_date) }}</p>
                <p><strong>Check-Out Time:</strong> {{ formatDateTime(selectedBooking.check_out_date) }}</p>
                <p><strong class="mr-3">Payment Status:</strong>
                    <Tag style="width: 100px;" v-if="selectedBooking.payment_status === 'paid'" severity="success"
                        class="px-3" value="Paid"></Tag>
                    <Tag style="width: 100px;" v-else severity="danger" class="px-3" value="Pending"></Tag>
                </p>
            </div>
        </div>
        <template #footer>
            <Button severity="secondary" label="Close" @click="showDialog = false" />
        </template>
    </Dialog>
</template>

<style scoped>
/* Add any additional styling here */
</style>
