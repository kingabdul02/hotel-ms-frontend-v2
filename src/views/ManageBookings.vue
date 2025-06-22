<script setup>
import { onMounted, reactive, ref, watch, computed } from 'vue';
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
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import AutoComplete from 'primevue/autocomplete';
import Textarea from 'primevue/textarea';
import FileUpload from 'primevue/fileupload';
import Card from 'primevue/card';
import Divider from 'primevue/divider';
import InputSwitch from 'primevue/inputswitch';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Chip from 'primevue/chip';

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
const showCorporateBookingDialog = ref(false);
const availableRooms = ref([]);
const companies = ref([]);
const filteredCompanies = ref([]);

// Corporate booking form data
const corporateBookingForm = reactive({
    is_new_company: true,
    check_in_date: null,
    check_out_date: null,
    company: {
        name: '',
        address: '',
        phone: '',
        email: ''
    },
    coordinator: {
        full_name: '',
        email: '',
        phone: '',
        nin: '',
        id_card_file: null
    },
    guests: []
});

const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
];

const selectedCompany = ref(null);
const companySearchQuery = ref('');

// Computed properties
const isFormValid = computed(() => {
    return corporateBookingForm.check_in_date &&
           corporateBookingForm.check_out_date &&
           corporateBookingForm.coordinator.full_name &&
           corporateBookingForm.coordinator.email &&
           corporateBookingForm.coordinator.phone &&
           corporateBookingForm.guests.length > 0 &&
           (corporateBookingForm.is_new_company ? 
            corporateBookingForm.company.name : selectedCompany.value);
});

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

