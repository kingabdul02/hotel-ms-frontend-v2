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
// Form state (camelCase fields the template binds to)
const modifiedBooking = ref({});
// Original snapshot for change detection
const originalBooking = ref({});
// Dropdown options
const availableRoomTypes = ref([]);

// Allow editing guest info when not checked out
const canModifyGuest = computed(() => !originalBooking.value?.is_checked_out);

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

// Normalize incoming booking object from various shapes (table uses snake_case)
const initializeForm = () => {
    const b = props.booking || {};

    const toDate = (v) => (v ? new Date(v) : null);

    const normalized = {
        // identifiers and flags (kept for canModifyGuest and submission)
        id: b.id || b.booking_id,
        booking_id: b.booking_id || b.id,
        is_checked_in: b.is_checked_in || false,
        is_checked_out: b.is_checked_out || false,

        // guest fields
        guestName: b.guestName || b.guest_name || b.user?.name || '',
        guestEmail: b.guestEmail || b.guest_email || b.user?.email || '',
        guestPhone: b.guestPhone || b.guest_phone || b.user?.phone || '',

        // dates
        checkInDate: toDate(b.checkInDate || b.check_in_date),
        checkOutDate: toDate(b.checkOutDate || b.check_out_date),

        // room type and guests
        roomTypeId: b.roomTypeId || b.room_type_id || b.room?.room_type_id || b.room?.room_type?.id || null,
        numberOfGuests: b.numberOfGuests ?? Number(b.no_of_guests ?? b.room?.no_of_guests ?? 1),

        // pricing
        roomRate: b.roomRate ?? b.room_rate ?? b.room?.price ?? 0,

        // notes
        specialRequests: b.specialRequests || b.special_requests || ''
    };

    originalBooking.value = { ...normalized };
    modifiedBooking.value = { ...normalized };
};

const loadRoomTypes = async () => {
    try {
        // RoomTypeService.getRoomTypes returns an array (response.data.data)
        const list = await roomTypeService.getRoomTypes();
        availableRoomTypes.value = Array.isArray(list) ? list : (list?.data || []);
    } catch (error) {
        console.error('Error loading room types:', error);
        availableRoomTypes.value = [];
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
        // Build payload in snake_case expected by API
        const payload = {
            guest_name: modifiedBooking.value.guestName || undefined,
            guest_email: modifiedBooking.value.guestEmail || undefined,
            guest_phone: modifiedBooking.value.guestPhone || undefined,
            check_in_date: modifiedBooking.value.checkInDate ? new Date(modifiedBooking.value.checkInDate).toISOString().split('T')[0] : undefined,
            check_out_date: modifiedBooking.value.checkOutDate ? new Date(modifiedBooking.value.checkOutDate).toISOString().split('T')[0] : undefined,
            room_type_id: modifiedBooking.value.roomTypeId ?? undefined,
            no_of_guests: (modifiedBooking.value.numberOfGuests != null) ? String(modifiedBooking.value.numberOfGuests) : undefined,
            room_rate: modifiedBooking.value.roomRate ?? undefined,
            special_requests: modifiedBooking.value.specialRequests || undefined
        };

        const bookingId = originalBooking.value.id || originalBooking.value.booking_id;
        const response = await bookingService.updateBooking(bookingId, payload);

        if (response?.success) {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Booking updated successfully', life: 3000 });
            emit('booking-updated', response.data || null);
            close();
        } else {
            throw new Error(response?.message || 'Failed to update booking');
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: error?.message || 'Failed to update booking', life: 5000 });
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
