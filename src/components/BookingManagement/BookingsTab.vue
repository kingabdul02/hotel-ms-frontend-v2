<script setup lang="ts">
/* --------------- imports --------------- */
import { ref, watch, onMounted } from 'vue';
import axiosInstance from '@/service/AxiosInstance';

import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

import BookingDetailsDialog from './BookingDetailsDialog.vue';
import StatisticsCards from './StatisticsCards.vue';
import NewReservationDialog from './NewReservationDialog.vue';
import RecentBookingsTable from './RecentBookingsTable.vue';
import BookingModificationDialog from './BookingModificationDialog.vue';
import CustomChargesDialog from './CustomChargesDialog.vue';
import POSChargesDialog from '@/components/pos/POSChargesDialog.vue';
import { useBooking } from '@/composables/useBooking';
import { formatDateTime } from '@/utils/dateTimeFormatter';
import { formatCurrency } from '@/utils/currencyFormatter';

/* --------------- composable state --------------- */
const {
  statisticsBooking,
  checkInsToday,
  checkOutsToday,
  availableRoomCount,
  recentBookings,
  pagingMeta,
} = useBooking();

const toast = useToast();

/* --------------- pagination refs --------------- */
const rows = ref(10); // default rows per page

/* --------------- filter refs --------------- */
const searchQuery = ref('');
const filterRoomTypeId = ref<number | null>(null);
const filterPaymentStatus = ref<string | null>(null);
const filterBookingStatus = ref<string | null>(null);
const filterDateRange = ref<Date[]>([]);
const filterCheckoutRange = ref<Date[]>([]);
const filterBookingDateRange = ref<Date[]>([]);

