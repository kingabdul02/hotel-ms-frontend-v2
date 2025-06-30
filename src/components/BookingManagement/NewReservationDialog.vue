<script setup lang="ts">
import { ref, computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Rating from 'primevue/rating';
import { useBooking } from '@/composables/useBooking';
import { formatDateTime } from '@/utils/dateTimeFormatter';
import { formatCurrency } from '@/utils/currencyFormatter';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'reservationCreated'): void;
}>();

const { searchRooms, availableRooms, isSearchingRooms, createReservation, isCreatingReservation } = useBooking();

const reservationForm = ref({
  check_in_date: null,
  check_out_date: null,
  no_of_guests: 1,
  room_id: null,
  special_requests: '',
  guest_name: ''
});

const guestOptions = ref([
  { label: '1 Guest', value: 1 },
  { label: '2 Guests', value: 2 },
  { label: '3 Guests', value: 3 },
  { label: '4 Guests', value: 4 },
  { label: '5+ Guests', value: 5 }
]);

const currentStep = ref(1);
const totalSteps = 3;

const closeDialog = () => {
  emit('update:visible', false);
  currentStep.value = 1;
  resetReservationForm();
};

const resetReservationForm = () => {
  reservationForm.value = {
    check_in_date: null,
    check_out_date: null,
    no_of_guests: 1,
    room_id: null,
    special_requests: '',
    guest_name: ''
  };
  availableRooms.value = [];
};

