<script setup>
import { ref, onMounted, computed } from 'vue';
import axiosInstance from '@/service/AxiosInstance';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { formatDateTime } from '@/utils/dateTimeFormatter';
import { mapMutations, useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION, GET_USER_DATA_GETTER, IS_USER_AUTHENTICATE_GETTER } from '@/store/storeconstants';

const formatCurrency = (value) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'NGN' });
};

const myBookings = ref([]);
const toast = useToast();
const store = useStore();
const { showLoading } = mapMutations({
    showLoading: LOADING_SPINNER_SHOW_MUTATION
});
const isAuthenticated = computed(() => store.getters['auth/' + IS_USER_AUTHENTICATE_GETTER]);
const userData2 = computed(() => store.getters['auth/' + GET_USER_DATA_GETTER]);
const roomPriceToPay = ref(0);

const email = ref('');
const password = ref('');
const password_confirmation = ref('');
const name = ref('');
const phone = ref('');
const loading = ref(false);
const errors = ref({});
const error = ref('');
const userEmail = computed(() => userData.value.email);

const router = useRouter();

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
            password: password.value
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
            phone: phone.value
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

const performLogout = async () => {
    await store.dispatch('auth/' + LOGOUT_ACTION);
    // router.push('/auth/login');
};

const showSuccess = () => {
    toast.add({ severity: 'success', summary: 'Login Successful', detail: 'Welcome back! ' + userEmail.value, life: 5000 });
};

const showSuccessSignupToast = () => {
    toast.add({ severity: 'success', summary: 'Signup Successful', detail: 'Your account has been created successfully. Welcome aboard!', life: 5000 });
};

const showModal = ref(false);

const clearError = () => {
    error.value = '';
};

const showLoadingMethod = showLoading.bind({ $store: store });

const fetchMyBookings = async () => {
    showLoadingMethod(true);
    const token = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')).token : null;

    if (!token) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'User not authenticated' });
        showLoadingMethod(false);
        return;
    }

    try {
        const response = await axiosInstance.get('/guest/my-bookings', {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        myBookings.value = response.data.data; // Assuming the bookings are returned in the `data` property

        // toast.add({ severity: 'success', summary: 'Success', detail: 'Bookings fetched successfully', life: 5000 });
        showLoadingMethod(false);
    } catch (error) {
        const errorMessage = error.response && error.response.data && error.response.data.message ? error.response.data.message : 'An error occurred';
        showLoadingMethod(false);
        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 5000 });
    }
};

const items = ref([{ label: 'Saved Bookings' }, { label: 'All Bookings' }]);

onMounted(() => {
    console.log(userData2);
});

const showBookingDetail = ref(false);

const onSortChange = (event) => {
    const value = event.value.value;
    const sortValue = event.value;

    if (value.indexOf('!') === 0) {
        sortOrder.value = -1;
        sortField.value = value.substring(1, value.length);
        sortKey.value = sortValue;
    } else {
        sortOrder.value = 1;
        sortField.value = value;
        sortKey.value = sortValue;
    }
};

onMounted(fetchMyBookings);

const bookingDetails = ref(null);
const bookingID = ref(null);

const userData = computed(() => store.getters['auth/' + GET_USER_DATA_GETTER]);

