<template>
    <Dialog 
        :visible="visible" 
        @update:visible="$emit('update:visible', $event)"
        modal 
        :style="{ width: '90vw', maxWidth: '800px' }"
        header="Modify Booking"
    >
        <div class="booking-modification-form">
            <form @submit.prevent="saveChanges">
                <!-- Guest Information -->
                <div class="form-section">
                    <h6>Guest Information</h6>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="guestName">Guest Name</label>
                            <InputText 
                                id="guestName"
                                v-model="modifiedBooking.guestName" 
                                :disabled="!canModifyGuest"
                            />
                        </div>
                        <div class="form-field">
                            <label for="guestEmail">Email</label>
                            <InputText 
                                id="guestEmail"
                                v-model="modifiedBooking.guestEmail" 
                                type="email"
                                :disabled="!canModifyGuest"
                            />
                        </div>
                        <div class="form-field">
                            <label for="guestPhone">Phone</label>
                            <InputText 
                                id="guestPhone"
                                v-model="modifiedBooking.guestPhone" 
                                :disabled="!canModifyGuest"
                            />
                        </div>
                    </div>
                </div>

                <!-- Booking Details -->
                <div class="form-section">
                    <h6>Booking Details</h6>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="checkInDate">Check-in Date</label>
                            <Calendar 
                                id="checkInDate"
                                v-model="modifiedBooking.checkInDate" 
                                show-icon
                                :min-date="minCheckInDate"
                                @date-select="calculateStayDuration"
                            />
                        </div>
                        <div class="form-field">
                            <label for="checkOutDate">Check-out Date</label>
                            <Calendar 
                                id="checkOutDate"
                                v-model="modifiedBooking.checkOutDate" 
                                show-icon
                                :min-date="minCheckOutDate"
                                @date-select="calculateStayDuration"
                            />
                        </div>
                        <div class="form-field">
                            <label for="roomType">Room Type</label>
                            <Dropdown 
                                id="roomType"
                                v-model="modifiedBooking.roomTypeId" 
                                :options="availableRoomTypes"
                                option-label="name"
                                option-value="id"
                                placeholder="Select Room Type"
                                @change="updateRoomRate"
                            />
                        </div>
                        <div class="form-field">
                            <label for="numberOfGuests">Number of Guests</label>
                            <InputNumber 
                                id="numberOfGuests"
                                v-model="modifiedBooking.numberOfGuests" 
                                :min="1"
                                :max="maxGuests"
                            />
                        </div>
                    </div>
                </div>

                <!-- Rate Information -->
                <div class="form-section">
                    <h6>Rate Information</h6>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="roomRate">Room Rate (per night)</label>
                            <InputNumber 
                                id="roomRate"
                                v-model="modifiedBooking.roomRate" 
                                mode="currency"
                                currency="NGN"
                                locale="en-NG"
                            />
                        </div>
                        <div class="form-field">
                            <label>Duration</label>
                            <div class="duration-display">
                                {{ stayDuration }} night(s)
                            </div>
                        </div>
                        <div class="form-field">
                            <label>Total Amount</label>
                            <div class="total-amount">
                                ₦{{ formatCurrency(totalAmount) }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Special Requests -->
                <div class="form-section">
                    <h6>Special Requests</h6>
                    <Textarea 
                        v-model="modifiedBooking.specialRequests" 
                        rows="3"
                        placeholder="Enter any special requests or notes"
                    />
                </div>

                <!-- Modification Summary -->
                <div class="form-section" v-if="hasChanges">
                    <h6>Modification Summary</h6>
                    <div class="changes-summary">
                        <div v-for="change in changesSummary" :key="change.field" class="change-item">
                            <strong>{{ change.label }}:</strong>
                            <span class="old-value">{{ change.oldValue }}</span>
                            <i class="pi pi-arrow-right"></i>
                            <span class="new-value">{{ change.newValue }}</span>
                        </div>
                    </div>
                </div>
            </form>
        </div>

        <template #footer>
            <Button 
                label="Cancel" 
                icon="pi pi-times" 
                @click="close" 
                class="p-button-text"
            />
            <Button 
                label="Save Changes" 
                icon="pi pi-check" 
                @click="saveChanges"
                :loading="saving"
                :disabled="!hasChanges"
            />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { BookingV2Service } from '@/service/BookingV2Service';
import { RoomTypeService } from '@/service/RoomTypeService';
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

const emit = defineEmits(['update:visible', 'booking-updated']);

const bookingService = new BookingV2Service();
const roomTypeService = new RoomTypeService();
const toast = useToast();

const saving = ref(false);
const modifiedBooking = ref({});
const originalBooking = ref({});
const availableRoomTypes = ref([]);

const canModifyGuest = computed(() => {
    // Allow guest modification only for certain booking statuses
    return ['confirmed', 'pending'].includes(originalBooking.value.status);
});

const minCheckInDate = computed(() => {
    return new Date(); // Can't check in before today
});

const minCheckOutDate = computed(() => {
    if (!modifiedBooking.value.checkInDate) return new Date();
    const checkIn = new Date(modifiedBooking.value.checkInDate);
    checkIn.setDate(checkIn.getDate() + 1); // Minimum 1 night stay
    return checkIn;
});

const maxGuests = computed(() => {
    const selectedRoomType = availableRoomTypes.value.find(
        rt => rt.id === modifiedBooking.value.roomTypeId
    );
    return selectedRoomType?.maxOccupancy || 4;
});

const stayDuration = computed(() => {
    if (!modifiedBooking.value.checkInDate || !modifiedBooking.value.checkOutDate) return 0;
    
    const checkIn = new Date(modifiedBooking.value.checkInDate);
    const checkOut = new Date(modifiedBooking.value.checkOutDate);
    const diffTime = checkOut - checkIn;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const totalAmount = computed(() => {
    return (modifiedBooking.value.roomRate || 0) * stayDuration.value;
});

const hasChanges = computed(() => {
    if (!originalBooking.value || !modifiedBooking.value) return false;
    
    const fieldsToCheck = [
        'guestName', 'guestEmail', 'guestPhone',
        'checkInDate', 'checkOutDate', 'roomTypeId',
        'numberOfGuests', 'roomRate', 'specialRequests'
    ];
    
    return fieldsToCheck.some(field => {
        const original = originalBooking.value[field];
        const modified = modifiedBooking.value[field];
        
        if (field.includes('Date') && original && modified) {
            return new Date(original).getTime() !== new Date(modified).getTime();
        }
        
        return original !== modified;
    });
});

const changesSummary = computed(() => {
    if (!hasChanges.value) return [];
    
    const changes = [];
    const fieldLabels = {
        guestName: 'Guest Name',
        guestEmail: 'Email',
        guestPhone: 'Phone',
        checkInDate: 'Check-in Date',
        checkOutDate: 'Check-out Date',
        roomTypeId: 'Room Type',
        numberOfGuests: 'Number of Guests',
        roomRate: 'Room Rate',
        specialRequests: 'Special Requests'
    };
    
    Object.keys(fieldLabels).forEach(field => {
        const original = originalBooking.value[field];
        const modified = modifiedBooking.value[field];
        
        if (original !== modified) {
            let oldValue = original;
            let newValue = modified;
            
            if (field.includes('Date')) {
                oldValue = original ? new Date(original).toLocaleDateString() : 'Not set';
                newValue = modified ? new Date(modified).toLocaleDateString() : 'Not set';
            } else if (field === 'roomTypeId') {
                const oldRoomType = availableRoomTypes.value.find(rt => rt.id === original);
                const newRoomType = availableRoomTypes.value.find(rt => rt.id === modified);
                oldValue = oldRoomType?.name || 'Unknown';
                newValue = newRoomType?.name || 'Unknown';
            } else if (field === 'roomRate') {
                oldValue = `₦${formatCurrency(original || 0)}`;
                newValue = `₦${formatCurrency(modified || 0)}`;
            }
            
            changes.push({
                field,
                label: fieldLabels[field],
                oldValue,
                newValue
            });
        }
    });
    
    return changes;
});

watch(() => props.visible, (newVal) => {
    if (newVal && props.booking) {
        initializeForm();
        loadRoomTypes();
    }
});

onMounted(() => {
    if (props.visible && props.booking) {
        initializeForm();
        loadRoomTypes();
    }
});

const initializeForm = () => {
    originalBooking.value = { ...props.booking };
    modifiedBooking.value = {
        ...props.booking,
        checkInDate: props.booking.checkInDate ? new Date(props.booking.checkInDate) : null,
        checkOutDate: props.booking.checkOutDate ? new Date(props.booking.checkOutDate) : null
    };
};

const loadRoomTypes = async () => {
    try {
        const response = await roomTypeService.getRoomTypes();
        if (response.success) {
            availableRoomTypes.value = response.data;
        }
    } catch (error) {
        console.error('Error loading room types:', error);
    }
};

const calculateStayDuration = () => {
    // Trigger reactivity for computed properties
    modifiedBooking.value = { ...modifiedBooking.value };
};

const updateRoomRate = () => {
    const selectedRoomType = availableRoomTypes.value.find(
        rt => rt.id === modifiedBooking.value.roomTypeId
    );
    if (selectedRoomType) {
        modifiedBooking.value.roomRate = selectedRoomType.baseRate;
    }
};

const saveChanges = async () => {
    if (!hasChanges.value) {
        close();
        return;
    }
    
    saving.value = true;
    try {
        const bookingData = {
            ...modifiedBooking.value,
            checkInDate: modifiedBooking.value.checkInDate?.toISOString().split('T')[0],
            checkOutDate: modifiedBooking.value.checkOutDate?.toISOString().split('T')[0]
        };
        
        const response = await bookingService.updateBooking(props.booking.id, bookingData);
        
        if (response.success) {
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Booking updated successfully',
                life: 3000
            });
            
            emit('booking-updated', response.data);
            close();
        } else {
            throw new Error(response.message || 'Failed to update booking');
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to update booking',
            life: 5000
        });
    } finally {
        saving.value = false;
    }
};

const close = () => {
    emit('update:visible', false);
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG').format(amount);
};
</script>

<style scoped>
.booking-modification-form {
    max-height: 70vh;
    overflow-y: auto;
}

.form-section {
    margin-bottom: 2rem;
}

.form-section h6 {
    color: var(--text-color);
    font-weight: 600;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--surface-border);
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-field label {
    font-weight: 500;
    color: var(--text-color);
}

.duration-display,
.total-amount {
    padding: 0.75rem;
    background: var(--surface-50);
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    font-weight: 600;
}

.total-amount {
    color: var(--primary-color);
    font-size: 1.1rem;
}

.changes-summary {
    background: var(--surface-50);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 1rem;
}

.change-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
}

.change-item:last-child {
    margin-bottom: 0;
}

.old-value {
    color: var(--red-500);
    text-decoration: line-through;
}

.new-value {
    color: var(--green-500);
    font-weight: 500;
}

@media (max-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .change-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
    }
}
</style>
