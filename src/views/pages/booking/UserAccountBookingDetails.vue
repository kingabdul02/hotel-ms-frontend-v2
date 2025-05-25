<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import axiosInstance from '@/service/AxiosInstance';
import { formatDateTime } from '@/utils/dateTimeFormatter';

import {
    LOADING_SPINNER_SHOW_MUTATION,
    GET_USER_DATA_GETTER,
} from '@/store/storeconstants';


const route = useRoute();
const router = useRouter();
const store = useStore();
const toast = useToast();
const userData = computed(() => store.getters['auth/' + GET_USER_DATA_GETTER]);

const showLoadingMethod = (state) => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, state);
};

const bookingDetails = ref(null);
const bookingID = ref(null);
const roomPriceToPay = ref(null);

const fetchBookingDetails = async () => {
    const token = userData.value?.token;
    if (!token) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'User not authenticated' });
        return;
    }

    showLoadingMethod(true);
    try {
        const response = await axiosInstance.get(`/guest/get-booking/${route.params.booking_id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        bookingDetails.value = response.data.data;
        bookingID.value = response?.data?.data?.booking_id;
        roomPriceToPay.value = response.data.data.paymentEntry.payment_amount;
        showLoadingMethod(false);
    } catch (error) {
        showLoadingMethod(false);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Could not fetch booking details' });
    }
};

onMounted(() => {
    fetchBookingDetails();
});

const printPage = () => {
    window.print();
};

// const formatCurrency = (value) => {
//     return value.toLocaleString('en-US', { style: 'currency', currency: 'NGN' });
// };

const mapUrl = 'https://maps.app.goo.gl/GPR2N7yV7j1pM2FJ6';
</script>

<template>
    <div class="mt-7"></div>
    <div class="px-4 md:px-0 lg:px-0">
        <div class="grid">
            <div class="md:col-10 lg:col-9">
                <div class="print-section p-5 minus-top-margin surface-section">
                    <div class="mb-4 text-center">
                        <img src="/img/logo-nbte-2.png" height="50" alt="logo" />
                        <h3 class="font-bold m-0">NBTE Consult Limited</h3>
                    </div>
                    <div class="text-900 font-bold text-3xl text-center p-3 mb-4 bg-green-100 border-round">
                        <span class="text-primary">Booking ID:</span> {{ bookingDetails?.booking_id }}
                    </div>
                    <div class="grid px-2">
                        <div class="col-12 lg:col-4 md:col-4 xl:col-4">
                            <div class="text-900 font-bold text-1xl mb-2">Room name:</div>
                            <div class="black-font text-1xl">{{ bookingDetails?.room?.name }}
                            </div>
                        </div>
                        <div class="col-12 lg:col-4 md:col-4 xl:col-4">
                            <div class="text-900 font-bold text-1xl mb-2">Room type:</div>
                            <div class="black-font text-1xl">{{ bookingDetails?.room?.roomType?.name }}
                            </div>
                        </div>
                        <div class="col-12 lg:col-4 md:col-4 xl:col-4">
                            <div class="text-900 font-bold text-1xl mb-2">Guest(s):</div>
                            <div class="black-font text-1xl">
                                <span class="font-bold text-2xl">
                                    <i class="pi pi-user mr-2"></i>
                                </span>
                                <span>
                                    {{ bookingDetails?.no_of_guests }}
                                </span>
                            </div>
                        </div>
                        <div class="col-12 lg:col-4 md:col-4 xl:col-4">
                            <div class="text-900 font-bold text-1xl mb-2">Check in Date:</div>
                            <div class="black-font text-1xl"><span class="font-bold text-2xl">
                                    <i class="pi pi-clock text-green-500 mr-2"></i>
                                </span>
                                <span>
                                    {{ formatDateTime(bookingDetails?.check_in_date) }}
                                </span>
                            </div>
                        </div>
                        <div class="col-12 lg:col-4 md:col-4 xl:col-4">
                            <div class="text-900 font-bold text-1xl mb-2">Check out Date:</div>
                            <div class="black-font text-1xl">
                                <span class="font-bold text-2xl">
                                    <i class="pi pi-clock text-red-500 mr-2"></i>
                                </span>
                                <span>
                                    {{ formatDateTime(bookingDetails?.check_out_date) }}
                                </span>
                            </div>
                        </div>
                        <div class="col-12 lg:col-4 md:col-4 xl:col-4">
                            <div class="text-900 font-bold text-1xl mb-2">Payment status:</div>
                            <div style="height: 20px;" class="text-600">
                                <Tag v-if="bookingDetails?.payment_status !== 'pending'" severity="success" class="px-3"
                                    value="Paid"></Tag>
                                <Tag v-if="bookingDetails?.payment_status === 'pending'" severity="danger" class="px-3"
                                    value="Pending"></Tag>
                            </div>
                        </div>
                        <div class="col-12 lg:col-4 md:col-4 xl:col-4">
                            <div class="text-900 font-bold text-1xl mb-2">Payment amount:</div>
                            <div style="height: 20px;" class="text-600">
                                <span class="font-medium text-600">
                                    ₦ {{ bookingDetails?.paymentEntry?.payment_amount }}
                                </span>
                            </div>
                        </div>
                        <div class="col-12 lg:col-4 md:col-4 xl:col-4">
                            <div class="text-900 font-bold text-1xl mb-2">Payed on:</div>
                            <div style="height: 20px;" class="text-600">
                                <span class="font-medium text-600">
                                    {{ formatDateTime(bookingDetails?.paymentEntry.payment_date) }}
                                </span>
                            </div>
                        </div>
                        <div class="col-12 lg:col-4 md:col-4 xl:col-4">
                            <div class="text-900 font-bold text-1xl mb-2">Special Requests:</div>
                            <div class="black-font text-1xl">{{ bookingDetails?.special_requests }}
                            </div>
                        </div>
                        <div class="col-12 lg:col-4 md:col-4 xl:col-4">
                            <div class="text-900 font-bold text-1xl mb-2">Cancellation Request:</div>
                            <div class="black-font text-1xl">{{ bookingDetails?.cancelationRequest ??
                                "Not set" }}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12 md:col-3 hide-on-print">
                <div class="surface-section p-5 text-center shadow-1 border-round">
                    <Button style="width: 250px;" label="Print Receipt"
                        class="font-bold p-3 w-full p-button-sm rubik-font mb-3 p-button-info" icon="pi pi-print"
                        iconPos="right" @click="printPage" />
                    <router-link to="/booking/user/account">
                        <Button style="width: 250px;" label="Back to Booking List"
                            class="font-bold p-3 w-full p-button-sm p-button-danger p-button-outlined rubik-font"
                            icon="pi pi-arrow-left" iconPos="left" />
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>



<style scoped></style>
