import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
import BookingLayout from '@/layout/booking/BookingLayout.vue';

import DashboardLandingLayout from '@/layout/dashboard-landing/DashboardLandingLayout.vue';
import store from '../store/store';
import { 
    IS_USER_AUTHENTICATE_GETTER,
    GET_USER_DATA_GETTER
 } from '../store/storeconstants';

const routes = [
    {
        path: '/dashboard',
        component: AppLayout,
        children: [
            {
                path: '/dashboard',
                name: 'dashboard',
                component: () => import('@/views/Dashboard.vue')
            },
            {
                path: '/inventory/dashboard',
                name: 'inventorydashboard',
                component: () => import('@/views/InventoryDashboard.vue'),
                meta: { auth: true }
            },
            {
                path: '/admin/booking/dashboard',
                name: 'bookingdashboard',
                component: () => import('@/views/EnhancedDashboard.vue'),
                meta: { auth: true }
            },
            {
                path: '/admin/housekeeping/dashboard',
                name: 'housekeepingdashboard',
                component: () => import('@/views/HousekeepingDashboard.vue'),
                meta: { auth: true }
            },
            {
                path: '/settings/dashboard',
                children: [
                    {
                        path: '/settings/dashboard',
                        name: 'settingsdashboard',
                        component: () => import('@/views/SettingsDashboard.vue'),
                        meta: { auth: true },
                    },
                    {
                        path: '/settings/profile',
                        name: 'settingsprofile',
                        component: () => import('@/views/SettingsProfile.vue'),
                        meta: { auth: true },
                    },
                    {
                        path: '/settings/manage/hotels',
                        name: 'managehotels',
                        component: () => import('@/views/pages/settings/ManageHotels.vue'),
                        meta: { auth: true }
                    },
                    {
                        path: '/settings/manage/room-types',
                        name: 'manageroomtypes',
                        component: () => import('@/views/pages/settings/ManageRoomTypes.vue'),
                        meta: { auth: true }
                    },
                    {
                        path: '/settings/manage/rooms',
                        name: 'managerooms',
                        component: () => import('@/views/pages/settings/ManageRooms.vue'),
                        meta: { auth: true }
                    },
                    {
                        path: '/settings/manage/items/items',
                        name: 'manageitemsitems',
                        component: () => import('@/views/pages/settings/ManageInventoryItem.vue'),
                        meta: { auth: true }
                    },
                    {
                        path: '/settings/manage/items/category',
                        name: 'manageitemscategory',
                        component: () => import('@/views/pages/settings/ManageItemCategory.vue'),
                        meta: { auth: true }
                    },
                    {
                        path: '/settings/manage/suppliers',
                        name: 'managesuppliers',
                        component: () => import('@/views/pages/settings/ManageSuppliers.vue'),
                        meta: { auth: true }
                    },
                    {
                        path: '/settings/manage/users',
                        name: 'manageusers',
                        component: () => import('@/views/pages/settings/ManageUsers.vue'),
                        meta: { auth: true }
                    },
                    {
                        path: '/settings/manage/halls',
                        name: 'managehalls',
                        component: () => import('@/views/pages/settings/ManageHalls.vue'),
                        meta: { auth: true }
                    },
                ]
            },
            {
                path: '/admin/booking/management',
                name: 'managebookings',
                component: () => import('@/components/BookingManagement/BookingManagement.vue'),
                meta: { auth: true }
            },
            {
                path: '/corporate-bill/:reservation_code',
                name: 'CorporateBill',
                component: () => import('@/components/BookingManagement/CorporateBill.vue'),
                meta: { auth: true }
              },
            {
                path: '/admin/booking/manage/listings',
                name: 'managelistings',
                component: () => import('@/views/ManageListings.vue'),
                meta: { auth: true }
            },
            {
                path: '/inventory/management/inventory',
                name: 'manageInventory',
                component: () => import('@/views/pages/settings/ManageAdminInvenotry.vue'),
                meta: { auth: true }
            },
            {
                path: '/inventory/management/reports',
                name: 'manageinventoryreports',
                component: () => import('@/views/ManageInventoryReports.vue')
            },
            {
                path: '/inventory/management/suppliers',
                name: 'manageinventorysuppliers',
                component: () => import('@/views/ManageSuppliers.vue')
            },
            {
                path: '/uikit/formlayout',
                name: 'formlayout',
                component: () => import('@/views/uikit/FormLayout.vue')
            },
            {
                path: '/uikit/input',
                name: 'input',
                component: () => import('@/views/uikit/Input.vue')
            },
            {
                path: '/uikit/floatlabel',
                name: 'floatlabel',
                component: () => import('@/views/uikit/FloatLabel.vue')
            },
            {
                path: '/uikit/invalidstate',
                name: 'invalidstate',
                component: () => import('@/views/uikit/InvalidState.vue')
            },
            {
                path: '/uikit/button',
                name: 'button',
                component: () => import('@/views/uikit/Button.vue')
            },
            {
                path: '/uikit/table',
                name: 'table',
                component: () => import('@/views/uikit/Table.vue')
            },
            {
                path: '/uikit/list',
                name: 'list',
                component: () => import('@/views/uikit/List.vue')
            },
            {
                path: '/uikit/tree',
                name: 'tree',
                component: () => import('@/views/uikit/Tree.vue')
            },
            {
                path: '/uikit/panel',
                name: 'panel',
                component: () => import('@/views/uikit/Panels.vue')
            },

            {
                path: '/uikit/overlay',
                name: 'overlay',
                component: () => import('@/views/uikit/Overlay.vue')
            },
            {
                path: '/uikit/media',
                name: 'media',
                component: () => import('@/views/uikit/Media.vue')
            },
            {
                path: '/uikit/menu',
                component: () => import('@/views/uikit/Menu.vue'),
                children: [
                    {
                        path: '/uikit/menu',
                        component: () => import('@/views/uikit/menu/PersonalDemo.vue')
                    },
                    {
                        path: '/uikit/menu/seat',
                        component: () => import('@/views/uikit/menu/SeatDemo.vue')
                    },
                    {
                        path: '/uikit/menu/payment',
                        component: () => import('@/views/uikit/menu/PaymentDemo.vue')
                    },
                    {
                        path: '/uikit/menu/confirmation',
                        component: () => import('@/views/uikit/menu/ConfirmationDemo.vue')
                    }
                ]
            },
            {
                path: '/uikit/message',
                name: 'message',
                component: () => import('@/views/uikit/Messages.vue')
            },
            {
                path: '/uikit/file',
                name: 'file',
                component: () => import('@/views/uikit/File.vue')
            },
            {
                path: '/uikit/charts',
                name: 'charts',
                component: () => import('@/views/uikit/Chart.vue')
            },
            {
                path: '/uikit/misc',
                name: 'misc',
                component: () => import('@/views/uikit/Misc.vue')
            },
            {
                path: '/blocks',
                name: 'blocks',
                component: () => import('@/views/utilities/Blocks.vue')
            },
            {
                path: '/utilities/icons',
                name: 'icons',
                component: () => import('@/views/utilities/Icons.vue')
            },
            {
                path: '/pages/timeline',
                name: 'timeline',
                component: () => import('@/views/pages/Timeline.vue')
            },
            {
                path: '/pages/empty',
                name: 'empty',
                component: () => import('@/views/pages/Empty.vue')
            },
            {
                path: '/pages/crud',
                name: 'crud',
                component: () => import('@/views/pages/Crud.vue')
            },
            {
                path: '/documentation',
                name: 'documentation',
                component: () => import('@/views/utilities/Documentation.vue')
            },
            {
                path: '/revenue/dashboard',
                name: 'revenuedashboard',
                component: () => import('@/views/RevenueDashboard.vue'),
                meta: { auth: true }
            }
        ]
    },
    {
        path: '/dashboard/landing',
        component: DashboardLandingLayout,
        children: [
            {
                path: '/dashboard/landing',
                name: 'dashboardlanding',
                component: () => import('@/views/DashboardLanding.vue'),
                meta: { auth: true } // Add meta field to specify that this route requires authentication
            }
        ]
    },
    {
        path: '/booking',
        component: BookingLayout,
        children: [
            {
                path: '/booking',
                name: 'bookinghome',
                component: () => import('@/views/pages/booking/Home.vue')
            },
            {
                path: '/booking/rooms',
                children: [
                    {
                        path: '/booking/results',
                        name: 'bookingresults',
                        component: () => import('@/views/pages/booking/Results.vue')
                    },
                    {
                        path: '/booking/rooms',
                        name: 'bookingrooms',
                        component: () => import('@/views/pages/booking/Rooms.vue')
                    },
                    {
                        path: '/booking/rooms/details/:id',
                        name: 'roomdetails',
                        component: () => import('@/views/pages/booking/RoomDetails.vue')
                    },
                    {
                        path: '/booking/rooms/details/:id/confirm/:booking_id',
                        name: 'roomdetailsconfirmreservation',
                        component: () => import('@/views/pages/booking/RoomDetailsConfirmResavation.vue')
                    },
                    {
                        path: '/booking/rooms/details/:id/confirm-booking/:booking_id',
                        name: 'roomdetailsconfirmbooking',
                        component: () => import('@/views/pages/booking/RoomDetailsConfirmResavation.vue')
                    },
                    {
                        path: '/booking/rooms/details/:id/payment/:booking_id',
                        name: 'roomdetailspayreservation',
                        component: () => import('@/views/pages/booking/RoomDetailsPayResavation.vue')
                    },
                ],

            },
            {
                path: '/booking/offers',
                name: 'bookingoffers',
                component: () => import('@/views/pages/booking/Offers.vue')
            },
            {
                path: '/booking/hotel-info',
                name: 'bookinghotelinfo',
                component: () => import('@/views/pages/booking/HotelInfo.vue')
            },
            {
                path: '/booking/location',
                name: 'bookinglocation',
                component: () => import('@/views/pages/booking/Location.vue')
            },
            {
                path: '/booking/user/account',
                children: [
                    {
                        path: '/booking/user/account',
                        name: 'useraccount',
                        component: () => import('@/views/pages/booking/UserAccount.vue'),
                        meta: { auth: true }
                    },
                    {
                        path: '/booking/user/account/booking/details/:booking_id',
                        name: 'useraccountbookingdetails',
                        component: () => import('@/views/pages/booking/UserAccountBookingDetails.vue'),
                        meta: { auth: true }
                    },
                ],

            },
        ]
    },
    {
        path: '',
        name: 'landing',
        component: () => import('@/views/pages/Landing.vue')
    },
    {
        path: '/pages/notfound',
        name: 'notfound',
        component: () => import('@/views/pages/NotFound.vue')
    },

    {
        path: '/auth/login',
        name: 'login',
        component: () => import('@/views/pages/auth/Login.vue'),
        meta: { auth: false } // Add meta field to specify that this route requires authentication
    },

    {
        path: '/auth/login-guest',
        name: 'loginguest',
        component: () => import('@/views/pages/auth/LoginGuest.vue'),
        meta: { auth: false } // Add meta field to specify that this route requires authentication
    },
    // {
    //     path: '/auth/register',
    //     name: 'register',
    //     component: () => import('@/views/pages/auth/Register.vue')
    // },
    {
        path: '/auth/forgot-password',
        name: 'forgot-password',
        component: () => import('@/views/pages/auth/ForgotPassword.vue')
    },
    {
        path: '/auth/verify',
        name: 'verify',
        component: () => import('@/views/pages/auth/PhoneNumberVerification.vue')
    },
    {
        path: '/auth/new-password',
        name: 'newpassword',
        component: () => import('@/views/pages/auth/NewPassword.vue')
    },
    {
        path: '/auth/access',
        name: 'accessDenied',
        component: () => import('@/views/pages/auth/Access.vue')
    },
    {
        path: '/auth/error',
        name: 'error',
        component: () => import('@/views/pages/auth/Error.vue')
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.VITE_BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
        // Always scroll to the top
        return { top: 0 }
    }
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = store.getters[`auth/${IS_USER_AUTHENTICATE_GETTER}`];
    console.log('isAuthenticated:', isAuthenticated);

    const userData = store.getters[`auth/${GET_USER_DATA_GETTER}`];
    console.log('userData:', userData);

    const userRole = userData ? userData.role : null;
    console.log('userRole:', userRole);

    const loginGuestPath = '/auth/login-guest';
    const loginPath = '/auth/login';
    const dashboardLandingPath = '/dashboard/landing';
    const bookingPath = '/booking';

    if (to.meta.auth && !isAuthenticated) {
        // User is not authenticated and route requires auth
        console.log('Route requires auth and user is not authenticated');
        if (to.path.includes('/booking/user/account')) {
            next(loginGuestPath);
        } else {
            next(loginPath);
        }
    } else if (to.meta.auth === false && isAuthenticated) {
        // User is authenticated but trying to access a non-auth route
        console.log('Route does not require auth and user is authenticated');
        if (userRole === 'Admin') {
            console.log('User is Admin, redirecting to dashboard');
            next(dashboardLandingPath);
        } else {
            console.log('User is not Admin, redirecting to booking');
            next(bookingPath);
        }
    } else if (userRole === 'Admin' && to.path.startsWith('/booking')) {
        // Admin user trying to access /booking routes
        console.log('Admin user trying to access /booking route, redirecting to dashboard');
        next(dashboardLandingPath);
    } else {
        // For all other cases, proceed to the requested route
        console.log('Proceeding to the requested route');
        next();
    }
});




export default router;
