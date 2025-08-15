<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import axiosInstance from '@/service/AxiosInstance';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Menu from 'primevue/menu';
import { useToast } from 'primevue/usetoast';
import { formatDateTime } from '@/utils/dateTimeFormatter';
import { formatCurrency } from '@/utils/currencyFormatter';

const props = defineProps<{
  value: any[];
  pagingMeta: { total: number; current_page: number; per_page: number };
  loading?: boolean;
  rows?: number;
  rowsPerPageOptions?: number[];
  // Action menu visibility controls
  showModify?: boolean;
  showCustomCharges?: boolean;
  showPOSCharges?: boolean;
}>();

const emits = defineEmits<{
  (e: 'request-fetch', payload: { page: number; rows: number; filters: any }): void;
  (e: 'open-details', booking: any): void;
  (e: 'modify-booking', booking: any): void;
  (e: 'add-custom-charges', booking: any): void;
  (e: 'add-pos-charges', booking: any): void;
}>();

const toast = useToast();

// internal rows state
const rows = ref(props.rows ?? 10);
const rowsPerPageOptions = computed(() => props.rowsPerPageOptions ?? [10, 20, 50, 100]);

// filter state
const searchQuery = ref('');
const filterRoomTypeId = ref<number | null>(null);
const filterPaymentStatus = ref<string | null>(null);
const filterBookingStatus = ref<string | null>(null);
const filterDateRange = ref<Date[]>([]);
const filterCheckoutRange = ref<Date[]>([]);
const filterBookingDateRange = ref<Date[]>([]);

const roomTypeOptions = ref<{ label: string; value: number | null }[]>([{ label: 'All', value: null }]);

