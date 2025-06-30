<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import Dialog from 'primevue/dialog';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useBooking } from '@/composables/useBooking';
import { formatDateTime } from '@/utils/dateTimeFormatter';
import { formatCurrency } from '@/utils/currencyFormatter';

// Define props with TypeScript validation
defineProps<{
  visible: boolean;
  selectedBooking: {
    booking_id: string;
    user: { name: string; email: string; phone: string };
    room: { name: string; price: number; no_of_guests: string };
    total_amount: number;
    check_in_date: string;
    check_out_date: string;
    payment_status: string;
    is_checked_in: boolean;
    is_checked_out: boolean;
    no_of_guests: string;
  } | null;
}>();

// Define emits
defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update'): void;
}>();

const { handleCheckIn, handleCheckOut } = useBooking();
</script>

<template>
  <Dialog
    :visible="visible"
    header="Booking Details"
    :modal="true"
    :style="{ width: '70vw' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="selectedBooking" class="booking-details">
      <Card class="booking-detail-card">
        <template #content>
          <div class="flex align-items-start flex-column lg:justify-content-between lg:flex-row">
            <div class="booking-customer-info">
              <div class="customer-name">
                <i class="pi pi-user mr-2 text-primary"></i>
                <span class="text-2xl font-bold">{{ selectedBooking.user.name }}</span>
              </div>
              <div class="booking-status-info">
                <div class="status-item">
                  <i class="pi pi-sign-in mr-2"></i>
                  <Tag
                    v-if="selectedBooking.is_checked_in"
                    severity="success"
                    value="Checked In"
                  />
                  <Tag
                    v-else-if="selectedBooking.is_checked_out"
                    severity="contrast"
                    value="Checked Out"
                  />
                  <Tag v-else severity="warning" value="Not Checked In" />
                </div>
                <div class="status-item">
                  <i class="pi pi-money-bill mr-2"></i>
                  <span class="price-text">{{ formatCurrency(selectedBooking.total_amount) }}</span>
                </div>
                <div class="status-item">
                  <i class="pi pi-clock mr-2"></i>
                  <span>{{ formatDateTime(selectedBooking.check_in_date) }}</span>
                </div>
              </div>
            </div>
            <div class="booking-actions">
              <Button
                v-if="!selectedBooking.is_checked_out && !selectedBooking.is_checked_in"
                label="Check In Guest"
                icon="pi pi-sign-in"
                class="p-button-success mr-2"
                @click="handleCheckIn(selectedBooking.booking_id).then(() => $emit('update'))"
              />
              <Button
                v-if="!selectedBooking.is_checked_out && selectedBooking.is_checked_in"
                label="Check Out Guest"
                icon="pi pi-sign-out"
                class="p-button-danger"
                @click="handleCheckOut(selectedBooking.booking_id).then(() => $emit('update'))"
              />
              <p v-if="selectedBooking.is_checked_out" class="text-600">Already Checked Out</p>
            </div>
          </div>
        </template>
      </Card>
      <div class="booking-details-grid mt-4">
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label class="detail-label">Room:</label>
              <span class="detail-value">{{ selectedBooking.room.name }}</span>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label class="detail-label">Customer:</label>
              <span class="detail-value">{{ selectedBooking.user.name }}</span>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label class="detail-label">Room Capacity:</label>
              <span class="detail-value">{{ selectedBooking.no_of_guests }} guests</span>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label class="detail-label">Payment Status:</label>
              <Tag
                :value="selectedBooking.payment_status"
                :severity="selectedBooking.payment_status === 'paid' ? 'success' : 'warning'"
              />
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label class="detail-label">Check-In Time:</label>
              <span class="detail-value">{{ formatDateTime(selectedBooking.check_in_date) }}</span>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label class="detail-label">Check-Out Time:</label>
              <span class="detail-value">{{ formatDateTime(selectedBooking.check_out_date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-4">
      <p class="text-gray-600">No booking selected.</p>
    </div>
    <template #footer>
      <Button
        severity="secondary"
        label="Close"
        icon="pi pi-times"
        text
        @click="$emit('update:visible', false)"
      />
    </template>
  </Dialog>
</template>

<style scoped>
@import '@/styles/booking-management.css';
</style>