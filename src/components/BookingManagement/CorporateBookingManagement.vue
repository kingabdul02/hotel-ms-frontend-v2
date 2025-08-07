<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import ProgressSpinner from 'primevue/progressspinner';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import Dialog from 'primevue/dialog';
import { useCorporateBooking } from '@/composables/useCorporateBooking';
import { useRouter } from 'vue-router';
import StatisticsCards from './StatisticsCards.vue';
import EditCorporateBookingModal from './EditCorporateBookingModal.vue';
import CorporateBookingForm from './CorporateBookingForm.vue';
import GuestBill from './GuestBill.vue';


// Constants
const bookingStatusOptions = [
  { label: 'All', value: null },
  { label: 'Pending', value: 'confirmed' },
  { label: 'Checked-In', value: 'checked_in' },
  { label: 'Checked Out', value: 'checked_out' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Not Showed', value: 'not_showed' },
];

const paymentStatusOptions = [
  { label: 'All Payment Status', value: '' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Cancelled', value: 'cancelled' },
];

interface Guest {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  gender?: string;
  is_checked_in: boolean;
  is_checked_out: boolean;
  checked_in_at?: string;
  checked_out_at?: string;
  room: {
    id: string;
    name: string;
    price: number;
    no_of_guests?: number;
    no_of_bedrooms?: number;
    no_of_beds?: number;
    no_of_baths?: number;
    images?: {
      data: Array<{ url: string }>;
    };
    roomType?: {
      name: string;
    };
  };
}

interface CorporateBooking {
  id: string;
  coordinator?: {
    full_name: string;
  };
  company?: {
    name: string;
  };
  guests: Guest[];
  check_in_date: string;
  check_out_date: string;
  booking_date?: string;
  created_at?: string;
  reservation_code: string;
  payment_status?: string;
}

// Composable
const {
  corporateBookings,
  loading,
  totalRecords,
  searchQuery,
  selectedStatus,
  selectedPaymentStatus,
  filterDateRange,
  filterCheckoutRange,
  filterBookingDateRange,
  fetchCorporateBookings,
  getBookingStatus,
  getBookingStatusSeverity,
  getGuestStatus,
  getGuestStatusSeverity,
  getCheckedInCount,
  getCheckedOutCount,
  getTotalGuestsCount,
  confirmCheckIn,
  confirmCheckOut,
  confirmBookingCheckIn,
  confirmBookingCheckOut,
  resetCorporateBookingForm,
  fetchBookingById,
  fetchCompanies,
  toast,
  confirm,
  showBookingDialog,
  isEditMode,
  bookingIdToEdit,
  corporateBookingForm
} = useCorporateBooking();

// Reactive state
const selectedGuest = ref<Guest | null>(null);
const showGuestDialog = ref(false);
const expandedRows = ref<CorporateBooking[]>([]);
const isSearching = ref(false);
const showEditModal = ref(false);
const selectedBookingForEdit = ref(null);
const showCreateModal = ref(false);
const showBillDialog = ref(false);
const selectedBookingForBill = ref(null);
const selectedGuestForBill = ref(null);
const billContent = ref(null);
const rows = ref(10); // pagination rows per page

const ITEMS_PER_PAGE = 10;

// Helper functions for date formatting
const apiDate = (d: Date | undefined) => {
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildFilters = () => ({
  check_in_from: apiDate(filterDateRange.value[0]),
  check_in_to: apiDate(filterDateRange.value[1]),
  check_out_from: apiDate(filterCheckoutRange.value[0]),
  check_out_to: apiDate(filterCheckoutRange.value[1]),
  booking_from: apiDate(filterBookingDateRange.value[0]),
  booking_to: apiDate(filterBookingDateRange.value[1]),
});

// Computed properties
const hasBookings = computed(() => corporateBookings.value.length > 0);
const isEmptyState = computed(() => {
  return !loading.value && corporateBookings.value.length === 0 && 
         !searchQuery.value.trim() && !selectedStatus.value && !selectedPaymentStatus.value &&
         !filterDateRange.value?.length && !filterCheckoutRange.value?.length && 
         !filterBookingDateRange.value?.length;
});
const isNoSearchResults = computed(() => {
  return !loading.value && corporateBookings.value.length === 0 && 
         (searchQuery.value.trim() || selectedStatus.value || selectedPaymentStatus.value ||
          filterDateRange.value?.length || filterCheckoutRange.value?.length || 
          filterBookingDateRange.value?.length);
});

const statisticsData = computed(() => ({
  recentBookingsCount: corporateBookings.value.length,
  availableRoomCount: 0, // This should come from your API
  checkInsToday: getCheckedInCount(),
  checkOutsToday: getCheckedOutCount(),
}));

// Router
const router = useRouter();

// Methods
const handleSearch = async () => {
  if (isSearching.value) return;
  isSearching.value = true;
  try {
    await fetchCorporateBookings({ first: 0, rows: rows.value, page: 1 }, buildFilters());
  } finally {
    isSearching.value = false;
  }
};

const handleStatusChange = async () => {
  await fetchCorporateBookings({ first: 0, rows: rows.value, page: 1 }, buildFilters());
};

const handlePaymentStatusChange = async () => {
  await fetchCorporateBookings({ first: 0, rows: rows.value, page: 1 }, buildFilters());
};

const onPage = async (event: any) => {
  rows.value = event.rows;
  await fetchCorporateBookings({ first: event.first, rows: event.rows, page: event.page + 1 }, buildFilters());
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedStatus.value = '';
  selectedPaymentStatus.value = '';
  filterDateRange.value = [];
  filterCheckoutRange.value = [];
  filterBookingDateRange.value = [];
  fetchCorporateBookings({ first: 0, rows: rows.value, page: 1 }, buildFilters());
};

const showGuestDetails = (guest: Guest) => {
  selectedGuest.value = guest;
  showGuestDialog.value = true;
};

const closeGuestDialog = () => {
  showGuestDialog.value = false;
  selectedGuest.value = null;
};

const handleRowExpand = (event: { data: CorporateBooking }) => {
  expandedRows.value = [event.data];
};

const handleRowCollapse = () => {
  expandedRows.value = [];
};

const handleCheckIn = (guest: Guest) => {
  confirmCheckIn(guest);
};

const handleCheckOut = (guest: Guest) => {
  confirmCheckOut(guest);
};

const handleBookingCheckIn = (booking: CorporateBooking) => {
  confirmBookingCheckIn(booking);
};

const handleBookingCheckOut = (booking: CorporateBooking) => {
  confirmBookingCheckOut(booking);
};

const openCreateBookingDialog = () => {
  resetCorporateBookingForm();
  isEditMode.value = false;
  bookingIdToEdit.value = null;
  showCreateModal.value = true;
};

const openEditBookingDialog = async (booking: CorporateBooking) => {
  const bookingDetails = await fetchBookingById(booking.id);
  if (bookingDetails) {
    selectedBookingForEdit.value = bookingDetails;
    showEditModal.value = true;
  }
};

const handleBookingCreation = async () => {
  showCreateModal.value = false;
  await fetchCorporateBookings({ first: 0, rows: rows.value, page: 1 }, buildFilters());
};

const handleBookingUpdated = async () => {
  showEditModal.value = false;
  await fetchCorporateBookings({ first: 0, rows: rows.value, page: 1 }, buildFilters());
};

const openGuestBill = (guest, booking) => {
  selectedGuestForBill.value = guest;
  selectedBookingForBill.value = booking;
  showBillDialog.value = true;
};

const viewBill = (booking: CorporateBooking) => {
  router.push({
    name: 'CorporateBill',
    params: { reservation_code: booking.reservation_code },
  });
};

const printBill = () => {
  const billElement = billContent.value?.$el;
  if (billElement) {
    const printWindow = window.open('', 'PRINT', 'height=800,width=900');
    printWindow.document.write('<html><head><title>Guest Bill</title>');

    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    styles.forEach(style => {
      printWindow.document.head.appendChild(style.cloneNode(true));
    });

    printWindow.document.write('</head><body>');
    printWindow.document.write(billElement.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};

// Utility functions
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount?: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount ?? 0);
};

const getGuestCountText = (count: number): string => {
  return `${count} guest${count !== 1 ? 's' : ''}`;
};

const getPaymentStatus = (booking: CorporateBooking): string => {
  // Return payment status text based on booking data
  const status = booking.payment_status || 'pending';
  switch (status) {
    case 'paid': return 'Paid';
    case 'partial': return 'Partial';
    case 'refunded': return 'Refunded';
    case 'failed': return 'Failed';
    case 'pending':
    default: return 'Pending';
  }
};

const getPaymentStatusSeverity = (booking: CorporateBooking): string => {
  // Return payment status severity for styling
  const status = booking.payment_status || 'pending';
  switch (status) {
    case 'paid': return 'success';
    case 'partial': return 'warning';
    case 'refunded': return 'info';
    case 'failed': return 'danger';
    case 'pending':
    default: return 'warning';
  }
};

// Helper functions for booking check-in/out status
const canBookingCheckIn = (booking: CorporateBooking): boolean => {
  // Can check in if all guests are not checked in and not checked out
  return booking.guests.some(guest => !guest.is_checked_in && !guest.is_checked_out);
};

const canBookingCheckOut = (booking: CorporateBooking): boolean => {
  // Can check out if some guests are checked in but not all are checked out
  return booking.guests.some(guest => guest.is_checked_in && !guest.is_checked_out);
};

const isBookingCompleted = (booking: CorporateBooking): boolean => {
  // Booking is completed if all guests are checked out
  return booking.guests.length > 0 && booking.guests.every(guest => guest.is_checked_out);
};

// Lifecycle
onMounted(async () => {
  await fetchCorporateBookings({ first: 0, rows: rows.value, page: 1 }, buildFilters());
  await fetchCompanies();
});

// Watchers
watch(searchQuery, handleSearch, { debounce: 500 });
watch(selectedStatus, handleStatusChange);
watch(selectedPaymentStatus, handlePaymentStatusChange);
watch(
  [filterDateRange, filterCheckoutRange, filterBookingDateRange],
  () => {
    // Only fetch if date ranges are valid (empty or have both start and end dates)
    const checkInRange = filterDateRange.value;
    const checkOutRange = filterCheckoutRange.value;
    const bookingDateRange = filterBookingDateRange.value;
    
    const isValidRange = (range: Date[]) => range.length === 0 || range.length === 2;
    
    if (isValidRange(checkInRange) && isValidRange(checkOutRange) && isValidRange(bookingDateRange)) {
      fetchCorporateBookings({ first: 0, rows: rows.value, page: 1 }, buildFilters());
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="corporate-booking-management">
    <!-- Statistics Cards -->
    <StatisticsCards v-bind="statisticsData" />

    <!-- Main Content Card -->
    <Card class="bookings-table-card">
            <template #title>
        <div class="card-header">
          <div class="title-section">
            <i class="pi pi-building text-primary"></i>
            <h2>Corporate Bookings</h2>
            <span class="total-count">({{ totalRecords }} total)</span>
          </div>
          <div class="header-actions">
            <Button
              label="New Corporate Booking"
              icon="pi pi-plus"
              class="p-button-success"
              @click="openCreateBookingDialog"
            />
          </div>
        </div>
      </template>

            <template #content>
        <!-- Search and Filter Controls -->
        <div class="table-controls">
          <div class="search-section">
            <div class="search-wrapper">
              <InputText
                v-model="searchQuery"
                placeholder="Search bookings..."
                class="search-input w-full"
              />
            </div>
          </div>
          <div class="filter-section">
            <Dropdown
              v-model="selectedStatus"
              :options="bookingStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Filter by Booking Status"
              class="status-dropdown"
              showClear
            />
            <Dropdown
              v-model="selectedPaymentStatus"
              :options="paymentStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Filter by Payment Status"
              class="status-dropdown"
              showClear
            />
          </div>
        </div>

        <!-- Date Filter Row -->
        <div class="flex flex-column md:flex-row gap-3 mb-3">
          <Calendar
            v-model="filterDateRange"
            selectionMode="range"
            dateFormat="yy-mm-dd"
            showIcon
            placeholder="Check-in date range"
            class="w-full md:w-16rem"
            :manualInput="false"
            :showButtonBar="true"
          />
          <Calendar
            v-model="filterCheckoutRange"
            selectionMode="range"
            dateFormat="yy-mm-dd"
            showIcon
            placeholder="Check-out date range"
            class="w-full md:w-16rem"
            :manualInput="false"
            :showButtonBar="true"
          />
          <Calendar
            v-model="filterBookingDateRange"
            selectionMode="range"
            dateFormat="yy-mm-dd"
            showIcon
            placeholder="Booking date range"
            class="w-full md:w-16rem"
            :manualInput="false"
            :showButtonBar="true"
          />
          <Button
            icon="pi pi-filter-slash"
            label="Reset Filters"
            @click="resetFilters"
            class="p-button-secondary md:ml-auto"
          />
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="loading-content">
            <ProgressSpinner />
            <p class="loading-text">Loading corporate bookings...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="isEmptyState" class="empty-state">
          <div class="empty-content">
            <i class="pi pi-building empty-icon"></i>
            <h3>No Corporate Bookings</h3>
            <p>Get started by creating your first corporate booking.</p>
            <Button
              label="Create Corporate Booking"
              icon="pi pi-plus"
              class="p-button-success"
              @click="openCreateBookingDialog"
            />
          </div>
        </div>

        <!-- No Search Results -->
        <div v-else-if="isNoSearchResults" class="empty-state">
          <div class="empty-content">
            <i class="pi pi-search empty-icon"></i>
            <h3>No Results Found</h3>
            <p>Try adjusting your search criteria or filters.</p>
            <Button
              label="Clear Filters"
              icon="pi pi-filter-slash"
              class="p-button-outlined"
              @click="resetFilters"
            />
          </div>
        </div>

        <!-- Data Table -->
        <div v-else class="table-container">
          <DataTable
            :value="corporateBookings"
            :rows="rows"
            :rowsPerPageOptions="[10, 20, 50, 100]"
            :totalRecords="totalRecords"
            :first="0"
            lazy
            paginator
            @page="onPage"
            v-model:expandedRows="expandedRows"
            @rowExpand="handleRowExpand"
            @rowCollapse="handleRowCollapse"
            class="custom-datatable"
            responsiveLayout="scroll"
          >
            <Column expander style="width: 5rem" />
            
            <Column header="Reservation Code" style="min-width: 180px">
              <template #body="{ data }">
                <div class="cell-content">
                  <i class="pi pi-bookmark text-primary"></i>
                  <span class="booking-id">{{ data.reservation_code }}</span>
                </div>
              </template>
            </Column>

            <Column header="Company" style="min-width: 200px">
              <template #body="{ data }">
                <div class="cell-content">
                  <i class="pi pi-building text-primary"></i>
                  <span>{{ data.company?.name || 'N/A' }}</span>
                </div>
              </template>
            </Column>

            <!-- <Column header="Coordinator" style="min-width: 200px">
              <template #body="{ data }">
                <div class="cell-content">
                  <i class="pi pi-user text-primary"></i>
                  <span>{{ data.coordinator?.full_name || 'N/A' }}</span>
                </div>
              </template>
            </Column> -->

             <Column header="Booking Date" style="min-width: 150px">
              <template #body="{ data }">
                {{ formatDate(data.booking_date || data.created_at) }}
              </template>
            </Column>

            <Column header="Check-In" style="min-width: 150px">
              <template #body="{ data }">
                {{ formatDate(data.check_in_date) }}
              </template>
            </Column>

            <Column header="Check-Out" style="min-width: 150px">
              <template #body="{ data }">
                {{ formatDate(data.check_out_date) }}
              </template>
            </Column>

            <Column header="Guests" style="min-width: 100px">
              <template #body="{ data }">
                <Tag
                  :value="getGuestCountText(data.guests?.length || 0)"
                  severity="info"
                  class="status-tag"
                />
              </template>
            </Column>

            <Column header="Booking Status" style="min-width: 120px">
              <template #body="{ data }">
                <Tag
                  :value="getBookingStatus(data)"
                  :severity="getBookingStatusSeverity(data)"
                  class="status-tag"
                />
              </template>
            </Column>

            <Column header="Payment Status" style="min-width: 140px">
              <template #body="{ data }">
                <Tag
                  :value="getPaymentStatus(data)"
                  :severity="getPaymentStatusSeverity(data)"
                  class="status-tag"
                />
              </template>
            </Column>

            <Column header="Actions" style="min-width: 280px">
              <template #body="{ data }">
                <div class="action-buttons">
                  <!-- Check-in button -->
                  <Button
                    v-if="canBookingCheckIn(data)"
                    icon="pi pi-sign-in"
                    class="p-button-sm p-button-success"
                    @click="handleBookingCheckIn(data)"
                    v-tooltip="'Check in all guests'"
                  />
                  
                  <!-- Check-out button -->
                  <Button
                    v-else-if="canBookingCheckOut(data)"
                    icon="pi pi-sign-out"
                    class="p-button-sm p-button-warning"
                    @click="handleBookingCheckOut(data)"
                    v-tooltip="'Check out all guests'"
                  />
                  
                  <!-- Completed status -->
                  <div
                    v-else-if="isBookingCompleted(data)"
                    class="completed-status-small"
                  >
                    <i class="pi pi-check-circle"></i>
                    <span>Completed</span>
                  </div>
                  
                    <Button
                    v-if="!isBookingCompleted(data)"
                    icon="pi pi-pencil"
                    class="p-button-sm p-button-outlined"
                    @click="openEditBookingDialog(data)"
                    v-tooltip="'Edit Booking'"
                    />
                  <Button
                    icon="pi pi-file-pdf"
                    class="p-button-sm p-button-outlined p-button-info"
                    @click="viewBill(data)"
                    v-tooltip="'View Bill'"
                  />
                </div>
              </template>
            </Column>

            <template #expansion="{ data }">
              <div class="guests-expansion">
                <div class="expansion-header">
                  <h4>Guests ({{ data.guests?.length || 0 }})</h4>
                </div>
                <div class="guests-grid">
                  <div
                    v-for="guest in data.guests"
                    :key="guest.id"
                    class="guest-card"
                  >
                    <div class="guest-header">
                      <div class="guest-avatar">
                        <i class="pi pi-user"></i>
                      </div>
                      <div class="guest-info">
                        <h5>{{ guest.full_name }}</h5>
                        <p class="guest-email">{{ guest.email || 'N/A' }}</p>
                      </div>
                      <Tag
                        :value="getGuestStatus(guest)"
                        :severity="getGuestStatusSeverity(guest)"
                        class="status-tag"
                      />
                    </div>

                    <div v-if="guest.room" class="room-info">
                      <div class="room-details">
                        <i class="pi pi-home"></i>
                        <span>{{ guest.room.name }}</span>
                        <span class="room-price">{{ formatCurrency(guest.room.price) }}</span>
                      </div>
                    </div>

                    <div class="guest-actions">
                      <Button
                        v-if="!guest.is_checked_in && !guest.is_checked_out"
                        label="Check In"
                        icon="pi pi-sign-in"
                        class="p-button-sm p-button-success"
                        @click="handleCheckIn(guest)"
                      />
                      <Button
                        v-else-if="guest.is_checked_in && !guest.is_checked_out"
                        label="Check Out"
                        icon="pi pi-sign-out"
                        class="p-button-sm p-button-danger"
                        @click="handleCheckOut(guest)"
                      />
                      <div
                        v-else-if="guest.is_checked_out"
                        class="completed-status"
                      >
                        <i class="pi pi-check-circle"></i>
                        <span>Completed</span>
                      </div>
                      <Button
                        icon="pi pi-eye"
                        class="p-button-sm p-button-outlined"
                        @click="showGuestDetails(guest)"
                        v-tooltip="'View Details'"
                      />
                      <Button
                        icon="pi pi-print"
                        class="p-button-sm p-button-outlined p-button-info"
                        @click="openGuestBill(guest, data)"
                        v-tooltip="'View Bill'"
                      />
                    </div>

                    <div v-if="guest.checked_in_at || guest.checked_out_at" class="guest-timestamps">
                      <div v-if="guest.checked_in_at" class="timestamp">
                        <i class="pi pi-sign-in"></i>
                        <span>Checked in: {{ formatDateTime(guest.checked_in_at) }}</span>
                      </div>
                      <div v-if="guest.checked_out_at" class="timestamp">
                        <i class="pi pi-sign-out"></i>
                        <span>Checked out: {{ formatDateTime(guest.checked_out_at) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </DataTable>
        </div>
      </template>
    </Card>

    <Dialog v-model:visible="showCreateModal" modal header="Create Corporate Booking" :style="{ width: '50vw' }">
        <CorporateBookingForm @close="showCreateModal = false" @booking-created="handleBookingCreation" />
    </Dialog>

    <EditCorporateBookingModal 
        :booking="selectedBookingForEdit" 
        :visible="showEditModal" 
        @update:visible="showEditModal = $event" 
        @booking-updated="handleBookingUpdated" 
    />

    <Dialog
      v-model:visible="showGuestDialog"
      :style="{ width: '90vw', maxWidth: '600px' }"
      header="Guest Details"
      :modal="true"
      class="guest-details-dialog"
      :closable="true"
      @hide="closeGuestDialog"
    >
      <div v-if="selectedGuest" class="guest-details-content">
        <section class="detail-section">
          <h3>Personal Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Full Name</label>
              <span>{{ selectedGuest.full_name || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>Gender</label>
              <span>{{ selectedGuest.gender || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>Email</label>
              <span>{{ selectedGuest.email || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>Phone</label>
              <span>{{ selectedGuest.phone || 'N/A' }}</span>
            </div>
          </div>
        </section>
        <section v-if="selectedGuest.room" class="detail-section">
          <h3>Room Information</h3>
          <div class="room-details-card">
            <div class="room-header">
              <div v-if="selectedGuest.room.images?.data?.length" class="room-image">
                <img :src="selectedGuest.room.images.data[0].url" :alt="`${selectedGuest.room.name} room image`" />
              </div>
              <div class="room-info-details">
                <h4>{{ selectedGuest.room.name }}</h4>
                <p class="room-type">{{ selectedGuest.room.roomType?.name || 'Standard Room' }}</p>
                <p class="room-price">{{ formatCurrency(selectedGuest.room.price) }}/night</p>
              </div>
            </div>
            <div class="room-specs">
              <div class="spec-item">
                <span class="spec-label">Capacity</span>
                <span class="spec-value">{{ selectedGuest.room.no_of_guests || 0 }} guests</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Bedrooms</span>
                <span class="spec-value">{{ selectedGuest.room.no_of_bedrooms || 0 }}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Beds</span>
                <span class="spec-value">{{ selectedGuest.room.no_of_beds || 0 }}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Bathrooms</span>
                <span class="spec-value">{{ selectedGuest.room.no_of_baths || 0 }}</span>
              </div>
            </div>
          </div>
        </section>
        <section class="detail-section">
          <h3>Status Information</h3>
          <div class="status-grid">
            <div class="status-item">
              <span>Check-in Status</span>
              <Tag
                :value="selectedGuest.is_checked_in ? 'Checked In' : 'Not Checked In'"
                :severity="selectedGuest.is_checked_in ? 'success' : 'warning'"
              />
            </div>
            <div class="status-item">
              <span>Check-out Status</span>
              <Tag
                :value="selectedGuest.is_checked_out ? 'Checked Out' : 'Still In Room'"
                :severity="selectedGuest.is_checked_out ? 'info' : 'success'"
              />
            </div>
          </div>
          <div v-if="selectedGuest.checked_in_at || selectedGuest.checked_out_at" class="timestamps">
            <div v-if="selectedGuest.checked_in_at" class="timestamp-item">
              <span>Checked in at</span>
              <span class="timestamp-value">{{ formatDateTime(selectedGuest.checked_in_at) }}</span>
            </div>
            <div v-if="selectedGuest.checked_out_at" class="timestamp-item">
              <span>Checked out at</span>
              <span class="timestamp-value">{{ formatDateTime(selectedGuest.checked_out_at) }}</span>
            </div>
          </div>
        </section>
      </div>
      <template #footer>
        <Button
          label="Close"
          icon="pi pi-times"
          text
          @click="closeGuestDialog"
          aria-label="Close guest details dialog"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showBillDialog"
      :style="{ width: '90vw', maxWidth: '800px' }"
      header="Guest Bill"
      :modal="true"
      class="guest-bill-dialog"
    >
      <GuestBill
        v-if="selectedGuestForBill && selectedBookingForBill"
        :guest="selectedGuestForBill"
        :booking="selectedBookingForBill"
        ref="billContent"
      />
      <template #footer>
        <Button
          label="Print"
          icon="pi pi-print"
          @click="printBill"
          class="p-button-success"
        />
        <Button
          label="Close"
          icon="pi pi-times"
          text
          @click="showBillDialog = false"
        />
      </template>
    </Dialog>

    <!-- Global Components -->
    <ConfirmDialog />
    <Toast />
  </div>
</template>

<style scoped>
/* Main Layout */
.corporate-booking-management {
  padding: 1.5rem;
  max-width: 100%;
  margin: 0 auto;
}

/* Card Styling */
.bookings-table-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-section h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.total-count {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* Loading State */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-text {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

/* Empty States */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 2rem;
}

.empty-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.empty-content p {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  line-height: 1.5;
}

/* Table Controls */
.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-section {
  flex: 1;
  min-width: 250px;
}

.search-wrapper {
  width: 100%;
  max-width: 400px;
}

.search-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-section {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.status-dropdown {
  min-width: 180px;
}

.dropdown-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Data Table Styling */
.custom-datatable {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0.75rem;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  transition: background-color 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #f8fafc;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 1rem 0.75rem;
  border: none;
}

.cell-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.booking-id {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
}

.status-tag {
  font-size: 0.75rem;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.completed-status-small {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #059669;
  font-weight: 500;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #f0fdf4;
  border-radius: 4px;
  border: 1px solid #bbf7d0;
}

/* Guest Expansion */
.guests-expansion {
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
  margin: 0.5rem;
}

.expansion-header h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.guests-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
}

.guest-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.guest-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.guest-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.guest-avatar {
  width: 40px;
  height: 40px;
  background: #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.guest-info {
  flex: 1;
}

.guest-info h5 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #1e293b;
}

.guest-email {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.room-info {
  margin-bottom: 1rem;
}

.room-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.room-price {
  font-weight: 600;
  color: #3b82f6;
  margin-left: auto;
}

.guest-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.completed-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #059669;
  font-weight: 500;
  font-size: 0.875rem;
}

.guest-timestamps {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.timestamp {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

/* Booking Form Dialog */
.booking-form-dialog {
  border-radius: 12px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
}

.form-section {
  padding: 1rem;
  border-radius: 8px;
  background: #f8fafc;
}

.form-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
}

.guest-section {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.guest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.guest-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

/* Guest Details Dialog */
.guest-details-dialog {
  border-radius: 12px;
}

.guest-details-content {
  padding: 0.5rem 0;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.info-item span {
  color: #1e293b;
  font-weight: 500;
}

.room-details-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
}

.room-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.room-image {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  background: #e2e8f0;
  flex-shrink: 0;
}

.room-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-info-details h4 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #1e293b;
}

.room-type {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #64748b;
}

.room-price {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #3b82f6;
}

.room-specs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.spec-label {
  font-size: 0.875rem;
  color: #64748b;
}

.spec-value {
  font-weight: 500;
  color: #1e293b;
}

.status-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.timestamps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.timestamp-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.timestamp-value {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.875rem;
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .corporate-booking-management {
    padding: 1rem;
  }
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .search-section,
  .filter-section {
    width: 100%;
  }
  .status-dropdown {
    width: 100%;
  }
  .guests-grid {
    grid-template-columns: 1fr;
  }
  .guest-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .guest-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .info-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
  .room-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .room-specs {
    grid-template-columns: repeat(2, 1fr);
  }
  .status-item,
  .timestamp-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .corporate-booking-management {
    padding: 0.75rem;
  }
  .room-specs {
    grid-template-columns: 1fr;
  }
}

/* Animation for loading spinner */
.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Focus styles for accessibility */
:deep(.p-button:focus) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
:deep(.p-dropdown:focus) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
:deep(.p-inputtext:focus) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
</style>