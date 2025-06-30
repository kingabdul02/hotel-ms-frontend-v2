<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import { formatDateTime } from '@/utils/dateTimeFormatter';
import { formatCurrency } from '@/utils/currencyFormatter';

// Define props with validation
defineProps<{
  visible: boolean;
  selectedGuest: {
    full_name: string;
    gender: string;
    email: string;
    phone: string;
    room?: {
      name: string;
      price: number;
      no_of_guests: number;
      no_of_bedrooms: number;
      no_of_beds: number;
      no_of_baths: number;
      images?: { data: { url: string }[] };
      roomType?: { name: string };
    };
    is_checked_in: boolean;
    is_checked_out: boolean;
    checked_in_at?: string;
    checked_out_at?: string;
  } | null;
  selectedBooking: any;
}>();

// Define emits
defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update'): void;
}>();
</script>

<template>
  <Dialog
    :visible="visible"
    :style="{ width: '600px' }"
    header="Guest Details"
    :modal="true"
    class="p-fluid"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="selectedGuest" class="space-y-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <p class="text-gray-900">{{ selectedGuest.full_name || 'N/A' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <p class="text-gray-900">{{ selectedGuest.gender || 'N/A' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p class="text-gray-900">{{ selectedGuest.email || 'N/A' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <p class="text-gray-900">{{ selectedGuest.phone || 'N/A' }}</p>
          </div>
        </div>
      </div>

      <div v-if="selectedGuest.room">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Room Information</h3>
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center space-x-4 mb-4">
            <div
              v-if="selectedGuest.room.images?.data?.length"
              class="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden"
            >
              <img
                :src="selectedGuest.room.images.data[0].url"
                :alt="selectedGuest.room.name"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-gray-800">{{ selectedGuest.room.name || 'N/A' }}</h4>
              <p class="text-sm text-gray-600">{{ selectedGuest.room.roomType?.name || 'N/A' }}</p>
              <p class="text-lg font-semibold text-blue-600">
                {{ formatCurrency(selectedGuest.room.price) }}/night
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Capacity:</span>
              <span class="font-medium ml-1">{{ selectedGuest.room.no_of_guests || 0 }} guests</span>
            </div>
            <div>
              <span class="text-gray-600">Bedrooms:</span>
              <span class="font-medium ml-1">{{ selectedGuest.room.no_of_bedrooms || 0 }}</span>
            </div>
            <div>
              <span class="text-gray-600">Beds:</span>
              <span class="font-medium ml-1">{{ selectedGuest.room.no_of_beds || 0 }}</span>
            </div>
            <div>
              <span class="text-gray-600">Bathrooms:</span>
              <span class="font-medium ml-1">{{ selectedGuest.room.no_of_baths || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <p class="text-gray-600">No room assigned to this guest.</p>
      </div>

      <div>
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Status Information</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">Check-in Status:</span>
            <Tag
              :value="selectedGuest.is_checked_in ? 'Checked In' : 'Not Checked In'"
              :severity="selectedGuest.is_checked_in ? 'success' : 'warning'"
            />
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">Check-out Status:</span>
            <Tag
              :value="selectedGuest.is_checked_out ? 'Checked Out' : 'Still In Room'"
              :severity="selectedGuest.is_checked_out ? 'info' : 'success'"
            />
          </div>
          <div v-if="selectedGuest.checked_in_at" class="p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">Checked in at:</span>
            <span class="font-medium ml-2">{{ formatDateTime(selectedGuest.checked_in_at) }}</span>
          </div>
          <div v-if="selectedGuest.checked_out_at" class="p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">Checked out at:</span>
            <span class="font-medium ml-2">{{ formatDateTime(selectedGuest.checked_out_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-4">
      <p class="text-gray-600">No guest selected.</p>
    </div>

    <template #footer>
      <button
        class="p-button p-button-secondary p-button-text"
        @click="$emit('update:visible', false)"
      >
        Close
      </button>
    </template>
  </Dialog>
</template>

<style scoped>
@import '@/styles/booking-management.css';
</style>
