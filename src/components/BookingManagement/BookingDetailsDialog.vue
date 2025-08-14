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
import { POSService } from '@/service/POSService';

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
const posService = new POSService();

// Local reactive booking state that syncs with props
const localBooking = ref(props.selectedBooking ? JSON.parse(JSON.stringify(props.selectedBooking)) : null);

// Bill state
const billLoading = ref(false);
const billError = ref('');
const bill = ref<any | null>(null);

const fetchBill = async () => {
  if (!localBooking.value?.id) return;
  billLoading.value = true;
  billError.value = '';
  try {
    const response = await posService.getConsolidatedBill(localBooking.value.id);
    bill.value = response?.data || null;
  } catch (err: any) {
    billError.value = err?.response?.data?.message || 'Failed to fetch bill breakdown';
    bill.value = null;
  } finally {
    billLoading.value = false;
  }
};

// Helpers
const humanizePaymentStatus = (status?: string | null): string => {
  if (!status) return 'Unknown';
  return String(status)
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Watch for changes in props and update local state
watch(() => props.selectedBooking, (newBooking) => {
  localBooking.value = newBooking ? JSON.parse(JSON.stringify(newBooking)) : null;
  if (newBooking) fetchBill();
}, { deep: true });

// When dialog opens, fetch bill for the selected booking
watch(() => props.visible, (isOpen) => {
  if (isOpen && localBooking.value) fetchBill();
});

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
    await axiosInstance.post(`/admin/complete-payment`, {
      booking_id: localBooking.value?.booking_id,
      payment_method: selectedPaymentMethod.value,
      amount: bill.value?.totals?.balance ?? localBooking.value?.total_amount
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

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
    
    // Close the main booking details dialog
    emits('update:visible', false);
  } catch (error: any) {
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
  const status = bill.value?.payment_status ?? localBooking.value?.payment_status;
  if (status !== 'paid') {
    showPaymentDialog.value = true;
    return;
  }
  
  try {
    // If payment is already made, proceed with normal checkout
    await handleCheckOut(localBooking.value!.booking_id);
    
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
                  <span class="price-text">{{ formatCurrency((bill?.totals?.total ?? localBooking.total_amount) ?? 0) }}</span>
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
                v-if="(bill?.payment_status ?? localBooking.payment_status) !== 'paid' && !localBooking.is_checked_out"
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
                :value="humanizePaymentStatus(bill?.payment_status ?? localBooking.payment_status)"
                :severity="(bill?.payment_status ?? localBooking.payment_status) === 'paid' ? 'success' : ((bill?.payment_status ?? localBooking.payment_status) === 'partially_paid' ? 'info' : 'warning')"
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

      <!-- Bill Breakdown -->
      <div class="mt-4">
        <h3 class="mb-3">Bill Breakdown</h3>
        <div v-if="billLoading" class="p-3 surface-100 border-round">Loading bill...</div>
        <div v-else-if="billError" class="p-3 surface-100 border-round text-red-600">{{ billError }}</div>
        <div v-else-if="bill" class="grid">
          <div class="col-12 md:col-4">
            <Card>
              <template #title>Summary</template>
              <template #content>
                <div class="flex flex-column gap-2">
                  <div class="flex justify-content-between"><span>Subtotal</span><strong>{{ formatCurrency(bill.totals?.subtotal || 0) }}</strong></div>
                  <div class="flex justify-content-between"><span>Tax</span><strong>{{ formatCurrency(bill.totals?.tax || 0) }}</strong></div>
                  <div class="flex justify-content-between"><span>Total</span><strong class="text-primary">{{ formatCurrency((bill.totals?.total ?? localBooking.total_amount) ?? 0) }}</strong></div>
                  <div class="flex justify-content-between"><span>Paid</span><strong class="text-green-600">{{ formatCurrency(bill.totals?.paid || 0) }}</strong></div>
                  <div class="flex justify-content-between"><span>Balance</span><strong class="text-orange-600">{{ formatCurrency(bill.totals?.balance ?? 0) }}</strong></div>
                </div>
              </template>
            </Card>
          </div>
          <div class="col-12 md:col-8" v-if="bill.charges?.accommodation">
            <Card>
              <template #title>Accommodation</template>
              <template #content>
                <div class="mb-2 flex justify-content-end gap-3 text-600">
                  <span>Subtotal: <strong>{{ formatCurrency(bill.charges.accommodation.subtotal || 0) }}</strong></span>
                  <span>Tax: <strong>{{ formatCurrency(bill.charges.accommodation.tax || 0) }}</strong></span>
                  <span>Total: <strong>{{ formatCurrency(bill.charges.accommodation.total || 0) }}</strong></span>
                </div>
                <div v-if="!bill.charges.accommodation.lines?.length" class="flex flex-column gap-2 pb-2">
                  <!-- <div class="text-600 mb-2">Nightly breakdown not provided. Estimated details based on booking:</div> -->
                  <div class="flex justify-content-between border-bottom-1 surface-border pb-2">
                    <span>Nights</span>
                    <span>{{ bill.booking?.no_of_nights || 1 }}</span>
                  </div>
                  <div class="flex justify-content-between border-bottom-1 surface-border pb-2">
                    <span>Estimated Rate/Night</span>
                    <span>{{ formatCurrency(((bill.charges.accommodation.total || 0) / (Number(bill.booking?.no_of_nights)||1)) || 0) }}</span>
                  </div>
                  <div class="flex justify-content-between">
                    <span>Estimated Total</span>
                    <span>{{ formatCurrency(bill.charges.accommodation.total || 0) }}</span>
                  </div>
                </div>
                <div v-else class="flex flex-column gap-2">
                  <div v-for="(line, idx) in bill.charges.accommodation.lines" :key="idx" class="flex justify-content-between border-bottom-1 surface-border pb-2">
                    <span>{{ line.description || 'Nightly Rate' }}</span>
                    <span>{{ formatCurrency(line.total || 0) }}</span>
                  </div>
                </div>
              </template>
            </Card>
          </div>
          <div class="col-12">
            <Card>
              <template #title>Booking Charges</template>
              <template #content>
                <p v-if="!bill.charges?.booking_charges?.length" class="text-600">No booking charges.</p>
                <div v-else class="table w-full">
                  <div class="flex font-medium text-600 border-bottom-1 surface-border pb-2">
                    <div class="w-2">Date</div>
                    <div class="w-5">Description</div>
                    <div class="w-1 text-right">Qty</div>
                    <div class="w-2 text-right">Unit</div>
                    <div class="w-2 text-right">Total</div>
                  </div>
                  <div v-for="(c, i) in bill.charges.booking_charges" :key="i" class="flex py-2 border-bottom-1 surface-border">
                    <div class="w-2">{{ c.date }}</div>
                    <div class="w-5">{{ c.description }} <span v-if="c.category" class="text-600">({{ c.category }})</span></div>
                    <div class="w-1 text-right">{{ c.quantity }}</div>
                    <div class="w-2 text-right">{{ formatCurrency(c.unit_price) }}</div>
                    <div class="w-2 text-right">{{ formatCurrency(c.total) }}</div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
          <div class="col-12">
            <Card>
              <template #title>POS Charges</template>
              <template #content>
                <p v-if="!bill.charges?.pos_charges?.length" class="text-600">No POS charges.</p>
                <div v-else class="table w-full">
                  <div class="flex font-medium text-600 border-bottom-1 surface-border pb-2">
                    <div class="w-2">Date</div>
                    <div class="w-3">Outlet</div>
                    <div class="w-4">Description</div>
                    <div class="w-1 text-right">Qty</div>
                    <div class="w-2 text-right">Unit</div>
                    <div class="w-2 text-right">Total</div>
                  </div>
                  <div v-for="(p, i) in bill.charges.pos_charges" :key="i" class="flex py-2 border-bottom-1 surface-border">
                    <div class="w-2">{{ p.date }}</div>
                    <div class="w-3">{{ p.outlet }}</div>
                    <div class="w-4">{{ p.description }}</div>
                    <div class="w-1 text-right">{{ p.quantity }}</div>
                    <div class="w-2 text-right">{{ formatCurrency(p.unit_price) }}</div>
                    <div class="w-2 text-right">{{ formatCurrency(p.total) }}</div>
                  </div>
                </div>
              </template>
            </Card>
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
            <span class="font-semibold">Amount Due:</span>
            <span class="text-xl font-bold text-primary">{{ formatCurrency((bill?.totals?.balance ?? localBooking?.total_amount) ?? 0) }}</span>
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