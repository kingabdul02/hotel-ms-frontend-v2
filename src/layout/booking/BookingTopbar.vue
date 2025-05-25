<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from "primevue/usetoast";
import SignupValidations from '../../service/SignupValidations';
import {
    LOADING_SPINNER_SHOW_MUTATION,
    LOGIN_ACTION_GUEST,
    LOGOUT_ACTION,
    IS_USER_AUTHENTICATE_GETTER,
    GET_USER_DATA_GETTER,
    SIGNUP_ACTION,
} from '../../store/storeconstants';

const email = ref('');
const password = ref('');
const password_confirmation = ref('');
const name = ref('');
const phone = ref('');
const loading = ref(false);
const errors = ref({});
const error = ref('');
const toast = useToast();
const userData = computed(() => store.getters['auth/' + GET_USER_DATA_GETTER]);
const userEmail = computed(() => userData.value.email);
const userName = computed(() => userData.value.name);

const router = useRouter();
const store = useStore();

const showSuccess = () => {
    toast.add({ severity: 'success', summary: 'Login Successful', detail: 'Welcome back! ' + userName.value, life: 5000 });
};

const showSuccessSignupToast = () => {
    toast.add({ severity: 'success', summary: 'Signup Successful', detail: 'Your account has been created successfully. Welcome aboard!', life: 5000 });
};

const showModal = ref(false);

const clearError = () => {
    error.value = '';
};

