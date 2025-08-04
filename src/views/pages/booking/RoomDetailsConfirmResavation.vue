<script setup>
import { ProductService } from '@/service/ProductService';
import { PhotoService } from '@/service/PhotoService';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { mapMutations } from 'vuex';
import axiosInstance from '@/service/AxiosInstance';
import { LOADING_SPINNER_SHOW_MUTATION, IS_USER_AUTHENTICATE_GETTER, GET_USER_DATA_GETTER } from '../../../store/storeconstants';
import { useToast } from 'primevue/usetoast';
import { formatDateTime } from '@/utils/dateTimeFormatter';
const toast = useToast();

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
const bookingDetails = ref(null);
const userData = computed(() => store.getters['auth/' + GET_USER_DATA_GETTER]);

const fetchBookingDetails = async (bookingID) => {
    const token = userData.value?.token;

    if (!token) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'User not authenticated' });
        return;
    }

    try {
        const response = await axiosInstance.get(`/guest/get-booking/${bookingID}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            bookingDetails.value = response.data.data;
            // toast.add({ severity: 'success', summary: 'Booking details fetched', detail: 'Booking details fetched successfully.' });
        } else {
            throw new Error('Failed to fetch booking details');
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'An error occurred while fetching booking details.' });
        console.error('Error fetching booking details:', error);
    }
};

onMounted(() => {
    const token = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')).token : null;
    const roomIdFromRoute = route.params.id;
    const bookingIDFromRoute = route.params.booking_id;
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

    if (isAuthenticated.value) {
        // Replace `bookingID` with actual booking ID you want to fetch
        fetchBookingDetails(bookingIDFromRoute);
    } else {
        showWelcomeMessage.value = true;
    }
});

const router = useRouter();

const goBack = () => {
    router.back();
};

const confirmBooking = ref(false);
const showBookingDetail = ref(false);
const isAuthenticated = computed(() => store.getters['auth/' + IS_USER_AUTHENTICATE_GETTER]);
const showWelcomeMessage = ref(false);

const bookRoom = async () => {
    const token = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')).token : null;

    if (!isAuthenticated.value) {
        showWelcomeMessage.value = true;
        return;
    }

    // Get today's date in 'YYYY-MM-DD' format
    const today = new Date().toISOString().split('T')[0];

    const payload = {
        room_id: route.params.id,
        check_in_date: today,
        check_out_date: today,
        special_requests: 'None',
        no_of_guests: String(noOfGuests.value) // Ensure noOfGuests is a string
    };

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
    },
    data() {
        return {
            mapUrl: 'https://maps.app.goo.gl/GPR2N7yV7j1pM2FJ6'
        };
    }
};
</script>
<template>
    <Dialog v-model:visible="showBookingDetail" modal header=" " class="montserrat-font" :style="{ width: '60vw' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
        <div class="surface-ground px-4 py-2 md:px-4 lg:px-4">
            <div class="text-900 font-bold text-4xl mb-4 text-center"><span class="text-primary">Booking ID:</span> {{ bookingDetails?.booking_id }}</div>
            <!-- <div class="text-700 text-xl mb-6 text-center line-height-3">Lorem ipsum dolor sit, amet consectetur
                adipisicing elit. Velit numquam eligendi quos.</div> -->

            <div class="grid">
                <div class="col-12 lg:col-4">
                    <div class="p-3 h-full">
                        <div class="h-full flex flex-column">
                            <div class="text-900 font-bold text-xl mb-2">Room name</div>
                            <div style="height: 20px" class="text-600">{{ bookingDetails?.room?.name }}</div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <div class="flex align-items-center">
                                <span class="font-bold text-2xl"><i class="pi pi-clock text-green-500 mr-2"></i></span>
                                <span class="ml-2 font-bol text-600">{{ formatDateTime(bookingDetails?.check_in_date) }}</span>
                            </div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <a :href="mapUrl" target="_blank" rel="noopener noreferrer">
                                <Button label="Get Direction" icon="pi pi-map-marker" class="p-3 w-full mt-auto"></Button>
                            </a>
                        </div>
                    </div>
                </div>

                <div class="col-12 lg:col-4">
                    <div class="p-3 h-full">
                        <div class="h-full flex flex-column">
                            <div class="text-900 font-bold text-xl mb-2">Room type</div>
                            <div style="height: 20px" class="text-600">{{ bookingDetails?.room?.roomType?.name }}</div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <div class="flex align-items-center">
                                <span class="font-bold text-2xl"><i class="pi pi-clock text-red-500 mr-2"></i></span>
                                <span class="ml-2 font-medium text-600">{{ formatDateTime(bookingDetails?.check_out_date) }}</span>
                            </div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <router-link :to="`/booking/user/account`">
                                <Button label="View Bookings" icon="pi pi-arrow-circle-right" icon-pos="right" class="p-3 w-full"></Button>
                            </router-link>
                        </div>
                    </div>
                </div>

                <div class="col-12 lg:col-4">
                    <div class="p-3 h-full">
                        <div class="h-full flex flex-column">
                            <div class="text-900 font-bold text-xl mb-2">Paymentstatus</div>
                            <div style="height: 20px" class="text-600">
                                <Tag v-if="!bookingDetails?.payment_status == 'pending'" severity="success" class="px-3" value="Paid"></Tag>
                                <Tag v-if="bookingDetails?.payment_status == 'pending'" severity="danger" class="px-3" value="Pending"></Tag>
                            </div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <div class="flex align-items-center font-bold">
                                <span class="font-bold text-primary text-2xl"><i class="pi pi-users"></i></span>
                                <span class="ml-2 font-medium text-600">{{ bookingDetails?.no_of_guests }} Guest(s)</span> <span class="mx-3">|</span>
                                <span class="font-bold text-primary text-2xl"><i class="pi pi-users"></i></span>
                                <span class="ml-2 font-medium text-600">{{ bookingDetails?.no_of_nights }} Night(s)</span>
                            </div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <Button label="Cancel Booking" class="p-3 w-full p-button-outlined p-button-danger" icon="pi pi-times-circle"></Button>
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
                            <div class="text-900 font-bold text-xl mb-2">Cancelation Request:</div>
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
                                <span class="text-red-500 text-sm font-bold mr-3 text-xl">₦ {{ bookingDetails?.paymentEntry?.payment_amount }}</span>
                            </div>
                            <!-- <div class="text-center mb-4">
                                <InlineMessage class="" style="width: 230px;" severity="info">Info Message</InlineMessage>
                            </div> -->
                            <router-link :to="`/booking/rooms/details/${route.params.id}/payment/${bookingDetails?.booking_id}`">
                                <Button :disabled="!isAuthenticated" style="width: 230px" label="Payment" class="px-5 py-3 montserrat-font mr-4" severity="info" icon="pi pi-arrow-right" iconPos="right" />
                            </router-link>

                            <Button
                                :disabled="!isAuthenticated"
                                style="width: 230px"
                                @click="
                                    showBookingDetail = true;
                                    fetchBookingDetails;
                                "
                                label="Details"
                                icon="pi pi-eye"
                                iconPos="right"
                                class="px-5 py-3 montserrat-font"
                            />
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
                                <div class="text-red-500 text-2xl md:text-4xl lg:text-4xl font-bold">Total: ₦ {{ roomData?.price }}</div>
                                <!-- <router-link :to="`/booking/rooms/details/${roomIdToRoute}/confirm`">
                            <Button 
                                style="width: 200px;" 
                                label="Confirm Booking"
                                class="px-5 py-3 montserrat-font mr-4 mt-4" 
                                icon="pi pi-arrow-right"
                                iconPos="right"
                            />
                        </router-link> -->
                                <Button style="width: 200px" label="Confirm Booking" class="px-5 py-3 montserrat-font mr-4 mt-4" icon="pi pi-arrow-right" iconPos="right" @click="bookRoom" />
                                <Button style="width: 200px" label="Cancel Booking" class="px-5 py-3 montserrat-font p-button-danger mt-4" icon="pi pi-times" iconPos="right" @click="confirmBooking = false" />
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
