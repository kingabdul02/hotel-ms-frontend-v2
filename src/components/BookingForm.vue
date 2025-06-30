<template>
    <div class="bg-white rounded-xl shadow-lg p-6">
      <h3 class="text-xl font-semibold text-gray-900 mb-6">Complete Booking</h3>
      
      <form @submit.prevent="submitBooking" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Guest Name *
            </label>
            <input
              v-model="form.guest_name"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter guest name"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Number of Guests *
            </label>
            <select
              v-model="form.no_of_guests"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select guests</option>
              <option v-for="i in selectedRoom?.capacity || 4" :key="i" :value="i.toString()">
                {{ i }} {{ i === 1 ? 'Guest' : 'Guests' }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              v-model="form.guest_email"
              type="email"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              v-model="form.guest_phone"
              type="tel"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter phone number"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Special Requests
          </label>
          <textarea
            v-model="form.special_requests"
            rows="4"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Any special requests or preferences..."
          ></textarea>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-medium text-gray-900 mb-3">Booking Summary</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Room:</span>
              <span class="font-medium">{{ selectedRoom?.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Check-in:</span>
              <span class="font-medium">{{ formatDate(dateRange.checkIn) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Check-out:</span>
              <span class="font-medium">{{ formatDate(dateRange.checkOut) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Nights:</span>
              <span class="font-medium">{{ nightCount }}</span>
            </div>
            <div class="flex justify-between text-lg font-semibold pt-2 border-t">
              <span>Total:</span>
              <span class="text-blue-600">${{ totalAmount }}</span>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-4">
          <button
            type="button"
            @click="$emit('cancel')"
            class="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            :class="[
              'flex-1 py-3 px-4 rounded-lg font-medium transition-colors',
              loading || !isFormValid
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            ]"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </span>
            <span v-else>Confirm Booking</span>
          </button>
        </div>
      </form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import type { Room, DateRange, BookingForm } from '../types'
  
  interface Props {
    selectedRoom: Room | null
    dateRange: DateRange
  }
  
  interface Emits {
    (e: 'submit', form: BookingForm): void
    (e: 'cancel'): void
  }
  
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  
  const loading = ref(false)
  
  const form = ref({
    room_id: 0,
    check_in_date: '',
    check_out_date: '',
    special_requests: 'None',
    no_of_guests: '',
    guest_name: '',
    guest_email: '',
    guest_phone: ''
  })
  
  const nightCount = computed(() => {
    if (!props.dateRange.checkIn || !props.dateRange.checkOut) return 0
    const diffTime = props.dateRange.checkOut.getTime() - props.dateRange.checkIn.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  })
  
  const totalAmount = computed(() => {
    if (!props.selectedRoom) return 0
    return nightCount.value * props.selectedRoom.price
  })
  
  const isFormValid = computed(() => {
    return form.value.guest_name.trim() !== '' && 
           form.value.no_of_guests !== '' &&
           props.selectedRoom !== null &&
           props.dateRange.checkIn !== null &&
           props.dateRange.checkOut !== null
  })
  
  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0]
  }
  
  const submitBooking = async () => {
    if (!isFormValid.value) return
    
    loading.value = true
    
    try {
      const bookingData: BookingForm = {
        room_id: props.selectedRoom!.id,
        check_in_date: formatDateForAPI(props.dateRange.checkIn!),
        check_out_date: formatDateForAPI(props.dateRange.checkOut!),
        special_requests: form.value.special_requests || 'None',
        no_of_guests: form.value.no_of_guests,
        guest_name: form.value.guest_name,
        guest_email: form.value.guest_email,
        guest_phone: form.value.guest_phone
      }
      
      emit('submit', bookingData)
    } finally {
      loading.value = false
    }
  }
  
  // Update form when room or dates change
  watch([() => props.selectedRoom, () => props.dateRange], () => {
    if (props.selectedRoom) {
      form.value.room_id = props.selectedRoom.id
    }
    if (props.dateRange.checkIn) {
      form.value.check_in_date = formatDateForAPI(props.dateRange.checkIn)
    }
    if (props.dateRange.checkOut) {
      form.value.check_out_date = formatDateForAPI(props.dateRange.checkOut)
    }
  }, { deep: true, immediate: true })
  </script>