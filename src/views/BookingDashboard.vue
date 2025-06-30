<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import axiosInstance from '@/service/AxiosInstance';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';
import { formatDateTime } from '@/utils/dateTimeFormatter';
import BookingDetailsDialog from '@/components/BookingManagement/BookingDetailsDialog.vue';

const store = useStore();
const toast = useToast();
const { isDarkTheme } = useLayout();
const selectedBooking = ref(null);
const showDialog = ref(false);

// Booking Stats
const checkInsToday = ref(0);
const checkOutsToday = ref(0);
const availableRoomCount = ref(0);
const statisticsBookingResponse = ref({});

// Pagination state
const bookingsPager = reactive({
  page: 1,
  rows: 10,
  total: 0
});

// Booking lists and search
const recentBookings = ref([]);
const filteredBookings = ref([]);
const searchQuery = ref('');

// Line chart data
const lineData = reactive({
  labels: [],
  datasets: []
});

const lineOptions = {
  responsive: true,
  plugins: { legend: { position: 'top' } },
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: { display: true, title: { display: true, text: 'Month' }},
    y: { display: true, title: { display: true, text: 'Revenue' }}
  }
};

const applyLightTheme = () => {
  lineOptions.plugins.legend.labels = { color: '#495057' };
  lineOptions.scales.x.ticks = { color: '#495057' };
  lineOptions.scales.x.grid = { color: '#ebedef' };
  lineOptions.scales.y.ticks = { color: '#495057' };
  lineOptions.scales.y.grid = { color: '#ebedef' };
};

const applyDarkTheme = () => {
  lineOptions.plugins.legend.labels = { color: '#ebedef' };
  lineOptions.scales.x.ticks = { color: '#ebedef' };
  lineOptions.scales.x.grid = { color: 'rgba(160, 167, 181, .3)' };
  lineOptions.scales.y.ticks = { color: '#ebedef' };
  lineOptions.scales.y.grid = { color: 'rgba(160, 167, 181, .3)' };
};

watch(isDarkTheme, (val) => {
  val ? applyDarkTheme() : applyLightTheme();
}, { immediate: true });

watch(searchQuery, () => {
  if (searchQuery.value) {
    filteredBookings.value = recentBookings.value.filter(booking =>
      booking.user?.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      booking.room?.name?.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  } else {
    filteredBookings.value = [...recentBookings.value];
  }
});

// Initial load
onMounted(() => {
  statisticsBooking();
});

const statisticsBooking = async () => {
  const loaded = await pullStatistics(1);
  if (!loaded) return;

  const stats = statisticsBookingResponse.value;
  const totalRevenueByRoomType = stats.totalRevenueByRoomType || {};
  const labels = Object.keys(totalRevenueByRoomType);
  const datasets = {};

  for (const [monthYear, revenues] of Object.entries(totalRevenueByRoomType)) {
    revenues.forEach(revenue => {
      const roomType = revenue.room_type;
      if (!datasets[roomType]) {
        datasets[roomType] = {
          label: roomType,
          data: Array(labels.length).fill(0),
          fill: false,
          backgroundColor: revenue.color_code,
          tension: 0.4
        };
      }
      const index = labels.indexOf(monthYear);
      datasets[roomType].data[index] = revenue.total_revenue;
    });
  }

  lineData.labels = labels;
  lineData.datasets = Object.values(datasets);
};

const pullStatistics = async (page = 1) => {
  const token = JSON.parse(localStorage.getItem('userData') || '{}')?.token;
  if (!token) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Authentication token missing. Please log in.', life: 3000 });
    return false;
  }

  try {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    const { data } = await axiosInstance.get('/admin/statistics/booking', {
      params: { page },
      headers: { Authorization: `Bearer ${token}` }
    });

    statisticsBookingResponse.value = data;

    checkInsToday.value = data.checkInsToday || 0;
    checkOutsToday.value = data.checkOutsToday || 0;
    availableRoomCount.value = data.availableRoomCount || 0;

    const pageData = data.recentBookings;
    bookingsPager.page = pageData.current_page;
    bookingsPager.rows = Number(pageData.per_page);
    bookingsPager.total = pageData.total;
    recentBookings.value = pageData.data;
    filteredBookings.value = [...pageData.data];

    return true;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch booking statistics', life: 3000 });
    console.error('Error fetching booking statistics:', error);
    return false;
  } finally {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
  }
};

