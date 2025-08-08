<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const modules = ref([
    {
        title: 'Inventory',
        description: 'Tracks information about . . .',
        image: '/img/control-inventario-clami.png',
        features: ['Inventory Reports', 'Suppliers', 'Orders'],
        route: '/inventory/dashboard'
    },
    {
        title: 'Hotel Booking',
        description: 'Tracks information about . . .',
        image: '/img/building/nbte-4.jpeg',
        features: ['Bookings Reports', 'Listings', 'Notifications'],
        route: '/admin/booking/dashboard'
    },
    {
        title: 'Housekeeping',
        description: 'Manages room status, cleaning schedules, and staff assignments.',
        image: '/img/bed-1.jpeg',
        features: ['Room Status', 'Cleaning Schedules', 'Staff Assignments'],
        route: '/admin/housekeeping/dashboard'
    },
    {
        title: 'Settings',
        description: 'Configuration of Booking & Inventory Parameters for the system',
        image: '/img/settings.png',
        features: ['Booking Management Settings', 'Inventory Management Settings', 'User and Permissions Management'],
        route: '/settings/dashboard'
    }
]);

const navigateTo = (route) => {
    if (route) {
        router.push(route);
    }
};
</script>

<template>
    <div class="pt-6 min-h-screen">
        <div class="px-4 pt-8 md:px-6 lg:px-8">
            <div class="text-700 font-bold text-4xl mb-4 text-center">CHOOSE A MODULE</div>

            <div class="grid">
                <div v-for="module in modules" :key="module.title" class="col-12 lg:col-4 md:col-4">
                    <div class="p-3 h-full">
                        <div @click="navigateTo(module.route)" class="quick-access-tab cursor-pointer p-3 h-full flex flex-column surface-card border-primary" style="border-radius: 38px">
                            <div :style="{
                                backgroundImage: `url('${module.image}')`,
                                height: '200px',
                                borderRadius: '25px',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                            }" class="p-0 c-shadow bg-primary mb-4">
                            </div>
                            <div class="px-4">
                                <div class="text-900 font-medium text-xl mb-2 font-bold">{{ module.title }}</div>
                                <div class="text-600">{{ module.description }}</div>
                                <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                                <ul class="list-none p-0 m-0 flex-grow-1">
                                    <li v-for="feature in module.features" :key="feature" class="flex align-items-center mb-3">
                                        <i class="pi pi-check-circle text-green-500 mr-2"></i>
                                        <span>{{ feature }}</span>
                                    </li>
                                </ul>
                                <Button @click.stop="navigateTo(module.route)" label="Enter" class="w-full mt-auto mb-3 p-button-rounded"></Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

