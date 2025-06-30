<template>
    <div class="bg-white rounded-xl shadow-lg p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Select Dates</h3>
        <div class="flex items-center space-x-2">
          <button
            @click="previousMonth"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft class="h-5 w-5 text-gray-600" />
          </button>
          <span class="font-medium text-gray-900 min-w-[140px] text-center">
            {{ monthYear }}
          </span>
          <button
            @click="nextMonth"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight class="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
  
      <div class="calendar-grid mb-4">
        <div
          v-for="day in dayHeaders"
          :key="day"
          class="text-center text-sm font-medium text-gray-500 py-2"
        >
          {{ day }}
        </div>
      </div>
  
      <div class="calendar-grid">
        <div
          v-for="date in calendarDates"
          :key="date.key"
          :class="getDateClasses(date)"
          @click="selectDate(date)"
        >
          {{ date.date }}
        </div>
      </div>
  
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between text-sm">
          <div>
            <span class="text-gray-600">Check-in:</span>
            <span class="ml-2 font-medium">{{ formatDate(selectedRange.checkIn) }}</span>
          </div>
          <div>
            <span class="text-gray-600">Check-out:</span>
            <span class="ml-2 font-medium">{{ formatDate(selectedRange.checkOut) }}</span>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
  import type { DateRange } from '../types'
  
  interface CalendarDate {
    date: number
    fullDate: Date
    isCurrentMonth: boolean
    isToday: boolean
    key: string
  }
  
  interface Props {
    selectedRange: DateRange
  }
  
  interface Emits {
    (e: 'update:selectedRange', range: DateRange): void
  }
  
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  
  const currentMonth = ref(new Date())
  const selectingCheckOut = ref(false)
  
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const monthYear = computed(() => {
    return currentMonth.value.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  })
  
  const calendarDates = computed<CalendarDate[]>(() => {
    const year = currentMonth.value.getFullYear()
    const month = currentMonth.value.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    
    // Go back to the start of the week
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const dates: CalendarDate[] = []
    const today = new Date()
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      dates.push({
        date: date.getDate(),
        fullDate: date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        key: date.toISOString()
      })
    }
    
    return dates
  })
  
  const previousMonth = () => {
    currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1)
  }
  
  const nextMonth = () => {
    currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1)
  }
  
  const selectDate = (calendarDate: CalendarDate) => {
    if (!calendarDate.isCurrentMonth || isPastDate(calendarDate.fullDate)) return
    
    if (!props.selectedRange.checkIn || selectingCheckOut.value) {
      // Select check-in date
      emit('update:selectedRange', {
        checkIn: calendarDate.fullDate,
        checkOut: null
      })
      selectingCheckOut.value = true
    } else if (!props.selectedRange.checkOut) {
      // Select check-out date
      if (calendarDate.fullDate <= props.selectedRange.checkIn) {
        // If selected date is before check-in, make it the new check-in
        emit('update:selectedRange', {
          checkIn: calendarDate.fullDate,
          checkOut: null
        })
      } else {
        emit('update:selectedRange', {
          checkIn: props.selectedRange.checkIn,
          checkOut: calendarDate.fullDate
        })
        selectingCheckOut.value = false
      }
    } else {
      // Both dates selected, start over
      emit('update:selectedRange', {
        checkIn: calendarDate.fullDate,
        checkOut: null
      })
      selectingCheckOut.value = true
    }
  }
  
  const isPastDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }
  
  const isSelected = (calendarDate: CalendarDate) => {
    if (!props.selectedRange.checkIn) return false
    
    const dateStr = calendarDate.fullDate.toDateString()
    const checkInStr = props.selectedRange.checkIn.toDateString()
    const checkOutStr = props.selectedRange.checkOut?.toDateString()
    
    return dateStr === checkInStr || (checkOutStr && dateStr === checkOutStr)
  }
  
  const isInRange = (calendarDate: CalendarDate) => {
    if (!props.selectedRange.checkIn || !props.selectedRange.checkOut) return false
    
    return calendarDate.fullDate > props.selectedRange.checkIn && 
           calendarDate.fullDate < props.selectedRange.checkOut
  }
  
  const getDateClasses = (calendarDate: CalendarDate) => {
    const classes = ['date-cell']
    
    if (!calendarDate.isCurrentMonth) {
      classes.push('text-gray-300')
    }
    
    if (isPastDate(calendarDate.fullDate)) {
      classes.push('disabled')
    }
    
    if (calendarDate.isToday) {
      classes.push('today')
    }
    
    if (isSelected(calendarDate)) {
      classes.push('selected')
    } else if (isInRange(calendarDate)) {
      classes.push('in-range')
    }
    
    return classes
  }
  
  const formatDate = (date: Date | null) => {
    if (!date) return 'Select date'
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  // Reset selecting state when range is cleared externally
  watch(() => props.selectedRange, (newRange) => {
    if (!newRange.checkIn && !newRange.checkOut) {
      selectingCheckOut.value = false
    }
  }, { deep: true })
  </script>