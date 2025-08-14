<template>
    <Dialog 
        :visible="visible" 
        @update:visible="$emit('update:visible', $event)"
        modal 
        :style="{ width: '130vw', maxWidth: '900px' }"
        header="Add Custom Charges"
    >
        <div class="dialog-info booking-charges-info">
            Booking Charges: Add stay or administrative fees (late/early check-out, upgrades, damages, misc.) directly to this booking.
        </div>

        <div class="charges-form">
            <div class="booking-info">
                <h6>Booking Information</h6>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Guest:</strong> {{ displayedBooking.guestName }}
                    </div>
                    <div class="info-item">
                        <strong>Room:</strong> {{ displayedBooking.roomNumber }} ({{ displayedBooking.roomType }})
                    </div>
                    <div class="info-item">
                        <strong>Check-in:</strong> {{ formatDate(displayedBooking.checkInDate) }}
                    </div>
                    <div class="info-item">
                        <strong>Check-out:</strong> {{ formatDate(displayedBooking.checkOutDate) }}
                    </div>
                    <div class="info-item">
                        <strong>Stay Duration:</strong> {{ stayDuration }} {{ stayDuration === 1 ? 'night' : 'nights' }}
                    </div>
                </div>
            </div>

            <div class="charges-section">
                <div class="section-header">
                    <h6>Add Charges</h6>
                    <Button 
                        label="Add Item" 
                        icon="pi pi-plus" 
                        @click="addChargeItem"
                        class="p-button-sm p-button-outlined"
                    />
                </div>

                <div class="charges-list">
                    <div 
                        v-for="(charge, index) in charges" 
                        :key="index"
                        class="charge-item"
                    >
                        <div class="charge-fields">
                            <div class="field-group">
                                <label>Description</label>
                                <InputText 
                                    v-model="charge.description" 
                                    placeholder="e.g., Minibar, Airport Transfer"
                                    :class="{ 'p-invalid': !charge.description && showValidation }"
                                />
                            </div>
                            
                            <div class="field-group">
                                <label>Amount</label>
                                <InputNumber 
                                    v-model="charge.amount" 
                                    mode="currency"
                                    currency="NGN"
                                    locale="en-NG"
                                    placeholder="0.00"
                                    :class="{ 'p-invalid': (!charge.amount || charge.amount <= 0) && showValidation }"
                                />
                            </div>
                            
                            <div class="field-group">
                                <label>Category</label>
                                <Dropdown 
                                    v-model="charge.category" 
                                    :options="chargeCategories"
                                    option-label="label"
                                    option-value="value"
                                    placeholder="Select Category"
                                />
                            </div>
                            
                            <div class="field-group quantity-group">
                                <label>Quantity</label>
                                <InputNumber 
                                    v-model="charge.quantity" 
                                    :min="1"
                                />
                            </div>
                        </div>
                        
                        <div class="charge-actions">
                            <Button 
                                icon="pi pi-trash" 
                                @click="removeChargeItem(index)"
                                class="p-button-sm p-button-danger p-button-text"
                                :disabled="charges.length === 1"
                            />
                        </div>
                        
                        <div class="charge-total">
                            <strong>Total: ₦{{ formatCurrency(charge.amount * charge.quantity) }}</strong>
                        </div>
                    </div>
                </div>

                <div class="charges-summary">
                    <div class="summary-row">
                        <span>Total Items:</span>
                        <span>{{ totalItems }}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Grand Total:</span>
                        <span>₦{{ formatCurrency(grandTotal) }}</span>
                    </div>
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
                <Textarea 
                    v-model="notes" 
                    rows="3"
                    placeholder="Enter any additional notes or comments for these charges"
                />
            </div>
        </div>

        <template #footer>
            <Button 
                label="Cancel" 
                icon="pi pi-times" 
                @click="close" 
                class="p-button-text"
            />
            <Button 
                label="Add Charges" 
                icon="pi pi-check" 
                @click="saveCharges"
                :loading="saving"
                :disabled="!isFormValid"
            />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { BookingV2Service } from '@/service/BookingV2Service';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    booking: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['update:visible', 'charges-added']);

const bookingService = new BookingV2Service();
const toast = useToast();

const saving = ref(false);
const showValidation = ref(false);
const notes = ref('');
const markAsPaid = ref(false);

const charges = ref([
    {
        description: '',
        amount: 0,
        category: '',
        quantity: 1
    }
]);

const chargeCategories = [
    { label: 'Food & Beverage', value: 'food_beverage' },
    { label: 'Minibar', value: 'minibar' },
    { label: 'Transport', value: 'transport' },
    { label: 'Laundry', value: 'laundry' },
    { label: 'Spa & Wellness', value: 'spa' },
    { label: 'Telecommunications', value: 'telecom' },
    { label: 'Business Services', value: 'business' },
    { label: 'Damage/Repair', value: 'damage' },
    { label: 'Other', value: 'other' }
];

const totalItems = computed(() => {
    return charges.value.reduce((sum, charge) => sum + (charge.quantity || 0), 0);
});

const grandTotal = computed(() => {
    return charges.value.reduce((sum, charge) => {
        return sum + ((charge.amount || 0) * (charge.quantity || 0));
    }, 0);
});

