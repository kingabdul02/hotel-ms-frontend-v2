<script setup>
import { ref, computed } from 'vue';

const password = ref('');
const checked = ref(false);

const logoUrl = computed(() => {
    return `/img/logo-nbte-2.png`;
});
</script>

<template>
    <div class="grid grid-nogutter m-0 p-0 min-h-screen min-w-screen overflow-hidden">
        <router-link to="/auth/verify" rel="noopener">
            <Button icon="pi pi-arrow-left" class="float-button"></Button>
        </router-link>

        <div class="md:col-7 p-0 m-0 shadow-8" style="background-image: url('/img/changepass.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;">
            <div class="overlay-2"></div>
        </div>
        <div class="col-12 md:col-5">
            <div class="md:px-8 px-4 py-4 md:pt-8">
                <div class="text-left mt-8 md:mt-0 lg:mt-0">
                    <span class="align-items-center">
                        <img :src="logoUrl" alt="logo" height="70" class="img-fluid" />
                    </span>
                </div>
                <p class="text-600 font-bold text-4xl text-left mb-3 text-primary">Reset Password</p>
                <p class="text-600 font-bold text-1xl text-center mb-4 text-left">Create your new password</p>
                <label for="password" class="block text-600 font-medium mb-2">Password</label>
                <Password id="password" v-model="password" placeholder="Password" :toggleMask="true" class="w-full mb-3"
                    inputClass="w-full" :inputStyle="{ padding: '1rem' }"></Password>

                <label for="confirmpassword" class="block text-600 font-medium mb-2">Confirm Password</label>
                <Password id="confirmpassword" v-model="password" placeholder="Confirm Password" :toggleMask="true"
                    class="w-full mb-6" inputClass="w-full" :inputStyle="{ padding: '1rem' }"></Password>
                <router-link to="/dashboard" rel="noopener">
                    <Button label="Continue" class="w-full p-3 text-1xl mb-2 montserrat-font"></Button>
                </router-link>
                <p class="text-center text-600 font-bold text-sm md:text-xl lg:text-xl my-2">Already have an
                    account? <a class="font-medium no-underline text-primary cursor-pointer"
                        routerLink="/auth/forgot-password"><router-link to="/auth/login" rel="noopener"><span
                                class="text-primary font-bold">Login Now</span></router-link></a></p>
            </div>
        </div>
    </div>
    <AppConfig simple />
</template>

<script>
import { ref } from 'vue';

const items = ref([
    {
        label: 'Update',
        icon: 'pi pi-refresh'
    },
    {
        label: 'Delete',
        icon: 'pi pi-times'
    },
    {
        separator: true
    },
    {
        label: 'Home',
        icon: 'pi pi-home'
    }
]);

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
