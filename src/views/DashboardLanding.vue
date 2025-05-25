<script setup>
</script>

<template>
    <div class="pt-6 min-h-screen">
        <div class="px-4 pt-8 md:px-6 lg:px-8">
            <div class="text-700 font-bold text-4xl mb-4 text-center">CHOOSE A MODULE</div>

            <div class="grid">
                <div class="col-12 lg:col-4 md:col-4">
                    <div class="p-3 h-full">
                        <!-- <div @click="navigateToInventory" class="quick-access-tab p-3 h-full flex flex-column surface-card border-primary primary-gradient white-font" style="border-radius: 38px">
                            <div style="background-image: url('/img/control-inventario-clami.png');
                            height: 200px;
                            border-radius: 25px;
                            background-size: cover;
                            background-position: center;
                            background-repeat: no-repeat;" class="p-0 c-shadow bg-primary mb-4">
                            </div>
                            <div class="px-4">
                                <div class="white-font font-medium text-xl mb-2 font-bold">Inventory</div>
                                <div class="white-font">Tracks information about . . .</div>
                                <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                                <ul class="list-none p-0 m-0 flex-grow-1">
                                    <li class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle white-font mr-2"></i>
                                        <span>Inventory Reports</span>
                                    </li>
                                    <li class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle white-font mr-2"></i>
                                        <span>Suppliers</span>
                                    </li>
                                    <li class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle white-font mr-2"></i>
                                        <span>Orders</span>
                                    </li>
                                </ul>
                                <Button @click="navigateToInventory" label="Enter" class="w-full mt-auto mb-3 p-button-rounded"></Button>
                            </div>
                        </div> -->
                        <div @click="navigateToInventory" class="quick-access-tab p-3 h-full flex flex-column surface-card border-primary" style="border-radius: 38px">
                            <div style="background-image: url('/img/control-inventario-clami.png');
                            height: 200px;
                            border-radius: 25px;
                            background-size: cover;
                            background-position: center;
                            background-repeat: no-repeat;" class="p-0 c-shadow bg-primary mb-4">
                            </div>
                            <div class="px-4">
                                <div class="text-900 font-medium text-xl mb-2 font-bold">Inventory</div>
                                <div class="text-600">Tracks information about . . .</div>
                                <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                                <ul class="list-none p-0 m-0 flex-grow-1">
                                    <li class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle text-green-500 mr-2"></i>
                                        <span>Inventory Reports</span>
                                    </li>
                                    <li class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle text-green-500 mr-2"></i>
                                        <span>Suppliers</span>
                                    </li>
                                    <li class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle text-green-500 mr-2"></i>
                                        <span>Orders</span>
                                    </li>
                                </ul>
                                <Button @click="navigateToInventory" label="Enter" class="w-full mt-auto mb-3 p-button-rounded"></Button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 lg:col-4 md:col-4">
                    <div class="p-3 h-full">
                        <div @click="navigateToBooking" class="quick-access-tab p-3 h-full flex flex-column surface-card border-primary" style="border-radius: 38px">
                            <div style="background-image: url('/img/building/nbte-4.jpeg');
                            height: 200px;
                            border-radius: 25px;
                            background-size: cover;
                            background-position: center;
                            background-repeat: no-repeat;" class="p-0 c-shadow bg-primary mb-4">
                            </div>
                            <div class="px-4">
                                <div class="text-900 font-medium text-xl mb-2 font-bold">Hotel Booking</div>
                                <div class="text-600">Tracks information about . . .</div>
                                <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                                <ul class="list-none p-0 m-0 flex-grow-1">
                                    <li class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle text-green-500 mr-2"></i>
                                        <span>Bookings Reports</span>
                                    </li>
                                    <li class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle text-green-500 mr-2"></i>
                                        <span>Listings</span>
                                    </li>
                                    <li class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle text-green-500 mr-2"></i>
                                        <span>Notifications</span>
                                    </li>
                                </ul>
                                <Button @click="navigateToBooking" label="Enter" class="w-full mt-auto mb-3 p-button-rounded"></Button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 lg:col-4 md:col-4">
                    <div class="p-3 h-full">
                        <div @click="navigateToSettings" class="quick-access-tab p-3 h-full flex flex-column surface-card border-primary" style="border-radius: 38px">
                            <div style="background-image: url('/img/settings.png');
                            height: 200px;
                            border-radius: 25px;
                            background-size: cover;
                            background-position: center;
                            background-repeat: no-repeat;" class="p-0 c-shadow bg-primary mb-4">
                            </div>
                            <div class="px-4">
                                <div class="text-900 font-medium text-xl mb-2 font-bold">Settings</div>
                                <div class="text-600">Configuration of Booking & Inventory Parameters for the system</div>
                                <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                                <ul class="list-none p-0 m-0 flex-grow-1">
                                    <li class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle text-green-500 mr-2"></i>
                                        <span>Booking Management Settings</span>
                                    </li>
                                    <li class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle text-green-500 mr-2"></i>
                                        <span>Inventory Management Settings</span>
                                    </li>
                                    <li class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle text-green-500 mr-2"></i>
                                        <span>User and Permissions Management</span>
                                    </li>
                                </ul>
                                <Button @click="navigateToSettings" label="Enter" class="w-full mt-auto mb-3 p-button-rounded"></Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex';
import { GET_USER_TOKEN_GETTER } from '../store/storeconstants'
export default {

    // data() {
    //     axios.get(``)
    // },

    computed: {
        ...mapGetters('auth', {
            token: GET_USER_TOKEN_GETTER
        })
    },

    methods: {
        navigateToInventory() {
            // Use Vue Router's push method to navigate to the desired route
            this.$router.push('/inventory/dashboard');
        },
        navigateToBooking() {
            this.$router.push('/admin/booking/dashboard');
        },
        navigateToSettings() {
            this.$router.push('/settings/dashboard');
        }
    }
}
</script>
