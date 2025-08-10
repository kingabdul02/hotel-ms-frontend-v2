<template>
    <div class="availability-calendar">
        <div class="card">
            <div class="card-header">
                <h5>Room Availability & Pricing Calendar</h5>
                <div class="calendar-controls">
                    <Calendar 
                        v-model="dateRange" 
                        selection-mode="range" 
                        :inline="false"
                        show-icon
                        :minDate="today"
                        placeholder="Select date range"
                        @date-select="onDateRangeSelect"
                    />
                    <Button 
                        label="Refresh" 
                        icon="pi pi-refresh" 
                        @click="refreshData"
                        :loading="loading"
                    />
                </div>
            </div>

            <!-- Legend -->
            <div class="calendar-legend" v-if="!loading">
                <div class="legend-item"><span class="legend-color no-availability"></span> Sold Out</div>
                <div class="legend-item"><span class="legend-color low-availability"></span> Low (&le;25%)</div>
                <div class="legend-item"><span class="legend-color medium-availability"></span> Medium (&le;50%)</div>
                <div class="legend-item"><span class="legend-color high-availability"></span> High (&gt;50%)</div>
                <div class="legend-separator"></div>
                <div class="legend-badge"><span class="badge badge-checkin">CI</span> Check-Ins</div>
                <div class="legend-badge"><span class="badge badge-checkout">CO</span> Check-Outs</div>
                <div class="legend-badge"><span class="badge badge-stayover">SO</span> Stayovers</div>
            </div>

            <div class="calendar-content" v-if="!loading">
                <div class="calendar-table">
                    <div class="table-header">
                        <div class="room-type-column">Room Type</div>
                        <div 
                            v-for="date in calendarDates" 
                            :key="date"
                            class="date-column"
                            :class="{ today: isToday(date) }"
                        >
                            {{ formatDateHeader(date) }}
                        </div>
                    </div>

                    <div 
                        v-for="roomType in roomTypes" 
                        :key="roomType.id"
                        class="table-row"
                    >
                        <div class="room-type-cell">
                            <div class="room-type-name">{{ roomType.name }}</div>
                            <div class="room-type-total">{{ roomType.totalRooms }} rooms</div>
                        </div>
                        
                        <div 
                            v-for="date in calendarDates" 
                            :key="`${roomType.id}-${date}`"
                            class="availability-cell"
                            :class="[getAvailabilityClass(roomType.id, date), { clickable: true, today: isToday(date) }]"
                            @click="openCellDetails(roomType, date)"
                        >
                            <div class="availability-info">
                                <div class="available-count">
                                    {{ getAvailableCount(roomType.id, date) }} / {{ roomType.totalRooms }}
                                </div>
                                <div class="daily-rate">
                                    ₦{{ formatCurrency(getDailyRate(roomType.id, date)) }}
                                </div>
                                <div class="badges" v-if="showBadges(roomType.id, date)">
                                    <span class="badge badge-checkin" v-if="getCheckInCount(roomType.id, date)" :title="getCheckInCount(roomType.id, date) + ' check-ins'">
                                        CI {{ getCheckInCount(roomType.id, date) }}
                                    </span>
                                    <span class="badge badge-checkout" v-if="getCheckOutCount(roomType.id, date)" :title="getCheckOutCount(roomType.id, date) + ' check-outs'">
                                        CO {{ getCheckOutCount(roomType.id, date) }}
                                    </span>
                                    <span class="badge badge-stayover" v-if="getStayOverCount(roomType.id, date)" :title="getStayOverCount(roomType.id, date) + ' stayovers'">
                                        SO {{ getStayOverCount(roomType.id, date) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="loading-state">
                <ProgressSpinner />
                <p>Loading availability data...</p>
            </div>
        </div>

        <!-- Cell Detail Dialog -->
        <Dialog v-model:visible="cellDialogVisible" :modal="true" :header="dialogHeader" class="cell-dialog" :style="{ width: '600px' }">
            <template v-if="selectedCell">
                <div class="cell-dialog-section">
                    <h6>Availability</h6>
                    <p>
                        <strong>{{ selectedCell.available }}</strong> available out of <strong>{{ selectedCell.total }}</strong> rooms.
                        Rate: ₦{{ formatCurrency(selectedCell.rate) }}
                    </p>
                    <Button size="small" icon="pi pi-plus" label="Book Room" :disabled="!selectedCell.available" @click="openQuickBooking" />
                </div>
                <div class="cell-dialog-section" v-if="selectedCell.checkIns && selectedCell.checkIns.length">
                    <h6>Expected Check-Ins ({{ selectedCell.checkIns.length }})</h6>
                    <ul class="mini-list">
                        <li v-for="b in selectedCell.checkIns" :key="b.id">
                            <span class="guest-name">{{ b.guest_name || b.guestName || 'Guest' }}</span>
                            <span class="booking-ref">#{{ b.reference || b.code || b.id }}</span>
                        </li>
                    </ul>
                </div>
                <div class="cell-dialog-section" v-if="selectedCell.checkOuts && selectedCell.checkOuts.length">
                    <h6>Expected Check-Outs ({{ selectedCell.checkOuts.length }})</h6>
                    <ul class="mini-list">
                        <li v-for="b in selectedCell.checkOuts" :key="b.id">
                            <span class="guest-name">{{ b.guest_name || b.guestName || 'Guest' }}</span>
                            <span class="booking-ref">#{{ b.reference || b.code || b.id }}</span>
                        </li>
                    </ul>
                </div>
                <div class="cell-dialog-section" v-if="selectedCell.availableRooms && selectedCell.availableRooms.length">
                    <h6>Free Rooms ({{ selectedCell.availableRooms.length }})</h6>
                    <div class="room-chips">
                        <span class="room-chip" v-for="r in selectedCell.availableRooms" :key="r.id || r.number">{{ r.number || r.name || r.id }}</span>
                    </div>
                </div>
            </template>
        </Dialog>

        <!-- Quick Booking Dialog -->
        <Dialog v-model:visible="quickBookingVisible" header="Quick Book Room" :modal="true" :style="{ width: '520px' }" :closable="true">
            <template v-if="selectedCell">
                <div class="qb-section">
                    <div class="qb-label">Room Type</div>
                    <div class="qb-value">{{ selectedCell.roomTypeName }}</div>
                </div>
                <div class="qb-grid">
                    <div class="qb-field full">
                        <label class="qb-label">Check-In / Check-Out</label>
                        <Calendar 
                            v-model="quickBookingDateRange" 
                            selection-mode="range" 
                            date-format="yy-mm-dd" 
                            :minDate="new Date()" 
                            show-icon 
                            placeholder="Select stay range" 
                            @date-select="onQuickRangeSelect" 
                            class="w-full"
                        />
                    </div>
                    <div class="qb-field">
                        <label class="qb-label">Guests</label>
                        <input type="number" min="1" v-model.number="quickBookingForm.no_of_guests" class="qb-input" />
                    </div>
                    <div class="qb-field full">
                        <label class="qb-label">Available Rooms</label>
                        <Dropdown v-model="quickBookingForm.room_id" :options="roomOptions" optionLabel="label" optionValue="value" placeholder="Select a room" class="w-full" :loading="loadingRooms" />
                    </div>
                    <div class="qb-field full">
                        <label class="qb-label">Guest Name</label>
                        <input type="text" v-model="quickBookingForm.guest_name" class="qb-input" placeholder="Enter guest name" />
                    </div>
                    <div class="qb-field full">
                        <label class="qb-label">Special Requests</label>
                        <textarea v-model="quickBookingForm.special_requests" rows="2" class="qb-textarea" placeholder="Optional notes..."></textarea>
                    </div>
                </div>
                <div class="qb-actions">
                    <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="quickBookingVisible = false" />
                    <Button label="Create Reservation" icon="pi pi-check" :disabled="!canSubmitQuickBooking" :loading="isCreatingReservation" @click="submitQuickBooking" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { DashboardV2Service } from '@/service/DashboardV2Service';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { useBooking } from '@/composables/useBooking';
import Dropdown from 'primevue/dropdown';

const props = defineProps({
    autoRefresh: { type: Boolean, default: false },
    refreshInterval: { type: Number, default: 300000 }
});

const emit = defineEmits(['data-loaded', 'error']);

const dashboardService = new DashboardV2Service();
const toast = useToast();
const router = useRouter();
const { searchRooms, createReservation, isCreatingReservation, availableRooms } = useBooking();

const loading = ref(false);
const dateRange = ref([new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);
const availabilityData = ref({}); // structure: { roomTypeId: { 'YYYY-MM-DD': { available, rate, checkIns:[], checkOuts:[], stayOvers:[], availableRooms:[] } } }
const roomTypes = ref([]);

const cellDialogVisible = ref(false);
const selectedCell = ref(null);
const selectedRoomType = ref(null);
const selectedDate = ref(null);

const quickBookingVisible = ref(false);
const quickBookingDateRange = ref([]); // [Date, Date]
const quickBookingForm = ref({
    room_id: null,
    no_of_guests: 1,
    guest_name: '',
    special_requests: ''
});
const loadingRooms = ref(false);

const today = new Date();

const calendarDates = computed(() => {
    if (!dateRange.value || dateRange.value.length < 2) return [];
    const start = new Date(dateRange.value[0]);
    const end = new Date(dateRange.value[1]);
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
    }
    return dates;
});

const roomOptions = computed(() => (availableRooms.value || []).map(r => ({
    label: r.name || r.number || `Room #${r.id}`,
    value: r.id
})));

watch(dateRange, (nv) => {
    if (nv && nv.length === 2 && nv[0] instanceof Date && nv[1] instanceof Date) {
        fetchAvailabilityData();
    }
});

onMounted(() => {
    fetchAvailabilityData();
    if (props.autoRefresh) {
        setInterval(fetchAvailabilityData, props.refreshInterval);
    }
});

const fetchAvailabilityData = async () => {
    if (!dateRange.value || dateRange.value.length < 2) return;
    loading.value = true;
    try {
        const startDate = dateRange.value[0].toISOString().split('T')[0];
        const endDate = dateRange.value[1].toISOString().split('T')[0];
        const response = await dashboardService.getAvailabilityCalendar(startDate, endDate);
        if (response.success) {
            availabilityData.value = response.data.availability || {};
            roomTypes.value = response.data.roomTypes || [];
            emit('data-loaded', response.data);
        } else {
            throw new Error(response.message || 'Failed to fetch availability data');
        }
    } catch (error) {
        console.error('Error fetching availability data:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load availability data', life: 3000 });
        emit('error', error);
    } finally {
        loading.value = false;
    }
};

const refreshData = () => fetchAvailabilityData();

const formatDateHeader = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const getCellObj = (roomTypeId, date) => availabilityData.value[roomTypeId]?.[date] || {};
const getAvailableCount = (roomTypeId, date) => getCellObj(roomTypeId, date).available || 0;
const getDailyRate = (roomTypeId, date) => getCellObj(roomTypeId, date).rate || 0;
const getCheckInCount = (roomTypeId, date) => {
    const c = getCellObj(roomTypeId, date).checkIns; return Array.isArray(c) ? c.length : (c || 0);
};
const getCheckOutCount = (roomTypeId, date) => {
    const c = getCellObj(roomTypeId, date).checkOuts; return Array.isArray(c) ? c.length : (c || 0);
};
const getStayOverCount = (roomTypeId, date) => {
    const c = getCellObj(roomTypeId, date).stayOvers || getCellObj(roomTypeId, date).stayovers; return Array.isArray(c) ? c.length : (c || 0);
};
const showBadges = (roomTypeId, date) => getCheckInCount(roomTypeId, date) || getCheckOutCount(roomTypeId, date) || getStayOverCount(roomTypeId, date);

const getAvailabilityClass = (roomTypeId, date) => {
    const available = getAvailableCount(roomTypeId, date);
    const total = roomTypes.value.find(rt => rt.id === roomTypeId)?.totalRooms || 0;
    const percentage = total > 0 ? (available / total) * 100 : 0;
    if (percentage === 0) return 'no-availability';
    if (percentage <= 25) return 'low-availability';
    if (percentage <= 50) return 'medium-availability';
    return 'high-availability';
};

const formatCurrency = (amount) => new Intl.NumberFormat('en-NG').format(amount || 0);

const isToday = (dateStr) => {
    const today = new Date();
    const d = new Date(dateStr);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
};

const openCellDetails = (roomType, date) => {
    const data = getCellObj(roomType.id, date);
    selectedCell.value = {
        roomTypeId: roomType.id,
        roomTypeName: roomType.name,
        date,
        available: data.available || 0,
        total: roomType.totalRooms || 0,
        rate: data.rate || 0,
        checkIns: Array.isArray(data.checkIns) ? data.checkIns : [],
        checkOuts: Array.isArray(data.checkOuts) ? data.checkOuts : [],
        stayOvers: Array.isArray(data.stayOvers || data.stayovers) ? (data.stayOvers || data.stayovers) : [],
        availableRooms: Array.isArray(data.availableRooms) ? data.availableRooms : []
    };
    selectedRoomType.value = roomType;
    selectedDate.value = date;
    cellDialogVisible.value = true;
};

const dialogHeader = computed(() => {
    if (!selectedCell.value) return 'Details';
    return `${selectedCell.value.roomTypeName} - ${new Date(selectedCell.value.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
});

const openQuickBooking = async () => {
    if (!selectedCell.value) return;
    // Default stay = selected date to next day
    const checkIn = new Date(selectedCell.value.date);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 1);
    quickBookingDateRange.value = [checkIn, checkOut];
    quickBookingForm.value.room_id = null;
    quickBookingForm.value.no_of_guests = 1;
    quickBookingForm.value.special_requests = '';
    quickBookingForm.value.guest_name = '';
    quickBookingVisible.value = true;
    await loadAvailableRoomsForQuickBooking();
};

const onQuickRangeSelect = async () => {
    if (quickBookingDateRange.value?.length === 2) {
        await loadAvailableRoomsForQuickBooking();
    }
};

const loadAvailableRoomsForQuickBooking = async () => {
    if (!quickBookingDateRange.value || quickBookingDateRange.value.length < 2) return;
    loadingRooms.value = true;
    try {
        const [ci, co] = quickBookingDateRange.value;
        await searchRooms({
            check_in_date: formatLocalDate(ci),
            check_out_date: formatLocalDate(co),
            room_type_id: selectedCell.value.roomTypeId,
            guests: quickBookingForm.value.no_of_guests
        });
    } finally {
        loadingRooms.value = false;
    }
};

const formatLocalDate = (d) => {
    if (!(d instanceof Date)) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const canSubmitQuickBooking = computed(() => {
    return quickBookingForm.value.room_id && quickBookingDateRange.value.length === 2 && quickBookingForm.value.guest_name;
});

const submitQuickBooking = async () => {
    if (!canSubmitQuickBooking.value) return;
    const [ci, co] = quickBookingDateRange.value;
    const payload = {
        room_id: quickBookingForm.value.room_id,
        check_in_date: formatLocalDate(ci),
        check_out_date: formatLocalDate(co),
        no_of_guests: String(quickBookingForm.value.no_of_guests),
        special_requests: quickBookingForm.value.special_requests || 'None',
        guest_name: quickBookingForm.value.guest_name,
        is_online_booking: false
    };
    try {
        const ok = await createReservation(payload);
        if (ok) {
            quickBookingVisible.value = false;
            cellDialogVisible.value = false;
            fetchAvailabilityData(); // refresh calendar
        }
    } catch (e) {
        // toast already handled in composable
    }
};

const normalizeDate = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isPastDate = (d) => normalizeDate(d) < normalizeDate(today);

const triggerFetchIfRangeComplete = () => {
    if (!dateRange.value || dateRange.value.length < 2) return;
    const [start, end] = dateRange.value;
    if (!(start instanceof Date) || !(end instanceof Date)) return;
    if (isPastDate(start)) {
        toast.add({ severity: 'warn', summary: 'Invalid Start Date', detail: 'Check-in date cannot be before today.', life: 3000 });
        dateRange.value = [today, end && end < today ? today : end];
        return;
    }
    // ensure chronological order if user picked backwards
    if (end < start) return; // wait until proper second pick
    fetchAvailabilityData();
};

const onDateRangeSelect = () => {
    triggerFetchIfRangeComplete();
};

watch(dateRange, (nv, ov) => {
    // Only react when user completes a valid range via direct assignment (not on every single partial selection)
    triggerFetchIfRangeComplete();
});
</script>

<style scoped>
.availability-calendar {
    margin-bottom: 2rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--surface-border);
}

.calendar-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.calendar-content {
    padding: 1rem;
}

.calendar-table {
    overflow-x: auto;
    border: 1px solid var(--surface-border);
    border-radius: 8px;
}

.table-header {
    display: flex;
    background-color: var(--surface-50);
    border-bottom: 2px solid var(--surface-border);
}

.table-row {
    display: flex;
    border-bottom: 1px solid var(--surface-border);
}

.room-type-column,
.room-type-cell {
    width: 200px;
    min-width: 200px;
    padding: 1rem;
    border-right: 1px solid var(--surface-border);
}

.room-type-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.room-type-total {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.date-column,
.availability-cell {
    width: 120px;
    min-width: 120px;
    padding: 0.75rem;
    border-right: 1px solid var(--surface-border);
    text-align: center;
}

.availability-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.available-count {
    font-size: 0.875rem;
    font-weight: 500;
}

.daily-rate {
    font-size: 0.75rem;
    color: var(--primary-color);
    font-weight: 600;
}

.no-availability {
    background-color: #fef2f2;
    color: #dc2626;
}

.low-availability {
    background-color: #fef3c7;
    color: #d97706;
}

.medium-availability {
    background-color: #dbeafe;
    color: #2563eb;
}

.high-availability {
    background-color: #dcfce7;
    color: #16a34a;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
}

.calendar-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.25rem;
    padding: 0 1.5rem 0.75rem 1.5rem;
    align-items: center;
    font-size: 0.75rem;
}
.legend-item, .legend-badge { display: flex; align-items: center; gap: 0.4rem; }
.legend-color { width: 16px; height: 16px; border-radius: 4px; display: inline-block; border: 1px solid rgba(0,0,0,0.05); }
.legend-separator { flex-basis: 100%; height: 0; }

.availability-cell.clickable { cursor: pointer; position: relative; }
.availability-cell.clickable:hover { outline: 2px solid var(--primary-color); z-index: 2; }

.badges { display: flex; gap: 0.25rem; flex-wrap: wrap; margin-top: 0.25rem; justify-content: center; }
.badge { font-size: 0.625rem; font-weight: 600; padding: 2px 4px; border-radius: 4px; line-height: 1; letter-spacing: .5px; color: #fff; }
.badge-checkin { background: #2563eb; }
.badge-checkout { background: #d97706; }
.badge-stayover { background: #6b7280; }

.date-column.today, .availability-cell.today { box-shadow: inset 0 0 0 2px var(--primary-color); }

.cell-dialog :deep(.p-dialog-header) { padding: 0.75rem 1rem; }
.cell-dialog-section { margin-bottom: 1rem; }
.cell-dialog-section h6 { margin: 0 0 0.25rem 0; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-color-secondary); }
.mini-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem; max-height: 140px; overflow-y: auto; }
.mini-list li { display: flex; justify-content: space-between; font-size: 0.75rem; background: var(--surface-100); padding: 4px 6px; border-radius: 4px; }
.guest-name { font-weight: 500; }
.booking-ref { opacity: 0.7; }
.room-chips { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.room-chip { background: var(--primary-color); color: #fff; font-size: 0.625rem; padding: 3px 6px; border-radius: 3px; }

.qb-grid { display: grid; grid-template-columns: 1fr 120px; gap: 0.75rem 1rem; margin-top: 0.5rem; }
.qb-field.full { grid-column: 1 / -1; }
.qb-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: var(--text-color-secondary); margin-bottom: 0.25rem; }
.qb-input, .qb-textarea { width: 100%; padding: 0.5rem 0.6rem; border: 1px solid var(--surface-border); border-radius: 6px; font-size: 0.8rem; background: var(--surface-card); color: inherit; }
.qb-textarea { resize: vertical; }
.qb-section { display:flex; justify-content: space-between; align-items:center; margin-bottom: .5rem; }
.qb-value { font-weight:600; font-size: .85rem; }
.qb-actions { margin-top: 1rem; display:flex; justify-content: flex-end; gap:.5rem; }

@media (max-width: 768px) {
    .card-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
    
    .calendar-controls {
        justify-content: center;
    }
    
    .room-type-column,
    .room-type-cell {
        width: 150px;
        min-width: 150px;
    }
    
    .date-column,
    .availability-cell {
        width: 100px;
        min-width: 100px;
    }

    .calendar-legend { font-size: 0.65rem; }
    .badges { justify-content: flex-start; }
    .availability-cell.clickable:hover { outline: none; }
}

@media (max-width: 640px){ .qb-grid { grid-template-columns: 1fr; } }
</style>