const nextStep = async () => {
  if (currentStep.value === 1) {
    if (!reservationForm.value.check_in_date || !reservationForm.value.check_out_date) return;
    if (reservationForm.value.check_in_date >= reservationForm.value.check_out_date) return;
    await searchAvailableRooms();
  }
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const searchAvailableRooms = async () => {
  const checkInDate = formatDateForAPI(reservationForm.value.check_in_date);
  const checkOutDate = formatDateForAPI(reservationForm.value.check_out_date);
  await searchRooms({
    check_in_date: checkInDate,
    check_out_date: checkOutDate,
    guests: reservationForm.value.no_of_guests
  });
};

const formatDateForAPI = (date: Date | null) => {
  if (!date) return '';
  return date.toLocaleDateString('en-CA');
};

const selectRoom = (room: any) => {
  reservationForm.value.room_id = room.id;
  nextStep();
};

const createNewReservation = async () => {
  const payload = {
    room_id: reservationForm.value.room_id,
    check_in_date: formatDateForAPI(reservationForm.value.check_in_date),
    check_out_date: formatDateForAPI(reservationForm.value.check_out_date),
    no_of_guests: reservationForm.value.no_of_guests.toString(),
    special_requests: reservationForm.value.special_requests || 'None',
    guest_name: reservationForm.value.guest_name,
    is_online_booking: false
  };

  const success = await createReservation(payload);
  if (success) {
    closeDialog();
    emit('reservationCreated');
  }
};

const getRoomById = (roomId: number | null) => {
  return availableRooms.value.find(room => room.id === roomId);
};

const getStepTitle = (step: number) => {
  switch (step) {
    case 1: return 'Select Dates & Guests';
    case 2: return 'Choose Room';
    case 3: return 'Confirm Reservation';
    default: return '';
  }
};

const isStepValid = computed(() => {
  switch (currentStep.value) {
    case 1:
      return reservationForm.value.check_in_date &&
        reservationForm.value.check_out_date &&
        reservationForm.value.check_in_date < reservationForm.value.check_out_date;
    case 2:
      return reservationForm.value.room_id !== null;
    case 3:
      return true;
    default:
      return false;
  }
});
</script>

<template>
  <Dialog
    :visible="visible"
    :header="`Create New Reservation - ${getStepTitle(currentStep)}`"
    :modal="true"
    :closable="false"
    :style="{ width: '70rem' }"
    class="reservation-dialog"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="step-progress mb-4">
      <div class="flex align-items-center justify-content-between">
        <div
          v-for="step in totalSteps"
          :key="step"
          class="step-item flex align-items-center"
          :class="{ 'active': currentStep >= step, 'completed': currentStep > step }"
        >
          <div class="step-circle">
            <i v-if="currentStep > step" class="pi pi-check"></i>
            <span v-else>{{ step }}</span>
          </div>
          <span v-if="step < totalSteps" class="step-line"></span>
        </div>
      </div>
    </div>

    <!-- Step 1 -->
    <div v-if="currentStep === 1" class="step-content">
      <div class="grid">
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium mb-2">Check-in Date</label>
          <Calendar v-model="reservationForm.check_in_date" :minDate="new Date()" dateFormat="yy-mm-dd" placeholder="Select check-in date" class="w-full" showIcon />
        </div>
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium mb-2">Check-out Date</label>
          <Calendar v-model="reservationForm.check_out_date" :minDate="reservationForm.check_in_date || new Date()" dateFormat="yy-mm-dd" placeholder="Select check-out date" class="w-full" showIcon />
        </div>
        <div class="col-12">
          <label class="block text-sm font-medium mb-2">Number of Guests</label>
          <Dropdown v-model="reservationForm.no_of_guests" :options="guestOptions" optionLabel="label" optionValue="value" placeholder="Select number of guests" class="w-full" />
        </div>
      </div>
    </div>

    <!-- Step 2 -->
    <div v-if="currentStep === 2" class="step-content">
      <div v-if="isSearchingRooms" class="flex justify-content-center py-4">
        <ProgressSpinner style="width: 50px; height: 50px" />
        <span class="ml-2">Searching for available rooms...</span>
      </div>
      <div v-else-if="availableRooms.length === 0" class="text-center py-4">
        <i class="pi pi-exclamation-triangle text-6xl text-orange-500 mb-3"></i>
        <h4>No Available Rooms</h4>
        <p class="text-600">No rooms are available for the selected dates and guest count.</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="room in availableRooms" :key="room.id" class="room-card-container">
          <Card 
            class="room-card h-full transition-all duration-300 cursor-pointer"
            :class="{ 
              'selected border-2 border-primary': reservationForm.room_id === room.id,
              'featured-room': room.is_feature 
            }"
            @click="selectRoom(room)"
          >
            <template #header>
              <div class="relative card-header-section">
                <div v-if="room.is_feature" class="featured-badge">
                  <i class="pi pi-star-fill mr-1"></i>
                  Featured
                </div>
                <div class="availability-badge" :class="room.is_available ? 'available' : 'unavailable'">
                  {{ room.is_available ? 'Available' : 'Unavailable' }}
                </div>
              </div>
            </template>
            <template #title>
              <div class="flex flex-col items-start">
                <span class="font-semibold text-xl">{{ room.name }}</span>
                <Rating v-model="room.rating" :stars="5" :cancel="false" class="mt-1" disabled />
              </div>
              <Tag 
                :value="room.roomType.name" 
                :style="{ backgroundColor: room.roomType.chart_color_code }" 
                class="text-white mt-2"
              />
            </template>
            <template #content>
              <div class="room-details">
                <p class="text-sm text-gray-600 mb-3">{{ room.description || 'A cozy chalet with modern amenities.' }}</p>
                <div class="grid room-features gap-2 mb-4">
                  <div class="flex items-center text-sm">
                    <i class="pi pi-users text-primary mr-2"></i>
                    <span>{{ room.no_of_guests }} guests</span>
                  </div>
                  <div class="flex items-center text-sm">
                    <i class="pi pi-home text-primary mr-2"></i>
                    <span>{{ room.no_of_bedrooms }} bedroom{{ room.no_of_bedrooms > 1 ? 's' : '' }}</span>
                  </div>
                  <div class="flex items-center text-sm">
                    <i class="pi pi-moon text-primary mr-2"></i>
                    <span>{{ room.no_of_beds }} bed{{ room.no_of_beds > 1 ? 's' : '' }}</span>
                  </div>
                  <div class="flex items-center text-sm">
                    <i class="pi pi-refresh text-primary mr-2"></i>
                    <span>{{ room.no_of_baths }} bath{{ room.no_of_baths > 1 ? 's' : '' }}</span>
                  </div>
                  <div v-if="room.has_sitting_room" class="flex items-center text-sm">
                    <i class="pi pi-check-circle text-green-500 mr-2"></i>
                    <span class="text-green-700">Includes sitting room</span>
                  </div>
                </div>
                <div class="price-section border-t pt-3">
                  <div class="flex justify-between items-center">
                    <div>
                      <span class="font-bold text-2xl text-primary">
                        {{ formatCurrency(room.price) }}
                      </span>
                      <span class="text-sm text-600 ml-1">/night</span>
                    </div>
                    <Button 
                      :label="reservationForm.room_id === room.id ? 'Selected' : 'Select Room'" 
                      :icon="reservationForm.room_id === room.id ? 'pi pi-check' : 'pi pi-arrow-right'"
                      :class="reservationForm.room_id === room.id ? 'p-button-success' : 'p-button-outlined'"
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Step 3 -->
    <div v-if="currentStep === 3" class="step-content">
      <div class="reservation-summary">
        <h4 class="mb-3">Reservation Summary</h4>
        <div class="summary-grid">
          <div class="summary-item">
            <label>Room:</label>
            <span class="font-semibold">{{ getRoomById(reservationForm.room_id)?.name }}</span>
          </div>
          <div class="summary-item">
            <label>Check-in:</label>
            <span>{{ formatDateForAPI(reservationForm.check_in_date) }}</span>
          </div>
          <div class="summary-item">
            <label>Check-out:</label>
            <span>{{ formatDateForAPI(reservationForm.check_out_date) }}</span>
          </div>
          <div class="summary-item">
            <label>Guests:</label>
            <span>{{ reservationForm.no_of_guests }}</span>
          </div>
        </div>
        <Divider />
        <div class="field">
          <label class="block text-sm font-medium mb-2">Special Requests (Optional)</label>
          <Textarea v-model="reservationForm.special_requests" rows="3" placeholder="Any special requests or notes..." class="w-full" />
        </div>
        <!-- guest name -->
        <div class="field">
          <label class="block text-sm font-medium mb-2">Guest Name</label>
          <InputText v-model="reservationForm.guest_name" placeholder="Enter guest name" class="w-full" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-content-between">
        <div>
          <Button v-if="currentStep > 1" label="Previous" icon="pi pi-arrow-left" class="p-button-text" @click="prevStep" />
        </div>
        <div class="flex gap-2">
          <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="closeDialog" />
          <Button v-if="currentStep < totalSteps" label="Next" icon="pi pi-arrow-right" iconPos="right" :disabled="!isStepValid || isSearchingRooms" @click="nextStep" />
          <Button v-if="currentStep === totalSteps" label="Create Reservation" icon="pi pi-check" class="p-button-success" :loading="isCreatingReservation" @click="createNewReservation" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.reservation-dialog .step-progress {
  padding: 0 1rem;
}

