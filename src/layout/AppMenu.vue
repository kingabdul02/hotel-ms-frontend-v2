<script setup>
import { ref, computed } from 'vue';

import AppMenuItem from './AppMenuItem.vue';
import { useRoute, useRouter } from 'vue-router'; // Import useRoute for accessing the current route
import { useLayout } from '@/layout/composables/layout';
import { useStore } from 'vuex';
import {
    LOGOUT_ACTION,
    IS_USER_AUTHENTICATE_GETTER,
} from '@/store/storeconstants';
import { useToast } from "primevue/usetoast";

const router = useRouter();
const store = useStore();

const toast = useToast();
const isAuthenticated = computed(() => store.getters['auth/' + IS_USER_AUTHENTICATE_GETTER]);

const route = useRoute(); // Get the current route information

const { onMenuToggle } = useLayout();

const showSuccessLogout = () => {
    toast.add({ severity: 'info', summary: 'Logged Out', detail: 'You have been successfully logged out.', life: 3000 });
};

const performLogout = async () => {
    await store.dispatch('auth/' + LOGOUT_ACTION);
    router.push('/auth/login');
    setTimeout(() => {
        showSuccessLogout();
    }, 5000);
};

const model = ref([
    {
        // label: 'Home',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/inventory/dashboard',
                visible: route.path.includes('/inventory'), // Check for '/inventory' in the path
            },
            {
                label: 'Inventory',
                icon: 'pi pi-fw pi-shopping-cart',
                to: '/inventory/management/inventory',
                visible: route.path.includes('/inventory'), // Check for '/inventory' in the path
            },
            {
                label: 'Reports',
                icon: 'pi pi-fw pi-chart-bar',
                to: '/inventory/management/reports',
                visible: route.path.includes('/inventory'), // Check for '/inventory' in the path
            },
            // {
            //     label: 'Suppliers',
            //     icon: 'pi pi-fw pi-truck',
            //     to: '/inventory/management/suppliers',
            //     visible: route.path.includes('/inventory'), // Check for '/inventory' in the path
            // },
            // {
            //     label: 'Orders',
            //     icon: 'pi pi-fw pi-box',
            //     to: '/inventory/manage/orders',
            //     visible: route.path.includes('/inventory'), // Check for '/inventory' in the path
            // },
            //Booking Menus
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/admin/booking/dashboard',
                visible: route.path.includes('/booking'), // Check for '/booking' in the path
            },
            {
                label: 'Bookings',
                icon: 'pi pi-fw pi-list',
                to: '/admin/booking/management',
                visible: route.path.includes('/booking'), // Check for '/booking' in the path
            },
            {
                label: 'Listings',
                icon: 'pi pi-fw pi-sort-amount-up',
                to: '/admin/booking/manage/listings',
                visible: route.path.includes('/booking'), // Check for '/booking' in the path
            },
            {
                label: 'Notifications',
                icon: 'pi pi-fw pi-bell',
                to: '/admin/bookings/notifications',
                visible: route.path.includes('/booking'), // Check for '/booking' in the path
            },
            //Settings Menus
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/settings/dashboard',
                visible: route.path.includes('/settings'), // Check for '/booking' in the path
            },
            // {
            //     label: 'Hotels',
            //     icon: 'pi pi-building',
            //     to: '/settings/manage/hotels',
            //     visible: route.path.includes('/settings'), // Check for '/booking' in the path
            // },
            {
                label: 'Room Management', icon: 'pi pi-fw pi-building',
                visible: route.path.includes('/settings'),
                items: [
                    {
                        label: 'Rooms',
                        icon: 'pi pi-building',
                        to: '/settings/manage/rooms',
                        visible: route.path.includes('/settings'), // Check for '/booking' in the path
                    },
                    {
                        label: 'Types',
                        icon: 'pi pi-sitemap',
                        to: '/settings/manage/room-types',
                        visible: route.path.includes('/settings'), // Check for '/booking' in the path
                    },
                ]
            },
            {
                label: 'Inventory', icon: 'pi pi-shopping-bag',
                visible: route.path.includes('/settings'),
                items: [
                    {
                        label: 'Items',
                        icon: 'pi pi-sitemap',
                        to: '/settings/manage/items/items',
                        visible: route.path.includes('/settings'), // Check for '/booking' in the path
                    },
                    {
                        label: 'Item Category',
                        icon: 'pi pi-sitemap',
                        to: '/settings/manage/items/category',
                        visible: route.path.includes('/settings'), // Check for '/booking' in the path
                    },
                    {
                        label: 'Suppliers',
                        icon: 'pi pi-truck',
                        to: '/settings/manage/suppliers',
                        visible: route.path.includes('/settings'), // Check for '/booking' in the path
                    },
                ] // Check for '/booking' in the path
            },
            {
                label: 'Manage Users',
                icon: 'pi pi-users',
                to: '/settings/manage/users',
                visible: route.path.includes('/settings'), // Check for '/booking' in the path
            },
        ]
    },
    // {
    //     label: 'UI Components',
    //     items: [
    //         { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', to: '/uikit/formlayout' },
    //         { label: 'Input', icon: 'pi pi-fw pi-check-square', to: '/uikit/input' },
    //         { label: 'Float Label', icon: 'pi pi-fw pi-bookmark', to: '/uikit/floatlabel' },
    //         { label: 'Invalid State', icon: 'pi pi-fw pi-exclamation-circle', to: '/uikit/invalidstate' },
    //         { label: 'Button', icon: 'pi pi-fw pi-mobile', to: '/uikit/button', class: 'rotated-icon' },
    //         { label: 'Table', icon: 'pi pi-fw pi-table', to: '/uikit/table' },
    //         { label: 'List', icon: 'pi pi-fw pi-list', to: '/uikit/list' },
    //         { label: 'Tree', icon: 'pi pi-fw pi-share-alt', to: '/uikit/tree' },
    //         { label: 'Panel', icon: 'pi pi-fw pi-tablet', to: '/uikit/panel' },
    //         { label: 'Overlay', icon: 'pi pi-fw pi-clone', to: '/uikit/overlay' },
    //         { label: 'Media', icon: 'pi pi-fw pi-image', to: '/uikit/media' },
    //         { label: 'Menu', icon: 'pi pi-fw pi-bars', to: '/uikit/menu', preventExact: true },
    //         { label: 'Message', icon: 'pi pi-fw pi-comment', to: '/uikit/message' },
    //         { label: 'File', icon: 'pi pi-fw pi-file', to: '/uikit/file' },
    //         { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', to: '/uikit/charts' },
    //         { label: 'Misc', icon: 'pi pi-fw pi-circle', to: '/uikit/misc' }
    //     ]
    // },
    // {
    //     label: 'Prime Blocks',
    //     items: [
    //         { label: 'Free Blocks', icon: 'pi pi-fw pi-eye', to: '/blocks', badge: 'NEW' },
    //         { label: 'All Blocks', icon: 'pi pi-fw pi-globe', url: 'https://www.primefaces.org/primeblocks-vue', target: '_blank' }
    //     ]
    // },
    // {
    //     label: 'Utilities',
    //     items: [
    //         { label: 'PrimeIcons', icon: 'pi pi-fw pi-prime', to: '/utilities/icons' },
    //         { label: 'PrimeFlex', icon: 'pi pi-fw pi-desktop', url: 'https://www.primefaces.org/primeflex/', target: '_blank' }
    //     ]
    // },
    // {
    //     label: 'Pages',
    //     icon: 'pi pi-fw pi-briefcase',
    //     to: '/pages',
    //     items: [
    //         {
    //             label: 'Landing',
    //             icon: 'pi pi-fw pi-globe',
    //             to: '/landing'
    //         },
    //         {
    //             label: 'Auth',
    //             icon: 'pi pi-fw pi-user',
    //             items: [
    //                 {
    //                     label: 'Login',
    //                     icon: 'pi pi-fw pi-sign-in',
    //                     to: '/auth/login'
    //                 },
    //                 {
    //                     label: 'Error',
    //                     icon: 'pi pi-fw pi-times-circle',
    //                     to: '/auth/error'
    //                 },
    //                 {
    //                     label: 'Access Denied',
    //                     icon: 'pi pi-fw pi-lock',
    //                     to: '/auth/access'
    //                 }
    //             ]
    //         },
    //         {
    //             label: 'Crud',
    //             icon: 'pi pi-fw pi-pencil',
    //             to: '/pages/crud'
    //         },
    //         {
    //             label: 'Timeline',
    //             icon: 'pi pi-fw pi-calendar',
    //             to: '/pages/timeline'
    //         },
    //         {
    //             label: 'Not Found',
    //             icon: 'pi pi-fw pi-exclamation-circle',
    //             to: '/pages/notfound'
    //         },
    //         {
    //             label: 'Empty',
    //             icon: 'pi pi-fw pi-circle-off',
    //             to: '/pages/empty'
    //         }
    //     ]
    // },
    // {
    //     label: 'Hierarchy',
    //     items: [
    //         {
    //             label: 'Submenu 1',
    //             icon: 'pi pi-fw pi-bookmark',
    //             items: [
    //                 {
    //                     label: 'Submenu 1.1',
    //                     icon: 'pi pi-fw pi-bookmark',
    //                     items: [
    //                         { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
    //                         { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
    //                         { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
    //                     ]
    //                 },
    //                 {
    //                     label: 'Submenu 1.2',
    //                     icon: 'pi pi-fw pi-bookmark',
    //                     items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
    //                 }
    //             ]
    //         },
    //         {
    //             label: 'Submenu 2',
    //             icon: 'pi pi-fw pi-bookmark',
    //             items: [
    //                 {
    //                     label: 'Submenu 2.1',
    //                     icon: 'pi pi-fw pi-bookmark',
    //                     items: [
    //                         { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
    //                         { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
    //                     ]
    //                 },
    //                 {
    //                     label: 'Submenu 2.2',
    //                     icon: 'pi pi-fw pi-bookmark',
    //                     items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
    //                 }
    //             ]
    //         }
    //     ]
    // },
    // {
    //     label: 'Get Started',
    //     items: [
    //         {
    //             label: 'Documentation',
    //             icon: 'pi pi-fw pi-question',
    //             to: '/documentation'
    //         },
    //         {
    //             label: 'Figma',
    //             url: 'https://www.dropbox.com/scl/fi/bhfwymnk8wu0g5530ceas/sakai-2023.fig?rlkey=u0c8n6xgn44db9t4zkd1brr3l&dl=0',
    //             icon: 'pi pi-fw pi-pencil',
    //             target: '_blank'
    //         },
    //         {
    //             label: 'View Source',
    //             icon: 'pi pi-fw pi-search',
    //             url: 'https://github.com/primefaces/sakai-vue',
    //             target: '_blank'
    //         },
    //         {
    //             label: 'Nuxt Version',
    //             url: 'https://github.com/primefaces/sakai-nuxt',
    //             icon: 'pi pi-fw pi-star'
    //         }
    //     ]
    // }
]);

