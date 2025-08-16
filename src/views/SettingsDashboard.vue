<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from '@/service/AxiosInstance';
import { InventoryService } from '@/service/InventoryService';
import { UserService } from '@/service/UserService';
import { RoomsService } from '@/service/RoomsService';
import { HallService } from '@/service/HallService';
import Chart from 'primevue/chart';

const loading = ref(true);
const bookingTotal = ref(0);
const bookingNew = ref(0);
const inventoryAvailable = ref(0);
const inventoryLow = ref(0);
const userTotal = ref(0);
const userNew = ref(0);
const alertsTotal = ref(0);
const alertsCritical = ref(0);

// New refs for extended stats
const rooms = ref([]);
const halls = ref([]);
const inventoryRecords = ref([]);
const userRecords = ref([]);

// Chart data refs
const roomOccupancyChart = ref({ labels: [], datasets: [] });
const roomsByTypeChart = ref({ labels: [], datasets: [] });
const hallStatusChart = ref({ labels: [], datasets: [] });
const inventoryDistributionChart = ref({ labels: [], datasets: [] });
const usersByRoleChart = ref({ labels: [], datasets: [] });
const weeklyUserSignupChart = ref({ labels: [], datasets: [] });

const inventoryService = new InventoryService();
const userService = new UserService();
const roomsService = new RoomsService();
const hallService = new HallService();

async function loadBookings() {
    try {
        const { data } = await axiosInstance.get('/admin/metrics/bookings');
        bookingTotal.value = data?.total ?? 0;
        bookingNew.value = data?.new ?? 0;
    } catch (e) {
        bookingTotal.value = 0;
        bookingNew.value = 0;
    }
}

async function loadInventory() {
    try {
        const records = await inventoryService.getRecords();
        inventoryRecords.value = records;
        inventoryAvailable.value = records.length;
        inventoryLow.value = records.filter(r => (r.quantity ?? 0) < (r.reorder_level ?? 0)).length;
    } catch (e) {
        inventoryRecords.value = [];
        inventoryAvailable.value = 0;
        inventoryLow.value = 0;
    }
}

async function loadUsers() {
    try {
        const records = await userService.getRecords();
        userRecords.value = records;
        userTotal.value = records.length;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        userNew.value = records.filter(u => u.created_at && new Date(u.created_at) >= sevenDaysAgo).length;
    } catch (e) {
        userRecords.value = [];
        userTotal.value = 0;
        userNew.value = 0;
    }
}

async function loadAlerts() {
    try {
        const { data } = await axiosInstance.get('/admin/metrics/alerts');
        alertsTotal.value = data?.total ?? 0;
        alertsCritical.value = data?.critical ?? 0;
    } catch (e) {
        alertsTotal.value = 0;
        alertsCritical.value = 0;
    }
}

async function loadRooms() {
    try {
        const data = await roomsService.getRooms();
        rooms.value = data;
    } catch (e) {
        rooms.value = [];
    }
}

async function loadHalls() {
    try {
        const data = await hallService.getHalls();
        halls.value = data;
    } catch (e) {
        halls.value = [];
    }
}

