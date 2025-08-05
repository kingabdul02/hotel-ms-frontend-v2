<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import BookingsTab from './BookingsTab.vue';
import CorporateBookingManagement from './CorporateBookingManagement.vue';
import { useBooking } from '@/composables/useBooking';

// Initialize useBooking composable
const { statisticsBooking } = useBooking();

const activeTab = ref(0);

// Fetch booking statistics on component mount
onMounted(() => {
  statisticsBooking();
});
</script>

<template>
  <div class="booking-management-container">
    <TabView v-model:activeIndex="activeTab" class="main-tabview">
      <TabPanel>
        <template #header>
          <div class="tab-header">
            <i class="pi pi-calendar-check text-primary"></i>
            <span class="ml-2 tab-title">Individual Bookings</span>
          </div>
        </template>
        <BookingsTab />
      </TabPanel>
      <TabPanel>
        <template #header>
          <div class="tab-header">
            <i class="pi pi-building text-primary"></i>
            <span class="ml-2 tab-title">Corporate Bookings</span>
          </div>
        </template>
        <CorporateBookingManagement />
      </TabPanel>
    </TabView>
  </div>
</template>

<style scoped>
@import '@/styles/booking-management.css';
</style>