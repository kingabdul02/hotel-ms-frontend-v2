<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import BookingsTab from '@/components/BookingManagement/BookingsTab.vue';
import CorporateBookingManagement from '@/components/BookingManagement/CorporateBookingManagement.vue';
import { useBooking } from '@/composables/useBooking';

// Initialize useBooking composable
const { statisticsBooking } = useBooking();

const activeTabIndex = ref(0);

const statistics = ref({
  recentBookingsCount: 0,
  availableRoomCount: 0,
  checkInsToday: 0,
  checkOutsToday: 0
});

onMounted(async () => {
  try {
    const stats = await statisticsBooking();
    statistics.value = {
      recentBookingsCount: stats.recentBookingsCount || 0,
      availableRoomCount: stats.availableRoomCount || 0,
      checkInsToday: stats.checkInsToday || 0,
      checkOutsToday: stats.checkOutsToday || 0
    };
  } catch (error) {
    console.error('Failed to fetch booking statistics:', error);
  }
});
</script>

<template>
  <div>
    <TabView v-model:activeIndex="activeTabIndex">
      <TabPanel header="Individual Booking">
        <BookingsTab :statisticsData="statistics" />
      </TabPanel>
      <TabPanel header="Corporate Booking">
        <CorporateBookingManagement />
      </TabPanel>
    </TabView>
  </div>
</template>

<style scoped>
/* Add any necessary styles here */
</style>
