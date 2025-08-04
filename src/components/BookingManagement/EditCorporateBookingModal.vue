<template>
  <div>
    <Dialog
      v-model:visible="showModal"
    >
      <div class="form-container">
        <!-- Company Selection -->
        <section class="form-section">
          <h3>Company Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Company Name</label>
              <InputText
                v-model="booking.company.name"
                placeholder="Company name"
                :disabled="true"
              />
            </div>
            <div class="form-group">
              <label>Email</label>
              <InputText
                v-model="booking.company.email"
                placeholder="Company email"
                :disabled="true"
              />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <InputText
                v-model="booking.company.phone"
                placeholder="Company phone"
                :disabled="true"
              />
            </div>
          </div>
        </section>

        <!-- Coordinator Details -->
        <section class="form-section">
          <h3>Coordinator Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Full Name</label>
              <InputText
                v-model="booking.coordinator.full_name"
                placeholder="Full name"
                :disabled="true"
              />
            </div>
            <div class="form-group">
              <label>Email</label>
              <InputText
                v-model="booking.coordinator.email"
                placeholder="Email"
                :disabled="true"
              />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <InputText
                v-model="booking.coordinator.phone"
                placeholder="Phone"
                :disabled="true"
              />
            </div>
            <div class="form-group">
              <label>NIN</label>
              <InputText
                v-model="booking.coordinator.nin"
                placeholder="NIN"
                :disabled="true"
              />
            </div>
          </div>
        </section>

        <!-- Booking Details -->
        <section class="form-section">
          <h3>Booking Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Check-in Date</label>
              <Calendar
                v-model="booking.check_in_date"
                showIcon
                dateFormat="yy-mm-dd"
                :disabled="true"
              />
            </div>
            <div class="form-group">
              <label>Check-out Date</label>
              <Calendar
                v-model="booking.check_out_date"
                showIcon
                dateFormat="yy-mm-dd"
                :disabled="true"
              />
            </div>
            <div class="form-group">
              <label>Expected Guests</label>
              <InputText
                v-model.number="booking.expected_guests"
                type="number"
                placeholder="Number of guests"
                :min="minExpectedGuests"
                @input="handleExpectedGuestsChange"
              />
            </div>
          </div>
        </section>

        <!-- Guest Details -->
        <section class="form-section">
          <h3>Guest Details</h3>
          <div v-for="(guest, index) in booking.guests" :key="guest.id" class="guest-section">
            <div class="guest-header">
              <h4>Guest {{ index + 1 }}</h4>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                :disabled="guest.is_checked_in || guest.is_checked_out"
                @click="handleRemoveGuest(index)"
              />
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Full Name</label>
                <InputText
                  v-model="guest.full_name"
                  :disabled="guest.is_checked_in || guest.is_checked_out"
                  placeholder="Full name"
                />
              </div>
              <div class="form-group">
                <label>Email</label>
                <InputText
                  v-model="guest.email"
                  :disabled="guest.is_checked_in || guest.is_checked_out"
                  placeholder="Email"
                />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <InputText
                  v-model="guest.phone"
                  :disabled="guest.is_checked_in || guest.is_checked_out"
                  placeholder="Phone"
                />
              </div>
              <div class="form-group">
                <label>Gender</label>
                <Dropdown
                  v-model="guest.gender"
                  :options="guestGenderOptions"
                  option-label="label"
                  option-value="value"
                  :disabled="guest.is_checked_in || guest.is_checked_out"
                  placeholder="Select gender"
                />
              </div>
              <div class="form-group">
                <label>Room</label>
                <Dropdown
                  v-model="guest.room_id"
                  :options="availableRooms"
                  option-label="name"
                  option-value="id"
                  :disabled="guest.is_checked_in || guest.is_checked_out"
                  placeholder="Select room"
                />
              </div>
            </div>
          </div>
          <Button
            label="Add Guest"
            icon="pi pi-plus"
            class="p-button-outlined p-button-success"
            :disabled="!canAddGuest"
            @click="handleAddGuest"
          />
        </section>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="emit('update:visible', false)"
          aria-label="Cancel booking"
        />
        <Button
          label="Update Booking"
          icon="pi pi-save"
          class="p-button-success"
          @click="handleSubmit"
          aria-label="Save booking"
        />
      </template>
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import { useCorporateBooking } from '@/composables/useCorporateBooking';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { ref, computed, watchEffect } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';