const fetchBookingDetails = async (bookingId) => {
    showLoadingMethod(true);
    const token = userData.value?.token;
    try {
        const response = await axiosInstance.get(`/guest/get-booking/${bookingId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        bookingDetails.value = response.data.data;
        bookingID.value = response?.data?.data?.booking_id;
        roomPriceToPay.value = response.data.data.paymentEntry.payment_amount;
        showBookingDetail.value = true;
        showLoadingMethod(false);
    } catch (error) {
        showLoadingMethod(false);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Could not fetch booking details' });
    }
};

const handlePayment = () => {
    const token = userData2.value?.token;
    if (isAuthenticated.value && token) {
        const handler = PaystackPop.setup({
            key: 'pk_test_24673c9637a1bf06e5fb6eb989012747183eb2ae',
            email: userData2.value.email,
            amount: roomPriceToPay.value * 100,
            currency: 'NGN',
            ref: '' + Math.floor(Math.random() * 1000000000 + 1),
            callback: function (response) {
                // Log the response for debugging
                console.log('Paystack response:', response);

                axiosInstance
                    .post(
                        `/make-payment/${bookingID.value}`,
                        {
                            reference: response.reference,
                            transaction: response.transaction,
                            amount: roomPriceToPay.value,
                            status: response.status,
                            message: response.message,
                            host_trx_ref: response.trxref,
                            email: userData.value.email,
                            raw_data: response,
                            payment_provider: 'Paystack'
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    )
                    .then((res) => {
                        if (res.status === 200) {
                            toast.add({ severity: 'success', summary: 'Payment successful', detail: 'Your payment was successful!', life: 5000 });
                            // router.push(`/booking/user/account/booking/details/${bookingID}`);
                            fetchMyBookings();
                            showBookingDetail.value = false;
                        } else {
                            toast.add({ severity: 'error', summary: 'Payment failed', detail: 'There was an issue with your payment. Please try again.' });
                        }
                    })
                    .catch((error) => {
                        console.error('Error making payment:', error);
                        toast.add({ severity: 'error', summary: 'Payment failed', detail: 'There was an issue with your payment. Please try again.' });
                    });
            },
            onClose: function () {
                toast.add({ severity: 'error', summary: 'Payment cancelled!', detail: 'Transaction was not completed' });
            }
        });
        handler.openIframe();
    } else {
        showModal.value = true;
    }
};
</script>

<script>
export default {
    methods: {
        navigateToRooms() {
            this.$router.push('/booking/rooms');
        }
    },
    data() {
        return {
            mapUrl: 'https://maps.app.goo.gl/GPR2N7yV7j1pM2FJ6'
        };
    }
};
</script>

<template>
    <Dialog
        class="shadow-8"
        style="z-index: 99999"
        :style="{ width: '40vw' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
        v-model:visible="showModal"
        modal
        :pt="{
            root: 'border-none',
            mask: {
                style: 'backdrop-filter: blur(2px)'
            }
        }"
    >
        <template #container="{ closeCallback }">
            <div class="flex flex-column px-5 py-5 gap-2 montserrat-font" style="border-radius: 12px; background-image: radial-gradient(circle at left top, var(--primary-400), var(--primary-700))">
                <div class="surface-section px-4 py-8 md:px-6 lg:px-8 card" v-if="showWelcomeMessage">
                    <div class="text-700 text-center">
                        <div class="text-center">
                            <span class="align-items-center">
                                <img src="/img/logo-nbte.png" alt="NBTE" class="img-fluid" height="80" width="80" />
                            </span>
                        </div>
                        <div class="text-900 font-bold text-4xl mb-3">Welcome back</div>
                        <div class="text-700 text-xl mb-5">We're thrilled to have you with us again. Explore our exclusive offers and find the perfect stay for your next adventure. Happy booking!.</div>
                        <Button
                            label="Explore"
                            class="font-bold px-8 py-3 p-button-raised p-button-rounded white-space-nowrap"
                            @click="
                                showLogingForm = true;
                                showWelcomeMessage = false;
                                clearError;
                                showModal = false;
                            "
                        ></Button>
                    </div>
                </div>
                <form @submit.prevent="onSignup()" v-if="showRegForm">
                    <div class="text-center">
                        <span class="align-items-center">
                            <img src="/img/logo-nbte.png" alt="NBTE" class="img-fluid" height="80" width="80" />
                        </span>
                    </div>
                    <div class="text-primary-50 text-with-shadow font-bold md:text-4xl lg:text-4xl text-3xl text-center">
                        <span class="primary-blue-font">Sign-Up</span>
                    </div>
                    <div class="text-700 font-bold text-xl text-center mb-4">Please create an account</div>
                    <div v-if="errors.length">
                        <Message v-for="error in errors" :key="error" severity="error">{{ error }}</Message>
                    </div>
                    <Message v-if="error" severity="error">{{ error }}</Message>
                    <div class="p-fluid">
                        <div class="formgrid grid">
                            <div class="col-12 pb-4">
                                <label for="name" class="text-primary-50 font-semibold block mb-2">Username</label>
                                <InputText id="name" v-model.trim="name" type="text" class="bg-white-alpha-40 border-none p-3 text-primary-50" placeholder="Enter username"> </InputText>
                                <small class="text-red-600" v-if="errors.name">{{ errors.name }}</small>
                            </div>
                            <div class="xl:col-6 md:col-6 lg:col-6 col-12 pb-4">
                                <label for="email" class="text-primary-50 font-semibold block mb-2">Email</label>
                                <InputText id="email" v-model.trim="email" type="emial" class="bg-white-alpha-40 border-none p-3 text-primary-50" placeholder="Enter email"> </InputText>
                                <small class="text-red-600" v-if="errors.email">{{ errors.email }}</small>
                            </div>
                            <div class="xl:col-6 md:col-6 lg:col-6 col-12 pb-4">
                                <label for="phone" class="text-primary-50 font-semibold block mb-2">Phone</label>
                                <InputText id="phone" v-model.trim="phone" type="tel" class="bg-white-alpha-40 border-none p-3 text-primary-50" placeholder="Enter phone"> </InputText>
                                <small class="text-red-600" v-if="errors.phone">{{ errors.phone }}</small>
                            </div>
                            <div class="xl:col-6 md:col-6 lg:col-6 col-12 pb-4">
                                <label for="password" class="text-primary-50 font-semibold block mb-2">Password</label>
                                <InputText id="password" v-model.trim="password" class="bg-white-alpha-40 border-none p-3 text-primary-50" placeholder="Enter password" type="password"></InputText>
                                <small class="text-red-600" v-if="errors.password">{{ errors.password }}</small>
                            </div>
                            <div class="xl:col-6 md:col-6 lg:col-6 col-12 pb-4">
                                <label for="password_confirmation" class="text-primary-50 font-semibold block mb-2">Confirm Password</label>
                                <InputText id="password_confirmation" v-model.trim="password_confirmation" class="bg-white-alpha-40 border-none p-3 text-primary-50" placeholder="Enter confirm password" type="password"></InputText>
                                <small class="text-red-600" v-if="errors.password_confirmation">{{ errors.password_confirmation }}</small>
                            </div>
                        </div>
                    </div>
                    <div class="flex align-items-center gap-3">
                        <Button
                            label="Cancel"
                            @click="
                                showModal = false;
                                clearError();
                            "
                            text
                            class="p-3 p-button-raised w-full text-primary-50 border-1 border-white-alpha-30 hover:bg-white-alpha-10 bg-white-alpha-20"
                        ></Button>
                        <Button label="Sign-Up" type="submit" class="p-3 p-button-raised w-full text-primary-50 border-1 border-white-alpha-30 hover:bg-white-alpha-10 bg-white-alpha-20"></Button>
                    </div>
                    <p class="text-center text-700 font-bold text-sm md:text-2xl lg:text-xl my-2">
                        Already have an account?
                        <span
                            class="text-primary-50 font-bold cursor-pointer"
                            @click="
                                showRegForm = false;
                                showLogingForm = true;
                            "
                            >Sign-in</span
                        >
                    </p>
                </form>
                <form @submit.prevent="onLogin" v-if="showLogingForm">
                    <div class="text-center">
                        <span class="align-items-center">
                            <img src="/img/logo-nbte.png" alt="NBTE" class="img-fluid" height="80" width="80" />
                        </span>
                    </div>
                    <div class="text-primary-50 text-with-shadow font-bold md:text-4xl lg:text-4xl text-3xl text-center">
                        <span class="primary-blue-font">Sign-In</span>
                    </div>
                    <div class="text-700 font-bold text-xl text-center mb-4">Please Sign in to your account</div>
                    <div v-if="errors.length">
                        <Message v-for="error in errors" :key="error" severity="error">{{ error }}</Message>
                    </div>
                    <Message v-if="error" severity="error">{{ error }}</Message>
                    <div class="p-fluid">
                        <div class="formgrid grid">
                            <div class="col-12 pb-4">
                                <label for="email" class="text-primary-50 font-semibold block mb-2">Email</label>
                                <InputText id="email" type="email" placeholder="Email address" class="w-full mb-5" style="padding: 1rem" v-model="email" />
                                <small class="text-red-600" v-if="errors.email">{{ errors.email }}</small>
                            </div>
                            <div class="col-12 pb-4">
                                <label for="password" class="text-primary-50 font-semibold block mb-2">Password</label>
                                <Password id="password" v-model="password" placeholder="Password" :toggleMask="true" class="w-full" inputClass="w-full" :inputStyle="{ padding: '1rem' }"> </Password>
                                <small class="text-red-600" v-if="errors.password">{{ errors.password }}</small>
                            </div>
                        </div>
                    </div>
                    <div class="flex align-items-center gap-3">
                        <Button
                            label="Cancel"
                            @click="
                                showModal = false;
                                clearError();
                            "
                            text
                            class="p-3 p-button-raised w-full text-primary-50 border-1 border-white-alpha-30 hover:bg-white-alpha-10 bg-white-alpha-20"
                        ></Button>
                        <Button label="Sign-In" type="submit" :loading="loading" class="p-3 p-button-raised w-full text-primary-50 border-1 border-white-alpha-30 hover:bg-white-alpha-10 bg-white-alpha-20"></Button>
                    </div>
                    <p class="text-center text-700 font-bold text-sm md:text-2xl lg:text-xl my-2">
                        New on our platform?
                        <span
                            class="text-primary-50 font-bold cursor-pointer"
                            @click="
                                showLogingForm = false;
                                showRegForm = true;
                            "
                            >Sign-up</span
                        >
                    </p>
                </form>
            </div>
        </template>
    </Dialog>

    <Dialog v-model:visible="showBookingDetail" modal header=" " class="montserrat-font" :style="{ width: '80vw' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
        <div class="surface-ground px-4 py-2 md:px-4 lg:px-4">
            <div class="text-900 font-bold text-3xl mb-4 text-center p-3 bg-green-100 border-round"><span class="text-primary">Booking ID:</span> {{ bookingDetails?.booking_id }}</div>
            <div class="grid">
                <div class="col-12 lg:col-3">
                    <div class="p-3 h-full">
                        <div class="h-full flex flex-column">
                            <div class="text-900 font-bold text-xl mb-2">Room name</div>
                            <div style="height: 20px" class="text-600">{{ bookingDetails?.room?.name }}</div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <div class="flex align-items-center">
                                <span class="font-bold text-2xl">
                                    <i class="pi pi-clock text-green-500 mr-2"></i>
                                </span>
                                <span class="ml-2 text-600">
                                    {{ formatDateTime(bookingDetails?.check_in_date) }}
                                </span>
                            </div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <a :href="mapUrl" target="_blank" rel="noopener noreferrer">
                                <Button label="Get Direction" icon="pi pi-map-marker" class="p-3 w-full mt-auto"></Button>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="col-12 lg:col-3">
                    <div class="p-3 h-full">
                        <div class="h-full flex flex-column">
                            <div class="text-900 font-bold text-xl mb-2">Room type</div>
                            <div style="height: 20px" class="text-600">{{ bookingDetails?.room?.roomType?.name }}</div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <div class="flex align-items-center">
                                <span class="font-bold text-2xl">
                                    <i class="pi pi-clock text-red-500 mr-2"></i>
                                </span>
                                <span class="ml-2 font-medium text-600">
                                    {{ formatDateTime(bookingDetails?.check_out_date) }}
                                </span>
                            </div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <router-link v-if="bookingDetails?.payment_status != 'pending'" :to="`/booking/user/account/booking/details/${bookingDetails?.booking_id}`">
                                <Button label="Generate Reciept" icon="pi pi-file" outlined icon-pos="right" class="p-3 w-full"></Button>
                            </router-link>
                            <!-- <Button v-if="bookingDetails?.payment_status == 'pending'"
                                :disabled="bookingDetails?.payment_status == 'pending'" label="View Bookings"
                                icon="pi pi-print" outlined icon-pos="right" class="p-3 w-full"></Button> -->

                            <Button v-if="bookingDetails?.payment_status == 'pending'" label="Make Payment" @click="handlePayment" icon="pi pi-money-bill" severity="info" icon-pos="right" class="p-3 w-full"></Button>
                        </div>
                    </div>
                </div>
                <div class="col-12 lg:col-3">
                    <div class="p-3 h-full">
                        <div class="h-full flex flex-column">
                            <div class="text-900 font-bold text-xl mb-2">Payment status</div>
                            <div style="height: 20px" class="text-600">
                                <Tag v-if="bookingDetails?.payment_status !== 'pending'" severity="success" class="px-3" value="Paid"></Tag>
                                <Tag v-if="bookingDetails?.payment_status === 'pending'" severity="danger" class="px-3" value="Pending"></Tag>
                            </div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <div class="flex align-items-center font-bold">
                                <span class="font-bold text-primary text-2xl">
                                    <i class="pi pi-users"></i>
                                </span>
                                <span class="ml-2 font-medium text-600"> {{ bookingDetails?.no_of_guests }} Guest(s) </span>
                                <span class="mx-3">|</span>
                                <span class="font-bold text-primary text-2xl">
                                    <i class="pi pi-users"></i>
                                </span>
                                <span class="ml-2 font-medium text-600"> {{ bookingDetails?.no_of_nights }} Night(s) </span>
                            </div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <Button label="Cancel Booking" class="p-3 w-full p-button-outlined p-button-danger" icon="pi pi-times-circle"></Button>
                        </div>
                    </div>
                </div>
                <div class="col-12 lg:col-3">
                    <div class="p-3 h-full">
                        <div class="h-full flex flex-column">
                            <div class="text-900 font-bold text-xl mb-2">Payment amount</div>
                            <div style="height: 20px" class="text-600">
                                <span class="font-medium text-600">
                                    {{ formatCurrency(bookingDetails?.paymentEntry?.payment_amount) }}
                                </span>
                            </div>
                            <span v-if="bookingDetails?.payment_status !== 'pending'">
                                <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                                <small class="flex align-items-center font-bold">
                                    <span class="font-bold text-2xl">
                                        <i class="pi pi-clock text-green-500 mr-2"></i>
                                    </span>
                                    <span class="ml-2 font-medium text-600"><strong class="text-primary">Payed on:</strong> {{ formatDateTime(bookingDetails?.paymentEntry.payment_date) }}</span>
                                </small>
                                <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12 p-3">
                <div class="border-2 border-dashed surface-border p-3">
                    <div class="grid">
                        <div class="col-12 lg:col-6 md:col-6 xl:col-6">
                            <div class="text-900 font-bold text-xl mb-2">Special Requests:</div>
                            <div class="black-font text-1xl">{{ bookingDetails?.special_requests }}</div>
                        </div>
                        <div class="col-12 lg:col-6 md:col-6 xl:col-6">
                            <div class="text-900 font-bold text-xl mb-2">Cancellation Request:</div>
                            <div class="black-font text-1xl">{{ bookingDetails?.cancelationRequest ?? 'Not set' }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex justify-content-end gap-2">
            <Button type="button" icon="pi pi-times" label="Close" severity="danger" outlined @click="showBookingDetail = false"></Button>
        </div>
    </Dialog>

    <div class="mt-7"></div>
    <div class="min-h-screen px-4 md:px-0 lg:px-0">
        <Panel class="shadow-1 montserrat-font mb-4" header=" ">
            <template #icons>
                <button class="p-panel-header-icon p-link">
                    <span class="pi pi-user-edit"></span>
                </button>
            </template>
            <div class="grid pl-4 pb-5">
                <div class="col-12 md:col-4 lg:col-4 p-2 md:p-3 lg:p-3 text-center">
                    <div
                        style="background-image: url('/img/user-avatar.png'); height: 200px; width: 200px; border-radius: 8px; background-size: cover; background-position: center; background-repeat: no-repeat"
                        class="card p-0 c-shadow smoke-bg"
                    ></div>
                </div>
                <div class="col-12 md:col-8 lg:col-8">
                    <div class="grid">
                        <div class="col-12">
                            <div class="text-2xl md:text-3xl lg:text-3xl text-left font-bold">{{ userData2.name }}</div>
                        </div>
                        <div class="col-12 md:col-6 lg:col-6">
                            <p class="text-500"><i class="pi pi-envelope"></i> {{ userData2.email }}</p>
                            <p class="text-500"><i class="pi pi-phone"></i> {{ userData2.phone }}</p>
                            <!-- <p class="text-500"><i class="pi pi-map-marker"></i> Kaduna</p> -->
                        </div>
                        <!-- <div class="col-12 md:col-6 lg:col-6">
                            <p class="text-500"><i class="pi pi-envelope"></i> modeeahmed@gmail.com</p>
                            <p class="text-500"><i class="pi pi-phone"></i> +234 0000000000</p>
                            <p class="text-500"><i class="pi pi-map-marker"></i> Kaduna</p>
                        </div> -->
                    </div>
                </div>
            </div>
        </Panel>
        <Panel class="shadow-1 montserrat-font">
            <div class="grid pl-4 pb-5">
                <div class="col-12 md:col-3 lg:col-3">
                    <Menu id="custom-tab" class="p-4" :model="items" />
                </div>
                <div class="col-12 md:col-9 lg:col-9">
                    <div class="grid">
                        <div class="col-12">
                            <div class="text-1xl md:text-2xl lg:text-2xl text-left font-bold text-primary">Saved Bookings</div>
                        </div>
                        <div class="col-12">
                            <DataView :value="myBookings" :paginator="true" :rows="9">
                                <template #list="slotProps">
                                    <div class="grid grid-nogutter">
                                        <div v-for="(item, index) in slotProps.items" :key="index" class="col-12">
                                            <div class="flex flex-column sm:flex-row sm:align-items-center p-4 gap-3" :class="{ 'border-top-1 surface-border': index !== 0 }">
                                                <div class="md:w-10rem relative">
                                                    <img class="block xl:block mx-auto border-round w-full img-fit" src="/img/building/nbte-4.jpeg" height="100" width="100" :alt="item.name" />
                                                </div>
                                                <div class="flex flex-column md:flex-row justify-content-between md:align-items-center flex-1 gap-4">
                                                    <div class="flex flex-row md:flex-column justify-content-between align-items-start gap-2 pt-3">
                                                        <div>
                                                            <div class="text-lg font-medium text-secondary mb-3">
                                                                <i class="pi pi-home mr-2"></i><span>{{ item.room.name }}</span>
                                                            </div>
                                                            <div class="text-lg font-medium text-secondary mb-3">
                                                                <i class="pi pi-calendar-minus mr-2"></i><span>No. of Nights: {{ item.no_of_nights }}</span>
                                                            </div>
                                                            <div class="text-lg font-medium text-secondary mb-3">
                                                                <i class="pi pi-calendar mr-2"></i><span>{{ formatDateTime(item.no_of_guests) }} for {{ item.no_of_guests }} Quest(s)</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="flex flex-column md:align-items-end gap-5">
                                                        <span class="">
                                                            <Tag v-if="item.is_confirmed" value="CONFIRMED" severity="success" class="mr-2" style="left: 4px; top: 4px"></Tag>
                                                            <Tag v-if="!item.is_confirmed" value="ENDED" severity="danger" class="mr-2" style="left: 4px; top: 4px"></Tag>

                                                            <Tag v-if="item.payment_status === 'paid'" value="PAID" severity="success" class="mr-2" style="left: 4px; top: 4px"></Tag>
                                                            <Tag v-if="item.payment_status === 'pending'" value="NOT PAID" severity="danger" class="mr-2" style="left: 4px; top: 4px"></Tag>
                                                            <span class="text-1xl font-semibold text-900">ID: {{ item.booking_id }}</span>
                                                        </span>
                                                        <div class="flex flex-row-reverse md:flex-row gap-2">
                                                            <!-- <Button class="p-button-danger" icon="pi pi-trash" label="Remove" outlined></Button> -->
                                                            <!-- <Button class="p-button-info" icon="pi pi-file" @click="showBookingDetail = false" label="View Reciept" outlined></Button> -->
                                                            <!-- <router-link
                                                                :to="`/booking/user/account/booking/details/${item.booking_id}`">
                                                                <Button icon="pi pi-eye" label="Details"
                                                                    class="flex-auto md:flex-initial white-space-nowrap"></Button>
                                                            </router-link> -->
                                                            <Button icon="pi pi-eye" label="Details" class="flex-auto md:flex-initial white-space-nowrap" @click="fetchBookingDetails(item.booking_id)"> </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>

                                <template #grid="slotProps">
                                    <div class="grid grid-nogutter">
                                        <div v-for="(item, index) in slotProps.items" :key="index" class="col-12 sm:col-6 md:col-4 p-2">
                                            <div class="p-4 border-1 surface-border surface-card border-round flex flex-column">
                                                <div class="surface-50 flex justify-content-center border-round p-3">
                                                    <div class="relative mx-auto">
                                                        <img class="border-round w-full" :src="`https://primefaces.org/cdn/primevue/images/product/${item.image}`" :alt="item.name" style="max-width: 300px" />
                                                        <Tag :value="item.inventoryStatus" :severity="getSeverity(item)" class="absolute" style="left: 4px; top: 4px"></Tag>
                                                    </div>
                                                </div>
                                                <div class="pt-4">
                                                    <div class="flex flex-row justify-content-between align-items-start gap-2">
                                                        <div>
                                                            <span class="font-medium text-secondary text-sm">{{ item.category }}</span>
                                                            <div class="text-lg font-medium text-900 mt-1">{{ item.name }}</div>
                                                        </div>
                                                        <div class="surface-100 p-1" style="border-radius: 30px">
                                                            <div
                                                                class="surface-0 flex align-items-center gap-2 justify-content-center py-1 px-2"
                                                                style="border-radius: 30px; box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)"
                                                            >
                                                                <span class="text-900 font-medium text-sm">{{ item.rating }}</span>
                                                                <i class="pi pi-star-fill text-yellow-500"></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="flex flex-column gap-4 mt-4">
                                                        <span class="text-2xl font-semibold text-900">${{ item.price }}</span>
                                                        <div class="flex gap-2">
                                                            <Button icon="pi pi-shopping-cart" label="Buy Now" :disabled="item.inventoryStatus === 'OUTOFSTOCK'" class="flex-auto white-space-nowrap"></Button>
                                                            <Button icon="pi pi-heart" outlined></Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </DataView>
                        </div>
                    </div>
                </div>
            </div>
        </Panel>
    </div>
</template>
<style scoped></style>
