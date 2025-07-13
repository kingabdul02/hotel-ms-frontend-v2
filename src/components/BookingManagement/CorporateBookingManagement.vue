<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import ProgressSpinner from 'primevue/progressspinner';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import AutoComplete from 'primevue/autocomplete';
import { useCorporateBooking } from '@/composables/useCorporateBooking';
import { useRouter } from 'vue-router';
import StatisticsCards from './StatisticsCards.vue';

// Types
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
  guests: Guest[];
  check_in_date: string;
  check_out_date: string;
  reservation_code: string;
}

// Composable
const {
  corporateBookings,
  loading,
  totalRecords,
  searchQuery,
  selectedStatus,
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
  corporateBookingForm,
  selectedCompany,
  availableRooms,
  companies,
  filteredCompanies,
  fetchAvailableRooms,
  fetchCompanies,
  searchCompanies,
  onCompanySelect,
  addGuest,
  removeGuest,
  resetCorporateBookingForm,
  submitCorporateBooking,
  fetchBookingById,
  updateCorporateBooking,
  toast,
  confirm,
} = useCorporateBooking();

// Reactive state
const selectedGuest = ref<Guest | null>(null);
const showGuestDialog = ref(false);
const expandedRows = ref<CorporateBooking[]>([]);
const isSearching = ref(false);
const showBookingDialog = ref(false);
const isEditMode = ref(false);
const bookingIdToEdit = ref<string | null>(null);

// Constants
const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
] as const;

const ITEMS_PER_PAGE = 10;

const guestGenderOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
];

// Computed properties
const hasBookings = computed(() => corporateBookings.value.length > 0);
const isEmptyState = computed(() => !loading.value && !hasBookings.value && !searchQuery.value);
const isNoSearchResults = computed(() => !loading.value && !hasBookings.value && searchQuery.value);
const canAddGuest = computed(() => corporateBookingForm.guests.length < corporateBookingForm.expected_guests);
const minExpectedGuests = computed(() => {
  return corporateBookingForm.guests.filter(guest => guest.is_checked_in || guest.is_checked_out).length;
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
    await fetchCorporateBookings({ first: 0, rows: ITEMS_PER_PAGE, page: 1 });
  } finally {
    isSearching.value = false;
  }
};

const handleStatusChange = async () => {
  await fetchCorporateBookings({ first: 0, rows: ITEMS_PER_PAGE, page: 1 });
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

const handleCheckIn = async (guest: Guest) => {
  try {
    await confirmCheckIn(guest);
    await fetchCorporateBookings({ first: 0, rows: ITEMS_PER_PAGE, page: 1 });
  } catch (error) {
    console.error('Check-in failed:', error);
  }
};

const handleCheckOut = async (guest: Guest) => {
  try {
    await confirmCheckOut(guest);
    await fetchCorporateBookings({ first: 0, rows: ITEMS_PER_PAGE, page: 1 });
  } catch (error) {
    console.error('Check-out failed:', error);
  }
};

const openCreateBookingDialog = () => {
  resetCorporateBookingForm();
  isEditMode.value = false;
  bookingIdToEdit.value = null;
  showBookingDialog.value = true;
};

const openEditBookingDialog = async (booking: CorporateBooking) => {
  resetCorporateBookingForm();
  bookingIdToEdit.value = booking.id;
  isEditMode.value = true;
  await fetchBookingById(booking.id);
  showBookingDialog.value = true;
};

const closeBookingDialog = () => {
  showBookingDialog.value = false;
  resetCorporateBookingForm();
  bookingIdToEdit.value = null;
  isEditMode.value = false;
};

const handleAddGuest = () => {
  if (!canAddGuest.value) {
    toast.add({ severity: 'warn', summary: 'Limit Reached', detail: 'Cannot add more guests than expected.', life: 3000 });
    return;
  }
  addGuest();
};

const handleRemoveGuest = (index: number) => {
  const guest = corporateBookingForm.guests[index];
  if (guest.is_checked_in || guest.is_checked_out) {
    toast.add({ severity: 'warn', summary: 'Cannot Remove', detail: 'Checked-in or checked-out guests cannot be removed.', life: 3000 });
    return;
  }
  confirm.require({
    message: `Are you sure you want to remove ${guest.full_name || 'this guest'}?`,
    header: 'Confirm Guest Removal',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      removeGuest(index);
      toast.add({ severity: 'success', summary: 'Guest Removed', detail: 'Guest has been removed.', life: 3000 });
    },
  });
};

