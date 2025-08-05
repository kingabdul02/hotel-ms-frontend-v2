<template>
  <div>
    <Dialog v-model:visible="showModal" :style="{ width: '90vw', maxWidth: '1200px' }" header="Edit Corporate Booking" :modal="true" class="booking-form-dialog" @hide="closeModal">
      <div class="form-container" v-if="localBooking">
        <!-- Company Details -->
        <section class="form-section">
          <h3>Company Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Company Name</label>
              <InputText v-model="localBooking.company.name" :disabled="true" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <InputText v-model="localBooking.company.email" :disabled="true" />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <InputText v-model="localBooking.company.phone" :disabled="true" />
            </div>
          </div>
        </section>

        <!-- Coordinator Details -->
        <section class="form-section">
          <h3>Coordinator Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Full Name</label>
              <InputText v-model="localBooking.coordinator.full_name" :disabled="true" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <InputText v-model="localBooking.coordinator.email" :disabled="true" />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <InputText v-model="localBooking.coordinator.phone" :disabled="true" />
            </div>
          </div>
        </section>

        <!-- Booking Details -->
        <section class="form-section">
          <h3>Booking Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Check-In Date</label>
              <Calendar v-model="localBooking.check_in_date" showIcon dateFormat="yy-mm-dd" />
            </div>
            <div class="form-group">
              <label>Check-Out Date</label>
              <Calendar v-model="localBooking.check_out_date" showIcon dateFormat="yy-mm-dd" />
            </div>
            <div class="form-group">
              <label>Expected Guests</label>
              <InputNumber v-model="localBooking.expected_guests" :min="minExpectedGuests" @update:modelValue="handleExpectedGuestsChange" />
            </div>
          </div>
        </section>

        <!-- Guest Details -->
        <section class="form-section">
          <h3>Guest Details</h3>
          <div v-for="(guest, index) in localBooking.guests" :key="guest.id" class="guest-section">
            <div class="guest-header">
              <h4>Guest {{ index + 1 }}</h4>
              <Button icon="pi pi-trash" class="p-button-danger p-button-text" @click="handleRemoveGuest(index)" :disabled="guest.is_checked_in || guest.is_checked_out" />
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Full Name</label>
                <InputText v-model="guest.full_name" :disabled="guest.is_checked_in || guest.is_checked_out" />
              </div>
              <div class="form-group">
                <label>Email</label>
                <InputText v-model="guest.email" :disabled="guest.is_checked_in || guest.is_checked_out" />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <InputText v-model="guest.phone" :disabled="guest.is_checked_in || guest.is_checked_out" />
              </div>
              <div class="form-group">
                <label>Gender</label>
                <Dropdown v-model="guest.gender" :options="guestGenderOptions" optionLabel="label" optionValue="value" :disabled="guest.is_checked_in || guest.is_checked_out" />
              </div>
              <div class="form-group">
                <label>Room</label>
                <Dropdown v-model="guest.room_id" :options="availableRooms" optionLabel="name" optionValue="id" placeholder="Select a Room" :disabled="guest.is_checked_in || guest.is_checked_out" />
              </div>
            </div>
          </div>
          <Button label="Add Guest" icon="pi pi-plus" class="p-button-outlined p-button-success" :disabled="!canAddGuest" @click="handleAddGuest" />
        </section>

        <!-- Hall Details -->
        <section class="form-section">
          <h3>Hall Details</h3>
          <div v-for="(hall, index) in localBooking.halls" :key="hall.id || `hall-${index}`" class="guest-section">
            <div class="guest-header">
              <h4>Hall {{ index + 1 }}</h4>
              <Button icon="pi pi-trash" class="p-button-danger p-button-text" @click="handleRemoveHall(index)" />
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Hall</label>
                <Dropdown v-model="hall.hall_id" :options="availableHalls" optionLabel="name" optionValue="id" placeholder="Select a Hall" @change="updateHallAmount(index)" />
              </div>
              <div class="form-group">
                <label>Start Date</label>
                <Calendar v-model="hall.start_date" showIcon dateFormat="yy-mm-dd" @date-select="updateHallAmount(index)" />
              </div>
              <div class="form-group">
                <label>End Date</label>
                <Calendar v-model="hall.end_date" showIcon dateFormat="yy-mm-dd" @date-select="updateHallAmount(index)" />
              </div>
              <div class="form-group">
                <label>Amount</label>
                <InputNumber v-model="hall.amount" mode="currency" currency="NGN" locale="en-NG" :disabled="true" />
              </div>
            </div>
          </div>
          <Button label="Add Hall" icon="pi pi-plus" class="p-button-outlined p-button-success" @click="handleAddHall" />
        </section>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text @click="closeModal" />
        <Button label="Update Booking" icon="pi pi-save" class="p-button-success" @click="handleSubmit" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, watchEffect } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import { useCorporateBooking } from '@/composables/useCorporateBooking';

