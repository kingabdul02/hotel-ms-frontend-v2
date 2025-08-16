<template>
  <Dialog 
    :visible="visible" 
    @update:visible="$emit('update:visible', $event)"
    modal 
    :style="{ width: '130vw', maxWidth: '900px' }"
    header="Add Corporate Charges"
  >
    <div class="dialog-info booking-charges-info">
      Corporate Booking Charges — Applied to the corporate booking (not an individual room).
    </div>

    <div class="charges-form">
      <div class="booking-info">
        <h6>Booking Information</h6>
        <div class="info-grid">
          <div class="info-item"><strong>Company:</strong> {{ displayedBooking.companyName }}</div>
          <div class="info-item"><strong>Reservation:</strong> {{ displayedBooking.reservationCode }}</div>
          <div class="info-item"><strong>Check-in:</strong> {{ formatDate(displayedBooking.checkInDate) }}</div>
          <div class="info-item"><strong>Check-out:</strong> {{ formatDate(displayedBooking.checkOutDate) }}</div>
          <div class="info-item"><strong>Guests:</strong> {{ displayedBooking.guestsCount }}</div>
        </div>
      </div>

      <div class="charges-section">
        <div class="section-header">
          <h6>Add Charges</h6>
          <Button label="Add Item" icon="pi pi-plus" @click="addChargeItem" class="p-button-sm p-button-outlined" />
        </div>

        <div class="charges-list">
          <div v-for="(charge, index) in charges" :key="index" class="charge-item">
            <div class="charge-fields">
              <div class="field-group">
                <label>Description</label>
                <InputText v-model="charge.description" placeholder="e.g., Event Hall, Transport" :class="{ 'p-invalid': !charge.description && showValidation }" />
              </div>
              <div class="field-group">
                <label>Amount</label>
                <InputNumber v-model="charge.amount" mode="currency" currency="NGN" locale="en-NG" placeholder="0.00" :class="{ 'p-invalid': (!charge.amount || charge.amount <= 0) && showValidation }" />
              </div>
              <div class="field-group">
                <label>Category</label>
                <Dropdown v-model="charge.category" :options="chargeCategories" option-label="label" option-value="value" placeholder="Select Category" />
              </div>
              <div class="field-group quantity-group">
                <label>Quantity</label>
                <InputNumber v-model="charge.quantity" :min="1" />
              </div>
            </div>
            <div class="charge-actions">
              <Button icon="pi pi-trash" @click="removeChargeItem(index)" class="p-button-sm p-button-danger p-button-text" :disabled="charges.length === 1" />
            </div>
            <div class="charge-total">
              <strong>Total: ₦{{ formatCurrency((charge.amount || 0) * (charge.quantity || 0)) }}</strong>
            </div>
          </div>
        </div>

        <div class="charges-summary">
          <div class="summary-row"><span>Total Items:</span><span>{{ totalItems }}</span></div>
          <div class="summary-row total"><span>Grand Total:</span><span>₦{{ formatCurrency(grandTotal) }}</span></div>
        </div>
      </div>

      <div class="payment-section">
        <h6>Payment</h6>
        <div class="payment-row">
          <span class="label">Mark as Paid</span>
          <InputSwitch v-model="markAsPaid" />
          <span class="status" :class="markAsPaid ? 'paid' : 'pending'">{{ markAsPaid ? 'Paid' : 'Pending' }}</span>
        </div>
      </div>

      <div class="notes-section">
        <h6>Additional Notes</h6>
        <Textarea v-model="notes" rows="3" placeholder="Enter any additional notes or comments for these charges" />
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" icon="pi pi-times" @click="close" class="p-button-text" />
      <Button label="Add Charges" icon="pi pi-check" @click="saveCharges" :loading="saving" :disabled="!isFormValid" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { CorporateBookingService } from '@/service/CorporateBookingService';
import { bookingChargeCategories as chargeCategories } from '@/enum/bookingChargeCategories';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
  visible: { type: Boolean, default: false },
  booking: { type: Object, default: () => ({}) }
});
const emit = defineEmits(['update:visible', 'charges-added']);

const corporateService = new CorporateBookingService();
const toast = useToast();

const saving = ref(false);
const showValidation = ref(false);
const notes = ref('');
const markAsPaid = ref(false);

const charges = ref([{ description: '', amount: 0, category: '', quantity: 1 }]);