.step-item {
  flex: 1;
  position: relative;
}

.step-circle {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--surface-200);
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 2px solid var(--surface-300);
  transition: all 0.3s;
}

.step-item.active .step-circle {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.step-item.completed .step-circle {
  background: var(--green-500);
  border-color: var(--green-500);
}

.step-line {
  position: absolute;
  top: 50%;
  left: 2rem;
  right: -2rem;
  height: 2px;
  background: var(--surface-300);
  z-index: -1;
}

.step-item.active .step-line {
  background: var(--primary-color);
}

.room-card {
  transition: all 0.3s;
  border: 2px solid transparent;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.room-card.selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

.room-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.room-placeholder {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-100);
}

.summary-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--surface-200);
}

.summary-item label {
  color: var(--text-color-secondary);
  font-weight: 500;
}
.card-header-section {
  padding: 1rem;
  min-height: 3rem;
}

.room-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.room-card:hover {
  transform: translateY(-2px);
}

.room-card.selected {
  box-shadow: 0 4px 16px rgba(var(--primary-color-rgb), 0.3);
}

.room-card.featured-room {
  position: relative;
}

.room-card.featured-room::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ffd700, #ffed4e);
  z-index: 1;
}

.room-image-container {
  position: relative;
  overflow: hidden;
}

.room-image {
  transition: transform 0.3s ease;
}

.room-card:hover .room-image {
  transform: scale(1.05);
}

.featured-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.availability-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.availability-badge.available {
  background: rgba(34, 197, 94, 0.9);
  color: white;
}

.availability-badge.unavailable {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.room-features {
  gap: 0.5rem;
}

.price-section {
  margin-top: auto;
}

.room-placeholder {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .room-features .col-6 {
    flex: 0 0 100%;
    max-width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style>