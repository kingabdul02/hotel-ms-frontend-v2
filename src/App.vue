<script setup>
</script>

<template>
    <the-loader v-if="showLoading"></the-loader>
    <router-view />
</template>

<style scoped>
.loading-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 10000;
    /* Ensure the loading spinner is on top of the overlay */
}

.loading-text {
    margin-top: 10px;
    font-weight: bold;
    color: #fff;
    /* Adjust text color as needed */
}

.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.749);
    /* Semi-transparent black overlay */
    z-index: 9999;
    /* Ensure the overlay is above other content */
}
</style>

<script>
import TheLoader from './components/TheLoader.vue';
import { mapState } from 'vuex';
import { AUTO_LOGIN_ACTION } from './store/storeconstants';
export default {
    name: 'App',
    computed: {
        ...mapState({
            showLoading: (state) => state.showLoading,
        }),
    },
    components: {
        TheLoader,
    },
    created() {
        this.$store.dispatch(`auth/${AUTO_LOGIN_ACTION}`);
    },
};
</script>