const handleExpectedGuestsChange = () => {
  const currentGuestCount = corporateBookingForm.guests.length;
  if (corporateBookingForm.expected_guests < minExpectedGuests.value) {
    toast.add({
      severity: 'warn',
      summary: 'Invalid Input',
      detail: `Cannot set expected guests below ${minExpectedGuests.value} (number of checked-in or checked-out guests).`,
      life: 3000,
    });
    corporateBookingForm.expected_guests = minExpectedGuests.value;
  } else if (corporateBookingForm.expected_guests < currentGuestCount) {
    const guestsToRemove = corporateBookingForm.guests
      .slice(corporateBookingForm.expected_guests)
      .filter(guest => !guest.is_checked_in && !guest.is_checked_out);
    if (guestsToRemove.length > 0) {
      confirm.require({
        message: `Reducing the number of guests will remove ${guestsToRemove.length} guest(s). Confirm?`,
        header: 'Confirm Guest Removal',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          corporateBookingForm.guests = corporateBookingForm.guests.slice(0, corporateBookingForm.expected_guests);
          toast.add({ severity: 'success', summary: 'Guests Removed', detail: 'Excess guests have been removed.', life: 3000 });
        },
        reject: () => {
          corporateBookingForm.expected_guests = currentGuestCount;
        },
      });
    }
  }
};

const handleSubmit = async () => {
  try {
    if (!isEditMode.value && !corporateBookingForm.is_new_company && !selectedCompany.value) {
      toast.add({ severity: 'warn', summary: 'Invalid Input', detail: 'Please select a company.', life: 3000 });
      return;
    }
    if (isEditMode.value && bookingIdToEdit.value) {
      await updateCorporateBooking(bookingIdToEdit.value, corporateBookingForm);
    } else {
      await submitCorporateBooking();
    }
    showBookingDialog.value = false;
    resetCorporateBookingForm();
    await fetchCorporateBookings({ first: 0, rows: ITEMS_PER_PAGE, page: 1 });
  } catch (error) {
    // Error handled by composable's toast
  }
};

