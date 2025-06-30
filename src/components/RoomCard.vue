<template>
    <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div class="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600">
        <img
          v-if="room.image"
          :src="room.image"
          :alt="room.name"
          class="w-full h-full object-cover"
          @error="handleImageError"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <div class="text-white text-6xl">🏨</div>
        </div>
        <div class="absolute top-4 right-4">
          <span
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium',
              room.available 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            ]"
          >
            {{ room.available ? 'Available' : 'Booked' }}
          </span>
        </div>
      </div>
      
      <div class="p-6">
        <div class="flex justify-between items-start mb-3">
          <h3 class="text-xl font-semibold text-gray-900">{{ room.name }}</h3>
          <div class="text-right">
            <div class="text-2xl font-bold text-blue-600">${{ room.price }}</div>
            <div class="text-sm text-gray-500">per night</div>
          </div>
        </div>
        
        <div class="flex items-center space-x-4 mb-4">
          <span class="text-sm text-gray-600">{{ room.type }}</span>
          <span class="text-sm text-gray-600">•</span>
          <div class="flex items-center space-x-1">
            <Users class="h-4 w-4 text-gray-400" />
            <span class="text-sm text-gray-600">{{ room.capacity }} guests</span>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-2 mb-4">
          <span
            v-for="amenity in room.amenities?.slice(0, 3) || []"
            :key="amenity"
            class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
          >
            {{ amenity }}
          </span>
          <span
            v-if="room.amenities && room.amenities.length > 3"
            class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
          >
            +{{ room.amenities.length - 3 }} more
          </span>
        </div>
        
        <button
          @click="$emit('select', room)"
          :disabled="!room.available"
          :class="[
            'w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200',
            room.available
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          {{ room.available ? 'Select Room' : 'Unavailable' }}
        </button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { Users } from 'lucide-vue-next'
  import type { Room } from '../types'
  
  interface Props {
    room: Room
  }
  
  interface Emits {
    (e: 'select', room: Room): void
  }
  
  defineProps<Props>()
  defineEmits<Emits>()
  
  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement
    img.style.display = 'none'
  }
  </script>