const onPage = (event) => {
  pullStatistics(event.page + 1);
};

const showDetails = (booking) => {
  selectedBooking.value = booking;
  showDialog.value = true;
};

const value = ref(50); // placeholder knob
</script>

<template>
  <div class="grid mb-3">
    <div class="col-12 lg:col-6 xl:col-3" v-for="(stat, i) in [
      { icon: 'pi-calendar-plus text-red-500', label: 'New Booking', value: bookingsPager.total },
      { icon: 'pi-home text-blue-500', label: 'Available Rooms', value: availableRoomCount },
      { icon: 'pi-calendar-check text-green-500', label: 'Check-In Today', value: checkInsToday },
      { icon: 'pi-calendar-minus text-purple-500', label: 'Check-Out Today', value: checkOutsToday }
    ]" :key="i">
      <div class="card mb-0 shadow-1 h-full">
        <div class="flex align-items-center gap-4">
          <i :class="`pi ${stat.icon} text-5xl`"></i>
          <div>
            <span class="text-900 block font-bold text-2xl mb-1">{{ stat.value }}</span>
            <div class="text-500 font-bold">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="grid mb-3">
    <div class="col-12 xl:col-7">
      <div class="card h-full shadow-1">
        <h5 class="font-bold text-600">Sales & Purchase</h5>
        <Chart type="line" :data="lineData" :options="lineOptions" />
      </div>
    </div>
    <div class="col-12 xl:col-5">
      <div class="card h-full shadow-1">
        <h5 class="font-bold text-600">Order Summary</h5>
        <Chart type="bar" :data="lineData" :options="lineOptions" />
      </div>
    </div>
  </div>

  <div class="grid mb-3">
    <div class="col-12">
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
              class="search-input w-full md:w-30rem"
            >
              <template #prepend>
                <i class="pi pi-search" />
              </template>
            </InputText>
          </div>

          <DataTable
            :value="filteredBookings"
            :paginator="true"
            lazy
            :rows="bookingsPager.rows"
            :totalRecords="bookingsPager.total"
            :first="(bookingsPager.page - 1) * bookingsPager.rows"
            @page="onPage"
            responsiveLayout="scroll"
            class="custom-datatable"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} bookings"
          >
            <Column field="booking_id" header="Booking ID" sortable>
              <template #body="slotProps">
                <i class="pi pi-home text-primary mr-2" />
                <span>{{ slotProps.data.booking_id }}</span>
              </template>
            </Column>

            <Column field="room.name" header="Room" sortable>
              <template #body="slotProps">
                <i class="pi pi-home text-primary mr-2" />
                <span>{{ slotProps.data.room.name }}</span>
              </template>
            </Column>

            <Column field="user.name" header="Customer" sortable>
              <template #body="slotProps">
                <i class="pi pi-user text-primary mr-2" />
                <span>{{ slotProps.data.user.name }}</span>
              </template>
            </Column>

            <Column field="check_in_date" header="Check-In" sortable>
              <template #body="slotProps">
                <i class="pi pi-calendar text-green-600 mr-2" />
                <span>{{ formatDateTime(slotProps.data.check_in_date) }}</span>
              </template>
            </Column>

            <Column field="check_out_date" header="Check-Out" sortable>
              <template #body="slotProps">
                <i class="pi pi-calendar text-red-600 mr-2" />
                <span>{{ formatDateTime(slotProps.data.check_out_date) }}</span>
              </template>
            </Column>

            <Column field="payment_status" header="Payment Status" sortable>
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.payment_status === 'paid' ? 'Paid' : 'Pending'"
                  :severity="slotProps.data.payment_status === 'paid' ? 'success' : 'warning'"
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

      <BookingDetailsDialog
        :visible="showDialog"
        :selectedBooking="selectedBooking"
        @update:visible="showDialog = $event"
        @update="statisticsBooking"
      />
    </div>
  </div>
</template>

<style scoped>
.search-input {
  max-width: 400px;
}
</style>
