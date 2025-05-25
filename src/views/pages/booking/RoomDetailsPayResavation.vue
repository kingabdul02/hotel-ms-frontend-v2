<script setup>
import { ProductService } from '@/service/ProductService';
import { PhotoService } from '@/service/PhotoService';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { mapMutations } from 'vuex';
import axiosInstance from '@/service/axiosInstance';
import { LOADING_SPINNER_SHOW_MUTATION, IS_USER_AUTHENTICATE_GETTER, GET_USER_DATA_GETTER } from '../../../store/storeconstants';
import { useToast } from 'primevue/usetoast';
const toast = useToast();

const route = useRoute();
const store = useStore();
const roomData = ref(null);

const products = ref([]);
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

const productService = new ProductService();
const photoService = new PhotoService();

const { showLoading } = mapMutations({
    showLoading: LOADING_SPINNER_SHOW_MUTATION
});

const showLoadingMethod = showLoading.bind({ $store: store });

const userEmail = ref(null);

onMounted(async () => {
    const roomIdFromRoute = route.params.id;
    const bookingID = route.params.booking_id;
    const token = userData.value?.token;

    userEmail.value = userData?.value?.email;

    if (!token) {
        console.error('Token is missing');
        return;
    }

    try {
        showLoadingMethod(true);

        // Fetch room data
        const roomResponse = await axiosInstance.get(`/rooms/${roomIdFromRoute}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        roomData.value = roomResponse?.data?.data;
        images.value = roomResponse?.data?.data?.images?.data;

        // Fetch booking data
        const bookingResponse = await axiosInstance.get(`/guest/get-booking/${bookingID}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        bookingData.value = bookingResponse?.data?.data;
        roomPriceToPay.value = bookingResponse?.data?.data?.paymentEntry?.payment_amount;
        console.log('roomPriceToPay', roomPriceToPay);
    } catch (error) {
        console.error('Error fetching data:', error.response ? error.response.data : error.message);
    } finally {
        showLoadingMethod(false);
    }

    // Fetch products
    try {
        const productData = await productService.getProductsSmall();
        products.value = productData;
    } catch (error) {
        console.error('Error fetching products:', error.message);
    }
});

const router = useRouter();

const goBack = () => {
    router.back();
};

const roomPriceToPay = ref(0);
const bookingData = ref(null);
const showBookingDetail = ref(false);

const isAuthenticated = computed(() => store.getters['auth/' + IS_USER_AUTHENTICATE_GETTER]);
const userData = computed(() => store.getters['auth/' + GET_USER_DATA_GETTER]);
const showWelcomeMessage = ref(false);

const handlePayment = () => {
    const token = userData.value?.token;
    if (isAuthenticated.value && token) {
        const handler = PaystackPop.setup({
            key: 'pk_test_24673c9637a1bf06e5fb6eb989012747183eb2ae',
            email: userData.value.email,
            amount: roomPriceToPay.value * 100,
            currency: 'NGN',
            ref: '' + Math.floor(Math.random() * 1000000000 + 1),
            callback: function (response) {
                // Log the response for debugging
                console.log('Paystack response:', response);

                const bookingID = route.params.booking_id;
                showLoadingMethod(true);
                axiosInstance
                    .post(
                        `/make-payment/${bookingID}`,
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
                            router.push(`/booking/user/account/booking/details/${bookingID}`);
                            showLoadingMethod(false);
                        } else {
                            toast.add({ severity: 'error', summary: 'Payment failed', detail: 'There was an issue with your payment. Please try again.' });
                            showLoadingMethod(false);
                        }
                    })
                    .catch((error) => {
                        console.error('Error making payment:', error);
                        toast.add({ severity: 'error', summary: 'Payment failed', detail: 'There was an issue with your payment. Please try again.' });
                        showLoadingMethod(false);
                    });
            },
            onClose: function () {
                toast.add({ severity: 'error', summary: 'Payment cancelled!', detail: 'Transaction was not completed' });
            }
        });
        handler.openIframe();
    } else {
        showWelcomeMessage.value = true;
    }
};
</script>