const isFormValid = computed(() => {
    return charges.value.every(charge => 
        charge.description && 
        charge.amount && 
        charge.amount > 0 && 
        charge.quantity && 
        charge.quantity > 0
    );
});

const displayedBooking = computed(() => {
    const b = props.booking || {};
    return {
        guestName: b.guestName || b.guest_name || b.user?.name || 'N/A',
        roomNumber: b.roomNumber || b.room?.name || b.room?.number || b.room_name || 'N/A',
        roomType: b.roomType || b.room?.room_type?.name || b.room?.type?.name || b.room_type || 'N/A',
        checkInDate: b.checkInDate || b.check_in_date || null,
        checkOutDate: b.checkOutDate || b.check_out_date || null
    };
});

const stayDuration = computed(() => {
    const ci = displayedBooking.value.checkInDate;
    const co = displayedBooking.value.checkOutDate;
    if (!ci || !co) return 0;
    const checkIn = new Date(ci);
    const checkOut = new Date(co);
    const diff = checkOut - checkIn;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

watch(() => props.visible, (newVal) => {
    if (newVal) {
        resetForm();
    }
});

const resetForm = () => {
    charges.value = [
        {
            description: '',
            amount: 0,
            category: '',
            quantity: 1
        }
    ];
    notes.value = '';
    showValidation.value = false;
    markAsPaid.value = false;
};

const addChargeItem = () => {
    charges.value.push({
        description: '',
        amount: 0,
        category: '',
        quantity: 1
    });
};

const removeChargeItem = (index) => {
    if (charges.value.length > 1) {
        charges.value.splice(index, 1);
    }
};

const saveCharges = async () => {
    showValidation.value = true;
    if (!isFormValid.value) {
        toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill in all required fields', life: 3000 });
        return;
    }
    saving.value = true;
    try {
        const chargeItems = charges.value.map(charge => ({
            description: charge.description,
            amount: charge.amount,
            category: charge.category,
            quantity: charge.quantity,
            total: charge.amount * charge.quantity
        }));
        const requestData = {
            charges: chargeItems,
            notes: notes.value,
            addedBy: 'current_user',
            addedAt: new Date().toISOString(),
            payment_status: markAsPaid.value ? 'paid' : 'pending'
        };
        const bookingId = props.booking.id || props.booking.booking_id;
        const response = await bookingService.addBookingCharges(bookingId, requestData);
        if (response.success) {
            toast.add({ severity: 'success', summary: 'Success', detail: `Added ${totalItems.value} charge item(s) totaling ₦${formatCurrency(grandTotal.value)}`, life: 3000 });
            emit('charges-added', { charges: chargeItems, total: grandTotal.value, notes: notes.value });
            close();
        } else { throw new Error(response.message || 'Failed to add charges'); }
    } catch (error) {
        console.error('Error adding charges:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: error.message || 'Failed to add charges to booking', life: 5000 });
    } finally { saving.value = false; }
};

const close = () => {
    emit('update:visible', false);
};

const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG').format(amount || 0);
};
</script>

<style scoped>
.charges-form {
    max-height: 70vh;
    overflow-y: auto;
}

.dialog-info { font-size: .75rem; line-height:1.2; padding:.5rem .75rem; border-radius:6px; margin-bottom:1rem; background: var(--surface-50); border-left:4px solid var(--primary-color); color: var(--text-color-secondary); }

.booking-info {
    background: var(--surface-50);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
}

.booking-info h6 {
    margin-bottom: 0.75rem;
    color: var(--text-color);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
}

.info-item {
    font-size: 0.875rem;
}

.charges-section {
    margin-bottom: 1.5rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.section-header h6 {
    margin: 0;
    color: var(--text-color);
}

.charges-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
}

.charge-item {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 1rem;
}

.charge-fields {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 120px;
    gap: 1rem;
    margin-bottom: 0.75rem;
    align-items: flex-start;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.field-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color);
}

.quantity-group {
    min-width: 110px;
}

.quantity-group :deep(.p-inputnumber),
.quantity-group :deep(input) {
    width: 100%;
}

.charge-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
}

.charge-total {
    text-align: right;
    padding-top: 0.5rem;
    border-top: 1px solid var(--surface-border);
    color: var(--primary-color);
}

.charges-summary {
    background: var(--surface-100);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 1rem;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.summary-row:last-child {
    margin-bottom: 0;
}

.summary-row.total {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--primary-color);
    padding-top: 0.5rem;
    border-top: 1px solid var(--surface-border);
}

.notes-section h6 {
    margin-bottom: 0.75rem;
    color: var(--text-color);
}

.payment-section { margin-bottom: 1.5rem; }
.payment-row { display:flex; align-items:center; gap:.75rem; }
.payment-row .label { font-weight:500; color: var(--text-color); }
.payment-row .status { font-size:.875rem; }
.payment-row .status.paid { color: var(--green-500); }
.payment-row .status.pending { color: var(--orange-500); }

@media (max-width: 960px) {
    .charge-fields {
        grid-template-columns: 2fr 1fr 1fr;
    }
    
    .quantity-group {
        grid-column: span 1;
    }
}

@media (max-width: 768px) {
    .charge-fields {
        grid-template-columns: 1fr;
    }
    
    .info-grid {
        grid-template-columns: 1fr;
    }
    
    .section-header {
        flex-direction: column;
        gap: 0.75rem;
        align-items: stretch;
    }
}
</style>
