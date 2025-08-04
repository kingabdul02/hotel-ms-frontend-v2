<script setup lang="ts">
import { defineProps, defineEmits, ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import { useBooking } from '@/composables/useBooking';
import { useToast } from 'primevue/usetoast';
import axiosInstance from '@/service/AxiosInstance';
import { formatDateTime } from '@/utils/dateTimeFormatter';
import { formatCurrency } from '@/utils/currencyFormatter';

// Define props with TypeScript validation
const props = defineProps<{
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
const emits = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update'): void;
}>();

const { handleCheckIn, handleCheckOut } = useBooking();
const toast = useToast();

// Local reactive booking state that syncs with props
const localBooking = ref(props.selectedBooking ? JSON.parse(JSON.stringify(props.selectedBooking)) : null);

// Watch for changes in props and update local state
watch(() => props.selectedBooking, (newBooking) => {
  localBooking.value = newBooking ? JSON.parse(JSON.stringify(newBooking)) : null;
}, { deep: true });

// Payment dialog state
const showPaymentDialog = ref(false);
const selectedPaymentMethod = ref('');
const paymentMethods = [
  { label: 'Cash', value: 'cash' },
  { label: 'POS', value: 'pos' },
  { label: 'Transfer', value: 'transfer' }
];

// Handle payment completion
const handleCompletePayment = async () => {
  if (!selectedPaymentMethod.value) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Warning', 
      detail: 'Please select a payment method', 
      life: 3000 
    });
    return;
  }

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const token = userData?.token;

  if (!token) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Authentication token missing', 
      life: 3000 
    });
    return;
  }

  try {
    const response = await axiosInstance.post(`/admin/complete-payment`, {
      booking_id: localBooking.value?.booking_id,
      payment_method: selectedPaymentMethod.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Update the local booking object immediately for instant UI feedback
    if (localBooking.value && response.data.success) {
      localBooking.value.payment_status = 'paid';
      // Trigger reactivity by reassigning the object
      localBooking.value = { ...localBooking.value };
    }

    toast.add({ 
      severity: 'success', 
      summary: 'Success', 
      detail: 'Payment completed successfully', 
      life: 3000 
    });

    // Close the payment dialog
    showPaymentDialog.value = false;
    selectedPaymentMethod.value = '';
    
    // Emit update to refresh the booking data from parent
    emits('update');
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'Failed to complete payment', 
      life: 3000 
    });
  }
};

// Handle checkout with payment check
const handleCheckOutWithPaymentCheck = async () => {
  if (localBooking.value?.payment_status !== 'paid') {
    showPaymentDialog.value = true;
    return;
  }
  
  try {
    // If payment is already made, proceed with normal checkout
    await handleCheckOut(localBooking.value.booking_id);
    
    // Update the local booking object immediately for instant UI feedback
    if (localBooking.value) {
      localBooking.value.is_checked_out = true;
    }
    
    // Emit update to refresh the booking data from parent
    emits('update');
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to check out guest', 
      life: 3000 
    });
  }
};

// Handle check-in with immediate UI feedback
const handleCheckInGuest = async () => {
  try {
    await handleCheckIn(localBooking.value?.booking_id);
    
    // Update the local booking object immediately for instant UI feedback
    if (localBooking.value) {
      localBooking.value.is_checked_in = true;
    }
    
    // Emit update to refresh the booking data from parent
    emits('update');
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to check in guest', 
      life: 3000 
    });
  }
};
</script>

