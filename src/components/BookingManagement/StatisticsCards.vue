<script setup lang="ts">
import { defineProps } from 'vue';
import Card from 'primevue/card';

defineProps<{
  recentBookingsCount: number;
  availableRoomCount: number;
  checkInsToday: number;
  checkOutsToday: number;
}>();
</script>

<template>
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
</template>

<style scoped>
@import '@/styles/booking-management.css';
</style>