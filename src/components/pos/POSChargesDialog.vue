<template>
    <Dialog 
        :visible="visible" 
        @update:visible="$emit('update:visible', $event)"
        modal 
        :style="{ width: '95vw', maxWidth: '1200px' }"
        header="POS Charges"
        :closable="false"
    >
        <div class="dialog-info pos-charges-info">
            POS Charges: Post outlet consumption (restaurant meals, bar drinks, spa, minibar, shop, etc.) to the guest's room bill.
        </div>
        <div class="pos-charges-dialog">
            <div class="dialog-layout">
                <!-- Booking Information -->
                <div class="booking-section">
                    <div class="booking-card">
                        <h6>Booking Information</h6>
                        <div class="booking-details">
                            <div class="detail-row">
                                <strong>Guest:</strong> {{ displayedBooking.guestName }}
                            </div>
                            <div class="detail-row">
                                <strong>Room:</strong> {{ displayedBooking.roomNumber }} ({{ displayedBooking.roomType }})
                            </div>
                            <div class="detail-row">
                                <strong>Check-in:</strong> {{ formatDate(displayedBooking.checkInDate) }}
                            </div>
                            <div class="detail-row">
                                <strong>Stay Duration:</strong> {{ stayDuration }} nights
                            </div>
                        </div>
                    </div>
                </div>

                <!-- POS Interface -->
                <div class="pos-section">
                    <div class="outlet-selection">
                        <div class="outlet-toolbar">
                            <div class="outlet-search">
                                <h6>Select Outlet</h6>
                            </div>
                            <div class="outlet-actions">
                                <Button label="Refresh" icon="pi pi-refresh" class="p-button-text" @click="loadOutlets" :loading="loadingOutlets" />
                            </div>
                        </div>
                        <div class="outlet-tabs">
                            <Button 
                                v-for="outlet in outlets"
                                :key="outlet.id"
                                :label="outlet.name"
                                icon="pi pi-store"
                                @click="selectOutlet(outlet)"
                                :class="['outlet-tab', { 'active': selectedOutlet?.id === outlet.id }]"
                            />
                        </div>
                    </div>

                    <div v-if="selectedOutlet" class="pos-content">
                        <!-- Items Grid -->
                        <div class="items-grid">
                            <div class="items-header">
                                <h6>{{ selectedOutlet?.name || 'Outlet' }} Items</h6>
                                <div class="search-bar">
                                    <InputText 
                                        v-model="searchQuery" 
                                        placeholder="Search items..."
                                        class="search-input"
                                    />
                                    <i class="pi pi-search search-icon"></i>
                                </div>
                            </div>

                            <div class="items-container">
                                <template v-for="category in filteredCategories" :key="category.name">
                                    <div class="category-header">{{ category.name }}</div>
                                    <div class="category-grid">
                                        <div 
                                            v-for="item in category.items"
                                            :key="item.id"
                                            class="item-card"
                                            @click="addItem(item)"
                                        >
                                            <div class="item-image">
                                                <img v-if="item.image" :src="item.image" :alt="item.name" />
                                                <i v-else class="pi pi-image item-placeholder"></i>
                                            </div>
                                            <div class="item-info">
                                                <div class="item-name">{{ item.name }}</div>
                                                <div class="item-price">₦{{ formatCurrency(item.price) }}</div>
                                                <div v-if="item.description" class="item-description">
                                                    {{ item.description }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </div>

                            <div v-if="loadingItems" class="items-loading">
                                <ProgressSpinner />
                                <p>Loading items...</p>
                            </div>
                        </div>

                        <!-- Cart -->
                        <div class="cart-section">
                            <div class="cart-header">
                                <h6>Order Summary</h6>
                                <Button 
                                    label="Clear All" 
                                    icon="pi pi-trash" 
                                    @click="clearCart"
                                    :disabled="cartItems.length === 0"
                                    class="p-button-sm p-button-text p-button-danger"
                                />
                            </div>

                            <div class="cart-items">
                                <div 
                                    v-for="(cartItem, index) in cartItems" 
                                    :key="index"
                                    class="cart-item"
                                >
                                    <div class="cart-item-info">
                                        <div class="cart-item-name">{{ cartItem.name }}</div>
                                        <div class="cart-item-price">₦{{ formatCurrency(cartItem.price) }}</div>
                                    </div>
                                    <div class="cart-item-controls">
                                        <div class="quantity-controls">
                                            <Button 
                                                icon="pi pi-minus" 
                                                @click="decreaseQuantity(index)"
                                                class="p-button-sm p-button-outlined quantity-btn"
                                            />
                                            <span class="quantity">{{ cartItem.quantity }}</span>
                                            <Button 
                                                icon="pi pi-plus" 
                                                @click="increaseQuantity(index)"
                                                class="p-button-sm p-button-outlined quantity-btn"
                                            />
                                        </div>
                                        <Button 
                                            icon="pi pi-times" 
                                            @click="removeItem(index)"
                                            class="p-button-sm p-button-text p-button-danger"
                                        />
                                    </div>
                                    <div class="cart-item-total">
                                        ₦{{ formatCurrency(cartItem.price * cartItem.quantity) }}
                                    </div>
                                </div>

                                <div v-if="cartItems.length === 0" class="empty-cart">
                                    <i class="pi pi-shopping-cart"></i>
                                    <p>Add items to start building the order</p>
                                </div>
                            </div>

                            <div class="cart-summary">
                                <div class="summary-row">
                                    <span>Items ({{ totalQuantity }}):</span>
                                    <span>₦{{ formatCurrency(subtotal) }}</span>
                                </div>
                                <div class="summary-row">
                                    <span>Tax ({{ taxRate }}%):</span>
                                    <span>₦{{ formatCurrency(taxAmount) }}</span>
                                </div>
                                <div class="summary-row total">
                                    <span>Total:</span>
                                    <span>₦{{ formatCurrency(total) }}</span>
                                </div>
                            </div>

                            <div class="payment-toggle">
                                <span class="label">Mark as Paid</span>
                                <InputSwitch v-model="markAsPaid" />
                                <span class="status" :class="markAsPaid ? 'paid' : 'pending'">{{ markAsPaid ? 'Paid' : 'Pending' }}</span>
                            </div>

                            <div class="order-notes">
                                <label for="orderNotes">Order Notes</label>
                                <Textarea 
                                    id="orderNotes"
                                    v-model="orderNotes" 
                                    rows="2"
                                    placeholder="Add any special instructions or notes"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    @click="close" 
                    class="p-button-text"
                />
                <Button 
                    label="Post to Room" 
                    icon="pi pi-check" 
                    @click="postCharges"
                    :loading="posting"
                    :disabled="cartItems.length === 0"
                    class="p-button-success"
                />
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { POSService } from '@/service/POSService';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    booking: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['update:visible', 'charges-posted']);

