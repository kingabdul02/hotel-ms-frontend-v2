<script setup>
import RevPARWidget from '@/components/dashboard/RevPARWidget.vue';
</script>

<template>
  <div class="grid p-4">
    <div class="col-12">
      <h2 class="text-900 mb-3">Revenue Dashboard</h2>
      <p class="text-600 mb-5">Key financial performance indicators and trends.</p>
      <RevPARWidget />
    </div>
  </div>
   <!-- Placeholder panels for future revenue KPIs -->
    <div class="col-12 md:col-6 lg:col-4">
      <div class="surface-card border-round p-3 shadow-1">Coming Soon: ADR</div>
    </div>
    <div class="col-12 md:col-6 lg:col-4">
      <div class="surface-card border-round p-3 shadow-1">Coming Soon: Occupancy</div>
    </div>
</template>

<style scoped>
</style>