const fetchAvailableRooms = async () => {
    if (!corporateBookingForm.check_in_date || !corporateBookingForm.check_out_date) return;
    
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    
    try {
        const response = await axiosInstance.get('/rooms', {
            params: {
                check_in_date: corporateBookingForm.check_in_date,
                check_out_date: corporateBookingForm.check_out_date
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        availableRooms.value = response.data?.data || [];

        console.log('availableRooms.value', availableRooms.value)
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch available rooms', life: 3000 });
    }
};

const fetchCompanies = async () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    
    try {
        const response = await axiosInstance.get('/admin/companies', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        companies.value = response.data.companies || [];
    } catch (error) {
        console.error('Error fetching companies:', error);
    }
};

const searchCompanies = (event) => {
    filteredCompanies.value = companies.value.filter(company =>
        company.name.toLowerCase().includes(event.query.toLowerCase())
    );
};

const onCompanySelect = (company) => {
    corporateBookingForm.company = { ...company };
};

const addGuest = () => {
    corporateBookingForm.guests.push({
        full_name: '',
        email: '',
        phone: '',
        room_id: null,
        gender: 'Male'
    });
};

const removeGuest = (index) => {
    corporateBookingForm.guests.splice(index, 1);
};

const openCorporateBookingDialog = () => {
    resetCorporateBookingForm();
    fetchCompanies();
    showCorporateBookingDialog.value = true;
};

const resetCorporateBookingForm = () => {
    Object.assign(corporateBookingForm, {
        is_new_company: true,
        check_in_date: null,
        check_out_date: null,
        company: {
            name: '',
            address: '',
            phone: '',
            email: ''
        },
        coordinator: {
            full_name: '',
            email: '',
            phone: '',
            nin: '',
            id_card_file: null
        },
        guests: []
    });
    selectedCompany.value = null;
    availableRooms.value = [];
};

const submitCorporateBooking = async () => {
    if (!isFormValid.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields', life: 3000 });
        return;
    }

    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);

    try {
        const formData = { ...corporateBookingForm };
        
        // If using existing company, use selected company data
        if (!formData.is_new_company && selectedCompany.value) {
            formData.company = selectedCompany.value;
        }

        const response = await axiosInstance.post('/admin/corporate-booking', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });

        toast.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: 'Corporate booking created successfully', 
            life: 3000 
        });
        
        showCorporateBookingDialog.value = false;
        statisticsBooking(); // Refresh dashboard data
        
    } catch (error) {
        toast.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: error.response?.data?.message || 'Failed to create corporate booking', 
            life: 3000 
        });
        console.error('Error creating corporate booking:', error);
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
        await axiosInstance.get(`/admin/check-in-booking/${selectedBooking.value.booking_id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        toast.add({ severity: 'success', summary: 'Success', detail: 'Booking checked in successfully', life: 3000 });
        showDialog.value = false;
        statisticsBooking();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to check in booking', life: 3000 });
        console.error('Error checking in booking:', error);
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

const handleCheckOut = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    try {
        await axiosInstance.get(`/admin/check-out-booking/${selectedBooking.value.booking_id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        toast.add({ severity: 'success', summary: 'Success', detail: 'Booking checked out successfully', life: 3000 });
        showDialog.value = false;
        statisticsBooking();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to check out booking', life: 3000 });
        console.error('Error checking out booking:', error);
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

onMounted(() => {
    statisticsBooking();
});

watch(searchQuery, searchBookings);
watch([() => corporateBookingForm.check_in_date, () => corporateBookingForm.check_out_date], fetchAvailableRooms);

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
                            <div class="flex gap-2">
                                <InputText v-model="searchQuery" placeholder="Search bookings..." />
                                <Button 
                                    label="Corporate Booking" 
                                    icon="pi pi-building" 
                                    class="p-button-outlined" 
                                    @click="openCorporateBookingDialog" 
                                />
                            </div>
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>
    </div>

    <!-- Individual Booking Details Dialog -->
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
                        <Button v-if="selectedBooking.is_checked_out === false && selectedBooking.is_checked_in === false" 
                               label="Check in guest" class="mr-2" icon="pi pi-sign-in" @click="handleCheckIn" />
                        <Button v-if="selectedBooking.is_checked_out === false && selectedBooking.is_checked_in === true" 
                               label="Check out guest" class="p-button-danger" icon="pi pi-sign-out" @click="handleCheckOut" />
                        <p v-if="selectedBooking.is_checked_out === true">Already Checked Out</p>
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

    <!-- Corporate Booking Dialog -->
    <Dialog v-model:visible="showCorporateBookingDialog" header="Create Corporate Booking" :modal="true" 
            :style="{ width: '90vw', maxWidth: '1200px' }" :maximizable="true">
        <div class="corporate-booking-form">
            <TabView>
                <TabPanel header="Booking Details" leftIcon="pi pi-calendar">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="checkInDate">Check-In Date *</label>
                                <Calendar 
                                    id="checkInDate"
                                    v-model="corporateBookingForm.check_in_date" 
                                    dateFormat="yy-mm-dd"
                                    :minDate="new Date()"
                                    class="w-full"
                                />
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="checkOutDate">Check-Out Date *</label>
                                <Calendar 
                                    id="checkOutDate"
                                    v-model="corporateBookingForm.check_out_date" 
                                    dateFormat="yy-mm-dd"
                                    :minDate="corporateBookingForm.check_in_date || new Date()"
                                    class="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Company Information" leftIcon="pi pi-building">
                    <div class="field mb-4">
                        <div class="flex align-items-center gap-2">
                            <InputSwitch v-model="corporateBookingForm.is_new_company" />
                            <label>{{ corporateBookingForm.is_new_company ? 'New Company' : 'Existing Company' }}</label>
                        </div>
                    </div>

                    <div v-if="!corporateBookingForm.is_new_company" class="field mb-4">
                        <label for="companySearch">Select Company *</label>
                        <AutoComplete 
                            id="companySearch"
                            v-model="selectedCompany"
                            :suggestions="filteredCompanies"
                            @complete="searchCompanies"
                            @item-select="onCompanySelect"
                            optionLabel="name"
                            placeholder="Type to search companies..."
                            class="w-full"
                        />
                    </div>

                    <div v-if="corporateBookingForm.is_new_company || selectedCompany">
                        <div class="grid">
                            <div class="col-12 md:col-6">
                                <div class="field">
                                    <label for="companyName">Company Name *</label>
                                    <InputText 
                                        id="companyName"
                                        v-model="corporateBookingForm.company.name" 
                                        class="w-full"
                                        :disabled="!corporateBookingForm.is_new_company"
                                    />
                                </div>
                            </div>
                            <div class="col-12 md:col-6">
                                <div class="field">
                                    <label for="companyEmail">Company Email *</label>
                                    <InputText 
                                        id="companyEmail"
                                        v-model="corporateBookingForm.company.email" 
                                        type="email"
                                        class="w-full"
                                        :disabled="!corporateBookingForm.is_new_company"
                                    />
                                </div>
                            </div>
                            <div class="col-12 md:col-6">
                                <div class="field">
                                    <label for="companyPhone">Company Phone *</label>
                                    <InputText 
                                        id="companyPhone"
                                        v-model="corporateBookingForm.company.phone" 
                                        class="w-full"
                                        :disabled="!corporateBookingForm.is_new_company"
                                    />
                                </div>
                            </div>
                            <div class="col-12 md:col-6">
                                <div class="field">
                                    <label for="companyAddress">Company Address</label>
                                    <Textarea 
                                        id="companyAddress"
                                        v-model="corporateBookingForm.company.address" 
                                        rows="3"
                                        class="w-full"
                                        :disabled="!corporateBookingForm.is_new_company"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Coordinator" leftIcon="pi pi-user">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="coordinatorName">Full Name *</label>
                                <InputText 
                                    id="coordinatorName"
                                    v-model="corporateBookingForm.coordinator.full_name" 
                                    class="w-full"
                                />
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="coordinatorEmail">Email *</label>
                                <InputText 
                                    id="coordinatorEmail"
                                    v-model="corporateBookingForm.coordinator.email" 
                                    type="email"
                                    class="w-full"
                                />
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="coordinatorPhone">Phone *</label>
                                <InputText 
                                    id="coordinatorPhone"
                                    v-model="corporateBookingForm.coordinator.phone" 
                                    class="w-full"
                                />
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="coordinatorNin">NIN</label>
                                <InputText 
                                    id="coordinatorNin"
                                    v-model="corporateBookingForm.coordinator.nin" 
                                    class="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Guests" leftIcon="pi pi-users">
                    <div class="mb-4">
                        <Button 
                            label="Add Guest" 
                            icon="pi pi-plus" 
                            @click="addGuest"
                        />
                        <small v-if="availableRooms.length === 0" class="text-orange-500 ml-2">
                            Please select check-in and check-out dates first
                        </small>
                    </div>

                    <div v-if="corporateBookingForm.guests.length > 0" class="guest-list">
                        <Card v-for="(guest, index) in corporateBookingForm.guests" :key="index" class="mb-3">
                            <template #header>
                                <div class="flex justify-content-between align-items-center p-3">
                                    <span class="font-semibold">Guest {{ index + 1 }}</span>
                                    <Button 
                                        icon="pi pi-trash" 
                                        class="p-button-rounded p-button-danger p-button-text" 
                                        @click="removeGuest(index)"
                                    />
                                </div>
                            </template>
                            <template #content>
                                <div class="grid">
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label>Full Name *</label>
                                            <InputText 
                                                v-model="guest.full_name" 
                                                class="w-full"
                                                placeholder="Enter guest full name"
                                            />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label>Email *</label>
                                            <InputText 
                                                v-model="guest.email" 
                                                type="email"
                                                class="w-full"
                                                placeholder="Enter guest email"
                                            />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4">
                                        <div class="field">
                                            <label>Phone *</label>
                                            <InputText 
                                                v-model="guest.phone" 
                                                class="w-full"
                                                placeholder="Enter guest phone"
                                            />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4">
                                        <div class="field">
                                            <label>Gender *</label>
                                            <Dropdown 
                                                v-model="guest.gender" 
                                                :options="genderOptions"
                                                optionLabel="label"
                                                optionValue="value"
                                                class="w-full"
                                            />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4">
                                        <div class="field">
                                            <label>Room *</label>
                                            <Dropdown 
                                                v-model="guest.room_id" 
                                                :options="availableRooms"
                                                optionLabel="name"
                                                optionValue="id"
                                                class="w-full"
                                                placeholder="Select room"
                                                :trackBy="room => room.id"
                                            >
                                                <template #option="slotProps">
                                                    <div class="flex justify-content-between align-items-center">
                                                        <span>{{ slotProps.option.name }}</span>
                                                        <Chip :label="formatCurrency(slotProps.option.price)" class="ml-2" />
                                                    </div>
                                                </template>
                                            </Dropdown>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>

                    <div v-else class="text-center py-4">
                        <i class="pi pi-users text-4xl text-400 mb-3"></i>
                        <p class="text-600">No guests added yet. Click "Add Guest" to start.</p>
                    </div>
                </TabPanel>

                <TabPanel header="Summary" leftIcon="pi pi-check-circle">
                    <div class="booking-summary">
                        <div class="grid">
                            <div class="col-12 md:col-6">
                                <Card>
                                    <template #title>
                                        <i class="pi pi-calendar mr-2"></i>Booking Period
                                    </template>
                                    <template #content>
                                        <div class="flex justify-content-between mb-2">
                                            <span>Check-in:</span>
                                            <strong>{{ corporateBookingForm.check_in_date || 'Not selected' }}</strong>
                                        </div>
                                        <div class="flex justify-content-between">
                                            <span>Check-out:</span>
                                            <strong>{{ corporateBookingForm.check_out_date || 'Not selected' }}</strong>
                                        </div>
                                    </template>
                                </Card>
                            </div>
                            <div class="col-12 md:col-6">
                                <Card>
                                    <template #title>
                                        <i class="pi pi-building mr-2"></i>Company
                                    </template>
                                    <template #content>
                                        <div class="flex justify-content-between mb-2">
                                            <span>Name:</span>
                                            <strong>{{ corporateBookingForm.company.name || 'Not specified' }}</strong>
                                        </div>
                                        <div class="flex justify-content-between">
                                            <span>Type:</span>
                                            <Tag :value="corporateBookingForm.is_new_company ? 'New Company' : 'Existing Company'" 
                                                 :severity="corporateBookingForm.is_new_company ? 'success' : 'info'" />
                                        </div>
                                    </template>
                                </Card>
                            </div>
                            <div class="col-12 md:col-6">
                                <Card>
                                    <template #title>
                                        <i class="pi pi-user mr-2"></i>Coordinator
                                    </template>
                                    <template #content>
                                        <div class="flex justify-content-between mb-2">
                                            <span>Name:</span>
                                            <strong>{{ corporateBookingForm.coordinator.full_name || 'Not specified' }}</strong>
                                        </div>
                                        <div class="flex justify-content-between">
                                            <span>Email:</span>
                                            <strong>{{ corporateBookingForm.coordinator.email || 'Not specified' }}</strong>
                                        </div>
                                    </template>
                                </Card>
                            </div>
                            <div class="col-12 md:col-6">
                                <Card>
                                    <template #title>
                                        <i class="pi pi-users mr-2"></i>Guests
                                    </template>
                                    <template #content>
                                        <div class="flex justify-content-between mb-2">
                                            <span>Total Guests:</span>
                                            <strong>{{ corporateBookingForm.guests.length }}</strong>
                                        </div>
                                        <div class="flex justify-content-between">
                                            <span>Rooms Required:</span>
                                            <strong>{{ corporateBookingForm.guests.filter(g => g.room_id).length }}</strong>
                                        </div>
                                    </template>
                                </Card>
                            </div>
                        </div>

                        <Divider />

                        <div v-if="corporateBookingForm.guests.length > 0">
                            <h5 class="mb-3">Guest List</h5>
                            <div class="guest-summary">
                                <div v-for="(guest, index) in corporateBookingForm.guests" :key="index" 
                                     class="flex justify-content-between align-items-center p-3 mb-2 surface-100 border-round">
                                    <div>
                                        <span class="font-semibold">{{ guest.full_name || `Guest ${index + 1}` }}</span>
                                        <small class="block text-600">{{ guest.email }}</small>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-semibold">
                                            {{ availableRooms.find(r => r.id === guest.room_id)?.name || 'No room selected' }}
                                        </div>
                                        <small class="text-600">{{ guest.gender }}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>
            </TabView>
        </div>

        <template #footer>
            <div class="flex justify-content-between">
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    class="p-button-text" 
                    @click="showCorporateBookingDialog = false" 
                />
                <Button 
                    label="Create Booking" 
                    icon="pi pi-check" 
                    @click="submitCorporateBooking"
                    :disabled="!isFormValid"
                />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.corporate-booking-form {
    min-height: 400px;
}

.guest-list .p-card {
    border: 1px solid var(--surface-border);
}

.guest-list .p-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.3s ease;
}

.booking-summary .p-card {
    height: 100%;
}

.guest-summary .surface-100 {
    border: 1px solid var(--surface-border);
}

.guest-summary .surface-100:hover {
    background-color: var(--surface-200);
}

.field {
    margin-bottom: 1rem;
}

.field label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-color);
}

.p-tabview .p-tabview-panels {
    padding: 1.5rem;
}

.p-dialog .p-dialog-header {
    background: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
}

.p-dialog .p-dialog-content {
    padding: 0;
}

.p-dialog .p-dialog-footer {
    border-top: 1px solid var(--surface-border);
    background: var(--surface-card);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .corporate-booking-form .grid .col-12 {
        padding: 0.5rem;
    }
    
    .guest-list .p-card {
        margin-bottom: 1rem;
    }
}

/* Animation for smooth transitions */
.p-dialog-enter-active, .p-dialog-leave-active {
    transition: all 0.3s ease;
}

.p-dialog-enter-from, .p-dialog-leave-to {
    opacity: 0;
    transform: scale(0.9);
}

/* Custom scrollbar for dialog content */
.p-dialog .p-dialog-content::-webkit-scrollbar {
    width: 6px;
}

.p-dialog .p-dialog-content::-webkit-scrollbar-track {
    background: var(--surface-ground);
}

.p-dialog .p-dialog-content::-webkit-scrollbar-thumb {
    background: var(--surface-border);
    border-radius: 3px;
}

.p-dialog .p-dialog-content::-webkit-scrollbar-thumb:hover {
    background: var(--surface-300);
}
</style>