<template>
  <div class="guest-bill" ref="billContent">
    <div class="bill-header">
      <div class="logo">
        <img src="/img/kasuwa24-logo.png" alt="Hotel Logo" />
      </div>
      <div class="hotel-info">
        <h1>Guest Bill</h1>
        <p><strong>Kasuwa24/7 Hotel & Suites</strong></p>
        <p>123 Luxury Avenue, Abuja, Nigeria</p>
        <p>Phone: (123) 456-7890 | Email: reservations@kasuwa247.com</p>
      </div>
    </div>

    <div class="bill-meta">
        <div class="meta-item">
            <span class="meta-label">Invoice #</span>
            <span class="meta-value">{{ booking.reservation_code }}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Date Issued</span>
            <span class="meta-value">{{ new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</span>
        </div>
    </div>

    <div class="bill-details">
      <div class="guest-info-card">
        <h4>Billed To</h4>
        <p><strong>{{ guest.full_name }}</strong></p>
        <p v-if="guest.email">{{ guest.email }}</p>
        <p v-if="guest.phone">{{ guest.phone }}</p>
      </div>
      <div class="booking-info-card">
        <h4>Booking Details</h4>
        <p><strong>Check-in:</strong> {{ formatDateTime(booking.check_in_date) }}</p>
        <p><strong>Check-out:</strong> {{ formatDateTime(booking.check_out_date) }}</p>
        <p><strong>Room:</strong> {{ guest.room.name }} ({{ guest.room.roomType?.name || 'Standard' }})</p>
      </div>
    </div>

    <div class="bill-items">
      <h4>Charges Summary</h4>
      <table>
        <thead>
          <tr>
            <th class="item-col">Item</th>
            <th class="desc-col">Description</th>
            <th class="rate-col">Rate</th>
            <th class="qty-col">Qty</th>
            <th class="amount-col">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="item-col">Room Charge</td>
            <td class="desc-col">Accommodation in Room {{ guest.room.name }}</td>
            <td class="rate-col">{{ formatCurrency(guest.room.price) }}</td>
            <td class="qty-col">{{ nights }} night(s)</td>
            <td class="amount-col">{{ formatCurrency(totalRoomCharge) }}</td>
          </tr>
          <!-- Add other charges here if any -->
        </tbody>
      </table>
    </div>

    <div class="bill-summary">
        <div class="summary-item">
            <span class="summary-label">Subtotal</span>
            <span class="summary-value">{{ formatCurrency(totalRoomCharge) }}</span>
        </div>
        <!-- <div class="summary-item">
            <span class="summary-label">VAT (7.5%)</span>
            <span class="summary-value">{{ formatCurrency(vat) }}</span>
        </div> -->
        <div class="summary-item total">
            <span class="summary-label">Total Amount Due</span>
            <span class="summary-value">{{ formatCurrency(grandTotal) }}</span>
        </div>
    </div>

    <div class="bill-footer">
      <div class="notes">
        <h5>Notes</h5>
        <p>Thank you for choosing Kasuwa24/7 Hotel & Suites. We hope you enjoyed your stay.</p>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <p>Authorized Signature</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, toRefs } from 'vue';

const props = defineProps({
  guest: {
    type: Object,
    required: true,
  },
  booking: {
    type: Object,
    required: true,
  },
});

const { guest, booking } = toRefs(props);

const nights = computed(() => {
  const checkIn = new Date(booking.value.check_in_date);
  const checkOut = new Date(booking.value.check_out_date);
  const diffTime = Math.abs(checkOut - checkIn);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1; // Minimum 1 night
});

const totalRoomCharge = computed(() => {
  return nights.value * guest.value.room.price;
});

const vat = computed(() => {
    return totalRoomCharge.value * 0.075;
});

// const grandTotal = computed(() => {
//     return totalRoomCharge.value + vat.value;
// });
const grandTotal = totalRoomCharge.value;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.guest-bill {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  color: #4a5568;
  padding: 2.5rem;
  background: white;
  max-width: 800px;
  margin: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #1a202c;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.logo img {
  max-width: 120px;
}

.hotel-info {
  text-align: right;
}

.hotel-info h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
}

.hotel-info p {
  margin: 0.2rem 0;
  font-size: 0.875rem;
}

.bill-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2rem;
    background: #f7fafc;
    padding: 0.75rem 1.25rem;
    border-radius: 6px;
}

.meta-item {
    display: flex;
    flex-direction: column;
}

.meta-label {
    font-size: 0.75rem;
    color: #718096;
    margin-bottom: 0.25rem;
}

.meta-value {
    font-weight: 600;
    font-size: 0.875rem;
}

.bill-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2.5rem;
}

.guest-info-card, .booking-info-card {
    background: #f7fafc;
    padding: 1.25rem;
    border-radius: 6px;
}

.guest-info-card h4, .booking-info-card h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #2d3748;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 0.5rem;
}

.guest-info-card p, .booking-info-card p {
    margin: 0.25rem 0;
    font-size: 0.875rem;
}

.bill-items {
  margin-bottom: 2rem;
}

.bill-items h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

thead th {
  background-color: #edf2f7;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #718096;
  font-weight: 600;
}

tbody tr:last-child td {
    border-bottom: none;
}

.item-col { width: 25%; }
.desc-col { width: 40%; }
.rate-col, .qty-col { width: 15%; }
.amount-col { width: 15%; text-align: right; }

td.amount-col {
    font-weight: 600;
    color: #2d3748;
}

.bill-summary {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-bottom: 2.5rem;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 300px;
    padding: 0.5rem 0;
}

.summary-label {
    color: #718096;
}

.summary-value {
    font-weight: 600;
    color: #2d3748;
}

.summary-item.total {
    font-size: 1.125rem;
    border-top: 2px solid #1a202c;
    margin-top: 0.5rem;
    padding-top: 0.75rem;
}

.summary-item.total .summary-label, .summary-item.total .summary-value {
    font-weight: 700;
    color: #1a202c;
}

.bill-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.notes h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
}

.notes p {
  font-size: 0.8rem;
  color: #718096;
  max-width: 350px;
}

.signature {
  text-align: center;
}

.signature-line {
  border-bottom: 1px solid #4a5568;
  width: 220px;
  margin-top: 3rem;
  margin-bottom: 0.5rem;
}

.signature p {
    font-size: 0.875rem;
    font-weight: 500;
}

@media print {
  body, .guest-bill {
    background: white;
    margin: 0;
    padding: 0;
    font-size: 10pt;
  }
  .guest-bill {
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
  .bill-header, .bill-footer {
      page-break-inside: avoid;
  }
  .bill-items table {
      page-break-inside: auto;
  }
  tbody tr {
      page-break-inside: avoid;
  }
}
</style>