function buildCharts() {
    // Room Occupancy
    const occCounts = rooms.value.reduce((acc, r) => {
        const key = (r.status || 'Unknown').toLowerCase();
        acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    roomOccupancyChart.value = {
        labels: Object.keys(occCounts).map(k => k.toUpperCase()),
        datasets: [{ data: Object.values(occCounts), backgroundColor: ['#16a34a','#2563eb','#f59e0b','#dc2626','#6b7280'] }]
    };

    // Rooms by Type
    const typeCounts = rooms.value.reduce((acc,r)=>{ const n = r.roomType?.name || r.type || 'Unknown'; acc[n]= (acc[n]||0)+1; return acc;},{});
    roomsByTypeChart.value = {
        labels: Object.keys(typeCounts),
        datasets: [{ label: 'Rooms', data: Object.values(typeCounts), backgroundColor: '#2563eb' }]
    };

    // Hall Status
    const hallCounts = halls.value.reduce((acc,h)=>{ const s = h.status || 'Unknown'; acc[s]= (acc[s]||0)+1; return acc;},{});
    hallStatusChart.value = {
        labels: Object.keys(hallCounts),
        datasets: [{ data: Object.values(hallCounts), backgroundColor: ['#0ea5e9','#6366f1','#f59e0b','#dc2626','#10b981'] }]
    };

    buildInventoryAndUserCharts();
}

function buildInventoryAndUserCharts() {
    // Inventory distribution by category (sum quantities per category)
    const catCounts = inventoryRecords.value.reduce((acc,i)=>{ const c = i.category?.name || 'Uncategorized'; acc[c]=(acc[c]||0)+ (i.inventory.quantity ?? 0); return acc;},{});
    inventoryDistributionChart.value = {
        labels: Object.keys(catCounts),
        datasets: [{ label: 'Qty', data: Object.values(catCounts), backgroundColor: '#10b981' }]
    };

    // Users by role
    const roleCounts = userRecords.value.reduce((acc,u)=>{ const r = u.role || 'Unknown'; acc[r]=(acc[r]||0)+1; return acc;},{});
    usersByRoleChart.value = {
        labels: Object.keys(roleCounts),
        datasets: [{ data: Object.values(roleCounts), backgroundColor: ['#6366f1','#22c55e','#f59e0b','#dc2626','#64748b'] }]
    };

    // Weekly signups (last 7 days)
    const days = [];
    for (let i=6;i>=0;i--) { const d = new Date(); d.setDate(d.getDate()-i); days.push(d); }
    const dayLabels = days.map(d=> d.toLocaleDateString(undefined,{ month:'short', day:'numeric'}));
    const signupCounts = days.map(d=> userRecords.value.filter(u=> u.created_at && new Date(u.created_at).toDateString() === d.toDateString()).length);
    weeklyUserSignupChart.value = {
        labels: dayLabels,
        datasets: [{ label: 'New Users', data: signupCounts, fill: true, tension: 0.4, backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#6366f1' }]
    };
}

async function loadAll() {
    loading.value = true;
    await Promise.all([loadBookings(), loadInventory(), loadUsers(), loadAlerts(), loadRooms(), loadHalls()]);
    buildCharts();
    loading.value = false;
}

onMounted(loadAll);
</script>

<template>
    <div class="">
        <div class="flex justify-content-end mb-3">
            <Button icon="pi pi-refresh" label="Refresh" class="p-button-sm" @click="loadAll" :loading="loading" />
        </div>
        <!-- existing metric cards -->
        <div class="grid">
            <div class="col-12 md:col-6 lg:col-3">
                <div class="surface-card shadow-2 p-3 border-round">
                    <div class="flex justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Total Bookings</span>
                            <div class="text-900 font-medium text-xl" v-if="!loading">{{ bookingTotal }}</div>
                            <Skeleton width="4rem" height="1.5rem" v-else />
                        </div>
                        <div class="flex align-items-center justify-content-center bg-blue-100 border-round"
                            style="width:2.5rem;height:2.5rem">
                            <i class="pi pi-calendar text-blue-500 text-xl"></i>
                        </div>
                    </div>
                    <template v-if="!loading">
                        <span class="text-green-500 font-medium">{{ bookingNew }} new </span>
                        <span class="text-500">since last period</span>
                    </template>
                    <Skeleton v-else width="100%" height="0.8rem" />
                </div>
            </div>
            <div class="col-12 md:col-6 lg:col-3">
                <div class="surface-card shadow-2 p-3 border-round">
                    <div class="flex justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Inventory Available</span>
                            <div class="text-900 font-medium text-xl" v-if="!loading">{{ inventoryAvailable }}</div>
                            <Skeleton width="4rem" height="1.5rem" v-else />
                        </div>
                        <div class="flex align-items-center justify-content-center bg-green-100 border-round"
                            style="width:2.5rem;height:2.5rem">
                            <i class="pi pi-box text-green-500 text-xl"></i>
                        </div>
                    </div>
                    <template v-if="!loading">
                        <span class="text-green-500 font-medium">{{ inventoryLow }} low </span>
                        <span class="text-500">stock items</span>
                    </template>
                    <Skeleton v-else width="100%" height="0.8rem" />
                </div>
            </div>
            <div class="col-12 md:col-6 lg:col-3">
                <div class="surface-card shadow-2 p-3 border-round">
                    <div class="flex justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Total Users</span>
                            <div class="text-900 font-medium text-xl" v-if="!loading">{{ userTotal }}</div>
                            <Skeleton width="4rem" height="1.5rem" v-else />
                        </div>
                        <div class="flex align-items-center justify-content-center bg-purple-100 border-round"
                            style="width:2.5rem;height:2.5rem">
                            <i class="pi pi-users text-purple-500 text-xl"></i>
                        </div>
                    </div>
                    <template v-if="!loading">
                        <span class="text-green-500 font-medium">{{ userNew }} new </span>
                        <span class="text-500">sign-ups</span>
                    </template>
                    <Skeleton v-else width="100%" height="0.8rem" />
                </div>
            </div>
            <div class="col-12 md:col-6 lg:col-3">
                <div class="surface-card shadow-2 p-3 border-round">
                    <div class="flex justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Total Alerts</span>
                            <div class="text-900 font-medium text-xl" v-if="!loading">{{ alertsTotal }}</div>
                            <Skeleton width="4rem" height="1.5rem" v-else />
                        </div>
                        <div class="flex align-items-center justify-content-center bg-red-100 border-round"
                            style="width:2.5rem;height:2.5rem">
                            <i class="pi pi-exclamation-triangle text-red-500 text-xl"></i>
                        </div>
                    </div>
                    <template v-if="!loading">
                        <span class="text-red-500 font-medium">{{ alertsCritical }} critical </span>
                        <span class="text-500">alerts</span>
                    </template>
                    <Skeleton v-else width="100%" height="0.8rem" />
                </div>
            </div>
        </div>
        <!-- New charts section -->
        <div class="mt-5">
            <div class="grid">
                <div class="col-12 lg:col-4">
                    <div class="surface-card shadow-2 p-3 border-round h-full">
                        <h6 class="mb-3 font-medium">Room Occupancy</h6>
                        <Chart type="doughnut" :data="roomOccupancyChart" />
                    </div>
                </div>
                <div class="col-12 lg:col-4">
                    <div class="surface-card shadow-2 p-3 border-round h-full">
                        <h6 class="mb-3 font-medium">Rooms by Type</h6>
                        <Chart type="bar" :data="roomsByTypeChart" />
                    </div>
                </div>
                <div class="col-12 lg:col-4">
                    <div class="surface-card shadow-2 p-3 border-round h-full">
                        <h6 class="mb-3 font-medium">Halls Status</h6>
                        <Chart type="pie" :data="hallStatusChart" />
                    </div>
                </div>
                <div class="col-12 lg:col-6">
                    <div class="surface-card shadow-2 p-3 border-round h-full">
                        <h6 class="mb-3 font-medium">Inventory Distribution</h6>
                        <Chart type="bar" :data="inventoryDistributionChart" />
                    </div>
                </div>
                <div class="col-12 lg:col-3">
                    <div class="surface-card shadow-2 p-3 border-round h-full">
                        <h6 class="mb-3 font-medium">Users by Role</h6>
                        <Chart type="pie" :data="usersByRoleChart" />
                    </div>
                </div>
                <div class="col-12 lg:col-3">
                    <div class="surface-card shadow-2 p-3 border-round h-full">
                        <h6 class="mb-3 font-medium">Weekly Signups</h6>
                        <Chart type="line" :data="weeklyUserSignupChart" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>