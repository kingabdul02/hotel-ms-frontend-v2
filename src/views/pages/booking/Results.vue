<template>
    <div>
        <h2 class="roboto-font text-800">Search Results ({{ roomsCount }})</h2>
        <div class="grid">
            <div v-for="room in rooms" :key="room.id" class="col-12 md:col-4 lg:col-4">
                <div @click="navigateToRoom(room.id)"
                    style="background-image: url('/img/building/nbte-3.jpeg'); height: 350px; border-radius: 25px; background-size: cover; background-position: center; background-repeat: no-repeat;" 
                    class="card p-0 quick-access-tab">
                    <div class="card__overlay">
                        <h2 class="text-left font-bold text-white">
                            <span v-if="room.is_available" class="mr-2">
                                <Tag style="background: #6B77E5; color: var(--surface-0); border-radius: 25px; padding: 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;">
                                    <span class="uppercase montserrat-font">Available</span>
                                </Tag>
                            </span>
                            <span v-if="room.is_feature" class="mr-2">
                                <Tag style="background: #ffffff; color: #000000; border-radius: 25px; padding: 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;">
                                    <span class="uppercase montserrat-font">Featured</span>
                                </Tag>
                            </span>
                            <span v-if="!room.is_available" class="mr-2">
                                <Tag style="background: #FEBB02; color: #ffffff; border-radius: 25px; padding: 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;">
                                    <span class="uppercase montserrat-font">Booked</span>
                                </Tag>
                            </span>
                        </h2>
                        <div class="surface-card c-shadow p-3 border-round">
                            <div class="flex justify-content-between mb-3">
                                <div>
                                    <span class="block text-900 text-sm font-bold mb-3">{{ room.name }}</span>
                                    <div class="text-900 text-sm text-xl font-bold">
                                        <i class="pi pi-user text-1xl mr-2"></i><span>{{ room.no_of_guests }}</span>
                                    </div>
                                </div>
                            </div>
                            <span class="text-red-500 text-sm font-bold mr-3">₦{{ room.price }}</span>
                            <img style="margin-bottom: -4px !important;" src="/img/icons8-bed-50.png" alt="Bed Icon" height="20" class="img-fluid img-fit mr-3">
                            <span class="text-400 mr-3">|</span>
                            <img style="margin-bottom: -3px !important;" src="/img/icons8-bath-50.png" alt="Bath Icon" height="20" class="img-fluid img-fit mr-3">
                            <span class="text-400 mr-3">|</span>
                            <span class="text-900">
                                <i class="pi pi-clone text-xl mr-2"></i>
                                <span class="text-sm font-bold">{{ room.roomType.name }}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import {
    LOADING_SPINNER_SHOW_MUTATION,
} from '@/store/storeconstants';
import { mapMutations } from 'vuex';
import axiosInstance from '@/service/AxiosInstance'; // Adjust the import according to your project structure

const route = useRoute();
const router = useRouter();
const store = useStore();

const rooms = ref([]);
// Mapping the mutations
const { showLoading } = mapMutations({
    showLoading: LOADING_SPINNER_SHOW_MUTATION,
});

const showLoadingMethod = showLoading.bind({ $store: store });

const roomsCount = computed(() => rooms.value.length);

const navigateToRoom = (roomId) => {
    router.push(`/booking/rooms/details/${roomId}`);
};

const fetchRooms = async () => {
    showLoadingMethod(true);

    const query = new URLSearchParams(route.query).toString();

    try {
        const response = await axiosInstance.get(`/room/search?${query}`);
        rooms.value = response.data.data;
    } catch (error) {
        console.error('Error fetching search results:', error);
    } finally {
        showLoadingMethod(false);
    }
};

onMounted(() => {
    fetchRooms();
});

watch(() => route.query, () => {
    fetchRooms();
});
</script>

<style scoped>
/* Add any styles you need here */
</style>