const props = defineProps({
  booking: {
    type: Object,
    default: null,
  },
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:visible', 'booking-updated']);

const { updateCorporateBooking, availableRooms, fetchAvailableRooms, availableHalls, fetchAvailableHalls } = useCorporateBooking();
const toast = useToast();
const confirm = useConfirm();

const localBooking = ref(null);

const showModal = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const formatDateForInput = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

watch(
  () => props.booking,
  (newBooking) => {
    if (newBooking) {
      const bookingCopy = JSON.parse(JSON.stringify(newBooking));
      
      bookingCopy.check_in_date = formatDateForInput(bookingCopy.check_in_date);
      bookingCopy.check_out_date = formatDateForInput(bookingCopy.check_out_date);

      if (bookingCopy.halls) {
        bookingCopy.halls.forEach(hall => {
          hall.start_date = formatDateForInput(hall.start_date);
          hall.end_date = formatDateForInput(hall.end_date);
        });
      }
      
      localBooking.value = bookingCopy;

      if (localBooking.value.check_in_date && localBooking.value.check_out_date) {
        fetchAvailableRooms(localBooking.value.check_in_date, localBooking.value.check_out_date, localBooking.value.id);
      }
      fetchAvailableHalls();
    } else {
      localBooking.value = null;
    }
  },
  { immediate: true, deep: true }
);

const guestGenderOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
];

const minExpectedGuests = computed(() => {
    if (!localBooking.value) return 0;
    return localBooking.value.guests.filter(guest => guest.is_checked_in || guest.is_checked_out).length;
});

const canAddGuest = computed(() => {
    if (!localBooking.value) return false;
    return localBooking.value.guests.length < localBooking.value.expected_guests;
});

const handleAddGuest = () => {
  if (!canAddGuest.value) {
    toast.add({ severity: 'warn', summary: 'Limit Reached', detail: 'Cannot add more guests than expected.', life: 3000 });
    return;
  }
  localBooking.value.guests.push({
    id: `new-guest-${Date.now()}`,
    full_name: '',
    email: '',
    phone: '',
    room_id: null,
    gender: 'Male',
    is_checked_in: false,
    is_checked_out: false,
  });
};

const handleAddHall = () => {
  if (!localBooking.value.halls) {
    localBooking.value.halls = [];
  }
  localBooking.value.halls.push({
    id: `new-hall-${Date.now()}`,
    hall_id: null,
    start_date: '',
    end_date: '',
    amount: 0,
  });
};

const handleRemoveHall = (index) => {
  localBooking.value.halls.splice(index, 1);
  toast.add({ severity: 'success', summary: 'Hall Removed', detail: 'Hall has been removed.', life: 3000 });
};

const updateHallAmount = (index) => {
  const hall = localBooking.value.halls[index];
  if (hall.hall_id && hall.start_date && hall.end_date) {
    const hallInfo = availableHalls.value.find(h => h.id === hall.hall_id);
    if (hallInfo) {
      const startDate = new Date(hall.start_date);
      const endDate = new Date(hall.end_date);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      hall.amount = days * hallInfo.price;
    }
  }
};

const handleRemoveGuest = (index) => {
  const guest = localBooking.value.guests[index];
  if (guest.is_checked_in || guest.is_checked_out) {
    toast.add({ severity: 'warn', summary: 'Cannot Remove', detail: 'Checked-in or checked-out guests cannot be removed.', life: 3000 });
    return;
  }
  confirm.require({
    message: `Are you sure you want to remove ${guest.full_name || 'this guest'}?`,
    header: 'Confirm Guest Removal',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      localBooking.value.guests.splice(index, 1);
      toast.add({ severity: 'success', summary: 'Guest Removed', detail: 'Guest has been removed.', life: 3000 });
    },
  });
};

const handleExpectedGuestsChange = () => {
  const currentGuestCount = localBooking.value.guests.length;
  if (localBooking.value.expected_guests < minExpectedGuests.value) {
    toast.add({
      severity: 'warn',
      summary: 'Invalid Input',
      detail: `Cannot set expected guests below ${minExpectedGuests.value} (number of checked-in or checked-out guests).`,
      life: 3000,
    });
    localBooking.value.expected_guests = minExpectedGuests.value;
  } else if (localBooking.value.expected_guests < currentGuestCount) {
    const removableGuests = localBooking.value.guests.slice(localBooking.value.expected_guests);
    const nonRemovableCount = removableGuests.filter(g => g.is_checked_in || g.is_checked_out).length;
    if (nonRemovableCount > 0) {
        toast.add({
            severity: 'warn',
            summary: 'Invalid Input',
            detail: `Cannot set expected guests below the number of checked-in/out guests.`,
            life: 3000,
        });
        localBooking.value.expected_guests = currentGuestCount;
        return;
    }

    confirm.require({
      message: `Reducing the number of guests will remove ${currentGuestCount - localBooking.value.expected_guests} guest(s). Confirm?`,
      header: 'Confirm Guest Removal',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        localBooking.value.guests = localBooking.value.guests.slice(0, localBooking.value.expected_guests);
        toast.add({ severity: 'success', summary: 'Guests Removed', detail: 'Excess guests have been removed.', life: 3000 });
      },
      reject: () => {
        localBooking.value.expected_guests = currentGuestCount;
      },
    });
  }
};

const handleSubmit = async () => {
  try {
    await updateCorporateBooking(localBooking.value.id, localBooking.value);
    emit('booking-updated');
    closeModal();
  } catch (error) {
    // Error is handled in the composable
  }
};

const closeModal = () => {
  emit('update:visible', false);
};

watchEffect(() => {
  if (localBooking.value && localBooking.value.check_in_date && localBooking.value.check_out_date) {
    const checkIn = new Date(localBooking.value.check_in_date);
    const checkOut = new Date(localBooking.value.check_out_date);
    if (checkIn >= checkOut) {
        toast.add({ severity: 'warn', summary: 'Invalid Dates', detail: 'Check-out date must be after check-in date.', life: 3000 });
    } else {
        fetchAvailableRooms(localBooking.value.check_in_date, localBooking.value.check_out_date, localBooking.value.id);
    }
  }
});
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
}

.form-section {
  padding: 1.5rem;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.form-section h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.guest-section {
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  background: #ffffff;
}

.guest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.guest-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}
</style>