const viewBill = (booking: CorporateBooking) => {
  router.push({
    name: 'CorporateBill',
    params: { reservation_code: booking.reservation_code },
  });
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

// Lifecycle
onMounted(async () => {
  await fetchCorporateBookings();
  await fetchCompanies();
});

// Watchers
watch(searchQuery, handleSearch, { debounce: 500 });
watch(
  () => [corporateBookingForm.check_in_date, corporateBookingForm.check_out_date],
  () => {
    if (corporateBookingForm.check_in_date && corporateBookingForm.check_out_date) {
      fetchAvailableRooms();
    }
  }
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
            <i class="pi pi-list text-primary" aria-hidden="true"></i>
            <h2>Corporate Bookings</h2>
          </div>
          <div class="header-actions">
            <span class="total-count" v-if="totalRecords > 0">
              {{ totalRecords }} total bookings
            </span>
            <Button
              label="Create Booking"
              icon="pi pi-plus"
              class="p-button-success p-button-sm"
              @click="openCreateBookingDialog"
              aria-label="Create new corporate booking"
            />
          </div>
        </div>
      </template>

      <template #content>
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="loading-content">
            <ProgressSpinner style="width: 50px; height: 50px" />
            <p class="loading-text">Loading bookings...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="isEmptyState" class="empty-state">
          <div class="empty-content">
            <i class="pi pi-calendar empty-icon" aria-hidden="true"></i>
            <h3>No bookings yet</h3>
            <p>Corporate bookings will appear here once they are created.</p>
            <Button 
              label="Create Booking" 
              icon="pi pi-plus"
              class="p-button-success"
              @click="openCreateBookingDialog"
              aria-label="Create new corporate booking"
            />
          </div>
        </div>

        <!-- No Search Results -->
        <div v-else-if="isNoSearchResults" class="empty-state">
          <div class="empty-content">
            <i class="pi pi-search empty-icon" aria-hidden="true"></i>
            <h3>No results found</h3>
            <p>Try adjusting your search criteria or filters.</p>
            <Button 
              label="Clear Search" 
              icon="pi pi-times"
              class="p-button-text"
              @click="searchQuery = ''"
              aria-label="Clear search"
            />
          </div>
        </div>

        <!-- Data Table -->
        <div v-else class="table-container">
          <!-- Search and Filter Controls -->
          <div class="table-controls">
            <div class="search-section">
              <div class="p-input-icon-left search-wrapper">
                <i class="pi pi-search" :class="{ 'pi-spin': isSearching }" aria-hidden="true"></i>
                <InputText
                  v-model="searchQuery"
                  placeholder="Search by coordinator or guest name..."
                  class="search-input"
                  :disabled="loading"
                  aria-label="Search bookings"
                />
              </div>
            </div>
            
            <div class="filter-section">
              <Dropdown
                v-model="selectedStatus"
                :options="STATUS_OPTIONS"
                option-label="label"
                option-value="value"
                placeholder="Filter by status"
                class="status-dropdown"
                :disabled="loading"
                @change="handleStatusChange"
                aria-label="Filter by booking status"
              >
                <template #value="slotProps">
                  <div class="dropdown-value">
                    <i class="pi pi-filter" aria-hidden="true"></i>
                    <span>{{ 
                      slotProps.value 
                        ? STATUS_OPTIONS.find(opt => opt.value === slotProps.value)?.label 
                        : 'All Status' 
                    }}</span>
                  </div>
                </template>
              </Dropdown>
            </div>
          </div>

          <!-- Data Table -->
          <DataTable
            :value="corporateBookings"
            :rows="ITEMS_PER_PAGE"
            :paginator="true"
            responsive-layout="scroll"
            class="custom-datatable"
            paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            current-page-report-template="Showing {first} to {last} of {totalRecords} bookings"
            :expanded-rows="expandedRows"
            @row-expand="handleRowExpand"
            @row-collapse="handleRowCollapse"
            :loading="loading"
            aria-label="Corporate bookings table"
          >
            <Column expander style="width: 5rem" header-style="width: 5rem">
              <template #header>
                <span class="sr-only">Expand row</span>
              </template>
            </Column>
            <Column field="reservation_code" header="Booking ID" sortable>
              <template #body="slotProps">
                <div class="cell-content">
                  <span class="booking-id">{{ slotProps.data.reservation_code }}</span>
                </div>
              </template>
            </Column>
            <Column field="coordinator.full_name" header="Coordinator" sortable>
              <template #body="slotProps">
                <div class="cell-content">
                  <i class="pi pi-user text-primary" aria-hidden="true"></i>
                  <span>{{ slotProps.data.coordinator?.full_name || 'N/A' }}</span>
                </div>
              </template>
            </Column>
            <Column header="Guests" sortable>
              <template #body="slotProps">
                <div class="cell-content">
                  <i class="pi pi-users text-primary" aria-hidden="true"></i>
                  <span>{{ getGuestCountText(slotProps.data.guests.length) }}</span>
                </div>
              </template>
            </Column>
            <Column field="check_in_date" header="Check-In" sortable>
              <template #body="slotProps">
                <div class="cell-content">
                  <i class="pi pi-calendar text-green-600" aria-hidden="true"></i>
                  <span>{{ formatDate(slotProps.data.check_in_date) }}</span>
                </div>
              </template>
            </Column>
            <Column field="check_out_date" header="Check-Out" sortable>
              <template #body="slotProps">
                <div class="cell-content">
                  <i class="pi pi-calendar text-red-600" aria-hidden="true"></i>
                  <span>{{ formatDate(slotProps.data.check_out_date) }}</span>
                </div>
              </template>
            </Column>
            <Column header="Status" sortable>
              <template #body="slotProps">
                <Tag
                  :value="getBookingStatus(slotProps.data)"
                  :severity="getBookingStatusSeverity(slotProps.data)"
                  class="status-tag"
                />
              </template>
            </Column>
            <Column header="Actions">
              <template #body="slotProps">
                <div class="action-buttons">
                  <Button
                    label="Edit"
                    icon="pi pi-pencil"
                    class="p-button-sm p-button-outlined p-button-info mr-2"
                    @click="openEditBookingDialog(slotProps.data)"
                    :disabled="getBookingStatus(slotProps.data) === 'Completed'"
                    :aria-label="`Edit booking ${slotProps.data.reservation_code}`"
                  />
                  <Button
                    label="View Bill"
                    icon="pi pi-file"
                    class="p-button-sm p-button-outlined p-button-success"
                    @click="viewBill(slotProps.data)"
                    :aria-label="`View bill for booking ${slotProps.data.reservation_code}`"
                  />
                </div>
              </template>
            </Column>
            <template #expansion="slotProps">
              <div class="guests-expansion">
                <div class="expansion-header">
                  <h4>{{ getGuestCountText(slotProps.data.guests.length) }}</h4>
                </div>
                <div class="guests-grid">
                  <div v-for="guest in slotProps.data.guests" :key="guest.id" class="guest-card">
                    <div class="guest-header">
                      <div class="guest-avatar">
                        <i class="pi pi-user" aria-hidden="true"></i>
                      </div>
                      <div class="guest-info">
                        <h5>{{ guest.full_name }}</h5>
                        <p class="guest-email">{{ guest.email || 'No email' }}</p>
                      </div>
                      <div class="guest-status">
                        <Tag :value="getGuestStatus(guest)" :severity="getGuestStatusSeverity(guest)" />
                      </div>
                    </div>
                    <div class="room-info">
                      <div class="room-details">
                        <i class="pi pi-home text-blue-600" aria-hidden="true"></i>
                        <span>Room {{ guest.room.name }}</span>
                        <span class="room-price">{{ formatCurrency(guest.room.price) }}/night</span>
                      </div>
                    </div>
                    <div class="guest-actions">
                      <Button
                        v-if="!guest.is_checked_in && !guest.is_checked_out"
                        label="Check In"
                        icon="pi pi-sign-in"
                        size="small"
                        severity="success"
                        @click="handleCheckIn(guest)"
                        :aria-label="`Check in ${guest.full_name}`"
                      />
                      <Button
                        v-else-if="guest.is_checked_in && !guest.is_checked_out"
                        label="Check Out"
                        icon="pi pi-sign-out"
                        size="small"
                        severity="danger"
                        @click="handleCheckOut(guest)"
                        :aria-label="`Check out ${guest.full_name}`"
                      />
                      <div v-else class="completed-status">
                        <i class="pi pi-check-circle" aria-hidden="true"></i>
                        <span>Completed</span>
                      </div>
                      <Button
                        icon="pi pi-eye"
                        size="small"
                        outlined
                        severity="success"
                        @click="showGuestDetails(guest)"
                        :aria-label="`View details for ${guest.full_name}`"
                      />
                    </div>
                    <div v-if="guest.checked_in_at || guest.checked_out_at" class="guest-timestamps">
                      <div v-if="guest.checked_in_at" class="timestamp">
                        <i class="pi pi-calendar text-green-600" aria-hidden="true"></i>
                        <span>Checked in: {{ formatDateTime(guest.checked_in_at) }}</span>
                      </div>
                      <div v-if="guest.checked_out_at" class="timestamp">
                        <i class="pi pi-calendar text-red-600" aria-hidden="true"></i>
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

    <!-- Booking Form Dialog -->
    <Dialog
      v-model:visible="showBookingDialog"
      :style="{ width: '90vw', maxWidth: '1200px' }"
      :header="isEditMode ? 'Edit Corporate Booking' : 'Create Corporate Booking'"
      :modal="true"
      class="booking-form-dialog"
      :closable="true"
      @hide="closeBookingDialog"
    >
      <div class="form-container">
        <!-- Company Selection -->
        <section class="form-section">
          <h3>Company Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Company Name</label>
              <InputText
                v-model="corporateBookingForm.company.name"
                placeholder="Company name"
                :disabled="isEditMode"
              />
            </div>
            <div class="form-group">
              <label>Email</label>
              <InputText
                v-model="corporateBookingForm.company.email"
                placeholder="Company email"
                :disabled="isEditMode"
              />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <InputText
                v-model="corporateBookingForm.company.phone"
                placeholder="Company phone"
                :disabled="isEditMode"
              />
            </div>
          </div>
        </section>

        <!-- Coordinator Details -->
        <section class="form-section">
          <h3>Coordinator Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Full Name</label>
              <InputText
                v-model="corporateBookingForm.coordinator.full_name"
                placeholder="Full name"
                :disabled="isEditMode"
              />
            </div>
            <div class="form-group">
              <label>Email</label>
              <InputText
                v-model="corporateBookingForm.coordinator.email"
                placeholder="Email"
                :disabled="isEditMode"
              />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <InputText
                v-model="corporateBookingForm.coordinator.phone"
                placeholder="Phone"
                :disabled="isEditMode"
              />
            </div>
            <div class="form-group">
              <label>NIN</label>
              <InputText
                v-model="corporateBookingForm.coordinator.nin"
                placeholder="NIN"
                :disabled="isEditMode"
              />
            </div>
          </div>
        </section>

        <!-- Booking Details -->
        <section class="form-section">
          <h3>Booking Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Check-in Date</label>
              <Calendar
                v-model="corporateBookingForm.check_in_date"
                showIcon
                dateFormat="yy-mm-dd"
                :disabled="isEditMode"
              />
            </div>
            <div class="form-group">
              <label>Check-out Date</label>
              <Calendar
                v-model="corporateBookingForm.check_out_date"
                showIcon
                dateFormat="yy-mm-dd"
                :disabled="isEditMode"
              />
            </div>
            <div class="form-group">
              <label>Expected Guests</label>
              <InputText
                v-model.number="corporateBookingForm.expected_guests"
                type="number"
                placeholder="Number of guests"
                :min="minExpectedGuests"
                @input="handleExpectedGuestsChange"
              />
            </div>
          </div>
        </section>

        <!-- Guest Details -->
        <section class="form-section">
          <h3>Guest Details</h3>
          <div v-for="(guest, index) in corporateBookingForm.guests" :key="index" class="guest-section">
            <div class="guest-header">
              <h4>Guest {{ index + 1 }}</h4>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                :disabled="guest.is_checked_in || guest.is_checked_out"
                @click="handleRemoveGuest(index)"
              />
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Full Name</label>
                <InputText
                  v-model="guest.full_name"
                  :disabled="guest.is_checked_in || guest.is_checked_out"
                  placeholder="Full name"
                />
              </div>
              <div class="form-group">
                <label>Email</label>
                <InputText
                  v-model="guest.email"
                  :disabled="guest.is_checked_in || guest.is_checked_out"
                  placeholder="Email"
                />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <InputText
                  v-model="guest.phone"
                  :disabled="guest.is_checked_in || guest.is_checked_out"
                  placeholder="Phone"
                />
              </div>
              <div class="form-group">
                <label>Gender</label>
                <Dropdown
                  v-model="guest.gender"
                  :options="guestGenderOptions"
                  option-label="label"
                  option-value="value"
                  :disabled="guest.is_checked_in || guest.is_checked_out"
                  placeholder="Select gender"
                />
              </div>
              <div class="form-group">
                <label>Room</label>
                <Dropdown
                  v-model="guest.room_id"
                  :options="availableRooms"
                  option-label="name"
                  option-value="id"
                  :disabled="guest.is_checked_in || guest.is_checked_out"
                  placeholder="Select room"
                />
              </div>
            </div>
          </div>
          <Button
            label="Add Guest"
            icon="pi pi-plus"
            class="p-button-outlined p-button-success"
            :disabled="!canAddGuest"
            @click="handleAddGuest"
          />
        </section>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="closeBookingDialog"
          aria-label="Cancel booking"
        />
        <Button
          :label="isEditMode ? 'Update Booking' : 'Create Booking'"
          icon="pi pi-save"
          class="p-button-success"
          @click="handleSubmit"
          aria-label="Save booking"
        />
      </template>
    </Dialog>

    <!-- Guest Details Dialog -->
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