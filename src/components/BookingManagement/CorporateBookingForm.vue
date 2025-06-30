<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue';
import Card from 'primevue/card';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Calendar from 'primevue/calendar';
import InputSwitch from 'primevue/inputswitch';
import AutoComplete from 'primevue/autocomplete';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import Divider from 'primevue/divider';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import { useCorporateBooking } from '@/composables/useCorporateBooking';
import { formatCurrency } from '@/utils/currencyFormatter';

const {
  corporateBookingForm,
  selectedCompany,
  availableRooms,
  filteredCompanies,
  fetchCompanies,
  fetchAvailableRooms,
  searchCompanies,
  onCompanySelect,
  addGuest,
  removeGuest,
  resetCorporateBookingForm,
  submitCorporateBooking,
  toast
} = useCorporateBooking();

const genderOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' }
];

// Active tab management
const activeIndex = ref(0);
const totalTabs = 5;

// Tab validation states - Fixed reactivity
const tabValidation = computed(() => {
  // Force reactivity by accessing reactive properties directly
  const guests = corporateBookingForm.guests;
  const coordinator = corporateBookingForm.coordinator;
  const company = corporateBookingForm.company;
  const isNewCompany = corporateBookingForm.is_new_company;
  const checkIn = corporateBookingForm.check_in_date;
  const checkOut = corporateBookingForm.check_out_date;
  const selectedComp = selectedCompany.value;
  
  return {
    0: { // Booking Details
      isValid: checkIn && checkOut,
      errors: []
    },
    1: { // Company Information
      isValid: isNewCompany ? 
        company.name && company.email && company.phone :
        selectedComp,
      errors: []
    },
    2: { // Coordinator
      isValid: coordinator.full_name && 
               coordinator.email && 
               coordinator.phone,
      errors: []
    },
    3: { // Guests
      isValid: guests.length > 0 && 
               guests.every(guest => 
                 guest.full_name && guest.email && guest.phone && guest.gender && guest.room_id
               ),
      errors: []
    },
    4: { // Summary
      isValid: true,
      errors: []
    }
  };
});

// Overall form validation
const isFormValid = computed(() => {
  return Object.values(tabValidation.value).every(tab => tab.isValid);
});

// Progress calculation
const completionProgress = computed(() => {
  const validTabs = Object.values(tabValidation.value).filter(tab => tab.isValid).length;
  return Math.round((validTabs / (totalTabs - 1)) * 100); // Exclude summary tab from calculation
});

// Navigation methods
const goToNextTab = () => {
  if (activeIndex.value < totalTabs - 1) {
    activeIndex.value++;
  }
};

const goToPreviousTab = () => {
  if (activeIndex.value > 0) {
    activeIndex.value--;
  }
};

const goToTab = (index: number) => {
  activeIndex.value = index;
};

// Tab labels for easier reference
const tabLabels = [
  'Booking Details',
  'Company Information', 
  'Coordinator',
  'Guests',
  'Summary'
];

// Enhanced summary calculations - Fixed reactivity
const bookingSummary = computed(() => {
  // Force reactivity by accessing the reactive properties directly
  const guests = corporateBookingForm.guests;
  const checkInDate = corporateBookingForm.check_in_date;
  const checkOutDate = corporateBookingForm.check_out_date;
  const rooms = availableRooms.value || availableRooms;
  
  const checkIn = new Date(checkInDate || '');
  const checkOut = new Date(checkOutDate || '');
  const nights = checkInDate && checkOutDate ? 
    Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  const totalCost = guests.reduce((total, guest) => {
    const room = rooms.find(r => r.id === guest.room_id);
    return total + (room ? room.price * nights : 0);
  }, 0);

  const roomBreakdown = guests.reduce((breakdown, guest) => {
    const room = rooms.find(r => r.id === guest.room_id);
    if (room) {
      const existing = breakdown.find(b => b.room_id === room.id);
      if (existing) {
        existing.count++;
        existing.guests.push(guest.full_name || 'Unnamed Guest');
      } else {
        breakdown.push({
          room_id: room.id,
          room_name: room.name,
          price_per_night: room.price,
          count: 1,
          guests: [guest.full_name || 'Unnamed Guest']
        });
      }
    }
    return breakdown;
  }, []);

  return {
    nights,
    totalCost,
    roomBreakdown,
    guestCount: guests.length,
    roomCount: new Set(guests.map(g => g.room_id).filter(Boolean)).size
  };
});

