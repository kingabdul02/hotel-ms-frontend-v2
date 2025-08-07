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
    <template #title>
      <div class="flex justify-content-between align-items-center w-full">
        <div class="flex align-items-center">
          <span class="pi pi-list text-primary text-xl mr-2" /> Recent Bookings
        </div>
        <Button
          label="New Reservation"
          icon="pi pi-plus"
          class="p-button-success"
          @click="openReservationDialog"
        />
      </div>
    </template>

    <template #content>
      <!-- unified filter bar -->
      <div class="flex flex-column md:flex-row gap-3 mb-3">
        <InputText
          v-model="searchQuery"
          placeholder="Search…"
          class="w-full md:w-16rem"
        />
        <Dropdown
          v-model="filterRoomTypeId"
          :options="roomTypeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Room type"
          class="w-full md:w-12rem"
        />
        <Dropdown
          v-model="filterPaymentStatus"
          :options="paymentOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Payment"
          class="w-full md:w-10rem"
        />
        <Dropdown
          v-model="filterBookingStatus"
          :options="bookingStatusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Booking Status"
          class="w-full md:w-12rem"
        />
      </div>
      
      <!-- Date filter row -->
      <div class="flex flex-column md:flex-row gap-3 mb-3">
        <Calendar
          v-model="filterDateRange"
          selectionMode="range"
          dateFormat="yy-mm-dd"
          showIcon
          placeholder="Check-in range"
          class="w-full md:w-16rem"
          :manualInput="false"
          :showButtonBar="true"
        />
        <Calendar
          v-model="filterCheckoutRange"
          selectionMode="range"
          dateFormat="yy-mm-dd"
          showIcon
          placeholder="Check-out range"
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
          label="Reset"
          @click="resetFilters"
          class="p-button-secondary md:ml-auto"
        />
      </div>

      <div v-if="isLoading" class="flex justify-content-center py-4">
        <ProgressSpinner />
      </div>

      <DataTable
        v-else
        :value="recentBookings"
        :rows="rows"
        :rowsPerPageOptions="[10, 20, 50, 100]"
        :totalRecords="pagingMeta.total"
        :first="(pagingMeta.current_page - 1) * pagingMeta.per_page"
        lazy
        paginator
        @page="onPage"
      >
        <Column field="booking_id" header="ID" sortable />

        <Column header="Customer" sortable>
          <template #body="{ data }">
            <i class="pi pi-user mr-1 text-primary" /> {{ data.is_online_booking ? data.user?.name : data.guest_name }}
          </template>
        </Column>

        <Column header="Room" sortable>
          <template #body="{ data }">
            <i class="pi pi-home mr-1 text-primary" /> {{ data.room?.name }}
          </template>
        </Column>

        <Column header="Booking Date">
          <template #body="{ data }">{{
            formatDateTime(data.created_at)
          }}</template>
        </Column>

        <Column header="Check-In">
          <template #body="{ data }">{{
            formatDateTime(data.check_in_date)
          }}</template>
        </Column>

        <Column header="Check-Out">
          <template #body="{ data }">{{
            formatDateTime(data.check_out_date)
          }}</template>
        </Column>

        <Column header="Amount">
          <template #body="{ data }">{{
            formatCurrency(data.total_amount)
          }}</template>
        </Column>

        <Column header="Booking Status">
          <template #body="{ data }">
            <Tag
              :value="
          data.is_checked_out
            ? 'Checked Out'
            : data.is_checked_in
            ? 'Checked In'
            : data.is_confirmed
            ? 'Confirmed'
            : 'Pending'
              "
              :severity="
          data.is_checked_out
            ? 'info'
            : data.is_checked_in
            ? 'success'
            : data.is_confirmed
            ? 'success'
            : 'warning'
              "
            />
          </template>
        </Column>

        <Column header="Payment Status">
          <template #body="{ data }">
            <Tag
                :value="data.payment_status.charAt(0).toUpperCase() + data.payment_status.slice(1).toLowerCase()"
              :severity="data.payment_status === 'paid' ? 'success' : 'warning'"
            />
          </template>
        </Column>

        <Column header="Actions">
          <template #body="{ data }">
            <Button
              icon="pi pi-eye"
              class="p-button-sm p-button-outlined"
              @click="openDetails(data)"
            />
          </template>
        </Column>
      </DataTable>
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