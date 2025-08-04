<script setup></script>

<template>
    <div class="">
        <div class="grid">
            <div class="col-12 md:col-6 lg:col-3">
                <div class="surface-card shadow-2 p-3 border-round">
                    <div class="flex justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Total Bookings</span>
                            <div class="text-900 font-medium text-xl">320</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-calendar text-blue-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-green-500 font-medium">12 new </span>
                    <span class="text-500">since last visit</span>
                </div>
            </div>
            <div class="col-12 md:col-6 lg:col-3">
                <div class="surface-card shadow-2 p-3 border-round">
                    <div class="flex justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Available Inventory</span>
                            <div class="text-900 font-medium text-xl">1500 items</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-box text-orange-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-red-500 font-medium">200 low </span>
                    <span class="text-500">need restock</span>
                </div>
            </div>
            <div class="col-12 md:col-6 lg:col-3">
                <div class="surface-card shadow-2 p-3 border-round">
                    <div class="flex justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">User Accounts</span>
                            <div class="text-900 font-medium text-xl">450</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-cyan-100 border-round" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-users text-cyan-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-green-500 font-medium">15 new </span>
                    <span class="text-500">since last week</span>
                </div>
            </div>
            <div class="col-12 md:col-6 lg:col-3">
                <div class="surface-card shadow-2 p-3 border-round">
                    <div class="flex justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">System Alerts</span>
                            <div class="text-900 font-medium text-xl">5</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-bell text-purple-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-red-500 font-medium">2 critical </span>
                    <span class="text-500">need attention</span>
                </div>
            </div>
        </div>
    </div>
</template>