const onLogin = async () => {
    const validations = new SignupValidations(email.value, password.value);
    errors.value = validations.checkValidations();

    if (Object.keys(errors.value).length) {
        console.log(errors.value);
        return false;
    }

    error.value = '';
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);

    try {
        await store.dispatch('auth/' + LOGIN_ACTION_GUEST, {
            email: email.value,
            password: password.value,
        });
        // router.push('/dashboard/landing');
        showWelcomeMessage.value = true;
        showRegForm.value = false;
        showLogingForm.value = false;
        setTimeout(() => {
            // Navigate to dashboard upon successful login
            showSuccess();
        }, 500); // Show success message after successful login
    } catch (e) {
        // Handle the error properly and log it
        if (e.response && e.response.data && e.response.data.message) {
            error.value = e.response.data.message;
        } else {
            error.value = e || 'An error occurred';
        }
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

const onSignup = async () => {
    const validations = new SignupValidations(email.value, password.value);
    errors.value = validations.checkValidations();

    if (Object.keys(errors.value).length) {
        console.log(errors.value);
        return false;
    }

    error.value = '';
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);

    try {
        await store.dispatch('auth/' + SIGNUP_ACTION, {
            email: email.value,
            password: password.value,
            password_confirmation: password_confirmation.value,
            name: name.value,
            phone: phone.value,
        });
        // router.push('/dashboard/landing');
        showWelcomeMessage.value = true;
        showRegForm.value = false;
        showLogingForm.value = false;
        setTimeout(() => {
            // Navigate to dashboard upon successful login
            showSuccessSignupToast();
        }, 500); // Show success message after successful login
    } catch (e) {
        // Handle the error properly and log it
        if (e.response && e.response.data && e.response.data.message) {
            error.value = e.response.data.message;
        } else {
            error.value = e || 'An error occurred';
        }
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);
const showRegForm = ref(false);
const showWelcomeMessage = ref(false);
const showLogingForm = ref(true);
const menu = ref();
const items = ref([
    {
        label: 'Options',
        items: [
            {
                label: 'Profile',
                icon: 'pi pi-user',
                command: () => {
                    goToProfile();
                }
            },
            {
                label: 'Logout',
                icon: 'pi pi-sign-out',
                command: () => {
                    performLogout();
                }
            }
        ]
    }
]);

const isAuthenticated = computed(() => store.getters['auth/' + IS_USER_AUTHENTICATE_GETTER]);

const performLogout = async () => {
    await store.dispatch('auth/' + LOGOUT_ACTION);
    // router.push('/auth/login');
};

const goToProfile = () => {
    // Navigate to the profile page
    router.push('/booking/user/account'); // Adjust the path to your profile page
};

const toggle = (event) => {
    menu.value.toggle(event);
};

onMounted(() => {
    bindOutsideClickListener();
});

onBeforeUnmount(() => {
    unbindOutsideClickListener();
});

const logoUrl = computed(() => {
    return `/img/logo-nbte-2.png`;
});

const onTopBarMenuButton = () => {
    topbarMenuActive.value = !topbarMenuActive.value;
};
const topbarMenuClasses = computed(() => {
    return {
        'layout-topbar-menu-mobile-active': topbarMenuActive.value
    };
});

const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                topbarMenuActive.value = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
};
const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
};
const isOutsideClicked = (event) => {
    if (!topbarMenuActive.value) return;

    const sidebarEl = document.querySelector('.layout-topbar-menu');
    const topbarEl = document.querySelector('.layout-topbar-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};

</script>

<template>
    <Dialog class="shadow-8" style="z-index: 99999;" :style="{ width: '40vw' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" v-model:visible="showModal" modal :pt="{
            root: 'border-none',
            mask: {
                style: 'backdrop-filter: blur(2px)'
            }
        }">
        <template #container="{ closeCallback }">
            <div class="flex flex-column px-5 py-5 gap-2 montserrat-font"
                style="border-radius: 12px; background-image: radial-gradient(circle at left top, var(--primary-400), var(--primary-700))">
                <div class="surface-section px-4 py-8 md:px-6 lg:px-8 card" v-if="showWelcomeMessage">
                    <div class="text-700 text-center">
                        <div class="text-center">
                            <span class="align-items-center">
                                <img src="/img/logo-nbte.png" alt="NBTE" class="img-fluid" height="80" width="80">
                            </span>
                        </div>
                        <div class="text-900 font-bold text-4xl mb-3">Welcome back</div>
                        <div class="text-700 text-xl mb-5">
                            We're thrilled to have you with us again. Explore our exclusive offers and find the perfect
                            stay for your next adventure. Happy booking!.</div>
                        <Button label="Explore"
                            class="font-bold px-8 py-3 p-button-raised p-button-rounded white-space-nowrap"
                            @click="showLogingForm=true;showWelcomeMessage=false;clearError;showModal=false;"></Button>
                    </div>
                </div>
                <form @submit.prevent="onSignup()" v-if="showRegForm">
                    <div class="text-center">
                        <span class="align-items-center">
                            <img src="/img/logo-nbte.png" alt="NBTE" class="img-fluid" height="80" width="80">
                        </span>
                    </div>
                    <div
                        class="text-primary-50 text-with-shadow font-bold md:text-4xl lg:text-4xl text-3xl text-center">
                        <span class="primary-blue-font">Sign-Up</span>
                    </div>
                    <div class="text-700 font-bold text-xl text-center mb-4">
                        Please create an account
                    </div>
                    <div v-if="errors.length">
                        <Message v-for="error in errors" :key="error" severity="error">{{ error }}</Message>
                    </div>
                    <Message v-if="error" severity="error">{{ error }}</Message>
                    <div class="p-fluid">
                        <div class="formgrid grid">
                            <div class="col-12 pb-4">
                                <label for="name" class="text-primary-50 font-semibold block mb-2">Username</label>
                                <InputText id="name" v-model.trim="name" type="text"
                                    class="bg-white-alpha-40 border-none p-3 text-primary-50"
                                    placeholder="Enter username">
                                </InputText>
                                <small class="text-red-600" v-if="errors.name">{{ errors.name }}</small>
                            </div>
                            <div class="xl:col-6 md:col-6 lg:col-6 col-12 pb-4">
                                <label for="email" class="text-primary-50 font-semibold block mb-2">Email</label>
                                <InputText id="email" v-model.trim="email" type="emial"
                                    class="bg-white-alpha-40 border-none p-3 text-primary-50" placeholder="Enter email">
                                </InputText>
                                <small class="text-red-600" v-if="errors.email">{{ errors.email }}</small>
                            </div>
                            <div class="xl:col-6 md:col-6 lg:col-6 col-12 pb-4">
                                <label for="phone" class="text-primary-50 font-semibold block mb-2">Phone</label>
                                <InputText id="phone" v-model.trim="phone" type="tel"
                                    class="bg-white-alpha-40 border-none p-3 text-primary-50" placeholder="Enter phone">
                                </InputText>
                                <small class="text-red-600" v-if="errors.phone">{{ errors.phone }}</small>
                            </div>
                            <div class="xl:col-6 md:col-6 lg:col-6 col-12 pb-4">
                                <label for="password" class="text-primary-50 font-semibold block mb-2">Password</label>
                                <InputText id="password" v-model.trim="password"
                                    class="bg-white-alpha-40 border-none p-3 text-primary-50"
                                    placeholder="Enter password" type="password"></InputText>
                                <small class="text-red-600" v-if="errors.password">{{ errors.password }}</small>
                            </div>
                            <div class="xl:col-6 md:col-6 lg:col-6 col-12 pb-4">
                                <label for="password_confirmation"
                                    class="text-primary-50 font-semibold block mb-2">Confirm
                                    Password</label>
                                <InputText id="password_confirmation" v-model.trim="password_confirmation"
                                    class="bg-white-alpha-40 border-none p-3 text-primary-50"
                                    placeholder="Enter confirm password" type="password"></InputText>
                                <small class="text-red-600" v-if="errors.password_confirmation">{{
                                    errors.password_confirmation }}</small>
                            </div>

                        </div>
                    </div>
                    <div class="flex align-items-center gap-3">
                        <Button label="Cancel" @click="showModal = false; clearError()" text
                            class="p-3 p-button-raised w-full text-primary-50 border-1 border-white-alpha-30 hover:bg-white-alpha-10 bg-white-alpha-20"></Button>
                        <Button label="Sign-Up" type="submit"
                            class="p-3 p-button-raised w-full text-primary-50 border-1 border-white-alpha-30 hover:bg-white-alpha-10 bg-white-alpha-20"></Button>
                    </div>
                    <p class="text-center text-700 font-bold  text-sm md:text-2xl lg:text-xl my-2">Already have an
                        account? <span class="text-primary-50 font-bold cursor-pointer"
                            @click="showRegForm = false; showLogingForm = true;">Sign-in</span></p>
                </form>
                <form @submit.prevent="onLogin" v-if="showLogingForm">
                    <div class="text-center">
                        <span class="align-items-center">
                            <img src="/img/logo-nbte.png" alt="NBTE" class="img-fluid" height="80" width="80">
                        </span>
                    </div>
                    <div
                        class="text-primary-50 text-with-shadow font-bold md:text-4xl lg:text-4xl text-3xl text-center">
                        <span class="primary-blue-font">Sign-In</span>
                    </div>
                    <div class="text-700 font-bold text-xl text-center mb-4">
                        Please Sign in to your account
                    </div>
                    <div v-if="errors.length">
                        <Message v-for="error in errors" :key="error" severity="error">{{ error }}</Message>
                    </div>
                    <Message v-if="error" severity="error">{{ error }}</Message>
                    <div class="p-fluid">
                        <div class="formgrid grid">
                            <div class="col-12 pb-4">
                                <label for="email" class="text-primary-50 font-semibold block mb-2">Email</label>
                                <InputText id="email" type="email" placeholder="Email address" class="w-full mb-5"
                                    style="padding: 1rem;" v-model="email" />
                                <small class="text-red-600" v-if="errors.email">{{ errors.email }}</small>
                            </div>
                            <div class="col-12 pb-4">
                                <label for="password" class="text-primary-50 font-semibold block mb-2">Password</label>
                                <Password id="password" v-model="password" placeholder="Password" :toggleMask="true"
                                    class="w-full" inputClass="w-full" :inputStyle="{ padding: '1rem' }">
                                </Password>
                                <small class="text-red-600" v-if="errors.password">{{ errors.password }}</small>
                            </div>
                        </div>
                    </div>
                    <div class="flex align-items-center gap-3">
                        <Button label="Cancel" @click="showModal = false; clearError()" text
                            class="p-3 p-button-raised w-full text-primary-50 border-1 border-white-alpha-30 hover:bg-white-alpha-10 bg-white-alpha-20"></Button>
                        <Button label="Sign-In" type="submit" :loading="loading"
                            class="p-3 p-button-raised w-full text-primary-50 border-1 border-white-alpha-30 hover:bg-white-alpha-10 bg-white-alpha-20"></Button>
                    </div>
                    <p class="text-center text-700 font-bold  text-sm md:text-2xl lg:text-xl my-2">New on our platform?
                        <span class="text-primary-50 font-bold cursor-pointer"
                            @click="showLogingForm = false; showRegForm = true;">Sign-up</span>
                    </p>
                </form>
            </div>
        </template>
    </Dialog>

    <div class="layout-topbar">
        <router-link to="/" class="layout-topbar-logo">
            <img :src="logoUrl" alt="logo" />
            <span class="font-bold">NBTE Consult Limited</span>
        </router-link>

        <button class="p-link layout-topbar-menu-button layout-topbar-button" @click="onTopBarMenuButton()">
            <i class="pi pi-ellipsis-v"></i>
        </button>
        <div class="layout-topbar-menu xl:pb-1 lg:pb-1 md:pb-1 pb-4" :class="topbarMenuClasses">
            <div class="list-none flex lg:align-items-center select-none flex-column lg:flex-row cursor-pointer mr-4">
                <div :class="{ 'active': $route.path === '/booking' }">
                    <router-link to="/booking" class="flex md:ml-6 pt-5 md:pt-1 lg:pt-1 nv-link font-bold p-ripple"
                        v-ripple>
                        <span>Home</span>
                    </router-link>
                </div>
                <div :class="{ 'active': $route.path === '/booking/rooms' }">
                    <router-link to="/booking/rooms"
                        class="flex md:ml-6 pt-5 md:pt-1 lg:pt-1 nv-link font-bold p-ripple" v-ripple>
                        <span>Rooms</span>
                    </router-link>
                </div>
                <div :class="{ 'active': $route.path === '/booking/hotel-info' }">
                    <router-link to="/booking/hotel-info"
                        class="flex md:ml-6 pt-5 md:pt-1 lg:pt-1 nv-link font-bold p-ripple" v-ripple>
                        <span>Hotel Info</span>
                    </router-link>
                </div>
                <div :class="{ 'active': $route.path === '/booking/location' }">
                    <router-link to="/booking/location"
                        class="flex md:ml-6 pt-5 md:pt-1 lg:pt-1 nv-link font-bold p-ripple" v-ripple>
                        <span>Location</span>
                    </router-link>
                </div>
                <li v-if="!isAuthenticated">
                    <a class="flex md:ml-6 pt-5 md:pt-1 lg:pt-1 nv-link font-bold p-ripple" v-ripple>
                        <Button label="Sign-up / Sign-in" class="px-5 py-3 montserrat-font" @click="showModal = true" />
                    </a>
                </li>
            </div>
            <div v-if="isAuthenticated">
                <Chip @click="toggle" icon="pi pi-user"
                    class="montserrat-font xl:mt-0 lg:mt-0 md:mt-0 mt-4 surface-border border-3 c-shadow cursor-pointer"
                    :label="userName" />
                <Button @click="toggle" icon="pi pi-chevron-down" severity="secondary" class="pt-3 ml-1" text rounded
                    aria-label="Favorite" />
                <Menu class="montserrat-font mt-2" ref="menu" id="overlay_menu" :model="items" :popup="true" />
            </div>

        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>

<script>

import { mapActions, mapGetters } from 'vuex';
import {
    IS_USER_AUTHENTICATE_GETTER,
} from '../../store/storeconstants';

export default {

    methods: {
        goToProfile() {
            // Use Vue Router's push method to navigate to the desired route
            // this.$router.push('/booking/rooms/details/room-c-12');
        },
        logout() {
            // this.$router.push('/booking/rooms');
        }
    },
    computed: {

        ...mapGetters('auth', {
            isAuthenticated: IS_USER_AUTHENTICATE_GETTER,
        }),

        isUserRoute() {
            // Check if the current route contains '/booking/user'
            return this.$route.path.includes('/booking/user');
        }
    }
}
</script>
