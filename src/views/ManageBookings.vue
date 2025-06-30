<script setup lang="ts">
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
const availableRooms = ref([]);
const companies = ref([]);
const filteredCompanies = ref([]);

// Reactive data
const corporateBookings = ref([]);
const loading = ref(false);
const totalRecords = ref(0);
const searchQuery2 = ref('');
const selectedStatus = ref('');
const expandedBookings = ref([]);
const guestDetailsVisible = ref(false);
const selectedGuest = ref(null);
const selectedBooking2 = ref(null);

const lazyParams = ref({
  first: 0,
  rows: 10,
  page: 1
});

// Status options for filtering
const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' }
];

// Fetch corporate bookings
const fetchCorporateBookings = async (params = lazyParams.value) => {
  const userData = JSON.parse(localStorage.getItem('userData'));
  const token = userData?.token;

  loading.value = true;
  store.commit(LOADING_SPINNER_SHOW_MUTATION, true);

  try {
    const response = await axiosInstance.get('/admin/corporate-booking', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        page: params.page,
        per_page: params.rows,
        search: searchQuery2.value,
        status: selectedStatus.value
      }
    });

    corporateBookings.value = response.data.data;
    totalRecords.value = response.data.meta.total;
    lazyParams.value = params;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch corporate bookings',
      life: 3000
    });
    console.error('Error fetching corporate bookings:', error);
  } finally {
    loading.value = false;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
  }
};

// Handle pagination
const onPage = (event) => {
  const params = {
    first: event.first,
    rows: event.rows,
    page: Math.floor(event.first / event.rows) + 1
  };
  fetchCorporateBookings(params);
};

// Toggle booking expansion
const toggleBookingExpansion = (bookingId) => {
  const index = expandedBookings.value.indexOf(bookingId);
  if (index > -1) {
    expandedBookings.value.splice(index, 1);
  } else {
    expandedBookings.value.push(bookingId);
  }
};

// Show guest details dialog
const showGuestDetails = (guest, booking) => {
  selectedGuest.value = guest;
  selectedBooking2.value = booking;
  guestDetailsVisible.value = true;
};

// Get booking status
const getBookingStatus = (booking) => {
  const allCheckedOut = booking.guests.every(guest => guest.is_checked_out);
  const someCheckedIn = booking.guests.some(guest => guest.is_checked_in);
  
  if (allCheckedOut) return 'Completed';
  if (someCheckedIn) return 'In Progress';
  return 'Pending';
};

// Get booking status severity
const getBookingStatusSeverity = (booking) => {
  const status = getBookingStatus(booking);
  switch (status) {
    case 'Completed': return 'success';
    case 'In Progress': return 'info';
    case 'Pending': return 'warning';
    default: return 'info';
  }
};

// Get guest status
const getGuestStatus = (guest) => {
  if (guest.is_checked_out) return 'Checked Out';
  if (guest.is_checked_in) return 'Checked In';
  return 'Pending';
};

// Get guest status severity
const getGuestStatusSeverity = (guest) => {
  if (guest.is_checked_out) return 'info';
  if (guest.is_checked_in) return 'success';
  return 'warning';
};

// Get statistics
const getCheckedInCount = () => {
  return corporateBookings.value.reduce((count, booking) => {
    return count + booking.guests.filter(guest => guest.is_checked_in && !guest.is_checked_out).length;
  }, 0);
};

const getCheckedOutCount = () => {
  return corporateBookings.value.reduce((count, booking) => {
    return count + booking.guests.filter(guest => guest.is_checked_out).length;
  }, 0);
};

const getTotalGuestsCount = () => {
  return corporateBookings.value.reduce((count, booking) => {
    return count + booking.guests.length;
  }, 0);
};

// Check-in guest
const checkInGuest = async (guest) => {
  const userData = JSON.parse(localStorage.getItem('userData'));
  const token = userData?.token;

  try {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    await axiosInstance.put(`/admin/corporate-booking/guest/${guest.id}/check-in`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${guest.full_name} has been checked in successfully`,
      life: 3000
    });

    // Refresh the data
    await fetchCorporateBookings();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to check in guest',
      life: 3000
    });
    console.error('Error checking in guest:', error);
  } finally {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
  }
};

// Check-out guest
const checkOutGuest = async (guest) => {
  const userData = JSON.parse(localStorage.getItem('userData'));
  const token = userData?.token;

  try {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    await axiosInstance.put(`/admin/corporate-booking/guest/${guest.id}/check-out`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${guest.full_name} has been checked out successfully`,
      life: 3000
    });

    // Refresh the data
    await fetchCorporateBookings();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to check out guest',
      life: 3000
    });
    console.error('Error checking out guest:', error);
  } finally {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
  }
};

// Confirm check-in
const confirmCheckIn = (guest) => {
  confirm.require({
    message: `Are you sure you want to check in ${guest.full_name}?`,
    header: 'Check-In Confirmation',
    icon: 'pi pi-info-circle',
    rejectClass: 'p-button-text p-button-text',
    acceptClass: 'p-button-success',
    accept: () => {
      checkInGuest(guest);
    }
  });
};

// Confirm check-out
const confirmCheckOut = (guest) => {
  confirm.require({
    message: `Are you sure you want to check out ${guest.full_name}?`,
    header: 'Check-Out Confirmation',
    icon: 'pi pi-info-circle',
    rejectClass: 'p-button-text p-button-text',
    acceptClass: 'p-button-danger',
    accept: () => {
      checkOutGuest(guest);
    }
  });
};

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
        
        resetCorporateBookingForm();
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
    fetchCompanies();
    fetchCorporateBookings();
});