<template>
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
            <div class="xl:col-8 md:col-8 lg:col-8 col-12">
                <div class="text-center mb-4">
                    <div class="text-green-900 text-4xl md:text-6xl lg:text-6xl font-bold mb-3">Confirm Reservation</div>
                    <div class="text-900 text-3xl md:text-5xl lg:text-5xl mb-3">
                        <span class="font-bold">{{ roomData?.name }}</span>
                    </div>
                    <!-- <div class="text-900 text-1xl md:text-2xl lg:text-2xl">
                        <span class="font-bold">Apartment - {{ roomData?.hotel_id }}</span>
                    </div> -->
                </div>
            </div>
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
                        <div class="pt-8">
                            <div class="text-primary text-xl md:text-3xl lg:text-3xl font-bold mb-3">Your reservation has been confirmed.</div>
                            <p class="text-500 text-1xl mb-3 font-bold">
                                <i class="pi pi-angle-double-right mr-2 font-bold"></i
                                ><span
                                    >We will send you an email confirming your reservation
                                    <br />
                                    <span class="text-primary">{{userEmail}}</span>
                                </span>
                            </p>
                            <p class="text-500 text-1xl mb-3 font-bold">
                                <i class="pi pi-angle-double-right mr-2 font-bold"></i
                                ><span
                                    >Your room was successfully reserved - you will be debited
                                    <br />
                                    <span class="text-primary">₦ {{ roomPriceToPay }}</span>
                                </span>
                            </p>
                            <p class="text-500 text-1xl mb-3 font-bold"><i class="pi pi-angle-double-right mr-2 font-bold"></i><span>You will have been charged for all or part of your stay by the property. Refunds take 5-7 business day. </span></p>
                            <p class="text-primary text-1xl mt-6 font-bold text-center"><i class="pi pi-phone mr-2 font-bold"></i><span>0000 0000 000 </span></p>
                            <div class="text-left">
                                <Button style="width: 250px" label="Make Payment" class="py-3 montserrat-font mr-4 mt-4" icon="pi pi-money-bill" iconPos="right" @click="handlePayment" />
                                <Button style="width: 250px" label="Cancel" class="py-3 montserrat-font mr-4 mt-4 p-button-danger" icon="pi pi-check" iconPos="right" @click="goBack" />
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
                        <div class="montserrat-font text-500 pl-4">You’ll have the apartment to yourself</div>
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
                                <img src="/img/icons8-kitchen-64.png" alt="RevUP Logo" height="20" class="img-fluid img-fit" />
                            </div>
                            <div>
                                <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Kitchen</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-6 lg:col-6">
                        <div class="grid">
                            <div class="flex align-items-center justify-content-center mr-2">
                                <img src="/img/icons8-pets-50.png" alt="RevUP Logo" height="20" class="img-fluid img-fit" />
                            </div>
                            <div>
                                <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">No Pets Allowed</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-6 lg:col-6">
                        <div class="grid">
                            <div class="flex align-items-center justify-content-center mr-2">
                                <img src="/img/icons8-tumble-dryer-50.png" alt="RevUP Logo" height="20" class="img-fluid img-fit" />
                            </div>
                            <div>
                                <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Free washer - in building</h2>
                            </div>
                        </div>
                    </div>
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
                                <img src="/img/icons8-security-camera-50.png" alt="RevUP Logo" height="20" class="img-fluid img-fit" />
                            </div>
                            <div>
                                <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Security cameras</h2>
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
                    <div class="col-12 md:col-6 lg:col-6">
                        <div class="grid">
                            <div class="flex align-items-center justify-content-center mr-2">
                                <img src="/img/icons8-glyph-48.png" alt="RevUP Logo" height="20" class="img-fluid img-fit" />
                            </div>
                            <div>
                                <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Bicycles</h2>
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
<script>
export default {
    methods: {
        navigateToRooms() {
            this.$router.push('/booking/rooms');
        }
    }
};
</script>
