<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCorporateBooking } from '@/composables/useCorporateBooking'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import Badge from 'primevue/badge'
import Avatar from 'primevue/avatar'

// Interfaces
interface GuestSummary {
  full_name: string
  room_number: string
  rate: number
  nights: number
  amount: number
}

interface MealPlan {
  name: string
  rate_per_day: number
  total_meal_cost: number
}

interface Bill {
  company_name: string
  check_in_date: string
  check_out_date: string
  nights: number
  guests: GuestSummary[]
  meal_plan: MealPlan | null
  total_accommodation: number
  grand_total: number
}

// Composable
const { fetchCorporateBill } = useCorporateBooking()
const router = useRouter()
const route = useRoute()
const toast = useToast()

// State
const bill = ref<Bill | null>(null)
const isLoading = ref(true)

// Computed
const formattedCheckIn = computed(() =>
  bill.value ? new Date(bill.value.check_in_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : ''
)

const formattedCheckOut = computed(() =>
  bill.value ? new Date(bill.value.check_out_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : ''
)

const formattedTotal = computed(() =>
  bill.value ? `$${bill.value.grand_total.toFixed(2)}` : '$0.00'
)

const totalGuests = computed(() => bill.value?.guests.length || 0)

const averageRatePerNight = computed(() => {
  if (!bill.value || bill.value.guests.length === 0) return 0
  const totalRate = bill.value.guests.reduce((sum, guest) => sum + guest.rate, 0)
  return totalRate / bill.value.guests.length
})

// Methods
const printBill = () => {
  const billContent = document.querySelector('.bill-content')?.innerHTML;

  if (!billContent) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Unable to print bill content',
      life: 3000,
    });
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Unable to open print window',
      life: 3000,
    });
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Corporate Bill</title>
        <style>
          * {
            box-sizing: border-box;
            max-width: 100%;
          }

          html, body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            color: #1f2937;
            overflow-x: hidden;
          }

          body {
            padding: 20px;
          }

          .bill-content {
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.6;
            overflow-wrap: break-word;
          }

          .info-card, .guests-card, .summary-card {
            background: white;
            border: 1px solid #e5e7eb;
            padding: 1.5rem;
            margin-bottom: 2rem;
            border-radius: 0.75rem;
            overflow: hidden;
            page-break-inside: avoid;
          }

          .card-header {
            font-weight: 600;
            font-size: 1.2rem;
            margin-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.5rem;
          }

          .info-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .info-section {
            flex: 1 1 45%;
          }

          .info-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: 500;
          }

          .info-value {
            font-size: 1rem;
            font-weight: 600;
          }

          .company-name {
            font-size: 1.1rem;
            font-weight: bold;
            color: #2563eb;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
            table-layout: auto;
          }

          th, td {
            padding: 0.75rem;
            border: 1px solid #e5e7eb;
            text-align: left;
            word-break: break-word;
          }

          th {
            background-color: #f3f4f6;
            font-weight: 600;
          }

          .amount {
            font-weight: bold;
            color: #059669;
          }

          .grand-total {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            padding: 1rem;
            border-radius: 0.75rem;
            margin-top: 1.5rem;
            text-align: right;
            clear: both;
          }

          .grand-total-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #059669;
          }

          .note {
            font-size: 0.75rem;
            color: #6b7280;
          }

          @media print {
            .print\\:hidden,
            .header-actions {
              display: none !important;
            }

            .bill-content {
              width: 100%;
              margin: 0 auto;
              padding: 0;
            }

            .info-card, .guests-card, .summary-card {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="bill-content">
          ${billContent}
        </div>
        <script>
          window.onload = function () {
            window.print();
            setTimeout(() => window.close(), 100);
          };
        <\/script>
      </body>
    </html>
  `);

  printWindow.document.close();
};


const goBack = () => {
    router.back()
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

// Lifecycle
onMounted(async () => {
  const reservationCode = route.params.reservation_code as string
  try {
    const response = await fetchCorporateBill(reservationCode)
    if (!response) {
      router.push({ name: 'CorporateBookings' })
      return
    }
    bill.value = response
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to load bill details', 
      life: 5000 
    })
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="corporate-bill">
    <!-- Header Section -->
    <div class="bill-header">
      <div class="header-content">
        <div class="header-left">
          <div class="company-logo">
            <i class="pi pi-building text-4xl text-white"></i>
          </div>
          <div class="header-success">
            <h1 class="page-title">Corporate Bill</h1>
            <p class="page-subtitle">Accommodation invoice</p>
          </div>
        </div>
        <div class="header-actions print:hidden">
          <Button
            label="Back"
            icon="pi pi-arrow-left"
            severity="danger"
            outlined
            @click="goBack"
            class="mr-3"
          />
          <Button
            label="Print Bill"
            icon="pi pi-print"
            severity="success"
            @click="printBill"
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="bill-content">
      <!-- Loading State -->
      <Card v-if="isLoading" class="loading-card">
        <template #content>
          <div class="loading-container">
            <ProgressSpinner style="width: 60px; height: 60px" strokeWidth="3" />
            <h3 class="loading-title">Loading Bill Details</h3>
            <p class="loading-text">Please wait while we fetch your corporate bill...</p>
          </div>
        </template>
      </Card>

      <!-- Bill Content -->
      <div v-else-if="bill" class="bill-sections">
        <!-- Company and Stay Information -->
        <Card class="info-card">
          <template #title>
            <div class="card-header">
              <i class="pi pi-info-circle"></i>
              <span>Booking Information</span>
            </div>
          </template>
          <template #content>
            <div class="info-grid">
              <div class="info-section">
                <div class="info-item">
                  <label class="info-label">Company Name</label>
                  <p class="info-value company-name">{{ bill.company_name }}</p>
                </div>
                <div class="info-item">
                  <label class="info-label">Reservation Code</label>
                  <p class="info-value">
                    <Badge :value="route.params.reservation_code" severity="info" />
                  </p>
                </div>
              </div>
              <div class="info-section">
                <div class="info-item">
                  <label class="info-label">Check-in Date</label>
                  <p class="info-value">
                    <i class="pi pi-calendar-plus text-green-600 mr-2"></i>
                    {{ formattedCheckIn }}
                  </p>
                </div>
                <div class="info-item">
                  <label class="info-label">Check-out Date</label>
                  <p class="info-value">
                    <i class="pi pi-calendar-minus text-red-600 mr-2"></i>
                    {{ formattedCheckOut }}
                  </p>
                </div>
                
              </div>
            </div>
          </template>
        </Card>

        <!-- Guest Details -->
        <Card class="guests-card">
          <template #title>
            <div class="card-header">
              <i class="pi pi-users"></i>
              <span>Guest Details</span>
              <Badge :value="totalGuests" severity="success" />
            </div>
          </template>
          <template #content>
            <DataTable 
              :value="bill.guests" 
              responsiveLayout="scroll" 
              class="enhanced-table"
              stripedRows
              :paginator="bill.guests.length > 10"
              :rows="10"
            >
              <Column field="full_name" header="Guest Name" sortable>
                <template #body="slotProps">
                  <div class="guest-cell">
                    <Avatar 
                      :label="getInitials(slotProps.data.full_name)" 
                      class="guest-avatar"
                      size="small"
                    />
                    <span class="guest-name">{{ slotProps.data.full_name }}</span>
                  </div>
                </template>
              </Column>
              <Column field="room_number" header="Room" sortable>
                <template #body="slotProps">
                  <Badge :value="slotProps.data.room_number" severity="secondary" />
                </template>
              </Column>
              <Column field="rate" header="Rate/Night" sortable>
                <template #body="slotProps">
                  <span class="amount-text">${{ slotProps.data.rate.toFixed(2) }}</span>
                </template>
              </Column>
              <Column field="nights" header="Nights" sortable>
                <template #body="slotProps">
                  <span class="nights-badge">{{ slotProps.data.nights }}</span>
                </template>
              </Column>
              <Column field="amount" header="Total" sortable>
                <template #body="slotProps">
                  <span class="total-amount-cell">${{ slotProps.data.amount.toFixed(2) }}</span>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <!-- Cost Breakdown -->
        <Card class="summary-card">
          <template #title>
            <div class="card-header">
              <i class="pi pi-calculator"></i>
              <span>Cost Breakdown</span>
            </div>
          </template>
          <template #content>
            <div class="cost-breakdown">
              <div class="cost-items">
                <div class="cost-item">
                  <div class="cost-label">
                    <i class="pi pi-home text-blue-600 mr-2"></i>
                    Accommodation Total
                  </div>
                  <div class="cost-value">${{ bill.total_accommodation.toFixed(2) }}</div>
                </div>
                <div v-if="bill.meal_plan" class="cost-item">
                  <div class="cost-label">
                    <i class="pi pi-shopping-cart text-green-600 mr-2"></i>
                    Meal Plan - {{ bill.meal_plan.name }}
                    <small class="meal-rate">(${{ bill.meal_plan.rate_per_day }}/day)</small>
                  </div>
                  <div class="cost-value">${{ bill.meal_plan.total_meal_cost.toFixed(2) }}</div>
                </div>
                <Divider />
                <div class="cost-item grand-total">
                  <div class="cost-label">
                    <i class="pi pi-wallet text-orange-600 mr-2"></i>
                    <strong>Grand Total</strong>
                  </div>
                  <div class="cost-value grand-total-value">{{ formattedTotal }}</div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.corporate-bill {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.bill-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.company-logo {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  padding: 1rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1f2937, #374151);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.page-subtitle {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0.25rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.bill-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 3rem 1.5rem;
}

.loading-card {
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-title {
  margin: 1.5rem 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.loading-text {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

.bill-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Remove stats-related styles */

.info-card,
.guests-card,
.summary-card {
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #1f2937;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1rem;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
}

.company-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #3b82f6;
}

.enhanced-table {
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.guest-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.guest-avatar {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  font-weight: 600;
}

.guest-name {
  font-weight: 500;
}

.amount-text {
  font-weight: 600;
  color: #059669;
}

.nights-badge {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.total-amount-cell {
  font-weight: 700;
  color: #1f2937;
  font-size: 1.1rem;
}

.cost-breakdown {
  max-width: 600px;
  margin: 0 auto;
}

.cost-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
}

.cost-label {
  display: flex;
  align-items: center;
  color: #374151;
  font-size: 1rem;
}

.meal-rate {
  color: #6b7280;
  margin-left: 0.5rem;
}

.cost-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 1.1rem;
}

.grand-total {
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  margin: 0.5rem -1rem 0 -1rem;
  padding: 1rem;
  border-radius: 0.75rem;
}

.grand-total-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .header-left {
    flex-direction: column;
    gap: 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .bill-content {
    padding: 0 1rem 2rem 1rem;
  }
}

/* Print Styles */
@media print {
  .corporate-bill {
    background: white;
  }

  .bill-header {
    background: white;
    border-bottom: 2px solid #e5e7eb;
  }

  .info-card,
  .guests-card,
  .summary-card {
    background: white;
    border: 1px solid #e5e7eb;
    box-shadow: none;
  }

  .enhanced-table {
    border: 1px solid #e5e7eb;
  }

  .print\:hidden {
    display: none !important;
  }

  .cost-item {
    border-bottom: 1px solid #f3f4f6;
  }

  .grand-total {
    background: #f9fafb;
    border: 2px solid #e5e7eb;
  }
}
</style>