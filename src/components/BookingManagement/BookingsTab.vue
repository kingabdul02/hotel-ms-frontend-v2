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

/* --------------- filter refs --------------- */
const searchQuery = ref('');
const filterRoomTypeId = ref<number | null>(null);
const filterPaymentStatus = ref<string | null>(null);
const filterDateRange = ref<[Date | null, Date | null]>([null, null]);

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
  { label: 'Successful', value: E_PaymentStatus.SUCCESSFUL },
  { label: 'Pending', value: E_PaymentStatus.PENDING },
  { label: 'Failed', value: E_PaymentStatus.FAILED },
  { label: 'Refunded', value: E_PaymentStatus.REFUNDED },
  { label: 'Cancelled', value: E_PaymentStatus.CANCELLED },
];

/* --------------- ui state --------------- */
const isLoading = ref(false);
const showDetailsDlg = ref(false);
const selectedBooking = ref(null);
const showReservationDialog = ref(false);

/* --------------- helpers --------------- */
const apiDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

const buildFilters = () => ({
  search: searchQuery.value,
  room_type_id: filterRoomTypeId.value,
  payment_status: filterPaymentStatus.value,
  check_in_from: apiDate(filterDateRange.value[0]),
  check_in_to: apiDate(filterDateRange.value[1]),
});

/* --------------- bookings fetch --------------- */
const fetchBookings = async (page = 1) => {
  isLoading.value = true;
  try {
    await statisticsBooking(page, buildFilters());
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
  filterDateRange.value = [null, null];
  fetchBookings(1);
};

/* --------------- watch filters --------------- */
watch(
  [searchQuery, filterRoomTypeId, filterPaymentStatus, filterDateRange],
  () => {
    // Only fetch bookings if the date range is fully cleared or both dates are set
    const [startDate, endDate] = filterDateRange.value;
    if (
      (startDate === null && endDate === null) ||
      (startDate !== null && endDate !== null)
    ) {
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
        <Calendar
          v-model="filterDateRange"
          selectionMode="range"
          dateFormat="yy-mm-dd"
          showIcon
          placeholder="Check-in range"
          class="w-full md:w-16rem"
          :manualInput="false"
          :showButtonBar="true"
          @clear-click="resetFilters"
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
        :rows="pagingMeta.per_page"
        :totalRecords="pagingMeta.total"
        :first="(pagingMeta.current_page - 1) * pagingMeta.per_page"
        lazy
        paginator
        @page="fetchBookings($event.page + 1)"
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
              label="View Details"
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