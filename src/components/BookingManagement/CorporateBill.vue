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

interface HallBooking {
  hall_name: string
  hall_price: string
  start_date: string
  end_date: string
  amount: string
}

interface Bill {
  company_name: string
  check_in_date: string
  check_out_date: string
  nights: number
  guests: GuestSummary[]
  meal_plan: MealPlan | null
  halls?: HallBooking[]
  total_accommodation: number
  total_halls_cost?: number
  grand_total: number
  payment_status: 'paid' | 'pending' | 'overdue' | 'cancelled'
  invoice_number?: string
  created_at?: string
  due_date?: string
  notes?: string
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
const currentDate = computed(() => 
  new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
)

const invoiceNumber = computed(() => 
  `INV-${reservationCode.value}-${new Date().getFullYear()}`
)

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
  bill.value ? formatCurrency(bill.value.grand_total) : formatCurrency(0)
)

const totalGuests = computed(() => bill.value?.guests.length || 0)

const totalHalls = computed(() => bill.value?.halls?.length || 0)

const hasHalls = computed(() => totalHalls.value > 0)

const isPaid = computed(() => bill.value?.payment_status === 'paid')

const paymentStatusSeverity = computed(() => {
  if (!bill.value) return 'secondary'
  switch (bill.value.payment_status) {
    case 'paid': return 'success'
    case 'pending': return 'warning'
    case 'overdue': return 'danger'
    default: return 'secondary'
  }
})
const paymentStatusIcon = computed(() => {
  if (!bill.value) return 'pi pi-question'
  switch (bill.value.payment_status) {
    case 'paid': return 'pi pi-check-circle'
    case 'pending': return 'pi pi-clock'
    case 'overdue': return 'pi pi-exclamation-triangle'
    default: return 'pi pi-question'
  }
})