const posService = new POSService();
const toast = useToast();

const selectedOutlet = ref(null);
const loadingItems = ref(false);
const loadingOutlets = ref(false);
const posting = ref(false);
const searchQuery = ref('');
const orderNotes = ref('');
const cartItems = ref([]);
const availableCategories = ref([]);
const taxRate = ref(7.5); // VAT rate
const outlets = ref([]);
const outletFilters = ref({ search: '', status: 'active', page: 1, per_page: 50 });
const markAsPaid = ref(false);

const displayedBooking = computed(() => {
    const b = props.booking || {};
    return {
        guestName: b.guestName || b.guest_name || b.user?.name || 'N/A',
        roomNumber: b.roomNumber || b.room?.name || b.room?.number || b.room_name || 'N/A',
        roomType: b.roomType || b.room?.room_type?.name || b.room?.type?.name || b.room_type || 'N/A',
        checkInDate: b.checkInDate || b.check_in_date || null,
        checkOutDate: b.checkOutDate || b.check_out_date || null,
        id: b.id || b.booking_id
    };
});

const stayDuration = computed(() => {
    const ci = displayedBooking.value.checkInDate;
    const co = displayedBooking.value.checkOutDate;
    if (!ci || !co) return 0;
    const checkIn = new Date(ci);
    const checkOut = new Date(co);
    const diffTime = checkOut - checkIn;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

const filteredCategories = computed(() => {
    if (!searchQuery.value) return availableCategories.value;
    const q = searchQuery.value.toLowerCase();
    // Filter items per category by search
    const mapped = availableCategories.value.map(cat => ({
        name: cat.name,
        items: (cat.items || []).filter(it =>
            it.name?.toLowerCase().includes(q) || it.description?.toLowerCase().includes(q)
        )
    }));
    // hide empty categories
    return mapped.filter(c => c.items.length > 0);
});

const totalQuantity = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0);
});

const subtotal = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const taxAmount = computed(() => {
    return subtotal.value * (taxRate.value / 100);
});

const total = computed(() => {
    return subtotal.value + taxAmount.value;
});

watch(() => props.visible, (newVal) => {
    if (newVal) {
        resetForm();
    }
});