<template>
  <Dialog
    :visible="props.visible"
    header="Booking Details"
    :modal="true"
    :style="{ width: '70vw' }"
    @update:visible="emits('update:visible', $event)"
  >
    <div v-if="localBooking" class="booking-details">
      <Card class="booking-detail-card">
        <template #content>
          <div class="flex align-items-start flex-column lg:justify-content-between lg:flex-row">
            <div class="booking-customer-info">
              <div class="customer-name">
                <i class="pi pi-user mr-2 text-primary"></i>
                <span class="text-2xl font-bold">{{ localBooking.user.name }}</span>
              </div>
              <div class="booking-status-info">
                <div class="status-item">
                  <i class="pi pi-sign-in mr-2"></i>
                  <Tag
                    v-if="localBooking.is_checked_in"
                    severity="success"
                    value="Checked In"
                  />
                  <Tag
                    v-else-if="localBooking.is_checked_out"
                    severity="contrast"
                    value="Checked Out"
                  />
                  <Tag v-else severity="warning" value="Not Checked In" />
                </div>
                <div class="status-item">
                  <i class="pi pi-money-bill mr-2"></i>
                  <span class="price-text">{{ formatCurrency(localBooking.total_amount) }}</span>
                </div>
                <div class="status-item">
                  <i class="pi pi-clock mr-2"></i>
                  <span>{{ formatDateTime(localBooking.check_in_date) }}</span>
                </div>
              </div>
            </div>
            <div class="booking-actions">
              <Button
                v-if="!localBooking.is_checked_out && !localBooking.is_checked_in"
                label="Check In Guest"
                icon="pi pi-sign-in"
                class="p-button-success mr-2"
                @click="handleCheckInGuest"
              />
              <Button
                v-if="localBooking.payment_status !== 'paid' && !localBooking.is_checked_out"
                label="Make Payment"
                icon="pi pi-money-bill"
                class="p-button-info mr-2"
                @click="showPaymentDialog = true"
              />
              <Button
                v-if="!localBooking.is_checked_out && localBooking.is_checked_in"
                label="Check Out Guest"
                icon="pi pi-sign-out"
                class="p-button-danger"
                @click="handleCheckOutWithPaymentCheck"
              />
              <p v-if="localBooking.is_checked_out" class="text-600">Already Checked Out</p>
            </div>
          </div>
        </template>
      </Card>
      <div class="booking-details-grid mt-4">
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label class="detail-label">Room:</label>
              <span class="detail-value">{{ localBooking.room.name }}</span>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label class="detail-label">Customer:</label>
              <span class="detail-value">{{ localBooking.user.name }}</span>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label class="detail-label">Room Capacity:</label>
              <span class="detail-value">{{ localBooking.no_of_guests }} guests</span>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label class="detail-label">Payment Status:</label>
              <Tag
                :value="localBooking.payment_status"
                :severity="localBooking.payment_status === 'paid' ? 'success' : 'warning'"
              />
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label class="detail-label">Check-In Time:</label>
              <span class="detail-value">{{ formatDateTime(localBooking.check_in_date) }}</span>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label class="detail-label">Check-Out Time:</label>
              <span class="detail-value">{{ formatDateTime(localBooking.check_out_date) }}</span>
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
        @click="emits('update:visible', false)"
      />
    </template>
  </Dialog>

  <!-- Payment Dialog -->
  <Dialog
    :visible="showPaymentDialog"
    header="Complete Payment"
    :modal="true"
    :style="{ width: '30vw' }"
    @update:visible="showPaymentDialog = $event"
  >
    <div class="payment-dialog-content">
      <div class="mb-4">
        <p class="text-600 mb-3">
          Complete payment for this booking. Please select a payment method:
        </p>
        <div class="mb-3 p-3 surface-100 border-round">
          <div class="flex justify-content-between align-items-center">
            <span class="font-semibold">Total Amount:</span>
            <span class="text-xl font-bold text-primary">{{ formatCurrency(localBooking?.total_amount || 0) }}</span>
          </div>
        </div>
        <div class="flex flex-column gap-3">
          <label for="payment-method" class="font-semibold">Payment Method</label>
          <Dropdown
            id="payment-method"
            v-model="selectedPaymentMethod"
            :options="paymentMethods"
            option-label="label"
            option-value="value"
            placeholder="Select payment method"
            class="w-full"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex gap-2">
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="showPaymentDialog = false; selectedPaymentMethod = ''"
        />
        <Button
          label="Complete Payment"
          icon="pi pi-check"
          :disabled="!selectedPaymentMethod"
          @click="handleCompletePayment"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
@import '@/styles/booking-management.css';
</style>