const totalItems = computed(() => charges.value.reduce((sum, c) => sum + (c.quantity || 0), 0));
const grandTotal = computed(() => charges.value.reduce((sum, c) => sum + ((c.amount || 0) * (c.quantity || 0)), 0));
const isFormValid = computed(() => charges.value.every(c => c.description && c.amount && c.amount > 0 && c.quantity && c.quantity > 0));

const displayedBooking = computed(() => {
  const b = props.booking || {};
  return {
    companyName: b.company?.name || 'N/A',
    reservationCode: b.reservation_code || 'N/A',
    checkInDate: b.check_in_date || null,
    checkOutDate: b.check_out_date || null,
    guestsCount: (b.guests || []).length || 0,
  };
});

watch(() => props.visible, (v) => { if (v) resetForm(); });

const resetForm = () => {
  charges.value = [{ description: '', amount: 0, category: '', quantity: 1 }];
  notes.value = '';
  showValidation.value = false;
  markAsPaid.value = false;
};

const addChargeItem = () => charges.value.push({ description: '', amount: 0, category: '', quantity: 1 });
const removeChargeItem = (index) => { if (charges.value.length > 1) charges.value.splice(index, 1); };

const saveCharges = async () => {
  showValidation.value = true;
  if (!isFormValid.value) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill in all required fields', life: 3000 });
    return;
  }
  saving.value = true;
  try {
    const chargeItems = charges.value.map(c => ({ description: c.description, amount: c.amount, category: c.category, quantity: c.quantity, total: c.amount * c.quantity }));
    const requestData = { charges: chargeItems, notes: notes.value, payment_status: markAsPaid.value ? 'paid' : 'pending' };
    const bookingId = props.booking.id || props.booking.corporate_booking_id || props.booking.booking_id;
    const response = await corporateService.addCorporateBookingCharges(bookingId, requestData);
    if (response) {
      toast.add({ severity: 'success', summary: 'Success', detail: `Added ${totalItems.value} item(s) totaling ₦${formatCurrency(grandTotal.value)}`, life: 3000 });
      emit('charges-added', { charges: chargeItems, total: grandTotal.value, notes: notes.value });
      close();
    } else {
      throw new Error('Failed to add charges');
    }
  } catch (error) {
    console.error('Error adding corporate charges:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: error?.message || 'Failed to add charges', life: 5000 });
  } finally {
    saving.value = false;
  }
};

const close = () => emit('update:visible', false);

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const formatCurrency = (amount) => new Intl.NumberFormat('en-NG').format(amount || 0);
</script>

<style scoped>
.charges-form { max-height: 70vh; overflow-y: auto; }
.dialog-info { font-size: .75rem; line-height:1.2; padding:.5rem .75rem; border-radius:6px; margin-bottom:1rem; background: var(--surface-50); border-left:4px solid var(--primary-color); color: var(--text-color-secondary); }
.booking-info { background: var(--surface-50); border: 1px solid var(--surface-border); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }
.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: .75rem; }
.charges-section { margin-bottom: 1.5rem; }
.section-header { display:flex; justify-content: space-between; align-items:center; margin-bottom:1rem; }
.charges-list { display:flex; flex-direction:column; gap:1rem; margin-bottom:1rem; }
.charge-item { background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: 8px; padding: 1rem; }
.charge-fields { display:grid; grid-template-columns: 2fr 1fr 1fr 120px; gap:1rem; margin-bottom: .75rem; align-items:flex-start; }
.field-group { display:flex; flex-direction:column; gap:.25rem; }
.quantity-group :deep(.p-inputnumber), .quantity-group :deep(input) { width: 100%; }
.charge-actions { display:flex; justify-content:flex-end; margin-bottom:.5rem; }
.charge-total { text-align:right; padding-top:.5rem; border-top:1px solid var(--surface-border); color: var(--primary-color); }
.charges-summary { background: var(--surface-100); border:1px solid var(--surface-border); border-radius:8px; padding:1rem; }
.summary-row { display:flex; justify-content:space-between; margin-bottom:.5rem; }
.summary-row.total { font-size:1.1rem; font-weight:600; color: var(--primary-color); padding-top:.5rem; border-top:1px solid var(--surface-border); }
.payment-section { margin: 1rem 0; }
.payment-row { display:flex; align-items:center; gap:.75rem; }
.payment-row .label { font-weight:500; color: var(--text-color); }
.payment-row .status { font-size:.875rem; }
.payment-row .status.paid { color: var(--green-500); }
.payment-row .status.pending { color: var(--orange-500); }
</style>