watch(selectedOutlet, (newOutlet) => {
    if (newOutlet?.id) loadItems(newOutlet.id);
});

onMounted(() => {
    if (props.visible) {
        resetForm();
    }
});

const resetForm = () => {
    selectedOutlet.value = null;
    cartItems.value = [];
    availableCategories.value = [];
    searchQuery.value = '';
    orderNotes.value = '';
    markAsPaid.value = false;
    loadOutlets();
};

const selectOutlet = (outlet) => {
    selectedOutlet.value = outlet;
    cartItems.value = []; // Clear cart when switching outlets
};

const loadItems = async (outletId) => {
    loadingItems.value = true;
    try {
        const response = await posService.getPOSItems(outletId);
        if (!response?.success) throw new Error(response?.message || 'Failed to load items');
        // response.data.categories: [{ name, items: [...] }]
        availableCategories.value = response?.data?.categories || [];
    } catch (error) {
        console.error('Error loading POS items:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load outlet items',
            life: 3000
        });
    } finally {
        loadingItems.value = false;
    }
};

const loadOutlets = async () => {
    loadingOutlets.value = true;
    try {
        const response = await posService.getPOSOutlets(outletFilters.value);
        if (!response?.success) throw new Error(response?.message || 'Failed to load outlets');
        // paginated response: data: { data: [ {id, name, ...} ], ... }
        const list = response?.data?.data || response?.data || [];
        outlets.value = Array.isArray(list) ? list : [];
    } catch (error) {
        console.error('Error loading POS outlets:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: error.message || 'Failed to load outlets', life: 3000 });
    } finally {
        loadingOutlets.value = false;
    }
};

const addItem = (item) => {
    const existingIndex = cartItems.value.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingIndex !== -1) {
        cartItems.value[existingIndex].quantity++;
    } else {
        cartItems.value.push({
            ...item,
            quantity: 1
        });
    }
};

const removeItem = (index) => {
    cartItems.value.splice(index, 1);
};

const increaseQuantity = (index) => {
    cartItems.value[index].quantity++;
};

const decreaseQuantity = (index) => {
    if (cartItems.value[index].quantity > 1) {
        cartItems.value[index].quantity--;
    } else {
        removeItem(index);
    }
};

const clearCart = () => {
    cartItems.value = [];
};

const postCharges = async () => {
    if (cartItems.value.length === 0) return;
    posting.value = true;
    try {
        const items = cartItems.value.map(cartItem => ({
            item_id: cartItem.id,
            quantity: cartItem.quantity,
            unit_price: cartItem.price,
            ...(cartItem.modifications?.length ? { modifications: cartItem.modifications } : {})
        }));
        const payload = {
            booking_id: displayedBooking.value.id,
            outlet_id: selectedOutlet.value.id,
            items,
            notes: orderNotes.value || undefined,
            payment_status: markAsPaid.value ? 'paid' : 'pending'
            // server_id, table_number could be added here when UI supports it
        };
        const response = await posService.addPOSCharges(payload);
        if (response?.success) {
            toast.add({ severity: 'success', summary: 'Charges Posted', detail: response?.message || `₦${formatCurrency(total.value)} posted to room ${displayedBooking.value.roomNumber}`, life: 3000 });
            emit('charges-posted', { bookingId: payload.booking_id, payload, outlet: selectedOutlet.value.name, result: response?.data });
            close();
        } else { throw new Error(response?.message || 'Failed to post charges'); }
    } catch (error) {
        console.error('Error posting POS charges:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: error.message || 'Failed to post charges to room', life: 5000 });
    } finally { posting.value = false; }
};

const close = () => {
    emit('update:visible', false);
};

const getOutletLabel = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value?.name || '';
};

const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG').format(amount || 0);
};
</script>

<style scoped>
.pos-charges-dialog {
    max-height: 80vh;
    overflow: hidden;
}

.dialog-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 1.5rem;
    height: 70vh;
}

.booking-section {
    border-right: 1px solid var(--surface-border);
    padding-right: 1.5rem;
}

.booking-card {
    background: var(--surface-50);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 1rem;
    word-break: break-word;
}

.booking-card h6 {
    margin-bottom: 1rem;
    color: var(--text-color);
    font-weight: 600;
}

.booking-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.detail-row {
    font-size: 0.875rem;
}