watch(searchQuery, searchBookings);
watch([() => corporateBookingForm.check_in_date, () => corporateBookingForm.check_out_date], fetchAvailableRooms);
watch([searchQuery2, selectedStatus], () => {
  // Reset to first page when searching/filtering
  lazyParams.value.first = 0;
  lazyParams.value.page = 1;
  fetchCorporateBookings();
}, { debounce: 500 });

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
    <div class="booking-management-container">
        <!-- Main Tab Navigation -->
        <TabView class="main-tabview">
            <!-- Bookings Tab -->
            <TabPanel>
                <template #header>
                    <div class="tab-header">
                        <i class="pi pi-calendar-check text-primary"></i>
                        <span class="ml-2 tab-title">Bookings</span>
                    </div>
                </template>
                
                <!-- Statistics Cards -->
                <div class="grid mb-4">
                    <div class="col-12 lg:col-6 xl:col-3">
                        <Card class="statistics-card card-new-booking">
                            <template #content>
                                <div class="flex align-items-center gap-4">
                                    <div class="icon-container bg-red-100">
                                        <i class="pi pi-calendar-plus text-red-600 text-4xl"></i>
                                    </div>
                                    <div class="statistics-content">
                                        <div class="statistics-number text-red-600">{{ recentBookingsCount }}</div>
                                        <div class="statistics-label">New Bookings</div>
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>
                    
                    <div class="col-12 lg:col-6 xl:col-3">
                        <Card class="statistics-card card-available-rooms">
                            <template #content>
                                <div class="flex align-items-center gap-4">
                                    <div class="icon-container bg-blue-100">
                                        <i class="pi pi-home text-blue-600 text-4xl"></i>
                                    </div>
                                    <div class="statistics-content">
                                        <div class="statistics-number text-blue-600">{{ availableRoomCount }}</div>
                                        <div class="statistics-label">Available Rooms</div>
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>
                    
                    <div class="col-12 lg:col-6 xl:col-3">
                        <Card class="statistics-card card-check-ins">
                            <template #content>
                                <div class="flex align-items-center gap-4">
                                    <div class="icon-container bg-green-100">
                                        <i class="pi pi-sign-in text-green-600 text-4xl"></i>
                                    </div>
                                    <div class="statistics-content">
                                        <div class="statistics-number text-green-600">{{ checkInsToday }}</div>
                                        <div class="statistics-label">Check-ins Today</div>
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>
                    
                    <div class="col-12 lg:col-6 xl:col-3">
                        <Card class="statistics-card card-check-outs">
                            <template #content>
                                <div class="flex align-items-center gap-4">
                                    <div class="icon-container bg-purple-100">
                                        <i class="pi pi-sign-out text-purple-600 text-4xl"></i>
                                    </div>
                                    <div class="statistics-content">
                                        <div class="statistics-number text-purple-600">{{ checkOutsToday }}</div>
                                        <div class="statistics-label">Check-outs Today</div>
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>
                </div>
                
                <!-- Recent Bookings Table -->
                <Card class="bookings-table-card">
                    <template #title>
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-list text-primary"></i>
                            <span>Recent Bookings</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="table-header mb-4">
                            <InputText 
                                v-model="searchQuery" 
                                placeholder="Search bookings..." 
                                class="search-input"
                            >
                                <template #prepend>
                                    <i class="pi pi-search"></i>
                                </template>
                            </InputText>
                        </div>
                        
                        <DataTable 
                            :value="filteredBookings" 
                            :rows="10" 
                            :paginator="true" 
                            responsiveLayout="scroll"
                            class="custom-datatable"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} bookings"
                        >
                            <Column field="room.name" header="Room" sortable>
                                <template #body="slotProps">
                                    <div class="flex align-items-center gap-2">
                                        <i class="pi pi-home text-primary"></i>
                                        <span class="font-semibold">{{ slotProps.data.room.name }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="user.name" header="Customer" sortable>
                                <template #body="slotProps">
                                    <div class="flex align-items-center gap-2">
                                        <i class="pi pi-user text-primary"></i>
                                        <span>{{ slotProps.data.user.name }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="check_in_date" header="Check-In" sortable>
                                <template #body="slotProps">
                                    <div class="flex align-items-center gap-2">
                                        <i class="pi pi-calendar text-green-600"></i>
                                        <span>{{ formatDateTime(slotProps.data.check_in_date) }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="check_out_date" header="Check-Out" sortable>
                                <template #body="slotProps">
                                    <div class="flex align-items-center gap-2">
                                        <i class="pi pi-calendar text-red-600"></i>
                                        <span>{{ formatDateTime(slotProps.data.check_out_date) }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="payment_status" header="Payment Status" sortable>
                                <template #body="slotProps">
                                    <Tag 
                                        :value="slotProps.data.payment_status === 'paid' ? 'Paid' : 'Pending'"
                                        :severity="slotProps.data.payment_status === 'paid' ? 'success' : 'warning'"
                                        class="payment-status-tag"
                                    />
                                </template>
                            </Column>
                            <Column header="Actions">
                                <template #body="slotProps">
                                    <Button 
                                        label="View Details" 
                                        icon="pi pi-eye"
                                        class="p-button-sm p-button-outlined"
                                        @click="showDetails(slotProps.data)" 
                                    />
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </TabPanel>
            
            <!-- Corporate Bookings Tab -->
            <TabPanel>
                <template #header>
                    <div class="tab-header">
                        <i class="pi pi-building text-primary"></i>
                        <span class="ml-2 tab-title">Corporate Bookings</span>
                    </div>
                </template>
                
                <Card class="corporate-booking-card">
                    <template #title>
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-building text-primary"></i>
                            <span>Create Corporate Booking</span>
                        </div>
                    </template>
                    <template #content>
                        <TabView class="corporate-form-tabs">
                            <!-- Booking Details -->
                            <TabPanel header="Booking Details" leftIcon="pi pi-calendar">
                                <div class="grid">
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label for="checkInDate" class="form-label">Check-In Date *</label>
                                            <Calendar 
                                                id="checkInDate"
                                                v-model="corporateBookingForm.check_in_date" 
                                                dateFormat="yy-mm-dd"
                                                :minDate="new Date()"
                                                class="w-full"
                                                placeholder="Select check-in date"
                                            />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label for="checkOutDate" class="form-label">Check-Out Date *</label>
                                            <Calendar 
                                                id="checkOutDate"
                                                v-model="corporateBookingForm.check_out_date" 
                                                dateFormat="yy-mm-dd"
                                                :minDate="corporateBookingForm.check_in_date || new Date()"
                                                class="w-full"
                                                placeholder="Select check-out date"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>

                            <!-- Company Information -->
                            <TabPanel header="Company Information" leftIcon="pi pi-building">
                                <div class="field mb-4">
                                    <div class="flex align-items-center gap-3">
                                        <InputSwitch v-model="corporateBookingForm.is_new_company" />
                                        <label class="form-label mb-0">
                                            {{ corporateBookingForm.is_new_company ? 'New Company' : 'Existing Company' }}
                                        </label>
                                    </div>
                                </div>

                                <div v-if="!corporateBookingForm.is_new_company" class="field mb-4">
                                    <label for="companySearch" class="form-label">Select Company *</label>
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
                                                <label for="companyName" class="form-label">Company Name *</label>
                                                <InputText 
                                                    id="companyName"
                                                    v-model="corporateBookingForm.company.name" 
                                                    class="w-full"
                                                    placeholder="Enter company name"
                                                    :disabled="!corporateBookingForm.is_new_company"
                                                />
                                            </div>
                                        </div>
                                        <div class="col-12 md:col-6">
                                            <div class="field">
                                                <label for="companyEmail" class="form-label">Company Email *</label>
                                                <InputText 
                                                    id="companyEmail"
                                                    v-model="corporateBookingForm.company.email" 
                                                    type="email"
                                                    class="w-full"
                                                    placeholder="Enter company email"
                                                    :disabled="!corporateBookingForm.is_new_company"
                                                />
                                            </div>
                                        </div>
                                        <div class="col-12 md:col-6">
                                            <div class="field">
                                                <label for="companyPhone" class="form-label">Company Phone *</label>
                                                <InputText 
                                                    id="companyPhone"
                                                    v-model="corporateBookingForm.company.phone" 
                                                    class="w-full"
                                                    placeholder="Enter company phone"
                                                    :disabled="!corporateBookingForm.is_new_company"
                                                />
                                            </div>
                                        </div>
                                        <div class="col-12 md:col-6">
                                            <div class="field">
                                                <label for="companyAddress" class="form-label">Company Address</label>
                                                <Textarea 
                                                    id="companyAddress"
                                                    v-model="corporateBookingForm.company.address" 
                                                    rows="3"
                                                    class="w-full"
                                                    placeholder="Enter company address"
                                                    :disabled="!corporateBookingForm.is_new_company"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>

                            <!-- Coordinator -->
                            <TabPanel header="Coordinator" leftIcon="pi pi-user">
                                <div class="grid">
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label for="coordinatorName" class="form-label">Full Name *</label>
                                            <InputText 
                                                id="coordinatorName"
                                                v-model="corporateBookingForm.coordinator.full_name" 
                                                class="w-full"
                                                placeholder="Enter coordinator full name"
                                            />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label for="coordinatorEmail" class="form-label">Email *</label>
                                            <InputText 
                                                id="coordinatorEmail"
                                                v-model="corporateBookingForm.coordinator.email" 
                                                type="email"
                                                class="w-full"
                                                placeholder="Enter coordinator email"
                                            />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label for="coordinatorPhone" class="form-label">Phone *</label>
                                            <InputText 
                                                id="coordinatorPhone"
                                                v-model="corporateBookingForm.coordinator.phone" 
                                                class="w-full"
                                                placeholder="Enter coordinator phone"
                                            />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label for="coordinatorNin" class="form-label">NIN</label>
                                            <InputText 
                                                id="coordinatorNin"
                                                v-model="corporateBookingForm.coordinator.nin" 
                                                class="w-full"
                                                placeholder="Enter NIN (optional)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>

                            <!-- Guests -->
                            <TabPanel header="Guests" leftIcon="pi pi-users">
                                <div class="mb-4 flex align-items-center justify-content-between">
                                    <Button 
                                        label="Add Guest" 
                                        icon="pi pi-plus" 
                                        class="p-button-success"
                                        @click="addGuest"
                                    />
                                    <small v-if="availableRooms.length === 0" class="text-orange-500">
                                        Please select check-in and check-out dates first
                                    </small>
                                </div>

                                <div v-if="corporateBookingForm.guests.length > 0" class="guest-list">
                                    <Card v-for="(guest, index) in corporateBookingForm.guests" :key="index" class="guest-card mb-3">
                                        <template #header>
                                            <div class="flex justify-content-between align-items-center p-3">
                                                <div class="flex align-items-center gap-2">
                                                    <i class="pi pi-user text-primary"></i>
                                                    <span class="font-semibold">Guest {{ index + 1 }}</span>
                                                </div>
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
                                                        <label class="form-label">Full Name *</label>
                                                        <InputText 
                                                            v-model="guest.full_name" 
                                                            class="w-full"
                                                            placeholder="Enter guest full name"
                                                        />
                                                    </div>
                                                </div>
                                                <div class="col-12 md:col-6">
                                                    <div class="field">
                                                        <label class="form-label">Email *</label>
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
                                                        <label class="form-label">Phone *</label>
                                                        <InputText 
                                                            v-model="guest.phone" 
                                                            class="w-full"
                                                            placeholder="Enter guest phone"
                                                        />
                                                    </div>
                                                </div>
                                                <div class="col-12 md:col-4">
                                                    <div class="field">
                                                        <label class="form-label">Gender *</label>
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
                                                        <label class="form-label">Room *</label>
                                                        <Dropdown 
                                                            v-model="guest.room_id" 
                                                            :options="availableRooms"
                                                            optionLabel="name"
                                                            optionValue="id"
                                                            class="w-full"
                                                            placeholder="Select room"
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

                                <div v-else class="text-center py-5">
                                    <i class="pi pi-users text-6xl text-400 mb-3"></i>
                                    <p class="text-600 text-lg">No guests added yet</p>
                                    <p class="text-500">Click "Add Guest" to start adding guests to this booking</p>
                                </div>
                            </TabPanel>

                            <!-- Summary -->
                            <TabPanel header="Summary" leftIcon="pi pi-check-circle">
                                <div class="booking-summary">
                                    <div class="grid">
                                        <div class="col-12 md:col-6">
                                            <Card class="summary-card">
                                                <template #title>
                                                    <div class="flex align-items-center gap-2">
                                                        <i class="pi pi-calendar text-primary"></i>
                                                        <span>Booking Period</span>
                                                    </div>
                                                </template>
                                                <template #content>
                                                    <div class="summary-item">
                                                        <span class="summary-label">Check-in:</span>
                                                        <strong class="summary-value">{{ corporateBookingForm.check_in_date || 'Not selected' }}</strong>
                                                    </div>
                                                    <div class="summary-item">
                                                        <span class="summary-label">Check-out:</span>
                                                        <strong class="summary-value">{{ corporateBookingForm.check_out_date || 'Not selected' }}</strong>
                                                    </div>
                                                </template>
                                            </Card>
                                        </div>
                                        <div class="col-12 md:col-6">
                                            <Card class="summary-card">
                                                <template #title>
                                                    <div class="flex align-items-center gap-2">
                                                        <i class="pi pi-building text-primary"></i>
                                                        <span>Company</span>
                                                    </div>
                                                </template>
                                                <template #content>
                                                    <div class="summary-item">
                                                        <span class="summary-label">Name:</span>
                                                        <strong class="summary-value">{{ corporateBookingForm.company.name || 'Not specified' }}</strong>
                                                    </div>
                                                    <div class="summary-item">
                                                        <span class="summary-label">Type:</span>
                                                        <Tag :value="corporateBookingForm.is_new_company ? 'New Company' : 'Existing Company'" 
                                                             :severity="corporateBookingForm.is_new_company ? 'success' : 'info'" />
                                                    </div>
                                                </template>
                                            </Card>
                                        </div>
                                        <div class="col-12 md:col-6">
                                            <Card class="summary-card">
                                                <template #title>
                                                    <div class="flex align-items-center gap-2">
                                                        <i class="pi pi-user text-primary"></i>
                                                        <span>Coordinator</span>
                                                    </div>
                                                </template>
                                                <template #content>
                                                    <div class="summary-item">
                                                        <span class="summary-label">Name:</span>
                                                        <strong class="summary-value">{{ corporateBookingForm.coordinator.full_name || 'Not specified' }}</strong>
                                                    </div>
                                                    <div class="summary-item">
                                                        <span class="summary-label">Email:</span>
                                                        <strong class="summary-value">{{ corporateBookingForm.coordinator.email || 'Not specified' }}</strong>
                                                    </div>
                                                </template>
                                            </Card>
                                        </div>
                                        <div class="col-12 md:col-6">
                                            <Card class="summary-card">
                                                <template #title>
                                                    <div class="flex align-items-center gap-2">
                                                        <i class="pi pi-users text-primary"></i>
                                                        <span>Guests</span>
                                                    </div>
                                                </template>
                                                <template #content>
                                                    <div class="summary-item">
                                                        <span class="summary-label">Total Guests:</span>
                                                        <strong class="summary-value">{{ corporateBookingForm.guests.length }}</strong>
                                                    </div>
                                                    <div class="summary-item">
                                                        <span class="summary-label">Rooms Required:</span>
                                                        <strong class="summary-value">{{ corporateBookingForm.guests.filter(g => g.room_id).length }}</strong>
                                                    </div>
                                                </template>
                                            </Card>
                                        </div>
                                    </div>

                                    <Divider />

                                    <div v-if="corporateBookingForm.guests.length > 0" class="guest-summary">
                                        <h5 class="mb-3 flex align-items-center gap-2">
                                            <i class="pi pi-list text-primary"></i>
                                            <span>Guest List</span>
                                        </h5>
                                        <div class="guest-summary-list">
                                            <div v-for="(guest, index) in corporateBookingForm.guests" :key="index" 
                                                 class="guest-summary-item">
                                                <div class="guest-info">
                                                    <div class="guest-name">
                                                        <i class="pi pi-user text-primary mr-2"></i>
                                                        <span class="font-semibold">{{ guest.full_name || `Guest ${index + 1}` }}</span>
                                                    </div>
                                                    <div class="guest-email text-600">{{ guest.email }}</div>
                                                </div>
                                                <div class="guest-room-info">
                                                    <div class="room-name font-semibold">
                                                        {{ availableRooms.find(r => r.id === guest.room_id)?.name || 'No room selected' }}
                                                    </div>
                                                    <div class="guest-gender text-600">{{ guest.gender }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-actions mt-5">
                                        <div class="flex justify-content-between">
                                            <Button 
                                                label="Reset Form" 
                                                icon="pi pi-refresh" 
                                                class="p-button-outlined p-button-secondary" 
                                                @click="resetCorporateBookingForm" 
                                            />
                                            <Button 
                                                label="Create Booking" 
                                                icon="pi pi-check" 
                                                class="p-button-success"
                                                @click="submitCorporateBooking"
                                                :disabled="!isFormValid"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>
                        </TabView>
                    </template>
                </Card>
            </TabPanel>

            <!-- Corporate Booking Management -->
            <TabPanel>
                <template #header>
                    <div class="tab-header">
                        <i class="pi pi-building text-primary"></i>
                        <span class="ml-2 tab-title">Manage Corporate Bookings</span>
                    </div>
                </template>
                
                <!-- Header Section -->
                <div class="mb-4">
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Corporate Booking Management</h2>
                    <p class="text-gray-600">Manage corporate bookings and guest check-ins/check-outs</p>
                </div>

                <!-- Statistics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <div class="bg-blue-100 rounded-full p-3 mr-3">
                                <i class="pi pi-calendar text-blue-600 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-gray-800">{{ totalRecords }}</div>
                                <div class="text-sm text-gray-600">Total Bookings</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <div class="bg-green-100 rounded-full p-3 mr-3">
                                <i class="pi pi-check-circle text-green-600 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-gray-800">{{ getCheckedInCount() }}</div>
                                <div class="text-sm text-gray-600">Checked In</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <div class="bg-red-100 rounded-full p-3 mr-3">
                                <i class="pi pi-times-circle text-red-600 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-gray-800">{{ getCheckedOutCount() }}</div>
                                <div class="text-sm text-gray-600">Checked Out</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <div class="bg-purple-100 rounded-full p-3 mr-3">
                                <i class="pi pi-users text-purple-600 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-gray-800">{{ getTotalGuestsCount() }}</div>
                                <div class="text-sm text-gray-600">Total Guests</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Search and Filter Section -->
                <div class="bg-white rounded-lg shadow-sm border p-4 mb-6">
                    <div class="flex flex-col md:flex-row gap-4 items-center">
                        <div class="flex-1">
                            <div class="relative">
                                <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                <InputText 
                                    v-model="searchQuery2" 
                                    placeholder="Search by coordinator or guest name..." 
                                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <Dropdown 
                                v-model="selectedStatus" 
                                :options="statusOptions" 
                                optionLabel="label" 
                                optionValue="value"
                                placeholder="All Status"
                                class="w-40"
                                showClear
                            />
                        </div>
                    </div>
                </div>

                <!-- Bookings List -->
                <div class="space-y-4">
                    <div v-if="loading" class="text-center py-8">
                        <ProgressSpinner />
                        <p class="text-gray-600 mt-2">Loading bookings...</p>
                    </div>
                    
                    <div v-else-if="corporateBookings.length === 0" class="text-center py-8">
                        <i class="pi pi-inbox text-gray-400 text-4xl mb-4"></i>
                        <p class="text-gray-600">No corporate bookings found</p>
                    </div>
                    
                    <div v-else>
                        <div 
                            v-for="booking in corporateBookings" 
                            :key="booking.id"
                            class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200"
                        >
                            <!-- Booking Header -->
                            <div class="p-4 border-b border-gray-200">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-4">
                                        <div class="bg-blue-100 rounded-full p-3">
                                            <i class="pi pi-calendar text-blue-600 text-lg"></i>
                                        </div>
                                        <div>
                                            <h3 class="text-lg font-semibold text-gray-800">Booking #{{ booking.id }}</h3>
                                            <p class="text-sm text-gray-600">Coordinator: {{ booking.coordinator.full_name }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center space-x-4">
                                        <div class="text-right">
                                            <div class="text-sm font-medium text-gray-800">{{ formatDateTime(booking.check_in_date) }} - {{ formatDateTime(booking.check_out_date) }}</div>
                                            <div class="text-sm text-gray-600">{{ booking.guests.length }} guest{{ booking.guests.length !== 1 ? 's' : '' }}</div>
                                        </div>
                                        <Tag 
                                            :value="getBookingStatus(booking)" 
                                            :severity="getBookingStatusSeverity(booking)"
                                            class="text-sm"
                                        />
                                        <Button 
                                            :icon="expandedBookings.includes(booking.id) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                                            class="p-button-text p-button-sm"
                                            @click="toggleBookingExpansion(booking.id)"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Coordinator Information (Always Visible) -->
                            <div class="p-4 bg-gray-50">
                                <h4 class="font-semibold text-gray-800 mb-3">Coordinator Information</h4>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div class="flex items-center space-x-2">
                                        <i class="pi pi-envelope text-gray-500"></i>
                                        <span class="text-sm text-gray-700">{{ booking.coordinator.email }}</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <i class="pi pi-phone text-gray-500"></i>
                                        <span class="text-sm text-gray-700">{{ booking.coordinator.phone }}</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <i class="pi pi-id-card text-gray-500"></i>
                                        <span class="text-sm text-gray-700">NIN: {{ booking.coordinator.nin }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Expanded Guests Section -->
                            <div v-if="expandedBookings.includes(booking.id)" class="border-t border-gray-200">
                                <div class="p-4">
                                    <div class="flex items-center justify-between mb-4">
                                        <h4 class="font-semibold text-gray-800 flex items-center">
                                            <i class="pi pi-users text-gray-500 mr-2"></i>
                                            Guests ({{ booking.guests.length }})
                                        </h4>
                                    </div>
                                    
                                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div 
                                            v-for="guest in booking.guests" 
                                            :key="guest.id"
                                            class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                        >
                                            <!-- Guest Header -->
                                            <div class="flex items-center justify-between mb-3">
                                                <div class="flex items-center space-x-3">
                                                    <div class="bg-gray-100 rounded-full p-2">
                                                        <i 
                                                            class="pi pi-user text-lg"
                                                            :class="guest.gender === 'Male' ? 'text-blue-500' : guest.gender === 'Female' ? 'text-pink-500' : 'text-gray-500'"
                                                        ></i>
                                                    </div>
                                                    <div>
                                                        <h5 class="font-semibold text-gray-800">{{ guest.full_name }}</h5>
                                                        <p class="text-sm text-gray-600">{{ guest.gender }}</p>
                                                    </div>
                                                </div>
                                                <div class="flex items-center space-x-2">
                                                    <Tag 
                                                        :value="getGuestStatus(guest)" 
                                                        :severity="getGuestStatusSeverity(guest)"
                                                        class="text-xs"
                                                    />
                                                    <Button 
                                                        icon="pi pi-eye"
                                                        class="p-button-text p-button-sm"
                                                        @click="showGuestDetails(guest, booking)"
                                                        v-tooltip="'View Details'"
                                                    />
                                                </div>
                                            </div>

                                            <!-- Guest Contact Info -->
                                            <div class="space-y-2 mb-3">
                                                <div class="flex items-center space-x-2 text-sm">
                                                    <i class="pi pi-envelope text-gray-400 w-4"></i>
                                                    <span class="text-gray-700">{{ guest.email }}</span>
                                                </div>
                                                <div class="flex items-center space-x-2 text-sm">
                                                    <i class="pi pi-phone text-gray-400 w-4"></i>
                                                    <span class="text-gray-700">{{ guest.phone }}</span>
                                                </div>
                                                <div class="flex items-center space-x-2 text-sm">
                                                    <i class="pi pi-home text-gray-400 w-4"></i>
                                                    <span class="text-gray-700">{{ guest.room?.name || 'No room assigned' }}</span>
                                                    <Chip 
                                                        v-if="guest.room"
                                                        :label="formatCurrency(guest.room.price)"
                                                        class="text-xs"
                                                    />
                                                </div>
                                            </div>

                                            <!-- Check-in/Check-out Status -->
                                            <div class="space-y-2 mb-4">
                                                <div class="flex items-center justify-between text-sm">
                                                    <span class="text-gray-600">Check-in Status:</span>
                                                    <Tag 
                                                        :value="guest.is_checked_in ? 'Checked In' : 'Not Checked In'"
                                                        :severity="guest.is_checked_in ? 'success' : 'warning'"
                                                        class="text-xs"
                                                    />
                                                </div>
                                                <div class="flex items-center justify-between text-sm">
                                                    <span class="text-gray-600">Check-out Status:</span>
                                                    <Tag 
                                                        :value="guest.is_checked_out ? 'Checked Out' : 'Still In Room'"
                                                        :severity="guest.is_checked_out ? 'info' : 'success'"
                                                        class="text-xs"
                                                    />
                                                </div>
                                            </div>

                                            <!-- Action Buttons -->
                                            <div class="flex space-x-2">
                                                <Button
                                                    v-if="!guest.is_checked_in && !guest.is_checked_out"
                                                    label="Check In"
                                                    icon="pi pi-sign-in"
                                                    class="p-button-success p-button-sm flex-1"
                                                    @click="confirmCheckIn(guest)"
                                                />
                                                <Button
                                                    v-if="guest.is_checked_in && !guest.is_checked_out"
                                                    label="Check Out"
                                                    icon="pi pi-sign-out"
                                                    class="p-button-danger p-button-sm flex-1"
                                                    @click="confirmCheckOut(guest)"
                                                />
                                                <span v-if="guest.is_checked_out" class="text-sm text-gray-500 flex items-center justify-center flex-1">
                                                    <i class="pi pi-check-circle mr-1"></i>
                                                    Completed
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div v-if="corporateBookings.length > 0" class="mt-6">
                    <Paginator
                        :first="lazyParams.first"
                        :rows="lazyParams.rows"
                        :totalRecords="totalRecords"
                        :rowsPerPageOptions="[5, 10, 20, 50]"
                        @page="onPage"
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                        class="p-paginator-sm"
                    />
                </div>

                <!-- Guest Details Dialog -->
                <Dialog 
                    v-model:visible="guestDetailsVisible" 
                    :style="{ width: '600px' }" 
                    header="Guest Details" 
                    :modal="true"
                    class="p-fluid"
                >
                    <div v-if="selectedGuest" class="space-y-6">
                        <!-- Personal Information -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <p class="text-gray-900">{{ selectedGuest.full_name }}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <p class="text-gray-900">{{ selectedGuest.gender }}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <p class="text-gray-900">{{ selectedGuest.email }}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <p class="text-gray-900">{{ selectedGuest.phone }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Room Information -->
                        <div v-if="selectedGuest.room">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Room Information</h3>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <div class="flex items-center space-x-4 mb-4">
                                    <div v-if="selectedGuest.room.images?.data?.length > 0" class="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                                        <img 
                                            :src="selectedGuest.room.images.data[0].url" 
                                            :alt="selectedGuest.room.name"
                                            class="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-gray-800">{{ selectedGuest.room.name }}</h4>
                                        <p class="text-sm text-gray-600">{{ selectedGuest.room.roomType?.name }}</p>
                                        <p class="text-lg font-semibold text-blue-600">{{ formatCurrency(selectedGuest.room.price) }}/night</p>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span class="text-gray-600">Capacity:</span>
                                        <span class="font-medium ml-1">{{ selectedGuest.room.no_of_guests }} guests</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">Bedrooms:</span>
                                        <span class="font-medium ml-1">{{ selectedGuest.room.no_of_bedrooms }}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">Beds:</span>
                                        <span class="font-medium ml-1">{{ selectedGuest.room.no_of_beds }}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">Bathrooms:</span>
                                        <span class="font-medium ml-1">{{ selectedGuest.room.no_of_baths }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Status Information -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Status Information</h3>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span class="text-gray-700">Check-in Status:</span>
                                    <Tag 
                                        :value="selectedGuest.is_checked_in ? 'Checked In' : 'Not Checked In'"
                                        :severity="selectedGuest.is_checked_in ? 'success' : 'warning'"
                                    />
                                </div>
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span class="text-gray-700">Check-out Status:</span>
                                    <Tag 
                                        :value="selectedGuest.is_checked_out ? 'Checked Out' : 'Still In Room'"
                                        :severity="selectedGuest.is_checked_out ? 'info' : 'success'"
                                    />
                                </div>
                                <div v-if="selectedGuest.checked_in_at" class="p-3 bg-gray-50 rounded-lg">
                                    <span class="text-gray-700">Checked in at:</span>
                                    <span class="font-medium ml-2">{{ formatDateTime(selectedGuest.checked_in_at) }}</span>
                                </div>
                                <div v-if="selectedGuest.checked_out_at" class="p-3 bg-gray-50 rounded-lg">
                                    <span class="text-gray-700">Checked out at:</span>
                                    <span class="font-medium ml-2">{{ formatDateTime(selectedGuest.checked_out_at) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </TabPanel>
        </TabView>

        <!-- Individual Booking Details Dialog -->
        <Dialog v-model:visible="showDialog" header="Booking Details" :modal="true" :style="{ width: '70vw' }">
            <div v-if="selectedBooking" class="booking-details">
                <Card class="booking-detail-card">
                    <template #content>
                        <div class="flex align-items-start flex-column lg:justify-content-between lg:flex-row">
                            <div class="booking-customer-info">
                                <div class="customer-name">
                                    <i class="pi pi-user mr-2 text-primary"></i>
                                    <span class="text-2xl font-bold">{{ selectedBooking.user.name }}</span>
                                </div>
                                <div class="booking-status-info">
                                    <div class="status-item">
                                        <i class="pi pi-sign-in mr-2"></i>
                                        <Tag v-if="selectedBooking.is_checked_in === true" severity="success" value="Checked In" />
                                        <Tag v-else-if="selectedBooking.is_checked_out === true" severity="contrast" value="Checked Out" />
                                        <Tag v-else severity="warning" value="Not Checked In" />
                                    </div>
                                    <div class="status-item">
                                        <i class="pi pi-money-bill mr-2"></i>
                                        <span class="price-text">{{ formatCurrency(selectedBooking.room.price) }}</span>
                                    </div>
                                    <div class="status-item">
                                        <i class="pi pi-clock mr-2"></i>
                                        <span>{{ formatDateTime(selectedBooking.check_in_date) }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="booking-actions">
                                <Button v-if="selectedBooking.is_checked_out === false && selectedBooking.is_checked_in === false" 
                                       label="Check In Guest" 
                                       icon="pi pi-sign-in" 
                                       class="p-button-success mr-2"
                                       @click="handleCheckIn" />
                                <Button v-if="selectedBooking.is_checked_out === false && selectedBooking.is_checked_in === true" 
                                       label="Check Out Guest" 
                                       icon="pi pi-sign-out" 
                                       class="p-button-danger"
                                       @click="handleCheckOut" />
                                <p v-if="selectedBooking.is_checked_out === true" class="text-600">Already Checked Out</p>
                            </div>
                        </div>
                    </template>
                </Card>
                
                <div class="booking-details-grid mt-4">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="detail-item">
                                <label class="detail-label">Room:</label>
                                <span class="detail-value">{{ selectedBooking.room.name }}</span>
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="detail-item">
                                <label class="detail-label">Room Capacity:</label>
                                <span class="detail-value">{{ selectedBooking.room.no_of_guests }} guests</span>
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="detail-item">
                                <label class="detail-label">Number of Nights:</label>
                                <span class="detail-value">{{ selectedBooking.no_of_nights }}</span>
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="detail-item">
                                <label class="detail-label">Payment Status:</label>
                                <Tag 
                                    :value="selectedBooking.payment_status === 'paid' ? 'Paid' : 'Pending'"
                                    :severity="selectedBooking.payment_status === 'paid' ? 'success' : 'warning'"
                                />
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="detail-item">
                                <label class="detail-label">Check-In Time:</label>
                                <span class="detail-value">{{ formatDateTime(selectedBooking.check_in_date) }}</span>
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="detail-item">
                                <label class="detail-label">Check-Out Time:</label>
                                <span class="detail-value">{{ formatDateTime(selectedBooking.check_out_date) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button severity="secondary" label="Close" icon="pi pi-times" @click="showDialog = false" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.booking-management-container {
    padding: 1rem;
}

/* Main Tab Navigation */
.main-tabview {
    background: var(--surface-card);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.main-tabview .p-tabview-nav {
    background: var(--surface-card);
    border-bottom: 2px solid var(--surface-border);
    border-radius: 12px 12px 0 0;
}

.main-tabview .p-tabview-header {
    background: transparent;
}

.main-tabview .p-tabview-header.p-highlight {
    background: var(--primary-50);
    border-color: var(--primary-color);
}

.tab-header {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
}

.tab-title {
    font-weight: 600;
    font-size: 1.1rem;
}

/* Statistics Cards */
.statistics-card {
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    border: 1px solid var(--surface-border);
}

.statistics-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.icon-container {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.statistics-content {
    flex: 1;
}

.statistics-number {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 0.5rem;
}

.statistics-label {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Bookings Table */
.bookings-table-card {
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.table-header {
    padding: 1rem 0;
}

.search-input {
    max-width: 300px;
}

.custom-datatable {
    border-radius: 12px;
    overflow: hidden;
}

.payment-status-tag {
    min-width: 80px;
    text-align: center;
}

/* Corporate Booking Form */
.corporate-booking-card {
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.corporate-form-tabs .p-tabview-panels {
    padding: 2rem;
}

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-color);
}

.field {
    margin-bottom: 1.5rem;
}

/* Guest Cards */
.guest-card {
    border: 2px solid var(--surface-border);
    border-radius: 12px;
    transition: all 0.3s ease;
}

.guest-card:hover {
    border-color: var(--primary-color);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Summary Cards */
.summary-card {
    border-radius: 12px;
    border: 1px solid var(--surface-border);
    height: 100%;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.summary-label {
    color: var(--text-color-secondary);
    font-weight: 500;
}

.summary-value {
    color: var(--text-color);
}

.guest-summary-list {
    max-height: 300px;
    overflow-y: auto;
}

.guest-summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    margin-bottom: 0.5rem;
    background: var(--surface-100);
    border-radius: 8px;
    border: 1px solid var(--surface-border);
    transition: all 0.3s ease;
}

.guest-summary-item:hover {
    background: var(--surface-200);
    transform: translateX(4px);
}

.guest-info {
    flex: 1;
}

.guest-name {
    display: flex;
    align-items: center;
    margin-bottom: 0.25rem;
}

.guest-room-info {
    text-align: right;
}

.room-name {
    margin-bottom: 0.25rem;
}

/* Booking Details Dialog */
.booking-detail-card {
    border-radius: 12px;
    border: 2px solid var(--surface-border);
}

.booking-customer-info {
    flex: 1;
}

.customer-name {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
}

.booking-status-info {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.price-text {
    font-weight: 600;
    color: var(--primary-color);
}

.booking-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.detail-label {
    font-weight: 600;
    color: var(--text-color-secondary);
    font-size: 0.9rem;
}

.detail-value {
    font-weight: 500;
    color: var(--text-color);
}

/* Form Actions */
.form-actions {
    padding: 1.5rem;
    background: var(--surface-50);
    border-radius: 12px;
    border: 1px solid var(--surface-border);
}

/* Responsive Design */
@media (max-width: 768px) {
    .booking-management-container {
        padding: 0.5rem;
    }
    
    .statistics-number {
        font-size: 2rem;
    }
    
    .tab-title {
        font-size: 1rem;
    }
    
    .corporate-form-tabs .p-tabview-panels {
        padding: 1rem;
    }
    
    .guest-summary-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .guest-room-info {
        text-align: left;
    }
    
    .booking-status-info {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .booking-actions {
        margin-top: 1rem;
        flex-direction: row;
        gap: 0.5rem;
    }
}

/* Animations */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.statistics-card,
.bookings-table-card,
.corporate-booking-card {
    animation: fadeIn 0.6s ease-out;
}

/* Scrollbar Styling */
.guest-summary-list::-webkit-scrollbar {
    width: 6px;
}

.guest-summary-list::-webkit-scrollbar-track {
    background: var(--surface-ground);
    border-radius: 3px;
}

.guest-summary-list::-webkit-scrollbar-thumb {
    background: var(--surface-border);
    border-radius: 3px;
}

.guest-summary-list::-webkit-scrollbar-thumb:hover {
    background: var(--surface-300);
}
</style>