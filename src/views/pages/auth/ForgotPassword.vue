<script setup>
import { ref, computed } from 'vue';

const logoUrl = computed(() => {
    return `/img/logo-nbte-2.png`;
});
</script>

<template>
    <div class="grid m-0 p-0 min-h-screen">
        <div class="md:col-7 p-0 m-0 shadow-8" style="background-image: url('/img/reset-pass-bg.jpeg');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;">
            <div class="overlay-2"></div>
        </div>
        <div class="col-12 md:col-5">
            <div class="md:px-8 px-4 pt-8">
                <div class="text-left mb-3">
                    <span class="align-items-center">
                        <img :src="logoUrl" alt="logo" height="70" class="img-fluid" />
                    </span>
                </div>
                <p class="text-600 font-bold text-3xl text-left mb-3">Reset Password</p>
                <p class="text-600 montserrat-font text-center mb-4 text-left">Select which contact we should use to
                    reset your password.</p>
                <div class="mb-5">
                    <div class="custom-card border-primary card-flex p-3 border-round">
                        <div class="card-flex mb-1">
                            <div class="number font-source-code-pro"><img src="/img/icons8-chat-64.png"
                                    class="img-fit mt-3" alt="">
                            </div>
                            <div class="info mb-2">
                                <div class="text-600 mb-2 text-2xl">
                                    <strong>Via SMS</strong>
                                </div>
                                <div class="text-primary">+234******273</div>
                            </div>
                        </div>
                    </div>
                </div>
                <router-link to="/auth/verify" rel="noopener">
                    <Button type="button" class="w-full p-3 text-1xl mb-2 montserrat-font"
                        label="Continue" :loading="loading[3]" @click="load(3)" />
                </router-link>
                <p class="text-center text-600 font-bold text-sm md:text-xl lg:text-xl my-2">Already have an
                    account? <a class="font-medium no-underline text-primary cursor-pointer"
                        routerLink="/auth/forgot-password"><router-link to="/auth/login" rel="noopener"><span
                                class="text-primary font-bold">Login Now</span></router-link></a>
                </p>
            </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue';

const loading = ref([false, false, false]);

const load = (index) => {
    loading.value[index] = true;
    setTimeout(() => (loading.value[index] = false), 3000);
};

export default {
    data() {
        return {
            otpFields: ['', '', '', '', '', ''], // Array to store OTP fields
        };
    },
    methods: {
        focusNextField(index) {
            // Move focus to the next field if the current field is filled
            if (index < 5 && this.otpFields[index].length === 1) {
                this.$refs['otpInputFields'][index + 1].focus();
            }
        }
    }
};
</script>
