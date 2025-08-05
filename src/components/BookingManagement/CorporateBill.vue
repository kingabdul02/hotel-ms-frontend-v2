<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
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
import Chip from 'primevue/chip'
import Message from 'primevue/message'
import Panel from 'primevue/panel'
import ConfirmDialog from 'primevue/confirmdialog'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import { useConfirm } from 'primevue/useconfirm'
import axiosInstance from '@/service/AxiosInstance'
import { formatCurrency } from '@/utils/currencyFormatter'

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
  payment_status: string
}

// Composable
const { fetchCorporateBill } = useCorporateBooking()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()

// State
const bill = ref<Bill | null>(null)
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const isPrintLoading = ref(false)
const isDownloading = ref(false)

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
  bill.value ? `₦${bill.value.grand_total.toFixed(2)}` : '₦0.00'
)

const totalGuests = computed(() => bill.value?.guests.length || 0)

const isPaid = computed(() => bill.value?.payment_status === 'paid')

// Payment dialog state
const showPaymentDialog = ref(false);
const selectedPaymentMethod = ref('');
const paymentMethods = [
  { label: 'Cash', value: 'cash' },
  { label: 'POS', value: 'pos' },
  { label: 'Transfer', value: 'transfer' }
];


const averageRatePerNight = computed(() => {
  if (!bill.value || bill.value.guests.length === 0) return 0
  const totalRate = bill.value.guests.reduce((sum, guest) => sum + guest.rate, 0)
  return totalRate / bill.value.guests.length
})

const totalNights = computed(() => bill.value?.nights || 0)

const formattedAverageRate = computed(() => 
  averageRatePerNight.value ? `$${averageRatePerNight.value.toFixed(2)}` : '$0.00'
)

const hasValidBill = computed(() => bill.value && !hasError.value)

const reservationCode = computed(() => route.params.reservation_code as string)

const canPrint = computed(() => hasValidBill.value && !isPrintLoading.value)

const canDownload = computed(() => hasValidBill.value && !isDownloading.value)

