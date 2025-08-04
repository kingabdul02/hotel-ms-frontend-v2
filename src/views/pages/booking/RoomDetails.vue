<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { mapMutations } from 'vuex';
import axiosInstance from '@/service/AxiosInstance';
import SignupValidations from '@/service/SignupValidations';
import { LOADING_SPINNER_SHOW_MUTATION, LOGIN_ACTION_GUEST, IS_USER_AUTHENTICATE_GETTER, GET_USER_DATA_GETTER, SIGNUP_ACTION } from '@/store/storeconstants';
import { useToast } from 'primevue/usetoast';
const toast = useToast();

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

const formatCurrency = (value) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'NGN' });
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
            password: password.value
        });
        // router.push('/dashboard/landing');
        showWelcomeMessage2.value = true;
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
        showWelcomeMessage2.value = true;
        showRegForm.value = false;
        showLogingForm.value = false;
        setTimeout(() => {
            // Navigate to dashboard upon successful login
            store.dispatch('auth/' + LOGIN_ACTION_GUEST, {
                email: email.value,
                password: password.value
            });
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

const route = useRoute();
const store = useStore();
const roomData = ref(null);
const images = ref([]);
const galleriaResponsiveOptions = ref([
    {
        breakpoint: '1024px',
        numVisible: 5
    },
    {
        breakpoint: '960px',
        numVisible: 4
    },
    {
        breakpoint: '768px',
        numVisible: 3
    },
    {
        breakpoint: '560px',
        numVisible: 1
    }
]);

const { showLoading } = mapMutations({
    showLoading: LOADING_SPINNER_SHOW_MUTATION
});

const showLoadingMethod = showLoading.bind({ $store: store });

const roomIdToRoute = ref(null);
const noOfGuests = ref('');
const is_available = ref(null);

onMounted(() => {
    const roomIdFromRoute = route.params.id;
    roomIdToRoute.value = roomIdFromRoute;

    showLoadingMethod(true);
    axiosInstance
        .get(`/rooms/${roomIdFromRoute}`)
        .then((response) => {
            roomData.value = response?.data?.data;
            noOfGuests.value = response?.data?.data?.no_of_guests;
            is_available.value = response?.data?.data?.is_available;
            images.value = response?.data?.data?.images?.data;
        })
        .catch((error) => {
            // console.error('Error fetching rooms:', error);
        })
        .finally(() => {
            showLoadingMethod(false);
        });
});

const router = useRouter();

const goBack = () => {
    router.back();
};

const confirmBooking = ref(false);
const showBookingDetail = ref(false);
const isAuthenticated = computed(() => store.getters['auth/' + IS_USER_AUTHENTICATE_GETTER]);
const showWelcomeMessage = ref(false);
const showWelcomeMessage2 = ref(false);
const showRegForm = ref(false);
const showLogingForm = ref(true);
const email = ref('');
const password = ref('');
const password_confirmation = ref('');
const name = ref('');
const phone = ref('');
const errors = ref({});
const error = ref('');
const checkInDate = ref(null);
const checkOutDate = ref(null);
const userData = computed(() => store.getters['auth/' + GET_USER_DATA_GETTER]);
const userEmail = computed(() => userData.value.email);
const today = new Date();

const minCheckOutDate = computed(() => {
    if (!checkInDate.value) {
        return today;
    }
    const minDate = new Date(checkInDate.value);
    minDate.setDate(minDate.getDate() + 1); // Set to one day after check-in date
    return minDate;
});

const bookRoom = async () => {
    const token = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')).token : null;

    if (!isAuthenticated.value) {
        showModal.value = true;
        return;
    }

    // Get today's date in 'YYYY-MM-DD' format
    const today = new Date().toISOString().split('T')[0];

    const payload = {
        room_id: route.params.id,
        check_in_date: checkInDate.value.toISOString().split('T')[0],
        check_out_date: new Date(checkOutDate.value.getTime() - checkOutDate.value.getTimezoneOffset() * 60000).toISOString().split('T')[0],
        special_requests: 'None',
        no_of_guests: String(noOfGuests.value) // Ensure noOfGuests is a string
    };

    console.log('booking payload', payload);

    try {
        showLoadingMethod(true);

        const response = await axiosInstance.post('/guest/book-room', payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const bookingID = response.data.data.booking_id;
        if (response.status == 200) {
            // Assuming successful booking returns 200 OK
            throw new Error('Failed to book room');
        }

        router.push(`/booking/rooms/details/${payload.room_id}/confirm-booking/${bookingID}`);

        setTimeout(() => {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Room booked successfully', life: 5000 });
        }, 500);
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'An error occurred while booking the room.';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage });
    } finally {
        showLoadingMethod(false);
    }
};
</script>

<script>
export default {
    methods: {
        navigateToRooms() {
            this.$router.push('/booking/rooms');
        }
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
                <div class="surface-section px-4 py-8 md:px-6 lg:px-8 card" v-if="showWelcomeMessage2">
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
                                showWelcomeMessage2 = false;
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
                        <Button label="Sign-In" type="submit" class="p-3 p-button-raised w-full text-primary-50 border-1 border-white-alpha-30 hover:bg-white-alpha-10 bg-white-alpha-20"></Button>
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
    <Dialog v-model:visible="showBookingDetail" modal header="BOOKING DETAILS" class="montserrat-font" :style="{ width: '60vw' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
        <div class="grid pt-5">
            <div class="col-5">
                <div class="text-left">
                    <div class="text-2xl font-bold text-primary line-height-3">Payment Receipt</div>
                    <div class="black-font text-sm mb-3">Generated on 10/02/2024</div>
                    <div class="border-1 p-3 green-bg">
                        <div class="black-font text-sm">Payment Reference Number (PRN)</div>
                        <div class="black-font font-bold text-3xl">109-9252-2038</div>
                    </div>
                </div>
            </div>
            <div class="col-3"></div>
            <div class="col-4 py-0">
                <div class="text-right">
                    <img src="/img/bed-2.jpeg" alt="logo" height="150" class="surface-border border-3 p-2 img-fluid img-fit" />
                </div>
            </div>
            <div class="col-12">
                <div class="text-left">
                    <div class="border-1 p-3 pb-0">
                        <div class="grid">
                            <div class="col-12 green-bg">
                                <div class="font-bold text-sm black-font uppercase">PAYER INFORMATION</div>
                            </div>
                            <div class="col-4 border-top-1">
                                <div class="black-font font-bold text-1xl uppercase">Name</div>
                            </div>
                            <div class="col-8 border-top-1 border-left-1">
                                <div class="black-font text-1xl uppercase">UMAR IDRIS BALA</div>
                            </div>
                            <div class="col-4 border-top-1">
                                <div class="black-font font-bold text-1xl uppercase">Email</div>
                            </div>
                            <div class="col-8 border-top-1 border-left-1">
                                <div class="black-font text-1xl">idreesbalaumar&#64;gmail.com</div>
                            </div>
                            <div class="col-4 border-top-1">
                                <div class="black-font font-bold text-1xl uppercase">Phone</div>
                            </div>
                            <div class="col-8 border-top-1 border-left-1">
                                <div class="black-font text-1xl">234 806 667 9100</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12">
                <div class="text-left">
                    <div class="border-1 p-3 pb-0">
                        <div class="grid">
                            <div class="col-12 green-bg">
                                <div class="font-bold text-sm black-font uppercase">Payment Channel Information</div>
                            </div>
                            <div class="col-4 border-top-1">
                                <div class="black-font font-bold text-1xl uppercase">Payment Method</div>
                            </div>
                            <div class="col-8 border-top-1 border-left-1">
                                <div class="black-font text-1xl">Cash</div>
                            </div>
                            <div class="col-4 border-top-1">
                                <div class="black-font font-bold text-1xl uppercase">Location</div>
                            </div>
                            <div class="col-8 border-top-1 border-left-1">
                                <div class="black-font text-1xl">[Address]</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12">
                <div class="text-left">
                    <div class="border-1 p-3 pb-0">
                        <div class="grid">
                            <div class="col-12 green-bg">
                                <div class="font-bold text-sm black-font uppercase">Payment Channel Information</div>
                            </div>
                            <div class="col-4 border-top-1">
                                <div class="black-font font-bold text-1xl uppercase">Payment Method</div>
                            </div>
                            <div class="col-8 border-top-1 border-left-1">
                                <div class="black-font text-1xl">Card (Credit/Debit)</div>
                            </div>
                            <div class="col-4 border-top-1">
                                <div class="black-font font-bold text-1xl uppercase">Payment Processor</div>
                            </div>
                            <div class="col-8 border-top-1 border-left-1">
                                <div class="black-font text-1xl">[Payment Processor Name]</div>
                            </div>
                            <div class="col-4 border-top-1">
                                <div class="black-font font-bold text-1xl uppercase">Card Type</div>
                            </div>
                            <div class="col-8 border-top-1 border-left-1">
                                <div class="black-font text-1xl">[Visa, Mastercard, American Express, etc.]</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12">
                <div class="text-left">
                    <div class="border-1 p-3 pb-0">
                        <div class="grid">
                            <div class="col-12 green-bg">
                                <div class="font-bold text-sm black-font uppercase">PAYMENT DETAILS</div>
                            </div>
                            <div class="col-2 border-top-1">
                                <div class="text-primary font-bold text-1xl uppercase">Payment Date</div>
                            </div>
                            <div class="col-4 border-top-1 border-left-1">
                                <div class="text-primary font-bold text-1xl uppercase">Service Description</div>
                            </div>
                            <div class="col-2 border-top-1 border-left-1">
                                <div class="text-primary font-bold text-1xl uppercase">Amount (₦)</div>
                            </div>
                            <div class="col-2 border-top-1 border-left-1">
                                <div class="text-primary font-bold text-1xl uppercase">Charge (₦)</div>
                            </div>
                            <div class="col-2 border-top-1 border-left-1">
                                <div class="text-primary font-bold text-1xl uppercase">VAT (₦)</div>
                            </div>
                            <div class="col-2 border-top-1">
                                <div class="black-font text-1xl">10/02/2024</div>
                            </div>
                            <div class="col-4 border-top-1 border-left-1">
                                <div class="black-font text-1xl"><strong>Offence :</strong> Nec tincidunt praesent semper feugiat. Sed adipiscing diam donec adipiscing tristique risus nec feugiat.</div>
                            </div>
                            <div class="col-2 border-top-1 border-left-1">
                                <div class="black-font text-1xl">2,000.00</div>
                            </div>
                            <div class="col-2 border-top-1 border-left-1">
                                <div class="black-font text-1xl">160.00</div>
                            </div>
                            <div class="col-2 border-top-1 border-left-1">
                                <div class="black-font text-1xl">12.00</div>
                            </div>
                            <div class="col-10 border-top-1">
                                <div class="black-font text-2xl text-right font-bold">TOTAL AMOUNT</div>
                            </div>
                            <div class="col-2 border-top-1 border-left-1">
                                <div class="black-font text-2xl font-bold">2,172.00</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- <div class="col-12 py-0 px-3">
                                <div class="text-center text-sm">
                                    <span>
                                        Kindly scan the QR code above to verify this payment or visit:
                                    </span>
                                    <strong>rev.up/auth/verify-payment/109-9252-2038</strong>
                                </div>
                            </div> -->
        </div>
    </Dialog>
    <Dialog
        class="shadow-8"
        style="z-index: 99999"
        :style="{ width: '40vw' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
        v-model:visible="showWelcomeMessage"
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
                        <div class="text-700 text-xl mb-5">Welcome to our platform! Please log in to proceed with the payment.</div>
                        <Button label="Ok!" class="font-bold px-8 py-3 p-button-raised p-button-rounded white-space-nowrap" @click="showWelcomeMessage = false"></Button>
                    </div>
                </div>
            </div>
        </template>
    </Dialog>
    <div>
        <div style="margin-top: -70px !important" class="grid p-0 m-0">
            <div class="xl:col-2 md:col-2 lg:col-2 col-12 xl:text-left md:text-left lg:text-left text-center pt-8">
                <Button icon="pi pi-arrow-left" severity="secondary" rounded raised outlined @click="goBack" />
            </div>
            <div class="xl:col-8 md:col-8 lg:col-8 col-12"></div>
            <div class="xl:col-2 md:col-2 lg:col-2 col-12"></div>
        </div>
        <div class="px-4 md:px-0 lg:px-0 mb-8">
            <div class="pt-2 md:pt-6 lg:pt-6 pl-5 md:pl-6 lg:pl-6">
                <div class="grid p-fluid">
                    <div class="col-12 md:col-6 lg:col-6">
                        <div class="">
                            <Galleria
                                :value="images"
                                :responsiveOptions="galleriaResponsiveOptions"
                                :numVisible="5"
                                :circular="true"
                                :autoPlay="true"
                                :transitionInterval="2000"
                                containerStyle="max-width: 500px"
                                :showItemNavigators="true"
                                :showThumbnails="false"
                                :showIndicators="false"
                            >
                                <template #item="slotProps">
                                    <img
                                        :src="slotProps.item.url"
                                        :alt="slotProps.item.alt"
                                        style="
                                            width: 500px;
                                            height: 500px;
                                            border-radius: 10px;
                                            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;
                                            background-position: center center;
                                            background-size: cover;
                                            object-fit: cover;
                                        "
                                    />
                                </template>
                                <template #thumbnail="slotProps">
                                    <img :src="slotProps.item.thumbnailImageSrc" :alt="slotProps.item.alt" style="width: 100%; display: block" />
                                </template>
                                <template #caption="slotProps">
                                    <div class="text-xl mb-2 font-bold">{{ slotProps.item.title }}</div>
                                    <p class="text-white">{{ slotProps.item.alt }}</p>
                                    <div class="">
                                        <h2 class="text-left font-bold text-white">
                                            <span class="mr-2">
                                                <Tag
                                                    v-if="roomData?.is_available"
                                                    style="background: #6b77e5; color: var(--surface-0); border-radius: 25px; padding: 8px 20px 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important"
                                                >
                                                    <span class="uppercase montserrat-font">Available</span>
                                                </Tag>
                                            </span>
                                            <span class="mr-2">
                                                <Tag
                                                    v-if="roomData?.is_feature"
                                                    style="background: #ffffff; color: #000000; border-radius: 25px; padding: 8px 20px 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important"
                                                >
                                                    <span class="uppercase montserrat-font">Featured</span>
                                                </Tag>
                                            </span>
                                            <span class="mr-2">
                                                <Tag
                                                    v-if="!roomData?.is_available"
                                                    style="background: #febb02; color: #ffffff; border-radius: 25px; padding: 8px 20px 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important"
                                                >
                                                    <span class="uppercase montserrat-font">Booked</span>
                                                </Tag>
                                            </span>
                                        </h2>
                                    </div>
                                </template>
                            </Galleria>
                        </div>
                    </div>
                    <div class="col-12 md:col-6 lg:col-6">
                        <div v-if="!confirmBooking" class="pt-8">
                            <div class="text-900 text-4xl md:text-6xl lg:text-6xl font-bold mb-3">Overview</div>
                            <div class="text-700 text-xl mb-3 font-bold"><i class="pi pi-map-marker mr-3 font-bold"></i><span>Kaduna Road</span></div>
                            <p class="text-700 text-xl mb-3">
                                <i class="pi pi-home mr-3 font-bold"></i><span class="font-bold">Room name : </span>
                                <span class="text-500">{{ roomData?.name }}</span>
                            </p>
                            <p class="text-700 text-xl mb-3">
                                <i class="pi pi-home mr-3 font-bold"></i><span class="font-bold">Room type : </span>
                                <span class="text-500">{{ roomData?.roomType?.name }}</span>
                            </p>
                            <p class="text-700 text-xl mb-3">
                                {{ roomData?.roomType?.description }}
                            </p>
                            <div class="mb-4">
                                <img style="margin-bottom: -4px !important" src="/img/icons8-bed-50.png" alt="NBTE Logo" height="20" class="img-fluid img-fit mr-3" /><span class="font-bold mr-3">{{ roomData?.no_of_beds }}</span
                                ><span class="text-400 mr-3">|</span> <img style="margin-bottom: -3px !important" src="/img/icons8-bath-50.png" alt="NBTE Logo" height="20" class="img-fluid img-fit mr-3" /><span class="font-bold mr-3">{{
                                    roomData?.no_of_baths
                                }}</span
                                ><span class="text-400 mr-3">|</span>
                                <span class="text-700"><i class="pi pi-clone text-xl mr-2"></i><span class="text-sm font-bold">Guest room</span></span>
                            </div>
                            <div class="mb-4">
                                <span class="text-red-500 text-sm font-bold mr-3 text-xl">₦ {{ roomData?.price }}</span>
                            </div>
                            <Button v-if="is_available" style="width: 200px" label="Book Room" class="px-5 py-3 montserrat-font mr-4" icon="pi pi-arrow-right" iconPos="right" @click="confirmBooking = true" />
                            <Button v-if="!is_available" style="width: 200px" label="Fully Booked" class="px-5 py-3 montserrat-font mr-4" disabled />
                            <!-- <Button v-if="!is_available" style="width: 200px;" @click="showBookingDetail = true;"
                                label="Details" icon="pi pi-arrow-right" raised iconPos="right"
                                class="px-5 py-3 montserrat-font" /> -->
                        </div>
                        <div v-if="confirmBooking" class="pt-8">
                            <div class="text-900 text-4xl md:text-6xl lg:text-6xl font-bold mb-3">Confirm Reservation</div>
                            <div class="text-500 text-1xl mb-3 font-bold">
                                <i class="pi pi-clock mr-2 font-bold"></i>
                                <span>{{ roomData?.check_in ?? 'Check in time not set' }} - <i class="pi pi-clock mr-2 font-bold"></i><span></span> {{ roomData?.check_out ?? 'Check out time not set' }}</span>
                            </div>
                            <div class="mb-4">
                                <img style="margin-bottom: -4px !important" src="/img/icons8-bed-50.png" alt="NBTE Logo" height="20" class="img-fluid img-fit mr-3" /><span class="font-bold mr-3">{{ roomData?.no_of_beds }}</span
                                ><span class="text-400 mr-3">|</span> <img style="margin-bottom: -3px !important" src="/img/icons8-bath-50.png" alt="NBTE Logo" height="20" class="img-fluid img-fit mr-3" /><span class="font-bold mr-3">{{
                                    roomData?.no_of_baths
                                }}</span
                                ><span class="text-400 mr-3">|</span>
                                <span class="text-700"><i class="pi pi-clone text-xl mr-2"></i><span class="text-sm font-bold">Guest room</span></span>
                            </div>
                            <div class="mb-3">
                                <span class="text-500 text-sm font-bold mr-3 text-xl">₦ {{ roomData?.price }} per night</span>
                            </div>
                            <p class="text-500 text-sm font-bold mr-3 text-xl mb-3">VAT rate: 200</p>
                            <div>
                                <p class="text-700 text-xl mb-2 font-bold">Note:</p>
                                <p class="text-700 text-xl mb-4">
                                    You can cancel for free until 8 hrs before the day of arrival. Cancellation stops 6pm n the day of arrival. If you don’t show up, the no-show fee will be the same as the cancellation fee
                                </p>
                                <div class="text-red-500 text-2xl md:text-4xl lg:text-4xl font-bold">Room Price: ₦ {{ roomData?.price }}</div>
                                <!-- <router-link :to="`/booking/rooms/details/${roomIdToRoute}/confirm`">
                            <Button 
                                style="width: 200px;" 
                                label="Confirm Booking"
                                class="px-5 py-3 montserrat-font mr-4 mt-4" 
                                icon="pi pi-arrow-right"
                                iconPos="right"
                            />
                        </router-link> -->
                                <div v-if="confirmBooking" class="card mt-4">
                                    <div class="formgroup-inline">
                                        <div class="field">
                                            <label for="checkInDate" class="font-bold block mb-2">Check in Date</label>
                                            <Calendar v-model="checkInDate" showIcon iconDisplay="input" inputId="checkInDate" :minDate="today" />
                                        </div>
                                        <div class="field">
                                            <label for="checkOutDate" class="font-bold block mb-2">Check out Date</label>
                                            <Calendar v-model="checkOutDate" showIcon iconDisplay="input" inputId="checkOutDate" :minDate="minCheckOutDate" />
                                        </div>
                                    </div>
                                    <div class="formgroup-inline">
                                        <div class="field">
                                            <Button label="Cancel Booking" class="p-button-outlined p-button-danger mr-2" icon="pi pi-times" @click="confirmBooking = false"> </Button>
                                        </div>
                                        <div class="field">
                                            <Button label="Confirm Booking" :disabled="!checkInDate || !checkOutDate" @click="bookRoom" icon="pi pi-check"> </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="grid mt-8 px-3">
            <div class="col-12 md:col-6 lg:col-6">
                <h2 class="font-bold text-700 mb-4">Executive Suites</h2>
                <hr />
                <p class="font-bold pb-0 text-700">
                    <i class="pi pi-circle-fill mr-2"></i><span class="mr-2">2 guests</span> <i class="pi pi-circle-fill mr-2"></i><span class="mr-2">1 bedroom</span> <i class="pi pi-circle-fill mr-2"></i><span class="mr-2">1 bed</span>
                    <i class="pi pi-circle-fill mr-2"></i><span class="mr-2">1 bath</span>
                </p>
                <p class="text-500 mb-4">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras eu urna mi. Cras sagittis tortor nec eros sollicitudin dignissim. Nullam faucibus est et erat tincidunt dictum. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Cras eu urna mi. Cras sagittis tortor nec eros sollicitudin dignissim. Nullam faucibus est et erat tincidunt dictum.
                </p>
                <Button label="Show more" class="px-5 py-3 montserrat-font p-button-outlined p-button-secondary p-button-sm mb-4" icon="pi pi-angle-down" iconPos="right" />
                <hr />
                <div class="my-4">
                    <div class="mb-4">
                        <div class="montserrat-font text-2xl text-700 font-bold"><i class="pi pi-circle-fill mr-2"></i><span>Entire home</span></div>
                        <div class="montserrat-font text-500 pl-4">You'll have the apartment to yourself</div>
                    </div>
                    <div class="mb-4">
                        <div class="montserrat-font text-2xl text-700 font-bold"><i class="pi pi-circle-fill mr-2"></i><span>Enhanced Clean</span></div>
                        <div class="montserrat-font text-500 pl-4">This Host committed an enhanced cleaning process.</div>
                    </div>
                    <div class="mb-4">
                        <div class="montserrat-font text-2xl text-700 font-bold"><i class="pi pi-circle-fill mr-2"></i><span>Kitchen service</span></div>
                        <div class="montserrat-font text-500 pl-4">This Host will be provided with our 24 hour kitchen service.</div>
                    </div>
                    <div class="mb-4">
                        <div class="montserrat-font text-2xl text-700 font-bold"><i class="pi pi-circle-fill mr-2"></i><span>Free cancellation before Nov 29th</span></div>
                    </div>
                </div>
            </div>
            <div class="col-12 md:col-6 lg:col-6">
                <h2 class="font-bold text-700 mb-4">What this room offers</h2>
                <div class="grid px-6">
                    <div class="col-12 md:col-6 lg:col-6">
                        <div class="grid">
                            <div class="flex align-items-center justify-content-center mr-2">
                                <img src="/img/icons8-air-conditioner-50.png" alt="RevUP Logo" height="20" class="img-fluid img-fit" />
                            </div>
                            <div>
                                <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Air conditioning</h2>
                            </div>
                        </div>
                    </div>
                    <!-- <div class="col-12 md:col-6 lg:col-6">
                        <div class="grid">
                            <div class="flex align-items-center justify-content-center mr-2">
                                <img src="/img/icons8-security-camera-50.png" alt="RevUP Logo" height="20"
                                    class="img-fluid img-fit">
                            </div>
                            <div>
                                <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Security cameras
                                </h2>
                            </div>
                        </div>
                    </div> -->
                    <div class="col-12 md:col-6 lg:col-6">
                        <div class="grid">
                            <div class="flex align-items-center justify-content-center mr-2">
                                <img src="/img/icons8-refrigerator-50.png" alt="RevUP Logo" height="20" class="img-fluid img-fit" />
                            </div>
                            <div>
                                <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Refrigerator</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <h2 class="font-bold text-700 mb-4 text-center">See similar rooms</h2>
    <div class="grid">
        <div class="col-12 lg:col-3">
            <div class="h-full">
                <div @click="navigateToRoom" class="card h-full p-3 quick-access-tab" style="border-radius: 40px">
                    <div style="background-image: url('/img/building/nbte-21.jpeg'); height: 200px; border-radius: 25px; background-size: cover; background-position: center; background-repeat: no-repeat" class="p-0 c-shadow mb-4"></div>
                    <div class="my-3 text-sm font-bold">Room</div>
                    <div class="flex justify-content-between align-items-center mb-3">
                        <div class="mt-0 font-bold text-xl">Guest Rooms</div>
                        <span> <i class="pi pi-user mr-2"></i><span>2</span> </span>
                    </div>
                    <p class="mb-4">Indulge in Tranquillity: Your Home Away from Home.</p>
                </div>
            </div>
        </div>
        <div class="col-12 lg:col-3">
            <div class="h-full">
                <div @click="navigateToRoom" class="card h-full p-3 quick-access-tab" style="border-radius: 40px">
                    <div style="background-image: url('/img/building/nbte-20.jpeg'); height: 200px; border-radius: 25px; background-size: cover; background-position: center; background-repeat: no-repeat" class="p-0 c-shadow mb-4"></div>
                    <div class="my-3 text-sm font-bold">Room</div>
                    <div class="flex justify-content-between align-items-center mb-3">
                        <div class="mt-0 font-bold text-xl">Guest Rooms</div>
                        <span> <i class="pi pi-user mr-2"></i><span>2</span> </span>
                    </div>
                    <p class="mb-4">Indulge in Tranquillity: Your Home Away from Home.</p>
                </div>
            </div>
        </div>
        <div class="col-12 lg:col-3">
            <div class="h-full">
                <div @click="navigateToRoom" class="card h-full p-3 quick-access-tab" style="border-radius: 40px">
                    <div style="background-image: url('/img/building/nbte-18.jpeg'); height: 200px; border-radius: 25px; background-size: cover; background-position: center; background-repeat: no-repeat" class="p-0 c-shadow mb-4"></div>
                    <div class="my-3 text-sm font-bold">Room</div>
                    <div class="flex justify-content-between align-items-center mb-3">
                        <div class="mt-0 font-bold text-xl">Standard Room</div>
                        <span> <i class="pi pi-user mr-2"></i><span>2</span> </span>
                    </div>
                    <p class="mb-4">Serene Sanctuaries: Where Comfort Meets Hospitality.</p>
                </div>
            </div>
        </div>
        <div class="col-12 lg:col-3">
            <div class="h-full">
                <div @click="navigateToRoom" class="card h-full p-3 quick-access-tab" style="border-radius: 40px">
                    <div style="background-image: url('/img/building/nbte-17.jpeg'); height: 200px; border-radius: 25px; background-size: cover; background-position: center; background-repeat: no-repeat" class="p-0 c-shadow mb-4"></div>
                    <div class="my-3 text-sm font-bold">Room</div>
                    <div class="flex justify-content-between align-items-center mb-3">
                        <div class="mt-0 font-bold text-xl">Standard Room</div>
                        <span> <i class="pi pi-user mr-2"></i><span>2</span> </span>
                    </div>
                    <p class="mb-4">Serene Sanctuaries: Where Comfort Meets Hospitality.</p>
                </div>
            </div>
        </div>
    </div>
</template>