const { updateCorporateBooking, availableRooms, fetchAvailableRooms, addGuest, removeGuest } = useCorporateBooking();

const props = defineProps<{
  booking: any,
  visible: boolean
}>();

const emit = defineEmits(['update:visible']);



const showModal = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});



const guestGenderOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
];

const minExpectedGuests = computed(() => {
  return props.booking.guests.filter(guest => guest.is_checked_in || guest.is_checked_out).length;
});

const canAddGuest = computed(() => corporateBookingForm.guests.length < corporateBookingForm.expected_guests);

const minExpectedGuests = computed(() => {
  return corporateBookingForm.guests.filter(guest => guest.is_checked_in || guest.is_checked_out).length;
});

const handleAddGuest = () => {
  if (!canAddGuest.value) {
    toast.add({ severity: 'warn', summary: 'Limit Reached', detail: 'Cannot add more guests than expected.', life: 3000 });
    return;
  }
  addGuest();
};

const handleRemoveGuest = (index: number) => {
  const guest = props.booking.guests[index];
  if (guest.is_checked_in || guest.is_checked_out) {
    toast.add({ severity: 'warn', summary: 'Cannot Remove', detail: 'Checked-in or checked-out guests cannot be removed.', life: 3000 });
    return;
  }
  confirm.require({
    message: `Are you sure you want to remove ${guest.full_name || 'this guest'}?`,
    header: 'Confirm Guest Removal',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      removeGuest(index);
      toast.add({ severity: 'success', summary: 'Guest Removed', detail: 'Guest has been removed.', life: 3000 });
    },
  });
};

const handleExpectedGuestsChange = () => {
  const currentGuestCount = props.booking.guests.length;
  if (props.booking.expected_guests < minExpectedGuests.value) {
    toast.add({
      severity: 'warn',
      summary: 'Invalid Input',
      detail: `Cannot set expected guests below ${minExpectedGuests.value} (number of checked-in or checked-out guests).`,
      life: 3000,
    });
    props.booking.expected_guests = minExpectedGuests.value;
  } else if (props.booking.expected_guests < currentGuestCount) {
    const guestsToRemove = props.booking.guests
      .slice(props.booking.expected_guests)
      .filter(guest => !guest.is_checked_in && !guest.is_checked_out);
    if (guestsToRemove.length > 0) {
      confirm.require({
        message: `Reducing the number of guests will remove ${guestsToRemove.length} guest(s). Confirm?`,
        header: 'Confirm Guest Removal',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          props.booking.guests = props.booking.guests.slice(0, props.booking.expected_guests);
          toast.add({ severity: 'success', summary: 'Guests Removed', detail: 'Excess guests have been removed.', life: 3000 });
        },
        reject: () => {
          props.booking.expected_guests = currentGuestCount;
        },
      });
    }
  }
};

const handleSubmit = async () => {
  try {
    await updateCorporateBooking(props.booking.id, props.booking);
    emit('update:visible', false);
  } catch (error) {
    // Error handled by composable's toast
  }
};

const handleRemoveGuest = (index: number) => {
  const guest = corporateBookingForm.guests[index];
  if (guest.is_checked_in || guest.is_checked_out) {
    toast.add({ severity: 'warn', summary: 'Cannot Remove', detail: 'Checked-in or checked-out guests cannot be removed.', life: 3000 });
    return;
  }
  confirm.require({
    message: `Are you sure you want to remove ${guest.full_name || 'this guest'}?`,
    header: 'Confirm Guest Removal',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      removeGuest(index);
      toast.add({ severity: 'success', summary: 'Guest Removed', detail: 'Guest has been removed.', life: 3000 });
    },
  });
};