/* dropdown options fetched from backend */
const roomTypeOptions = ref<{ label: string; value: number }[]>([]);
enum E_PaymentStatus {
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

const paymentOptions = [
  { label: 'All', value: null },
  { label: 'Successful', value: E_PaymentStatus.PAID },
  { label: 'Pending', value: E_PaymentStatus.PENDING },
  { label: 'Failed', value: E_PaymentStatus.FAILED },
  { label: 'Refunded', value: E_PaymentStatus.REFUNDED },
  { label: 'Cancelled', value: E_PaymentStatus.CANCELLED },
];

const bookingStatusOptions = [
  { label: 'All', value: null },
  { label: 'Pending', value: 'is_confirmed' },
  { label: 'Checked-In', value: 'is_checked_in' },
  { label: 'Checked Out', value: 'is_checked_out' },
];

/* --------------- ui state --------------- */
const isLoading = ref(false);
const showDetailsDlg = ref(false);
const selectedBooking = ref(null);
const showReservationDialog = ref(false);
const isBookingModificationDialogVisible = ref(false);
const isCustomChargesDialogVisible = ref(false);
const isPOSChargesDialogVisible = ref(false);

/* --------------- helpers --------------- */
const apiDate = (d: Date | undefined) => {
  // This ensures local date string (YYYY-MM-DD) without UTC conversion
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildFilters = () => ({
  search: searchQuery.value,
  room_type_id: filterRoomTypeId.value,
  payment_status: filterPaymentStatus.value,
  booking_status: filterBookingStatus.value,
  check_in_from: apiDate(filterDateRange.value[0]),
  check_in_to: apiDate(filterDateRange.value[1]),
  check_out_from: apiDate(filterCheckoutRange.value[0]),
  check_out_to: apiDate(filterCheckoutRange.value[1]),
  booking_date_from: apiDate(filterBookingDateRange.value[0]),
  booking_date_to: apiDate(filterBookingDateRange.value[1]),
});

/* --------------- bookings fetch --------------- */
const fetchBookings = async (page = 1) => {
  isLoading.value = true;
  try {
    await statisticsBooking(page, buildFilters(), rows.value);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch bookings. Please try again.',
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

/* --------------- pagination event handler --------------- */
const onPage = (event: any) => {
  rows.value = event.rows;
  fetchBookings(event.page + 1);
};

/* --------------- room-type dropdown load --------------- */
const loadRoomTypes = async () => {
  try {
    const { data } = await axiosInstance.get('/get-room-types');
    roomTypeOptions.value = [
      { label: 'All', value: null },
      ...data.data.map((rt: any) => ({
        label: rt.name,
        value: rt.id,
      })),
    ];
  } catch {
    /* swallow silently – dropdown will just be empty */
  }
};

/* --------------- reset filters --------------- */
const resetFilters = () => {
  searchQuery.value = '';
  filterRoomTypeId.value = null;
  filterPaymentStatus.value = null;
  filterBookingStatus.value = null;
  filterDateRange.value = [];
  filterCheckoutRange.value = [];
  filterBookingDateRange.value = [];
  fetchBookings(1);
};

/* --------------- watch filters --------------- */
watch(
  [searchQuery, filterRoomTypeId, filterPaymentStatus, filterBookingStatus, filterDateRange, filterCheckoutRange, filterBookingDateRange],
  () => {
    // Only fetch bookings if all date ranges are fully cleared or both dates are set
    const checkInRange = filterDateRange.value;
    const checkOutRange = filterCheckoutRange.value;
    const bookingRange = filterBookingDateRange.value;
    
    const isValidRange = (range: Date[]) => range.length === 0 || range.length === 2;
    
    if (isValidRange(checkInRange) && isValidRange(checkOutRange) && isValidRange(bookingRange)) {
      fetchBookings(1);
    }
  },
  { deep: true },
);

/* --------------- lifecycle --------------- */
onMounted(() => {
  loadRoomTypes();
  fetchBookings();
});

/* --------------- booking detail open --------------- */
const openDetails = (row: any) => {
  selectedBooking.value = row;
  showDetailsDlg.value = true;
};

/* --------------- reservation dialog open --------------- */
const openReservationDialog = () => {
  showReservationDialog.value = true;
};

/* --------------- action handlers from menu --------------- */
const showBookingModification = (booking: any) => {
  if (booking?.is_checked_out) {
    toast.add({ severity: 'warn', summary: 'Not allowed', detail: 'Booking is checked out. You cannot modify this booking.', life: 3000 });
    return;
  }
  selectedBooking.value = booking;
  isBookingModificationDialogVisible.value = true;
};

const showCustomCharges = (booking: any) => {
  if (booking?.is_checked_out) {
    toast.add({ severity: 'warn', summary: 'Not allowed', detail: 'Booking is checked out. You cannot add custom charges.', life: 3000 });
    return;
  }
  selectedBooking.value = booking;
  isCustomChargesDialogVisible.value = true;
};

const showPOSCharges = (booking: any) => {
  if (booking?.is_checked_out) {
    toast.add({ severity: 'warn', summary: 'Not allowed', detail: 'Booking is checked out. You cannot add POS charges.', life: 3000 });
    return;
  }
  selectedBooking.value = booking;
  isPOSChargesDialogVisible.value = true;
};
</script>

<template>
  <Toast />
  <StatisticsCards
    :recentBookingsCount="pagingMeta.total"
    :availableRoomCount="availableRoomCount"
    :checkInsToday="checkInsToday"
    :checkOutsToday="checkOutsToday"
  />

  <Card class="mt-4">
    <template #content>
      <RecentBookingsTable
        :value="recentBookings"
        :pagingMeta="pagingMeta"
        :loading="isLoading"
        :rows="rows"
        :rowsPerPageOptions="[10,20,50,100]"
        :showModify="true"
        :showCustomCharges="true"
        :showPOSCharges="true"
        @request-fetch="(p) => { rows = p.rows; statisticsBooking(p.page, p.filters, rows); }"
        @open-details="openDetails"
        @modify-booking="showBookingModification"
        @add-custom-charges="showCustomCharges"
        @add-pos-charges="showPOSCharges"
      >
        <template #header-actions>
          <Button label="New Reservation" icon="pi pi-plus" class="p-button-success" @click="openReservationDialog" />
        </template>
      </RecentBookingsTable>
    </template>
  </Card>

  <BookingDetailsDialog
    :visible="showDetailsDlg"
    :selectedBooking="selectedBooking"
    @update:visible="showDetailsDlg = $event"
    @update="fetchBookings(1)"
  />

  <NewReservationDialog
    v-model:visible="showReservationDialog"
    @reservationCreated="fetchBookings(1)"
  />

  <!-- Action dialogs -->
  <BookingModificationDialog
    :visible="isBookingModificationDialogVisible"
    :booking="selectedBooking"
    @update:visible="isBookingModificationDialogVisible = $event"
    @booking-updated="() => { isBookingModificationDialogVisible = false; fetchBookings(1); }"
  />
  <CustomChargesDialog
    :visible="isCustomChargesDialogVisible"
    :booking="selectedBooking"
    @update:visible="isCustomChargesDialogVisible = $event"
    @charges-added="() => { isCustomChargesDialogVisible = false; fetchBookings(1); }"
  />
  <POSChargesDialog
    :visible="isPOSChargesDialogVisible"
    :booking="selectedBooking"
    @update:visible="isPOSChargesDialogVisible = $event"
    @charges-posted="() => { isPOSChargesDialogVisible = false; fetchBookings(1); }"
  />
</template>

<style scoped>
@import '@/styles/booking-management.css';
/* tighten spacing when stacked on small screens */
@media (max-width: 576px) {
  .p-datatable {
    font-size: 0.9rem;
  }
}
</style>