.pos-section {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.outlet-selection {
    margin-bottom: 1.5rem;
}

.outlet-selection h6 {
    margin-bottom: 1rem;
    color: var(--text-color);
    font-weight: 600;
}

.outlet-tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.outlet-toolbar { display:flex; align-items:center; justify-content: space-between; gap:.5rem; margin-bottom:.75rem; }
.outlet-search { flex:1; min-width: 240px; }
.outlet-actions { white-space: nowrap; }

.outlet-tab {
    border: 1px solid var(--surface-border);
    background: var(--surface-card);
    color: var(--text-color);
}

.outlet-tab.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.pos-content {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 1.5rem;
    flex: 1;
    min-height: 0;
}

@media (max-width: 1400px) {
    .pos-content {
        grid-template-columns: 1fr 360px;
    }
}

.items-grid {
    display: flex;
    flex-direction: column;
}

.items-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.items-header h6 {
    margin: 0;
    color: var(--text-color);
    font-weight: 600;
}

.search-bar {
    position: relative;
    width: 250px;
}

.search-input {
    width: 100%;
    padding-right: 2.5rem;
}

.search-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-color-secondary);
}

.items-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    overflow-y: auto;
    max-height: calc(70vh - 150px);
    padding: 0.5rem;
}

.category-header { font-weight:600; color: var(--text-color); margin: .75rem 0 .25rem; grid-column: 1/-1; }
.category-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap:1rem; }

.item-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
}

.item-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--primary-color);
}

.item-image {
    width: 60px;
    height: 60px;
    margin: 0 auto 0.75rem;
    border-radius: 8px;
    overflow: hidden;
    background: var(--surface-100);
    display: flex;
    align-items: center;
    justify-content: center;
}

.item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.item-placeholder {
    font-size: 1.5rem;
    color: var(--text-color-secondary);
}

.item-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
}

.item-price {
    color: var(--primary-color);
    font-weight: 700;
    margin-bottom: 0.25rem;
}

.item-description {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    line-height: 1.3;
}

.items-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
}

.cart-section {
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    height: fit-content;
}

.cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--surface-border);
}

.cart-header h6 {
    margin: 0;
    color: var(--text-color);
    font-weight: 600;
}

.cart-items {
    flex: 1;
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 1rem;
}

.cart-item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    margin-bottom: 0.5rem;
}

.cart-item:last-child {
    margin-bottom: 0;
}

.cart-item-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.cart-item-name {
    font-weight: 500;
    font-size: 0.875rem;
}

.cart-item-price {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.cart-item-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.quantity-btn {
    width: 28px;
    height: 28px;
    padding: 0;
}

.quantity {
    min-width: 32px;
    text-align: center;
    font-weight: 600;
}

.cart-item-total {
    font-weight: 600;
    color: var(--primary-color);
    text-align: right;
}

.empty-cart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--text-color-secondary);
    text-align: center;
}

.empty-cart i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
}

.cart-summary {
    border-top: 1px solid var(--surface-border);
    padding-top: 1rem;
    margin-bottom: 1rem;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
}

.summary-row:last-child {
    margin-bottom: 0;
}

.summary-row.total {
    font-size: 1rem;
    font-weight: 700;
    color: var(--primary-color);
    padding-top: 0.5rem;
    border-top: 1px solid var(--surface-border);
}

.order-notes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.order-notes label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--text-color);
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.dialog-info { font-size:.75rem; line-height:1.2; padding:.5rem .75rem; border-radius:6px; margin-bottom:1rem; background: var(--surface-50); border-left:4px solid var(--primary-color); color: var(--text-color-secondary); }

@media (max-width: 1024px) {
    .dialog-layout {
        grid-template-columns: 1fr;
        height: auto;
    }
    
    .booking-section {
        border-right: none;
        border-bottom: 1px solid var(--surface-border);
        padding-right: 0;
        padding-bottom: 1.5rem;
    }
    
    .pos-content {
        grid-template-columns: 1fr;
    }
    
    .cart-section {
        order: -1;
    }
}

@media (max-width: 768px) {
    .outlet-tabs {
        gap: 0.25rem;
    }
    
    .outlet-tab {
        font-size: 0.75rem;
        padding: 0.5rem;
    }
    
    .items-container {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
    
    .search-bar {
        width: 200px;
    }
}

@media (max-width: 600px) {
  .cart-item {
    grid-template-columns: 1fr auto;
    grid-template-areas: 'info controls' 'total total';
  }
  .cart-item-info {
    grid-area: info;
  }
  .cart-item-controls {
    grid-area: controls;
  }
  .cart-item-total {
    grid-area: total;
    text-align: right;
  }
}
</style>