const handleExpectedGuestsChange = () => {
  const currentGuestCount = corporateBookingForm.guests.length;
  if (corporateBookingForm.expected_guests < minExpectedGuests.value) {
    toast.add({
      severity: 'warn',
      summary: 'Invalid Input',
      detail: `Cannot set expected guests below ${minExpectedGuests.value} (number of checked-in or checked-out guests).`,
      life: 3000,
    });
    corporateBookingForm.expected_guests = minExpectedGuests.value;
  } else if (corporateBookingForm.expected_guests < currentGuestCount) {
    const guestsToRemove = corporateBookingForm.guests
      .slice(corporateBookingForm.expected_guests)
      .filter(guest => !guest.is_checked_in && !guest.is_checked_out);
    if (guestsToRemove.length > 0) {
      confirm.require({
        message: `Reducing the number of guests will remove ${guestsToRemove.length} guest(s). Confirm?`,
        header: 'Confirm Guest Removal',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          corporateBookingForm.guests = corporateBookingForm.guests.slice(0, corporateBookingForm.expected_guests);
          toast.add({ severity: 'success', summary: 'Guests Removed', detail: 'Excess guests have been removed.', life: 3000 });
        },
        reject: () => {
          corporateBookingForm.expected_guests = currentGuestCount;
        },
      });
    }
  }
};

const handleSubmit = async () => {
  try {
    await updateCorporateBooking(props.booking.id, corporateBookingForm);
    emit('update:visible', false);
  } catch (error) {
    // Error handled by composable's toast
  }
};

watchEffect(() => {
  if (props.booking) {
    fetchAvailableRooms();
  }
});
</script>
<style scoped>
/* Main Layout */
.corporate-booking-management {
  padding: 1.5rem;
  max-width: 100%;
  margin: 0 auto;
}

/* Card Styling */
.bookings-table-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-section h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.total-count {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* Loading State */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-text {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

/* Empty States */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 2rem;
}

.empty-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.empty-content p {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  line-height: 1.5;
}

/* Table Controls */
.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-section {
  flex: 1;
  min-width: 250px;
}

.search-wrapper {
  width: 100%;
  max-width: 400px;
}

.search-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-section {
  display: flex;
  gap: 0.75rem;
}

.status-dropdown {
  min-width: 180px;
}

.dropdown-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Data Table Styling */
.custom-datatable {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0.75rem;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  transition: background-color 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #f8fafc;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 1rem 0.75rem;
  border: none;
}

.cell-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.booking-id {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
}

.status-tag {
  font-size: 0.75rem;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

/* Guest Expansion */
.guests-expansion {
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
  margin: 0.5rem;
}

.expansion-header h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.guests-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
}

.guest-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.guest-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.guest-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.guest-avatar {
  width: 40px;
  height: 40px;
  background: #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.guest-info {
  flex: 1;
}

.guest-info h5 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #1e293b;
}

.guest-email {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.room-info {
  margin-bottom: 1rem;
}

.room-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.room-price {
  font-weight: 600;
  color: #3b82f6;
  margin-left: auto;
}

.guest-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.completed-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #059669;
  font-weight: 500;
  font-size: 0.875rem;
}

.guest-timestamps {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.timestamp {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

/* Booking Form Dialog */
.booking-form-dialog {
  border-radius: 12px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
}

.form-section {
  padding: 1rem;
  border-radius: 8px;
  background: #f8fafc;
}

.form-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
}

.guest-section {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.guest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.guest-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

/* Guest Details Dialog */
.guest-details-dialog {
  border-radius: 12px;
}

.guest-details-content {
  padding: 0.5rem 0;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.info-item span {
  color: #1e293b;
  font-weight: 500;
}

.room-details-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
}

.room-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.room-image {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  background: #e2e8f0;
  flex-shrink: 0;
}

.room-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-info-details h4 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #1e293b;
}

.room-type {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #64748b;
}

.room-price {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #3b82f6;
}

.room-specs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.spec-label {
  font-size: 0.875rem;
  color: #64748b;
}

.spec-value {
  font-weight: 500;
  color: #1e293b;
}

.status-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.timestamps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.timestamp-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.timestamp-value {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.875rem;
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .corporate-booking-management {
    padding: 1rem;
  }
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .search-section,
  .filter-section {
    width: 100%;
  }
  .status-dropdown {
    width: 100%;
  }
  .guests-grid {
    grid-template-columns: 1fr;
  }
  .guest-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .guest-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .info-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
  .room-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .room-specs {
    grid-template-columns: repeat(2, 1fr);
  }
  .status-item,
  .timestamp-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .corporate-booking-management {
    padding: 0.75rem;
  }
  .room-specs {
    grid-template-columns: 1fr;
  }
}

/* Animation for loading spinner */
.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Focus styles for accessibility */
:deep(.p-button:focus) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
:deep(.p-dropdown:focus) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
:deep(.p-inputtext:focus) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
</style>
