<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
  recentBookingsCount: number;
  availableRoomCount: number;
  checkInsToday: number;
  checkOutsToday: number;
}>();
</script>

<template>
  <div class="booking-overview-section">
    <div class="overview-cards">
      <div class="overview-card new-bookings">
        <div class="card-icon">
          <i class="pi pi-calendar-plus" />
        </div>
        <div class="card-content">
          <div class="card-value">{{ recentBookingsCount }}</div>
          <div class="card-label">New Bookings</div>
        </div>
      </div>

      <div class="overview-card available-rooms">
        <div class="card-icon">
          <i class="pi pi-home" />
        </div>
        <div class="card-content">
            <div class="card-value">{{ availableRoomCount }}</div>
            <div class="card-label">Available Rooms</div>
        </div>
      </div>

      <div class="overview-card check-ins">
        <div class="card-icon">
          <i class="pi pi-sign-in" />
        </div>
        <div class="card-content">
            <div class="card-value">{{ checkInsToday }}</div>
            <div class="card-label">Check-ins Today</div>
        </div>
      </div>

      <div class="overview-card check-outs">
        <div class="card-icon">
          <i class="pi pi-sign-out" />
        </div>
        <div class="card-content">
            <div class="card-value">{{ checkOutsToday }}</div>
            <div class="card-label">Check-outs Today</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Adopt Housekeeping Dashboard card styling for consistency */
.booking-overview-section { 
  margin-bottom: 1.5rem; 
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.overview-card {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform .2s ease;
  color: #fff;
}
.overview-card:hover { transform: translateY(-2px); }

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.2);
  font-size: 1.25rem;
}
.card-content { flex: 1; }
.card-value { font-size: 1.5rem; font-weight: 700; margin-bottom: .25rem; }
.card-label { font-size: .875rem; opacity: .9; }

/* Variant gradients (mirroring dashboard aesthetic) */
.overview-card.new-bookings { background: linear-gradient(135deg,#ef4444 0%,#dc2626 100%); }
.overview-card.available-rooms { background: linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%); }
.overview-card.check-ins { background: linear-gradient(135deg,#10b981 0%,#059669 100%); }
.overview-card.check-outs { background: linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%); }

@media (max-width: 768px) {
  .overview-cards { grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); }
  .overview-card { padding: 1rem; }
  .card-icon { width: 40px; height: 40px; font-size: 1rem; }
  .card-value { font-size: 1.25rem; }
}
</style>