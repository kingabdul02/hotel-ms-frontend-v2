<script setup lang="ts">
import { defineProps, defineEmits, ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import { useBooking } from '@/composables/useBooking';
import { useToast } from 'primevue/usetoast';
import axiosInstance from '@/service/AxiosInstance';
import { formatDateTime } from '@/utils/dateTimeFormatter';
import { formatCurrency } from '@/utils/currencyFormatter';
import { humanizePaymentStatus } from '@/utils/paymentStatus';
import { POSService } from '@/service/POSService';
import { bookingChargeCategories as chargeCategories } from '@/enum/bookingChargeCategories';

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

// Helpers are imported from utils

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
const paymentAmount = ref<number>(0);
const paymentMethods = [
  { label: 'Cash', value: 'cash' },
  { label: 'POS', value: 'pos' },
  { label: 'Transfer', value: 'transfer' }
];

// Computed current balance (fallback to total amount if bill missing)
const currentBalance = computed<number>(() => {
  const fromBill = bill.value?.totals?.balance;
  const fallback = localBooking.value?.total_amount ?? 0;
  return typeof fromBill === 'number' ? fromBill : (fromBill ?? fallback ?? 0);
});

// Initialize amount when payment dialog opens
watch(showPaymentDialog, (open) => {
  if (open) {
    paymentAmount.value = Number(currentBalance.value || 0);
  }
});

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

  // Validate amount
  if (!paymentAmount.value || paymentAmount.value <= 0) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Invalid amount', 
      detail: 'Please enter a valid payment amount', 
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
    // Guard against overpayment
    if (paymentAmount.value > currentBalance.value) {
      toast.add({
        severity: 'warn',
        summary: 'Amount too high',
        detail: 'Payment amount cannot exceed outstanding balance',
        life: 3000
      });
      return;
    }

    await axiosInstance.post(`/admin/complete-payment`, {
      booking_id: localBooking.value?.booking_id,
      payment_method: selectedPaymentMethod.value,
  amount: paymentAmount.value
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
  paymentAmount.value = 0;
    
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

// Discount-aware totals for display
const displayedTotal = computed<number>(() => {
  const lb = Number(localBooking.value?.total_amount ?? 0) || 0;
  const bt = Number(bill.value?.totals?.total ?? 0) || 0;
  // Prefer the booking total if present and lower (discounted), else fallback to bill total
  if (lb && bt) return Math.min(lb, bt);
  return lb || bt || 0;
});

const discountMeta = computed(() => {
  const b: any = localBooking.value || {};
  const type = b.discount_type || b.discountType;
  const value = b.discount_value ?? b.discountValue;
  const reason = b.discount_reason || b.discountReason;
  return {
    has: !!type && (Number(value) || 0) > 0,
    type,
    value: Number(value) || 0,
    reason: reason || ''
  };
});

const nightsForEst = computed(() => {
  const start = localBooking.value?.check_in_date ? new Date(localBooking.value.check_in_date) : null;
  const end = localBooking.value?.check_out_date ? new Date(localBooking.value.check_out_date) : null;
  if (!start || !end) return Number(bill.value?.booking?.no_of_nights ?? 0) || 0;
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.max(Math.ceil((e - s) / (1000 * 60 * 60 * 24)), 0);
});

const accommodationTotalForEst = computed(() => {
  const fromBill = Number(bill.value?.charges?.accommodation?.total ?? 0) || 0;
  const fromBooking = Number(localBooking.value?.total_amount ?? 0) || 0;
  if (fromBill && fromBooking) return Math.min(fromBill, fromBooking);
  return fromBooking || fromBill || 0;
});

const estimatedRatePerNight = computed(() => {
  const n = nightsForEst.value || 1;
  const total = accommodationTotalForEst.value || 0;
  return n > 0 ? total / n : total;
});

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
                  <span class="price-text">{{ formatCurrency(displayedTotal) }}</span>
                </div>
                <div class="status-item" v-if="discountMeta.has">
                  <i class="pi pi-tag mr-2"></i>
                  <Tag severity="info" :value="discountMeta.type === 'percent' ? (discountMeta.value + '% off') : (formatCurrency(discountMeta.value) + ' off')" />
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
        <div v-else-if="bill" class="grid align-items-stretch equal-height-cards">
          <div class="col-12 md:col-4">
            <Card class="card-full">
              <template #title>Summary</template>
              <template #content>
                <div class="flex flex-column gap-2">
                  <div class="flex justify-content-between"><span>Subtotal</span><strong>{{ formatCurrency(bill.totals?.subtotal || 0) }}</strong></div>
                  <div class="flex justify-content-between"><span>Tax</span><strong>{{ formatCurrency(bill.totals?.tax || 0) }}</strong></div>
                  <div class="flex justify-content-between" v-if="(bill.totals?.discount ?? (discountMeta.has ? discountMeta.value : 0))">
                    <span>Discount</span>
                    <strong class="text-red-600">-{{ formatCurrency(bill.totals?.discount ?? discountMeta.value) }}</strong>
                  </div>
                  <div class="flex justify-content-between"><span>Total</span><strong class="text-primary">{{ formatCurrency(displayedTotal) }}</strong></div>
                  <div class="flex justify-content-between"><span>Paid</span><strong class="text-green-600">{{ formatCurrency(bill.totals?.paid || 0) }}</strong></div>
                  <div class="flex justify-content-between"><span>Balance</span><strong class="text-orange-600">{{ formatCurrency(bill.totals?.balance ?? 0) }}</strong></div>
                  <div v-if="discountMeta.has && discountMeta.reason" class="mt-1 text-600" style="font-size:.8rem;">
                    Reason: {{ discountMeta.reason }}
                  </div>
                </div>
              </template>
            </Card>
          </div>
          <div class="col-12 md:col-8" v-if="bill.charges?.accommodation">
            <Card class="card-full">
              <template #title>Accommodation</template>
              <template #content>
                <div class="mb-2 flex justify-content-end gap-3 text-600">
                  <span>Subtotal: <strong>{{ formatCurrency(bill.charges.accommodation.subtotal || 0) }}</strong></span>
                  <span>Tax: <strong>{{ formatCurrency(bill.charges.accommodation.tax || 0) }}</strong></span>
                  <span>Accommodation Total (before discount): <strong>{{ formatCurrency(bill.charges.accommodation.total || 0) }}</strong></span>
                </div>
                <div v-if="!bill.charges.accommodation.lines?.length" class="flex flex-column gap-2 pb-2">
                  <!-- <div class="text-600 mb-2">Nightly breakdown not provided. Estimated details based on booking:</div> -->
                  <div class="flex justify-content-between border-bottom-1 surface-border pb-2">
                    <span>Nights</span>
                    <span>{{ bill.booking?.no_of_nights || 1 }}</span>
                  </div>
                  <div class="flex justify-content-between border-bottom-1 surface-border pb-2">
                    <span>Estimated Rate/Night</span>
                    <span>{{ formatCurrency(estimatedRatePerNight) }}</span>
                  </div>
                  <div class="flex justify-content-between">
                    <span>Accommodation Total (before discount)</span>
                    <span>{{ formatCurrency(bill.charges.accommodation.total || 0) }}</span>
                  </div>
                  <div class="flex justify-content-between" v-if="bill.totals?.discount">
                    <span>Discount</span>
                    <span class="text-red-600">-{{ formatCurrency(bill.totals.discount) }}</span>
                  </div>
                  <div class="flex justify-content-between">
                    <span>Net Total</span>
                    <span class="text-primary">{{ formatCurrency(displayedTotal) }}</span>
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
                    <div class="w-5">{{ c.description }} <span v-if="c.category" class="text-600">({{ chargeCategories.find(cat => cat.value === c.category)?.label }})</span></div>
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
            <span class="text-xl font-bold text-primary">{{ formatCurrency(currentBalance) }}</span>
          </div>
        </div>
        <div class="flex flex-column gap-3">
          <label for="payment-amount" class="font-semibold">Amount</label>
          <InputNumber
            id="payment-amount"
            v-model="paymentAmount"
            mode="currency"
            currency="NGN"
            locale="en-NG"
            :max="currentBalance"
            :min="0"
            class="w-full"
            input-class="w-full"
            :useGrouping="true"
            placeholder="Enter amount"
          />
          <small class="text-600">Defaults to outstanding balance. You can enter a partial amount.</small>

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
          @click="showPaymentDialog = false; selectedPaymentMethod = ''; paymentAmount = 0"
        />
        <Button
          label="Complete Payment"
          icon="pi pi-check"
          :disabled="!selectedPaymentMethod || !paymentAmount || paymentAmount <= 0"
          @click="handleCompletePayment"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
@import '@/styles/booking-management.css';

/* Equal height cards for Summary and Accommodation */
.equal-height-cards { align-items: stretch; }
.card-full { height: 100%; display: flex; flex-direction: column; }
.card-full :deep(.p-card-body) { display: flex; flex-direction: column; height: 100%; }
.card-full :deep(.p-card-content) { margin-top: auto; }
</style>