watch([() => corporateBookingForm.check_in_date, () => corporateBookingForm.check_out_date], fetchAvailableRooms);

onMounted(() => {
  fetchCompanies();
});
</script>

<template>
  <Card class="corporate-booking-card">
    <template #title>
      <div class="flex align-items-center justify-content-between">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-building text-primary"></i>
          <span>Create Corporate Booking</span>
        </div>
        <div class="flex align-items-center gap-3">
          <small class="text-600">Progress:</small>
          <ProgressBar :value="completionProgress" style="width: 150px" />
          <small class="text-600">{{ completionProgress }}%</small>
        </div>
      </div>
    </template>
    <template #content>
      <TabView v-model:activeIndex="activeIndex" class="corporate-form-tabs" scrollable>
        <!-- Booking Details Tab -->
        <TabPanel header="Booking Details" leftIcon="pi pi-calendar">
          <div class="tab-content">
            <Message v-if="!tabValidation[0].isValid" severity="warn" class="mb-4">
              Please select both check-in and check-out dates to proceed.
            </Message>
            
            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="checkInDate" class="form-label">Check-In Date *</label>
                  <Calendar
                    id="checkInDate"
                    v-model="corporateBookingForm.check_in_date"
                    dateFormat="yy-mm-dd"
                    :minDate="new Date()"
                    class="w-full"
                    placeholder="Select check-in date"
                  />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="checkOutDate" class="form-label">Check-Out Date *</label>
                  <Calendar
                    id="checkOutDate"
                    v-model="corporateBookingForm.check_out_date"
                    dateFormat="yy-mm-dd"
                    :minDate="corporateBookingForm.check_in_date || new Date()"
                    class="w-full"
                    placeholder="Select check-out date"
                  />
                </div>
              </div>
              <div v-if="bookingSummary.nights > 0" class="col-12">
                <Card class="mt-3">
                  <template #content>
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-moon text-primary"></i>
                      <span class="font-semibold">{{ bookingSummary.nights }} night{{ bookingSummary.nights > 1 ? 's' : '' }}</span>
                      <Chip :label="`${new Date(corporateBookingForm.check_in_date).toLocaleDateString()} - ${new Date(corporateBookingForm.check_out_date).toLocaleDateString()}`" />
                    </div>
                  </template>
                </Card>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Company Information Tab -->
        <TabPanel header="Company Information" leftIcon="pi pi-building">
          <div class="tab-content">
            <Message v-if="!tabValidation[1].isValid" severity="warn" class="mb-4">
              Please provide complete company information to proceed.
            </Message>

            <div class="field mb-4">
              <div class="flex align-items-center gap-3">
                <InputSwitch v-model="corporateBookingForm.is_new_company" />
                <label class="form-label mb-0">
                  {{ corporateBookingForm.is_new_company ? 'New Company' : 'Existing Company' }}
                </label>
              </div>
            </div>
            
            <div v-if="!corporateBookingForm.is_new_company" class="field mb-4">
              <label for="companySearch" class="form-label">Select Company *</label>
              <AutoComplete
                id="companySearch"
                v-model="selectedCompany"
                :suggestions="filteredCompanies"
                @complete="searchCompanies"
                @item-select="onCompanySelect"
                optionLabel="name"
                placeholder="Type to search companies..."
                class="w-full"
              />
            </div>
            
            <div v-if="corporateBookingForm.is_new_company || selectedCompany">
              <div class="grid">
                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="companyName" class="form-label">Company Name *</label>
                    <InputText
                      id="companyName"
                      v-model="corporateBookingForm.company.name"
                      class="w-full"
                      placeholder="Enter company name"
                      :disabled="!corporateBookingForm.is_new_company"
                    />
                  </div>
                </div>
                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="companyEmail" class="form-label">Company Email *</label>
                    <InputText
                      id="companyEmail"
                      v-model="corporateBookingForm.company.email"
                      type="email"
                      class="w-full"
                      placeholder="Enter company email"
                      :disabled="!corporateBookingForm.is_new_company"
                    />
                  </div>
                </div>
                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="companyPhone" class="form-label">Company Phone *</label>
                    <InputText
                      id="companyPhone"
                      v-model="corporateBookingForm.company.phone"
                      class="w-full"
                      placeholder="Enter company phone"
                      :disabled="!corporateBookingForm.is_new_company"
                    />
                  </div>
                </div>
                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="companyAddress" class="form-label">Company Address</label>
                    <Textarea
                      id="companyAddress"
                      v-model="corporateBookingForm.company.address"
                      rows="3"
                      class="w-full"
                      placeholder="Enter company address"
                      :disabled="!corporateBookingForm.is_new_company"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Coordinator Tab -->
        <TabPanel header="Coordinator" leftIcon="pi pi-user">
          <div class="tab-content">
            <Message v-if="!tabValidation[2].isValid" severity="warn" class="mb-4">
              Please provide complete coordinator information to proceed.
            </Message>

            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="coordinatorName" class="form-label">Full Name *</label>
                  <InputText
                    id="coordinatorName"
                    v-model="corporateBookingForm.coordinator.full_name"
                    class="w-full"
                    placeholder="Enter coordinator full name"
                  />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="coordinatorEmail" class="form-label">Email *</label>
                  <InputText
                    id="coordinatorEmail"
                    v-model="corporateBookingForm.coordinator.email"
                    type="email"
                    class="w-full"
                    placeholder="Enter coordinator email"
                  />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="coordinatorPhone" class="form-label">Phone *</label>
                  <InputText
                    id="coordinatorPhone"
                    v-model="corporateBookingForm.coordinator.phone"
                    class="w-full"
                    placeholder="Enter coordinator phone"
                  />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="coordinatorNin" class="form-label">NIN</label>
                  <InputText
                    id="coordinatorNin"
                    v-model="corporateBookingForm.coordinator.nin"
                    class="w-full"
                    placeholder="Enter NIN (optional)"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Guests Tab -->
        <TabPanel header="Guests" leftIcon="pi pi-users">
          <div class="tab-content">
            <Message v-if="!tabValidation[3].isValid" severity="warn" class="mb-4">
              Please add at least one guest with complete information and room assignment.
            </Message>

            <div class="mb-4 flex align-items-center justify-content-between">
              <Button label="Add Guest" icon="pi pi-plus" class="p-button-success" @click="addGuest" />
              <div class="flex align-items-center gap-2">
                <Chip :label="`${corporateBookingForm.guests.length} Guest${corporateBookingForm.guests.length !== 1 ? 's' : ''}`" />
                <small v-if="availableRooms.length === 0" class="text-orange-500">
                  Please select check-in and check-out dates first
                </small>
              </div>
            </div>
            
            <div v-if="corporateBookingForm.guests.length > 0" class="guest-list">
              <Card v-for="(guest, index) in corporateBookingForm.guests" :key="`guest-${index}-${guest.id || Date.now()}`" class="guest-card mb-3">
                <template #header>
                  <div class="flex justify-content-between align-items-center p-3">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-user text-primary"></i>
                      <span class="font-semibold">Guest {{ index + 1 }}</span>
                      <Tag v-if="guest.full_name && guest.email && guest.phone && guest.gender && guest.room_id" 
                           value="Complete" severity="success" />
                      <Tag v-else value="Incomplete" severity="warn" />
                    </div>
                    <Button
                      icon="pi pi-trash"
                      class="p-button-rounded p-button-danger p-button-text"
                      @click="removeGuest(index)"
                    />
                  </div>
                </template>
                <template #content>
                  <div class="grid">
                    <div class="col-12 md:col-6">
                      <div class="field">
                        <label class="form-label">Full Name *</label>
                        <InputText v-model="guest.full_name" class="w-full" placeholder="Enter guest full name" />
                      </div>
                    </div>
                    <div class="col-12 md:col-6">
                      <div class="field">
                        <label class="form-label">Email *</label>
                        <InputText v-model="guest.email" type="email" class="w-full" placeholder="Enter guest email" />
                      </div>
                    </div>
                    <div class="col-12 md:col-4">
                      <div class="field">
                        <label class="form-label">Phone *</label>
                        <InputText v-model="guest.phone" class="w-full" placeholder="Enter guest phone" />
                      </div>
                    </div>
                    <div class="col-12 md:col-4">
                      <div class="field">
                        <label class="form-label">Gender *</label>
                        <Dropdown
                          v-model="guest.gender"
                          :options="genderOptions"
                          optionLabel="label"
                          optionValue="value"
                          class="w-full"
                          placeholder="Select gender"
                        />
                      </div>
                    </div>
                    <div class="col-12 md:col-4">
                      <div class="field">
                        <label class="form-label">Room *</label>
                        <Dropdown
                          v-model="guest.room_id"
                          :options="availableRooms"
                          optionLabel="name"
                          optionValue="id"
                          class="w-full"
                          placeholder="Select room"
                        >
                          <template #option="slotProps">
                            <div class="flex justify-content-between align-items-center">
                              <span>{{ slotProps.option.name }}</span>
                              <Chip :label="formatCurrency(slotProps.option.price)" class="ml-2" />
                            </div>
                          </template>
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>
            </div>
            
            <div v-else class="text-center py-5">
              <i class="pi pi-users text-6xl text-400 mb-3"></i>
              <p class="text-600 text-lg">No guests added yet</p>
              <p class="text-500">Click "Add Guest" to start adding guests to this booking</p>
            </div>
          </div>
        </TabPanel>

        <!-- Enhanced Summary Tab -->
        <TabPanel header="Summary" leftIcon="pi pi-check-circle">
          <div class="booking-summary">
            <!-- Quick Overview -->
            <Card class="mb-4 overview-card">
              <template #title>
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-eye text-primary"></i>
                  <span>Booking Overview</span>
                </div>
              </template>
              <template #content>
                <div class="grid">
                  <div class="col-6 md:col-3 text-center">
                    <div class="stat-value">{{ bookingSummary.nights }}</div>
                    <div class="stat-label">Night{{ bookingSummary.nights !== 1 ? 's' : '' }}</div>
                  </div>
                  <div class="col-6 md:col-3 text-center">
                    <div class="stat-value">{{ bookingSummary.guestCount }}</div>
                    <div class="stat-label">Guest{{ bookingSummary.guestCount !== 1 ? 's' : '' }}</div>
                  </div>
                  <div class="col-6 md:col-3 text-center">
                    <div class="stat-value">{{ bookingSummary.roomCount }}</div>
                    <div class="stat-label">Room{{ bookingSummary.roomCount !== 1 ? 's' : '' }}</div>
                  </div>
                  <div class="col-6 md:col-3 text-center">
                    <div class="stat-value text-primary">{{ formatCurrency(bookingSummary.totalCost) }}</div>
                    <div class="stat-label">Total Cost</div>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Detailed Information -->
            <div class="grid">
              <div class="col-12 md:col-6">
                <Card class="summary-card h-full">
                  <template #title>
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-calendar text-primary"></i>
                      <span>Booking Period</span>
                    </div>
                  </template>
                  <template #content>
                    <div class="summary-item">
                      <span class="summary-label">Check-in:</span>
                      <strong class="summary-value">
                        {{ corporateBookingForm.check_in_date ? new Date(corporateBookingForm.check_in_date).toLocaleDateString() : 'Not selected' }}
                      </strong>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Check-out:</span>
                      <strong class="summary-value">
                        {{ corporateBookingForm.check_out_date ? new Date(corporateBookingForm.check_out_date).toLocaleDateString() : 'Not selected' }}
                      </strong>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Duration:</span>
                      <strong class="summary-value">{{ bookingSummary.nights }} night{{ bookingSummary.nights !== 1 ? 's' : '' }}</strong>
                    </div>
                  </template>
                </Card>
              </div>
              
              <div class="col-12 md:col-6">
                <Card class="summary-card h-full">
                  <template #title>
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-building text-primary"></i>
                      <span>Company Information</span>
                    </div>
                  </template>
                  <template #content>
                    <div class="summary-item">
                      <span class="summary-label">Name:</span>
                      <strong class="summary-value">{{ corporateBookingForm.company.name || 'Not specified' }}</strong>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Email:</span>
                      <strong class="summary-value">{{ corporateBookingForm.company.email || 'Not specified' }}</strong>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Type:</span>
                      <Tag
                        :value="corporateBookingForm.is_new_company ? 'New Company' : 'Existing Company'"
                        :severity="corporateBookingForm.is_new_company ? 'success' : 'info'"
                      />
                    </div>
                  </template>
                </Card>
              </div>
              
              <div class="col-12 md:col-6">
                <Card class="summary-card h-full">
                  <template #title>
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-user text-primary"></i>
                      <span>Coordinator</span>
                    </div>
                  </template>
                  <template #content>
                    <div class="summary-item">
                      <span class="summary-label">Name:</span>
                      <strong class="summary-value">{{ corporateBookingForm.coordinator.full_name || 'Not specified' }}</strong>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Email:</span>
                      <strong class="summary-value">{{ corporateBookingForm.coordinator.email || 'Not specified' }}</strong>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Phone:</span>
                      <strong class="summary-value">{{ corporateBookingForm.coordinator.phone || 'Not specified' }}</strong>
                    </div>
                  </template>
                </Card>
              </div>
              
              <div class="col-12 md:col-6">
                <Card class="summary-card h-full">
                  <template #title>
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-chart-bar text-primary"></i>
                      <span>Booking Statistics</span>
                    </div>
                  </template>
                  <template #content>
                    <div class="summary-item">
                      <span class="summary-label">Total Guests:</span>
                      <strong class="summary-value">{{ bookingSummary.guestCount }}</strong>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Rooms Booked:</span>
                      <strong class="summary-value">{{ bookingSummary.roomCount }}</strong>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Avg. Cost/Night:</span>
                      <strong class="summary-value">{{ formatCurrency(bookingSummary.totalCost / Math.max(bookingSummary.nights, 1)) }}</strong>
                    </div>
                  </template>
                </Card>
              </div>
            </div>

            <!-- Room Breakdown -->
            <div v-if="bookingSummary.roomBreakdown.length > 0" class="mt-4">
              <Card>
                <template #title>
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-home text-primary"></i>
                    <span>Room Breakdown</span>
                  </div>
                </template>
                <template #content>
                  <div class="room-breakdown-list">
                    <div v-for="room in bookingSummary.roomBreakdown" :key="room.room_id" class="room-breakdown-item">
                      <div class="flex justify-content-between align-items-start">
                        <div class="room-info">
                          <div class="room-name font-semibold">{{ room.room_name }}</div>
                          <div class="room-details text-600">
                            {{ room.count }} room{{ room.count !== 1 ? 's' : '' }} × {{ bookingSummary.nights }} night{{ bookingSummary.nights !== 1 ? 's' : '' }}
                          </div>
                          <div class="guest-names text-500 text-sm">
                            Guests: {{ room.guests.join(', ') }}
                          </div>
                        </div>
                        <div class="room-cost text-right">
                          <div class="cost-per-night text-600">{{ formatCurrency(room.price_per_night) }}/night</div>
                          <div class="total-cost font-semibold text-primary">
                            {{ formatCurrency(room.price_per_night * room.count * bookingSummary.nights) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Divider />
                  <div class="flex justify-content-between align-items-center">
                    <span class="font-semibold">Total Booking Cost:</span>
                    <span class="font-semibold text-primary text-xl">{{ formatCurrency(bookingSummary.totalCost) }}</span>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Guest List -->
            <div v-if="corporateBookingForm.guests.length > 0" class="mt-4">
              <Card>
                <template #title>
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-users text-primary"></i>
                    <span>Guest List</span>
                  </div>
                </template>
                <template #content>
                  <div class="guest-summary-list">
                    <div v-for="(guest, index) in corporateBookingForm.guests" :key="index" class="guest-summary-item">
                      <div class="guest-info">
                        <div class="guest-name">
                          <i class="pi pi-user text-primary mr-2"></i>
                          <span class="font-semibold">{{ guest.full_name || `Guest ${index + 1}` }}</span>
                          <Tag :value="guest.gender" severity="secondary" class="ml-2" />
                        </div>
                        <div class="guest-email text-600">{{ guest.email }}</div>
                        <div class="guest-phone text-600">{{ guest.phone }}</div>
                      </div>
                      <div class="guest-room-info">
                        <div class="room-name font-semibold">
                          {{ availableRooms.find(r => r.id === guest.room_id)?.name || 'No room selected' }}
                        </div>
                        <div class="room-cost text-600">
                          {{ formatCurrency((availableRooms.find(r => r.id === guest.room_id)?.price || 0) * bookingSummary.nights) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Action Buttons -->
            <div class="form-actions mt-5">
              <div class="flex justify-content-between">
                <Button
                  label="Reset Form"
                  icon="pi pi-refresh"
                  class="p-button-outlined p-button-secondary"
                  @click="resetCorporateBookingForm"
                />
                <Button
                  label="Create Booking"
                  icon="pi pi-check"
                  class="p-button-success"
                  @click="submitCorporateBooking"
                  :disabled="!isFormValid"
                />
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>

      <!-- Navigation Controls -->
      <div class="tab-navigation mt-4">
        <div class="flex justify-content-between align-items-center">
          <Button
            label="Previous"
            icon="pi pi-chevron-left"
            class="p-button-outlined"
            @click="goToPreviousTab"
            :disabled="activeIndex === 0"
          />
          
          <div class="flex align-items-center gap-2">
            <span class="text-600">Step {{ activeIndex + 1 }} of {{ totalTabs }}</span>
            <div class="flex gap-1">
              <Button
                v-for="(label, index) in tabLabels"
                :key="index"
                :class="['p-button-rounded p-button-sm', {
                  'p-button-success': tabValidation[index]?.isValid,
                  'p-button-warning': !tabValidation[index]?.isValid && index < activeIndex,
                  'p-button-outlined': index !== activeIndex,
                  'p-button-primary': index === activeIndex
                }]"
                :label="(index + 1).toString()"
                @click="goToTab(index)"
                :disabled="index > activeIndex && !tabValidation[activeIndex]?.isValid"
              />
            </div>
          </div>
          
          <Button
            :label="activeIndex === totalTabs - 1 ? 'Complete' : 'Next'"
            :icon="activeIndex === totalTabs - 1 ? 'pi pi-check' : 'pi pi-chevron-right'"
            iconPos="right"
            :class="activeIndex === totalTabs - 1 ? 'p-button-success' : ''"
            @click="activeIndex === totalTabs - 1 ? submitCorporateBooking() : goToNextTab()"
            :disabled="activeIndex === totalTabs - 1 ? !isFormValid : !tabValidation[activeIndex]?.isValid"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
@import '@/styles/booking-management.css';

/* Enhanced styling for better UX */
/* .corporate-booking-card {
  max-width: 1200px;
  margin: 0 auto;
} */

.tab-content {
  min-height: 400px;
}

.tab-navigation {
  border-top: 1px solid var(--surface-border);
  padding-top: 1rem;
}

.overview-card .stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
  line-height: 1;
}

.overview-card .stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.summary-card {
  height: 100%;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  color: var(--text-color-secondary);
  font-weight: 500;
}

.summary-value {
  color: var(--text-color);
}

.room-breakdown-item {
  padding: 1rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.room-breakdown-item:last-child {
  border-bottom: none;
}

.room-name {
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.room-details {
  margin-bottom: 0.25rem;
}

.guest-names {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cost-per-night {
  font-size: 0.875rem;
}

.total-cost {
  font-size: 1.1rem;
}

.guest-summary-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.guest-summary-item:last-child {
  border-bottom: none;
}

.guest-info {
  flex: 1;
}

.guest-name {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
}

.guest-email, .guest-phone {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.guest-room-info {
  text-align: right;
  min-width: 150px;
}

.guest-card {
  transition: all 0.3s ease;
}

.guest-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Progress bar styling */
.p-progressbar {
  height: 8px;
}

/* Tab validation indicators */
.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
  background: var(--primary-color);
  color: white;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tab-navigation .flex {
    flex-direction: column;
    gap: 1rem;
  }
  
  .overview-card .grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .guest-summary-item {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .guest-room-info {
    text-align: left;
    min-width: auto;
  }
}
</style>