const model2 = ref([
    {
        // label: 'Home',
        items: [
            {
                label: 'Toggle sidebar',
                icon: 'pi pi-bars',
                command: () => {
                    onMenuToggle();
                },
            },
            {
                label: 'Exit Module',
                icon: 'pi pi-directions-alt',
                to: '/dashboard/landing',
            },
            // {
            //     label: 'Settings',
            //     icon: 'pi pi-fw pi-cog',
            //     to: '/settings/profile',
            // }
        ]
    },
]);

const model3 = ref([
    {
        // label: 'Home',
        items: [
            {
                label: 'Logout',
                icon: 'pi pi-fw pi-sign-out',
                command: () => {
                    performLogout();
                },
                visible: isAuthenticated
            },
        ]
    },
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
        <!-- <li>
            <a href="https://www.primefaces.org/primeblocks-vue/#/" target="_blank">
                <img src="/layout/images/banner-primeblocks.png" alt="Prime Blocks" class="w-full mt-3" />
            </a>
        </li> -->
    </ul>
    <ul class="layout-menu layout-menu2 mb-8">
        <template v-for="(item, i) in model2" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
    <ul class="layout-menu4 layout-menu3 mb-5">
        <template v-for="(item, i) in model3" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>

</template>

<style scoped>
.layout-menu2 {
    position: absolute;
    /* Make it absolute for positioning */
    bottom: 0;
    /* Position it at the bottom */
    width: 85%;
    /* Make it fill the entire width of the sidebar */
}

.layout-menu3 {
    position: absolute;
    /* Make it absolute for positioning */
    bottom: 0;
    /* Position it at the bottom */
    width: 85%;
    /* Make it fill the entire width of the sidebar */
    color: red !important;
}
</style>