const paymentStatusLabel = computed(() => {
  if (!bill.value) return 'Unknown'
  return bill.value.payment_status.charAt(0).toUpperCase() + bill.value.payment_status.slice(1)
})

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
  formatCurrency(averageRatePerNight.value)
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
        detail: 'Unable to find invoice content for printing',
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
    <!DOCTYPE html>
    <html>
      <head>
        <title>Corporate Bill - ${bill.value?.company_name || 'Unknown Company'}</title>
        <meta charset="UTF-8">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1f2937;
            background: white;
            padding: 20mm;
          }

          .bill-content {
            max-width: 210mm;
            margin: 0 auto;
          }

          /* Header */
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1e293b;
          }

          .hotel-branding {
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }

          .hotel-logo {
            background: #1e293b;
            color: white;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            font-size: 24px;
          }

          .hotel-name {
            font-size: 28px;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 5px;
          }

          .hotel-tagline {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 10px;
          }

          .hotel-contact {
            font-size: 11px;
            color: #64748b;
            line-height: 1.4;
          }

          .invoice-details {
            text-align: right;
          }

          .invoice-title {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 15px;
          }

          .invoice-meta {
            font-size: 12px;
            line-height: 1.6;
          }

          .invoice-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            min-width: 200px;
          }

          .label {
            color: #64748b;
            font-weight: 500;
          }

          .value {
            color: #1e293b;
            font-weight: 600;
          }

          /* Billing parties */
          .billing-parties {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            gap: 40px;
          }

          .bill-to, .stay-details {
            flex: 1;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f9fafb;
          }

          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .company-name {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 10px;
          }

          .billing-address {
            color: #64748b;
          }

          .stay-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .stay-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }

          .stay-label {
            color: #64748b;
            font-weight: 500;
          }

          .stay-value {
            color: #1e293b;
            font-weight: 600;
          }

          /* Table */
          .accommodation-details, .hall-details {
            margin: 30px 0;
          }

          .section-header {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
          }

          th, td {
            padding: 12px 8px;
            text-align: left;
            border: 1px solid #e5e7eb;
          }

          th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .guest-name, .hall-name {
            font-weight: 500;
            color: #1e293b;
          }

          .amount {
            font-weight: 600;
            color: #059669;
            text-align: right;
            font-family: monospace;
          }

          /* Summary */
          .invoice-summary {
            margin: 30px 0;
            max-width: 400px;
            margin-left: auto;
          }

          .summary-items {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }

          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 20px;
            border-bottom: 1px solid #f1f5f9;
          }

          .summary-item:last-child {
            border-bottom: none;
          }

          .summary-label {
            color: #374151;
            font-weight: 500;
          }

          .summary-value {
            font-weight: 600;
            color: #1e293b;
            font-family: monospace;
          }

          .total-item {
            background: #f1f5f9;
            border-top: 2px solid #d1d5db;
          }

          .total-value {
            font-size: 16px;
            font-weight: 700;
            color: #059669;
          }

          /* Terms */
          .terms {
            margin-top: 40px;
            padding: 20px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 10px;
            color: #4b5563;
          }

          .terms h4 {
            font-size: 12px;
            color: #1e293b;
            margin-bottom: 10px;
          }

          .terms ul {
            margin: 10px 0;
            padding-left: 15px;
          }

          .terms li {
            margin-bottom: 5px;
          }

          .invoice-footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
          }

          .thank-you {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 5px;
          }

          @page {
            margin: 20mm;
            size: A4;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="bill-content">
          <!-- Header -->
          <div class="invoice-header">
            <div class="hotel-branding">
              <div class="hotel-logo">🏨</div>
              <div class="hotel-info">
                <div class="hotel-name">Premium Hotel Management</div>
                <div class="hotel-tagline">Excellence in Hospitality</div>
                <div class="hotel-contact">
                  📞 +234 (0) 123 456 7890<br>
                  📧 billing@premiumhotel.com<br>
                  📍 Victoria Island, Lagos, Nigeria
                </div>
              </div>
            </div>
            <div class="invoice-details">
              <div class="invoice-title">CORPORATE INVOICE</div>
              <div class="invoice-meta">
                <div class="invoice-item">
                  <span class="label">Invoice #:</span>
                  <span class="value">${invoiceNumber.value}</span>
                </div>
                <div class="invoice-item">
                  <span class="label">Date:</span>
                  <span class="value">${currentDate.value}</span>
                </div>
                <div class="invoice-item">
                  <span class="label">Reservation:</span>
                  <span class="value">${reservationCode.value}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Billing Parties -->
          <div class="billing-parties">
            <div class="bill-to">
              <div class="section-title">Bill To</div>
              <div class="company-name">${bill.value?.company_name}</div>
              <div class="billing-address">
                Corporate Billing Department<br>
                ${bill.value?.company_name}<br>
                Lagos, Nigeria
              </div>
            </div>
            <div class="stay-details">
              <div class="section-title">Stay Details</div>
              <div class="stay-info">
                <div class="stay-item">
                  <span class="stay-label">Check-in:</span>
                  <span class="stay-value">${formattedCheckIn.value}</span>
                </div>
                <div class="stay-item">
                  <span class="stay-label">Check-out:</span>
                  <span class="stay-value">${formattedCheckOut.value}</span>
                </div>
                <div class="stay-item">
                  <span class="stay-label">Duration:</span>
                  <span class="stay-value">${totalNights.value} nights</span>
                </div>
                <div class="stay-item">
                  <span class="stay-label">Guests:</span>
                  <span class="stay-value">${totalGuests.value} people</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Guest Details Table -->
          <div class="accommodation-details">
            <div class="section-header">Accommodation Details</div>
            <table>
              <thead>
                <tr>
                  <th>Guest Name</th>
                  <th>Room No.</th>
                  <th>Rate/Night</th>
                  <th>Nights</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${bill.value?.guests.map(guest => 
                  `<tr>
                    <td class="guest-name">${guest.full_name}</td>
                    <td>Room ${guest.room_number}</td>
                    <td class="amount">${formatCurrency(guest.rate)}</td>
                    <td>${guest.nights}</td>
                    <td class="amount">${formatCurrency(guest.amount)}</td>
                  </tr>`
                ).join('') || ''}
              </tbody>
            </table>
          </div>

          <!-- Hall Bookings (if any) -->
          ${bill.value?.halls && bill.value.halls.length > 0 ? `
          <div class="hall-details">
            <div class="section-header">Event Halls & Meeting Rooms</div>
            <table>
              <thead>
                <tr>
                  <th>Hall/Room Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Price/Day</th>
                  <th style="text-align: right;">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                ${bill.value.halls.map(hall => 
                  `<tr>
                    <td class="hall-name">${hall.hall_name}</td>
                    <td>${new Date(hall.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>${new Date(hall.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>${calculateDuration(hall.start_date, hall.end_date)}</td>
                    <td class="amount">${formatCurrency(parseFloat(hall.hall_price))}</td>
                    <td class="amount">${formatCurrency(parseFloat(hall.amount))}</td>
                  </tr>`
                ).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <!-- Invoice Summary -->
          <div class="invoice-summary">
            <div class="section-header">Invoice Summary</div>
            <div class="summary-items">
              <div class="summary-item">
                <span class="summary-label">Accommodation Total:</span>
                <span class="summary-value">${formatCurrency(bill.value?.total_accommodation || 0)}</span>
              </div>
              ${bill.value?.halls && bill.value.halls.length > 0 ? 
                `<div class="summary-item">
                  <span class="summary-label">Event Halls Total:</span>
                  <span class="summary-value">${formatCurrency(bill.value?.total_halls_cost || 0)}</span>
                </div>`
                : ''}
              ${bill.value?.meal_plan ? 
                `<div class="summary-item">
                  <span class="summary-label">Meal Plan (${bill.value.meal_plan.name}):</span>
                  <span class="summary-value">${formatCurrency(bill.value.meal_plan.total_meal_cost)}</span>
                </div>`
                : ''}
              <div class="summary-item">
                <span class="summary-label">VAT (7.5%):</span>
                <span class="summary-value">${formatCurrency((bill.value?.grand_total || 0) * 0.075)}</span>
              </div>
              <div class="summary-item total-item">
                <span class="summary-label"><strong>Total Amount Due:</strong></span>
                <span class="summary-value total-value">${formatCurrency(bill.value?.grand_total || 0)}</span>
              </div>
            </div>
          </div>

          <!-- Terms -->
          <div class="terms">
            <h4>Terms & Conditions</h4>
            <ul>
              <li>Payment is due within 30 days of invoice date.</li>
              <li>Late payments may incur additional charges.</li>
              <li>All rates are inclusive of service charges unless stated otherwise.</li>
              <li>Cancellation policies apply as per booking agreement.</li>
              <li>Disputes must be reported within 7 days of invoice receipt.</li>
            </ul>
            <div class="invoice-footer">
              <div class="thank-you">Thank you for choosing Premium Hotel Management!</div>
              <div>For billing inquiries, contact us at billing@premiumhotel.com or +234 (0) 123 456 7890</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function () {
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 500);
            }, 500);
          };
        <\/script>
      </body>
    </html>
  `);

    printWindow.document.close();
    
    toast.add({
      severity: 'success',
      summary: 'Print Ready',
      detail: 'Professional invoice is ready for printing',
      life: 3000,
    });
  } catch (error) {
    console.error('Print error:', error)
    toast.add({
      severity: 'error',
      summary: 'Print Error',
      detail: 'An error occurred while preparing the invoice for printing',
      life: 4000,
    });
  } finally {
    isPrintLoading.value = false
  }
};


const goBack = () => {
  router.push({ name: 'CorporateBookings' })
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

const calculateDuration = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`
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
    <!-- Professional Header Section -->
    <div class="bill-header">
      <div class="header-content">
        <!-- Hotel Branding -->
        <div class="hotel-branding">
          <div class="hotel-logo">
            <i class="pi pi-building text-4xl text-white"></i>
          </div>
          <div class="hotel-info">
            <h1 class="hotel-name">Premium Hotel Management</h1>
            <p class="hotel-tagline">Excellence in Hospitality</p>
            <div class="hotel-contact">
              <span><i class="pi pi-phone mr-1"></i> +234 (0) 123 456 7890</span>
              <span><i class="pi pi-envelope mr-1"></i> billing@premiumhotel.com</span>
              <span><i class="pi pi-map-marker mr-1"></i> Victoria Island, Lagos, Nigeria</span>
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="header-actions">
          <Button
            label="Back"
            icon="pi pi-arrow-left"
            severity="secondary"
            text
            @click="goBack"
            class="back-button"
          />
          <Button
            v-if="!isPaid"
            label="Complete Payment"
            icon="pi pi-credit-card"
            severity="success"
            @click="showPaymentDialog = true"
          />
          <Button
            label="Print Invoice"
            icon="pi pi-print"
            severity="secondary"
            outlined
            @click="confirmPrint"
            :disabled="!canPrint"
            :loading="isPrintLoading"
          />
          <Button
            label="Download PDF"
            icon="pi pi-download"
            severity="info"
            outlined
            @click="downloadBill"
            :disabled="!canDownload"
            :loading="isDownloading"
          />
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            severity="secondary"
            text
            @click="refreshBill"
            :disabled="isLoading"
          />
        </div>
        <!-- Invoice Details -->
        <div class="invoice-details">              
       
          <div class="invoice-header">
            <h2 class="invoice-title">CORPORATE BILL</h2>
          </div>
          <div class="invoice-meta">
            <div class="invoice-item">
              <span class="label">Payment Status: </span>
            <span class="value"><Badge :value="paymentStatusLabel" :severity="paymentStatusSeverity"  />
                </span>
            </div>
            <div class="invoice-item">
              <span class="label">Invoice #:</span>
              <span class="value">{{ invoiceNumber }}</span>
            </div>
            <div class="invoice-item">
              <span class="label">Date Issued:</span>
              <span class="value">{{ currentDate }}</span>
            </div>
            <div class="invoice-item">
              <span class="label">Reservation:</span>
              <span class="value">{{ reservationCode }}</span>
            </div>
          </div>
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
            <h3 class="loading-title">Loading Invoice Details</h3>
            <p class="loading-text">Please wait while we prepare your corporate invoice...</p>
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

      <!-- Invoice Content -->
      <div v-else-if="hasValidBill" class="invoice-sections">
        <!-- Company and Billing Information -->
        <div class="billing-parties">
          <Card class="bill-to-card">
            <template #title>
              <div class="card-header">
                <i class="pi pi-building"></i>
                <span>Bill To</span>
              </div>
            </template>
            <template #content>
              <div class="company-details">
                <h3 class="company-name">{{ bill.company_name }}</h3>
                <div class="billing-address">
                  <p class="address-line">Corporate Billing Department</p>
                  <p class="address-line">{{ bill.company_name }}</p>
                  <p class="address-line">Lagos, Nigeria</p>
                </div>
              </div>
            </template>
          </Card>

          <Card class="stay-details-card">
            <template #title>
              <div class="card-header">
                <i class="pi pi-calendar"></i>
                <span>Stay Details</span>
              </div>
            </template>
            <template #content>
              <div class="stay-info">
                <div class="stay-item">
                  <span class="stay-label">Check-in:</span>
                  <span class="stay-value">{{ formattedCheckIn }}</span>
                </div>
                <div class="stay-item">
                  <span class="stay-label">Check-out:</span>
                  <span class="stay-value">{{ formattedCheckOut }}</span>
                </div>
                <div class="stay-item">
                  <span class="stay-label">Duration:</span>
                  <span class="stay-value">{{ totalNights }} nights</span>
                </div>
                <div class="stay-item">
                  <span class="stay-label">Guests:</span>
                  <span class="stay-value">{{ totalGuests }} people</span>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Guest Accommodation Details -->
        <Card class="accommodation-card">
          <template #title>
            <div class="card-header">
              <i class="pi pi-users"></i>
              <span>Accommodation Details</span>
            </div>
          </template>
          <template #content>
            <DataTable 
              :value="bill.guests" 
              responsiveLayout="scroll" 
              class="professional-table"
              stripedRows
              :paginator="bill.guests.length > 10"
              :rows="10"
              :showGridlines="true"
            >
              <Column field="full_name" header="Guest Name" sortable class="name-column">
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
              <Column field="room_number" header="Room No." sortable class="room-column">
                <template #body="slotProps">
                  <Badge :value="'Room ' + slotProps.data.room_number" severity="info" />
                </template>
              </Column>
              <Column field="rate" header="Rate/Night" sortable class="rate-column">
                <template #body="slotProps">
                  <span class="amount-text">{{ formatCurrency(slotProps.data.rate) }}</span>
                </template>
              </Column>
              <Column field="nights" header="Nights" sortable class="nights-column">
                <template #body="slotProps">
                  <span class="nights-value">{{ slotProps.data.nights }}</span>
                </template>
              </Column>
              <Column field="amount" header="Subtotal" sortable class="amount-column">
                <template #body="slotProps">
                  <span class="subtotal-amount">{{ formatCurrency(slotProps.data.amount) }}</span>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <!-- Hall Bookings Details -->
        <Card v-if="hasHalls" class="halls-card">
          <template #title>
            <div class="card-header">
              <i class="pi pi-home"></i>
              <span>Event Halls & Meeting Rooms</span>
              <Chip 
                :label="`${totalHalls} ${totalHalls === 1 ? 'Hall' : 'Halls'}`" 
                icon="pi pi-home"
                class="halls-count-chip"
              />
            </div>
          </template>
          <template #content>
            <DataTable 
              :value="bill.halls" 
              responsiveLayout="scroll" 
              class="professional-table halls-table"
              stripedRows
              :paginator="bill.halls && bill.halls.length > 5"
              :rows="5"
              :showGridlines="true"
            >
              <Column field="hall_name" header="Hall/Room Name" sortable class="hall-name-column">
                <template #body="slotProps">
                  <div class="hall-cell">
                    <i class="pi pi-home hall-icon"></i>
                    <div class="hall-info">
                      <span class="hall-name">{{ slotProps.data.hall_name }}</span>
                    </div>
                  </div>
                </template>
              </Column>
              <Column field="start_date" header="Start Date" sortable class="date-column">
                <template #body="slotProps">
                  <div class="booking-date">
                    <i class="pi pi-calendar text-blue-600 mr-1"></i>
                    {{ new Date(slotProps.data.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) }}
                  </div>
                </template>
              </Column>
              <Column field="end_date" header="End Date" sortable class="date-column">
                <template #body="slotProps">
                  <div class="booking-date">
                    <i class="pi pi-calendar text-red-600 mr-1"></i>
                    {{ new Date(slotProps.data.end_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) }}
                  </div>
                </template>
              </Column>
              <Column field="duration" header="Duration" sortable class="duration-column">
                <template #body="slotProps">
                  <div class="duration-badge">
                    {{ calculateDuration(slotProps.data.start_date, slotProps.data.end_date) }}
                  </div>
                </template>
              </Column>
              <Column field="hall_price" header="Price/Day" sortable class="price-column">
                <template #body="slotProps">
                  <span class="price-text">{{ formatCurrency(parseFloat(slotProps.data.hall_price)) }}</span>
                </template>
              </Column>
              <Column field="amount" header="Total Amount" sortable class="amount-column">
                <template #body="slotProps">
                  <span class="hall-total-amount">{{ formatCurrency(parseFloat(slotProps.data.amount)) }}</span>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <!-- Cost Summary -->
        <Card class="summary-card">
          <template #title>
            <div class="card-header">
              <i class="pi pi-calculator"></i>
              <span>Invoice Summary</span>
            </div>
          </template>
          <template #content>
            <div class="invoice-summary">
              <div class="summary-items">
                <div class="summary-item">
                  <span class="summary-label">Accommodation Total:</span>
                  <span class="summary-value">{{ formatCurrency(bill.total_accommodation) }}</span>
                </div>
                <div v-if="hasHalls" class="summary-item">
                  <span class="summary-label">Event Halls Total:</span>
                  <span class="summary-value">{{ formatCurrency(bill.total_halls_cost || 0) }}</span>
                </div>
                <div v-if="bill.meal_plan" class="summary-item">
                  <span class="summary-label">
                    Meal Plan ({{ bill.meal_plan.name }}):
                    <small class="meal-details">{{ formatCurrency(bill.meal_plan.rate_per_day) }}/day</small>
                  </span>
                  <span class="summary-value">{{ formatCurrency(bill.meal_plan.total_meal_cost) }}</span>
                </div>
                <div class="summary-item tax-item">
                  <span class="summary-label">VAT (7.5%):</span>
                  <span class="summary-value">{{ formatCurrency(bill.grand_total * 0.075) }}</span>
                </div>
                <Divider class="summary-divider" />
                <div class="summary-item total-item">
                  <span class="summary-label">
                    <strong>Total Amount Due:</strong>
                  </span>
                  <span class="summary-value total-value">{{ formattedTotal }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Terms and Conditions -->
        <Card class="terms-card print-visible">
          <template #title>
            <div class="card-header">
              <i class="pi pi-file-text"></i>
              <span>Terms & Conditions</span>
            </div>
          </template>
          <template #content>
            <div class="terms-content">
              <ul class="terms-list">
                <li>Payment is due within 30 days of invoice date.</li>
                <li>Late payments may incur additional charges.</li>
                <li>All rates are inclusive of service charges unless stated otherwise.</li>
                <li>Cancellation policies apply as per booking agreement.</li>
                <li>Disputes must be reported within 7 days of invoice receipt.</li>
              </ul>
              <div class="invoice-footer">
                <p class="thank-you">Thank you for choosing Premium Hotel Management!</p>
                <p class="contact-info">For billing inquiries, contact us at billing@premiumhotel.com or +234 (0) 123 456 7890</p>
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
      :style="{ width: '450px' }"
      @update:visible="showPaymentDialog = $event"
      class="payment-dialog"
    >
      <div class="payment-dialog-content">
        <div class="payment-summary">
          <div class="payment-amount-display">
            <span class="amount-label">Total Amount:</span>
            <span class="amount-value">{{ formatCurrency(bill?.grand_total || 0) }}</span>
          </div>
        </div>
        
        <div class="payment-method-selection">
          <label for="payment-method" class="payment-method-label">Select Payment Method</label>
          <Dropdown
            id="payment-method"
            v-model="selectedPaymentMethod"
            :options="paymentMethods"
            option-label="label"
            option-value="value"
            placeholder="Choose payment method"
            class="w-full payment-dropdown"
          />
        </div>
      </div>
      
      <template #footer>
        <div class="payment-dialog-footer">
          <Button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="showPaymentDialog = false; selectedPaymentMethod = ''"
          />
          <Button
            label="Complete Payment"
            icon="pi pi-check"
            severity="success"
            :disabled="!selectedPaymentMethod"
            @click="handleCompletePayment"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Professional Invoice Styling */
.corporate-bill {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}

/* Professional Header */
.bill-header {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: white;
  padding: 4rem 0 3rem 0;
  position: relative;
  overflow: hidden;
}

.bill-header::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="80" cy="80" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="40" cy="60" r="1" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
  align-items: start;
  position: relative;
  z-index: 1;
}

/* Hotel Branding */
.hotel-branding {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.hotel-logo {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  padding: 1.25rem;
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  min-height: 80px;
}

.hotel-info {
  flex: 1;
}

.hotel-name {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hotel-tagline {
  font-size: 1.1rem;
  color: #cbd5e1;
  margin: 0 0 1rem 0;
  font-weight: 500;
}

.hotel-contact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #e2e8f0;
}

.hotel-contact span {
  display: flex;
  align-items: center;
}

.hotel-contact i {
  width: 16px;
  color: #64748b;
}

/* Invoice Details */
.invoice-details {
  text-align: right;
}

.invoice-header {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.invoice-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: white;
  letter-spacing: -0.025em;
}

.payment-status-badge {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
}

.invoice-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.invoice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 280px;
}

.invoice-item .label {
  font-weight: 500;
  color: #cbd5e1;
  font-size: 0.875rem;
}

.invoice-item .value {
  font-weight: 600;
  color: white;
  font-size: 0.95rem;
}

/* Header Actions */
.header-actions {
  position: absolute;
  bottom: 13rem;
  right: 2rem;
  display: flex;
  gap: 0.75rem;
  z-index: 2;
}

.back-button {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  backdrop-filter: blur(10px);
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

/* Main Content */
.bill-content {
  max-width: 1200px;
  margin: -2rem auto 0;
  padding: 0 2rem 4rem;
  position: relative;
  z-index: 1;
}

/* Loading and Error States */
.loading-card,
.error-message {
  background: white;
  border: none;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  margin-bottom: 2rem;
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

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 2rem;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

/* Invoice Sections */
.invoice-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Billing Parties */
.billing-parties {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.bill-to-card,
.stay-details-card {
  background: white;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 1rem;
  overflow: hidden;
}

.company-details {
  padding: 0.5rem 0;
}

.company-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.billing-address {
  color: #64748b;
  line-height: 1.6;
}

.address-line {
  margin: 0.25rem 0;
}

.stay-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stay-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.stay-item:last-child {
  border-bottom: none;
}

.stay-label {
  font-weight: 500;
  color: #64748b;
}

.stay-value {
  font-weight: 600;
  color: #1e293b;
}

/* Cards */
.accommodation-card,
.halls-card,
.summary-card,
.terms-card {
  background: white;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 1rem;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #1e293b;
  font-weight: 600;
  font-size: 1.1rem;
}

.card-header i {
  color: #3b82f6;
  font-size: 1.2rem;
}

/* Halls Count Chip */
.halls-count-chip {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
  color: white !important;
  border: none !important;
  font-weight: 600;
  margin-left: auto;
}

/* Professional Table */
.professional-table {
  border-radius: 0;
  border: none;
  box-shadow: none;
}

.professional-table :deep(.p-datatable-thead > tr > th) {
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem;
  border: none;
  border-bottom: 2px solid #e5e7eb;
}

.professional-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.95rem;
}

.professional-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8fafc;
}

.guest-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.guest-avatar {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
}

.guest-name {
  font-weight: 500;
  color: #1e293b;
}

.amount-text,
.subtotal-amount {
  font-weight: 600;
  color: #059669;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.nights-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  color: #1e40af;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 2rem;
  height: 1.75rem;
}

/* Halls Table Styles */
.hall-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hall-icon {
  color: #f59e0b;
  font-size: 1.2rem;
  background: #fef3c7;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.hall-info {
  display: flex;
  flex-direction: column;
}

.hall-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.booking-date {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #374151;
}

.duration-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ecfdf5;
  color: #065f46;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #d1fae5;
}

.price-text,
.hall-total-amount {
  font-weight: 600;
  color: #f59e0b;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.hall-total-amount {
  color: #059669;
  font-size: 1.05rem;
}

/* Invoice Summary */
.invoice-summary {
  max-width: 500px;
  margin-left: auto;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0;
}

.summary-label {
  color: #374151;
  font-size: 0.95rem;
  flex: 1;
}

.meal-details {
  display: block;
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.summary-value {
  font-weight: 600;
  color: #1e293b;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  margin-left: 2rem;
}

.tax-item {
  color: #6b7280;
  font-size: 0.9rem;
}

.summary-divider {
  margin: 0.5rem 0;
}

.total-item {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  margin: 0.5rem -1rem 0;
  padding: 1.25rem 1.5rem;
  border-radius: 0.75rem;
  border: 2px solid #cbd5e1;
}

.total-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
}

/* Terms and Conditions */
.terms-content {
  color: #4b5563;
  font-size: 0.9rem;
  line-height: 1.6;
}

.terms-list {
  margin: 0;
  padding-left: 1.25rem;
  list-style-type: disc;
}

.terms-list li {
  margin-bottom: 0.5rem;
  color: #6b7280;
}

.invoice-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.thank-you {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.contact-info {
  color: #6b7280;
  margin: 0;
}

/* Payment Dialog */
.payment-dialog :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: white;
  border-radius: 0.75rem 0.75rem 0 0;
}

.payment-dialog :deep(.p-dialog-title) {
  color: white;
  font-weight: 600;
}

.payment-dialog-content {
  padding: 1.5rem 0;
}

.payment-summary {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}

.payment-amount-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-label {
  font-weight: 500;
  color: #374151;
  font-size: 1rem;
}

.amount-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.payment-method-selection {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.payment-method-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.payment-dropdown {
  font-size: 0.95rem;
}

.payment-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0;
}

/* Print Styles */
@media print {
  .corporate-bill {
    background: white;
    color: black;
  }

  .bill-header {
    background: white;
    color: black;
    border-bottom: 2px solid #000;
    page-break-after: avoid;
  }

  .hotel-name {
    -webkit-text-fill-color: black;
    color: black;
  }

  .hotel-tagline,
  .hotel-contact {
    color: #666;
  }

  .invoice-title {
    color: black;
  }

  .header-actions,
  .print\:hidden {
    display: none !important;
  }

  .accommodation-card,
  .halls-card,
  .summary-card,
  .terms-card,
  .bill-to-card,
  .stay-details-card {
    background: white;
    box-shadow: none;
    border: 1px solid #ddd;
    page-break-inside: avoid;
  }

  .professional-table :deep(.p-datatable-thead > tr > th) {
    background: #f5f5f5;
    border: 1px solid #ddd;
  }

  .professional-table :deep(.p-datatable-tbody > tr > td) {
    border: 1px solid #ddd;
  }

  .total-item {
    background: #f9f9f9;
    border: 2px solid #333;
  }

  .print-visible {
    display: block !important;
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-content {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .invoice-details {
    text-align: center;
  }

  .invoice-item {
    justify-content: center;
    margin: 0 auto;
  }

  .header-actions {
    position: static;
    justify-content: center;
    margin-top: 2rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .billing-parties {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .bill-content {
    padding: 0 1rem 3rem;
  }

  .header-content {
    padding: 0 1rem;
  }

  .hotel-branding {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }

  .hotel-name {
    font-size: 2rem;
  }

  .invoice-title {
    font-size: 1.5rem;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .professional-table :deep(.p-datatable-wrapper) {
    overflow-x: auto;
  }

  .invoice-summary {
    margin: 0;
  }

  .summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .summary-value {
    margin-left: 0;
  }

  .payment-dialog {
    width: 95vw !important;
  }
}

@media (max-width: 480px) {
  .hotel-contact {
    font-size: 0.8rem;
  }

  .invoice-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .billing-parties {
    gap: 1rem;
  }

  .invoice-sections {
    gap: 1.5rem;
  }
}
</style>