const E_PaymentStatus = {
  PENDING: 'pending',
  SUCCESSFUL: 'successful',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

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

const apiDate = (d: Date | undefined) => {
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

const requestFetch = (page = 1) => {
  emits('request-fetch', { page, rows: rows.value, filters: buildFilters() });
};

// load room types for filter
const loadRoomTypes = async () => {
  try {
    const { data } = await axiosInstance.get('/get-room-types');
    roomTypeOptions.value = [
      { label: 'All', value: null },
      ...(data?.data || []).map((rt: any) => ({ label: rt.name, value: rt.id })),
    ];
  } catch (err) {
    // silently ignore
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  filterRoomTypeId.value = null;
  filterPaymentStatus.value = null;
  filterBookingStatus.value = null;
  filterDateRange.value = [];
  filterCheckoutRange.value = [];
  filterBookingDateRange.value = [];
  requestFetch(1);
};

watch(
  [searchQuery, filterRoomTypeId, filterPaymentStatus, filterBookingStatus, filterDateRange, filterCheckoutRange, filterBookingDateRange],
  () => {
    const isValidRange = (range: Date[]) => range.length === 0 || range.length === 2;
    if (isValidRange(filterDateRange.value) && isValidRange(filterCheckoutRange.value) && isValidRange(filterBookingDateRange.value)) {
      requestFetch(1);
    }
  },
  { deep: true }
);

onMounted(() => {
  loadRoomTypes();
  // initial fetch
  requestFetch(1);
});

// Actions menu
const actionMenu = ref();
const selectedRow = ref<any | null>(null);
const openActions = (event: Event, row: any) => {
  selectedRow.value = row;
  actionMenu.value?.toggle(event);
};

const actionMenuItems = computed(() => {
  const row = selectedRow.value as any | null;
  const isCheckedOut = !!row?.is_checked_out;
  const items: any[] = [
    {
      label: 'View Details',
      icon: 'pi pi-eye',
      command: () => selectedRow.value && emits('open-details', selectedRow.value),
    },
  ];
  if (props.showModify && !isCheckedOut) {
    items.push({ label: 'Modify Booking', icon: 'pi pi-pencil', command: () => selectedRow.value && emits('modify-booking', selectedRow.value) });
  }
  if (props.showCustomCharges && !isCheckedOut) {
    items.push({ label: 'Add Custom Charges', icon: 'pi pi-plus-circle', command: () => selectedRow.value && emits('add-custom-charges', selectedRow.value) });
  }
  if (props.showPOSCharges && !isCheckedOut) {
    items.push({ label: 'Add POS Charges', icon: 'pi pi-shopping-cart', command: () => selectedRow.value && emits('add-pos-charges', selectedRow.value) });
  }
  return items;
});

</script>

<template>
  <div class="recent-bookings-table">
    <!-- Header with slot for actions (e.g., New Reservation) -->
    <div class="table-header flex justify-content-between align-items-center w-full mb-3">
      <div class="flex align-items-center">
        <span class="pi pi-list text-primary text-xl mr-2" /> Recent Bookings
      </div>
      <div class="flex align-items-center gap-2">
        <slot name="header-actions"></slot>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-column md:flex-row gap-3 mb-3">
      <InputText v-model="searchQuery" placeholder="Search…" class="w-full md:w-16rem" />
      <Dropdown v-model="filterRoomTypeId" :options="roomTypeOptions" optionLabel="label" optionValue="value" placeholder="Room type" class="w-full md:w-12rem" />
      <Dropdown v-model="filterPaymentStatus" :options="paymentOptions" optionLabel="label" optionValue="value" placeholder="Payment" class="w-full md:w-10rem" />
      <Dropdown v-model="filterBookingStatus" :options="bookingStatusOptions" optionLabel="label" optionValue="value" placeholder="Booking Status" class="w-full md:w-12rem" />
    </div>

    <!-- Date filters -->
    <div class="flex flex-column md:flex-row gap-3 mb-3">
      <Calendar v-model="filterDateRange" selectionMode="range" dateFormat="yy-mm-dd" showIcon placeholder="Check-in range" class="w-full md:w-16rem" :manualInput="false" :showButtonBar="true" />
      <Calendar v-model="filterCheckoutRange" selectionMode="range" dateFormat="yy-mm-dd" showIcon placeholder="Check-out range" class="w-full md:w-16rem" :manualInput="false" :showButtonBar="true" />
      <Calendar v-model="filterBookingDateRange" selectionMode="range" dateFormat="yy-mm-dd" showIcon placeholder="Booking date range" class="w-full md:w-16rem" :manualInput="false" :showButtonBar="true" />
      <Button icon="pi pi-filter-slash" label="Reset" @click="resetFilters" class="p-button-secondary md:ml-auto" />
    </div>

    <div v-if="props.loading" class="flex justify-content-center py-4">
      <ProgressSpinner />
    </div>

    <DataTable v-else :value="props.value" :rows="rows" :rowsPerPageOptions="rowsPerPageOptions" :totalRecords="props.pagingMeta.total" :first="(props.pagingMeta.current_page - 1) * props.pagingMeta.per_page" lazy paginator @page="(e) => { rows = e.rows; requestFetch(e.page + 1); }">
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
        <template #body="{ data }">{{ formatDateTime(data.created_at) }}</template>
      </Column>

      <Column header="Check-In">
        <template #body="{ data }">{{ formatDateTime(data.check_in_date) }}</template>
      </Column>

      <Column header="Check-Out">
        <template #body="{ data }">{{ formatDateTime(data.check_out_date) }}</template>
      </Column>

      <Column header="Amount">
        <template #body="{ data }">{{ formatCurrency(data.total_amount) }}</template>
      </Column>

      <Column header="Booking Status">
        <template #body="{ data }">
          <Tag :value="data.is_checked_out ? 'Checked Out' : data.is_checked_in ? 'Checked In' : data.is_confirmed ? 'Confirmed' : 'Pending'" :severity="data.is_checked_out ? 'info' : data.is_checked_in ? 'success' : data.is_confirmed ? 'success' : 'warning'" />
        </template>
      </Column>

      <Column header="Payment Status">
        <template #body="{ data }">
          <Tag :value="data.payment_status.charAt(0).toUpperCase() + data.payment_status.slice(1).toLowerCase()" :severity="data.payment_status === 'paid' ? 'success' : 'warning'" />
        </template>
      </Column>

      <Column header="Actions" :exportable="false" style="width: 3rem; text-align: right;">
        <template #body="{ data }">
          <Button icon="pi pi-ellipsis-v" class="p-button-text p-button-rounded" @click="(e) => openActions(e, data)" aria-label="Actions" />
        </template>
      </Column>
    </DataTable>

    <Menu ref="actionMenu" :model="actionMenuItems" :popup="true" />
  </div>
</template>

<style scoped>
.table-header > * { flex-shrink: 0; }
</style>