// Methods
const printBill = async () => {
  if (!canPrint.value) return
  
  isPrintLoading.value = true
  
  try {
    await nextTick() // Ensure DOM is updated
    const billContent = document.querySelector('.bill-content')?.innerHTML;

    if (!billContent) {
      toast.add({
        severity: 'error',
        summary: 'Print Error',
        detail: 'Unable to find bill content for printing',
        life: 4000,
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.add({
        severity: 'error',
        summary: 'Print Error', 
        detail: 'Unable to open print window. Please check your browser settings.',
        life: 4000,
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
    
    toast.add({
      severity: 'success',
      summary: 'Print Ready',
      detail: 'Bill is ready for printing',
      life: 3000,
    });
  } catch (error) {
    console.error('Print error:', error)
    toast.add({
      severity: 'error',
      summary: 'Print Error',
      detail: 'An error occurred while preparing the bill for printing',
      life: 4000,
    });
  } finally {
    isPrintLoading.value = false
  }
};


const goBack = () => {
  router.back()
}

const confirmPrint = () => {
  confirm.require({
    message: 'Are you sure you want to print this corporate bill?',
    header: 'Print Confirmation',
    icon: 'pi pi-print',
    rejectClass: 'p-button-text',
    acceptClass: 'p-button-success',
    accept: printBill,
  });
}

const downloadBill = async () => {
  if (!canDownload.value) return
  
  isDownloading.value = true
  
  try {
    await nextTick()
    const billElement = document.querySelector('.bill-content')
    
    if (!billElement) {
      toast.add({
        severity: 'error',
        summary: 'Download Error',
        detail: 'Unable to find bill content for download',
        life: 4000,
      });
      return;
    }

    // Create a downloadable HTML file
    const billContent = billElement.innerHTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Corporate Bill - ${bill.value?.company_name || 'Unknown Company'}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            ${getDownloadStyles()}
          </style>
        </head>
        <body>
          <div class="bill-content">
            ${billContent}
          </div>
        </body>
      </html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `corporate-bill-${reservationCode.value}-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.add({
      severity: 'success',
      summary: 'Download Complete',
      detail: 'Bill has been downloaded successfully',
      life: 3000,
    });
  } catch (error) {
    console.error('Download error:', error)
    toast.add({
      severity: 'error',
      summary: 'Download Error',
      detail: 'An error occurred while downloading the bill',
      life: 4000,
    });
  } finally {
    isDownloading.value = false
  }
}

const getDownloadStyles = () => {
  return `
    * { box-sizing: border-box; max-width: 100%; }
    body { margin: 0; padding: 20px; font-family: 'Inter', sans-serif; font-size: 12px; color: #1f2937; }
    .bill-content { max-width: 900px; margin: 0 auto; line-height: 1.6; }
    .info-card, .guests-card, .summary-card { background: white; border: 1px solid #e5e7eb; padding: 1.5rem; margin-bottom: 2rem; border-radius: 0.75rem; }
    .card-header { font-weight: 600; font-size: 1.2rem; margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { padding: 0.75rem; border: 1px solid #e5e7eb; text-align: left; }
    th { background-color: #f3f4f6; font-weight: 600; }
    .amount { font-weight: bold; color: #059669; }
    .grand-total { background: #f9fafb; border: 2px solid #e5e7eb; padding: 1rem; border-radius: 0.75rem; margin-top: 1.5rem; text-align: right; }
    .grand-total-value { font-size: 1.5rem; font-weight: 700; color: #059669; }
  `
}

const refreshBill = async () => {
  hasError.value = false
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    const response = await fetchCorporateBill(reservationCode.value)
    if (!response) {
      hasError.value = true
      errorMessage.value = 'Failed to load bill details. Please try again.'
      return
    }
    bill.value = response
    toast.add({
      severity: 'success',
      summary: 'Refreshed',
      detail: 'Bill details have been refreshed',
      life: 3000,
    });
  } catch (error) {
    hasError.value = true
    errorMessage.value = 'An error occurred while refreshing the bill'
    toast.add({ 
      severity: 'error', 
      summary: 'Refresh Error', 
      detail: 'Failed to refresh bill details', 
      life: 4000 
    })
  } finally {
    isLoading.value = false
  }
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

// Handle payment completion
const handleCompletePayment = async () => {
  if (!selectedPaymentMethod.value) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Warning', 
      detail: 'Please select a payment method', 
      life: 3000 
    });
    return;
  }

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const token = userData?.token;

  if (!token) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Authentication token missing', 
      life: 3000 
    });
    return;
  }

  try {
    await axiosInstance.post(`/admin/complete-corporate-payment`, {
      reservation_code: reservationCode.value,
      payment_method: selectedPaymentMethod.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    toast.add({ 
      severity: 'success', 
      summary: 'Success', 
      detail: 'Payment completed successfully', 
      life: 3000 
    });

    // Close the payment dialog
    showPaymentDialog.value = false;
    selectedPaymentMethod.value = '';
    
    // Refresh the bill to get updated payment status
    await refreshBill();
    
  } catch (error: any) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'Failed to complete payment', 
      life: 3000 
    });
  }
};

// Lifecycle
onMounted(async () => {
  const code = reservationCode.value
  if (!code) {
    hasError.value = true
    errorMessage.value = 'Invalid reservation code'
    isLoading.value = false
    return
  }
  
  try {
    const response = await fetchCorporateBill(code)
    if (!response) {
      hasError.value = true
      errorMessage.value = 'Bill not found for this reservation code'
      toast.add({ 
        severity: 'warn', 
        summary: 'Bill Not Found', 
        detail: 'No bill found for this reservation. Redirecting...', 
        life: 3000 
      })
      setTimeout(() => {
        router.push({ name: 'CorporateBookings' })
      }, 2000)
      return
    }
    bill.value = response
  } catch (error) {
    hasError.value = true
    errorMessage.value = 'Failed to load bill details. Please try again.'
    toast.add({ 
      severity: 'error', 
      summary: 'Loading Error', 
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
                v-if="!isPaid"
                label="Make Payment"
                icon="pi pi-money-bill"
                class="p-button-info mr-2"
                @click="showPaymentDialog = true"
              />
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            severity="info"
            outlined
            @click="refreshBill"
            :disabled="isLoading"
            class="mr-2"
          />
          <Button
            label="Download"
            icon="pi pi-download"
            severity="secondary"
            outlined
            @click="downloadBill"
            :disabled="!canDownload"
            :loading="isDownloading"
            class="mr-2"
          />
          <Button
            label="Print Bill"
            icon="pi pi-print"
            severity="success"
            @click="confirmPrint"
            :disabled="!canPrint"
            :loading="isPrintLoading"
            class="mr-3"
          />
          <Button
            label="Back"
            icon="pi pi-arrow-left"
            severity="danger"
            outlined
            @click="goBack"
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

      <!-- Error State -->
      <Message 
        v-else-if="hasError" 
        severity="error" 
        :closable="false"
        class="error-message"
      >
        <div class="error-content">
          <i class="pi pi-exclamation-triangle text-2xl mb-3"></i>
          <h3>{{ errorMessage }}</h3>
          <div class="error-actions">
            <Button 
              label="Try Again" 
              icon="pi pi-refresh"
              @click="refreshBill"
              class="mr-2"
            />
            <Button 
              label="Go Back" 
              icon="pi pi-arrow-left"
              severity="secondary"
              outlined
              @click="goBack"
            />
          </div>
        </div>
      </Message>

      <!-- Bill Content -->
      <div v-else-if="hasValidBill" class="bill-sections">
        <!-- Quick Statistics Panel -->
        <Panel header="Quick Overview" class="stats-panel" toggleable collapsed>
          <div class="quick-stats">
            <div class="stat-item">
              <i class="pi pi-users stat-icon"></i>
              <div class="stat-info">
                <span class="stat-label">Total Guests</span>
                <span class="stat-value">{{ totalGuests }}</span>
              </div>
            </div>
            <div class="stat-item">
              <i class="pi pi-calendar stat-icon"></i>
              <div class="stat-info">
                <span class="stat-label">Total Nights</span>
                <span class="stat-value">{{ totalNights }}</span>
              </div>
            </div>
            <div class="stat-item">
              <i class="pi pi-dollar stat-icon"></i>
              <div class="stat-info">
                <span class="stat-label">Average Rate/Night</span>
                <span class="stat-value">{{ formattedAverageRate }}</span>
              </div>
            </div>
            <div class="stat-item">
              <i class="pi pi-wallet stat-icon"></i>
              <div class="stat-info">
                <span class="stat-label">Grand Total</span>
                <span class="stat-value highlight">{{ formattedTotal }}</span>
              </div>
            </div>
          </div>
        </Panel>
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
                    <Chip 
                      :label="reservationCode" 
                      icon="pi pi-tag"
                      class="reservation-chip"
                    />
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
              <Chip 
                :label="`${totalGuests} Guests`" 
                icon="pi pi-users"
                class="guests-count-chip"
              />
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
    
    <!-- Confirmation Dialog -->
    <ConfirmDialog />

    <!-- Payment Dialog -->
  <Dialog
    :visible="showPaymentDialog"
    header="Complete Payment"
    :modal="true"
    :style="{ width: '30vw' }"
    @update:visible="showPaymentDialog = $event"
  >
    <div class="payment-dialog-content">
      <div class="mb-4">
        <p class="text-600 mb-3">
          Complete payment for this booking. Please select a payment method:
        </p>
        <div class="mb-3 p-3 surface-100 border-round">
          <div class="flex justify-content-between align-items-center">
            <span class="font-semibold">Total Amount:</span>
            <span class="text-xl font-bold text-primary">{{ formatCurrency(bill?.grand_total || 0) }}</span>
          </div>
        </div>
        <div class="flex flex-column gap-3">
          <label for="payment-method" class="font-semibold">Payment Method</label>
          <Dropdown
            id="payment-method"
            v-model="selectedPaymentMethod"
            :options="paymentMethods"
            option-label="label"
            option-value="value"
            placeholder="Select payment method"
            class="w-full"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex gap-2">
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="showPaymentDialog = false; selectedPaymentMethod = ''"
        />
        <Button
          label="Complete Payment"
          icon="pi pi-check"
          :disabled="!selectedPaymentMethod"
          @click="handleCompletePayment"
        />
      </div>
    </template>
  </Dialog>
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

/* Stats Panel Styles */
.stats-panel {
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 1.5rem;
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.75rem;
  border-radius: 0.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-value.highlight {
  color: #059669;
  font-size: 1.5rem;
}

/* Chip Styles */
.reservation-chip {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
  color: white !important;
  border: none !important;
  font-weight: 600;
  padding: 0.5rem 1rem;
}

.guests-count-chip {
  background: linear-gradient(135deg, #059669, #047857) !important;
  color: white !important;
  border: none !important;
  font-weight: 600;
}

/* Error Message Styles */
.error-message {
  margin: 2rem;
  border-radius: 0.75rem;
  border: 1px solid #fee2e2;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
}

.error-content i {
  color: #dc2626;
  margin-bottom: 1rem;
}

.error-content h3 {
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

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

  .quick-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .header-actions .p-button {
    width: 100%;
  }

  .error-actions {
    flex-direction: column;
    width: 100%;
  }

  .error-actions .p-button {
    width: 100%;
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