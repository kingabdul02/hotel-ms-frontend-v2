<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axiosInstance from '@/service/AxiosInstance';

const router = useRouter();

const date = ref({ checkIn: null, checkOut: null });
const loading = ref(false);

const selectedGuests = ref(null);
const selectedRoomType = ref(null);
const roomTypes = ref([]);

const guests = ref([
    { name: '1 room - 1 guest', code: '1RM' },
    { name: '1 room - 2 guests', code: '2RM' },
    { name: '2 room - 5 guests', code: '5RM' },
]);

const fetchRoomTypes = async () => {
    try {
        const response = await axiosInstance.get('/get-room-types');
        if (Array.isArray(response.data.data)) {
            roomTypes.value = response.data.data;
        } else {
            roomTypes.value = Object.values(response.data.data);
        }
    } catch (error) {
        console.error('Error fetching room types:', error);
    }
};

onMounted(fetchRoomTypes);

const load = () => {
    loading.value = true;

    const params = {};

    if (date.value.checkIn) {
        params.check_in_date = date.value.checkIn.toISOString().split('T')[0];
    }

    if (date.value.checkOut) {
        params.check_out_date = date.value.checkOut.toISOString().split('T')[0];
    }

    if (selectedRoomType.value) {
        params.room_type_id = selectedRoomType.value.id;
        params.no_of_bedrooms = 1; // Adjust as needed
    }

    if (selectedGuests.value) {
        if (selectedGuests.value.code === '1RM') {
            params.no_of_guests =  1;
        } else if (selectedGuests.value.code === '2RM') {
            params.no_of_guests =  2;
        } else {
            params.no_of_guests =  5;
        }
    }

    router.push({ path: '/booking/results', query: params });
    loading.value = false;
};

const isUserRoute = computed(() => router.currentRoute.value.path.includes('/booking/user'));
</script>

<template>
    <div v-if="!isUserRoute">
        <div class="col-12 pt-8 p-0"
            style="background-image: url('/img/building/nbte-16.jpeg'); height: 500px; background-size: cover; background-position: center; background-repeat: no-repeat;">
            <div class="overlay-4 overlay-3 pt-8">
                <div class="px-4 py-8 md:px-6 lg:px-8">
                    <div class="text-700 text-center">
                        <div class="text-white font-bold md:text-7xl lg:text-7xl text-4xl text-with-shadow">Discover
                            Extraordinary <br> Comfort in Hotels</div>
                    </div>
                </div>
            </div>
        </div>
        <div style="margin-top: -60px !important;" class="grid m-0">
            <div class="col-12 md:col-2 lg:col-2"></div>
            <div class="col-12 md:col-8 lg:col-8 px-5 md:px-0 lg:px-0">
                <div class="card shadow-1 pb-3">
                    <div class="grid">
                        <div class="col-12 md:col-3 lg:col-3">
                            <Dropdown v-model="selectedRoomType" :options="roomTypes" optionLabel="name" placeholder="Room Type" class="w-full" />
                        </div>
                        <div class="col-12 md:col-2 lg:col-2">
                            <Calendar v-model="date.checkIn" placeholder="Check in" class="w-full" showButtonBar />
                        </div>
                        <div class="col-12 md:col-2 lg:col-2">
                            <Calendar v-model="date.checkOut" placeholder="Check out" class="w-full" showButtonBar />
                        </div>
                        <div class="col-12 md:col-3 lg:col-3">
                            <Dropdown v-model="selectedGuests" :options="guests" optionLabel="name" placeholder="Guests"
                                checkmark :highlightOnSelect="false" class="w-full" />
                        </div>
                        <div class="col-12 md:col-2 lg:col-2">
                            <Button type="button" label="Search" class="w-full" icon="pi pi-search" :loading="loading"
                                @click="load()" />
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12 md:col-2 lg:col-2"></div>
        </div>
    </div>
</template>
