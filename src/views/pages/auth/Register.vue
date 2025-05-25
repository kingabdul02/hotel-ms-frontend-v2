<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ref, computed } from 'vue';
import AppConfig from '@/layout/AppConfig.vue';

const { layoutConfig } = useLayout();
const email = ref('');
const password = ref('');
const checked = ref(false);

const logoUrl = computed(() => {
    return `/img/NBTE-logo.png`;
});
</script>

<template>
    <div class="grid grid-nogutter m-0 p-0 min-h-screen min-w-screen overflow-hidden primary-bg">

        <div
            class="md:col-7 p-0 m-0  border-1 white-border text-center d-flex align-items-center justify-content-center hide-on-mobile white-border-left">
            <div class="px-8 pt-8 full-height-bg">
                <img class="block xl:block mx-auto border-round w-full c-shadow img-fit" src="/img/register-bg.jpeg" height="540"
                    alt="Kasuwa Logo" />
                <div class="black-font font-bold text-3xl text-center line-height-3 mt-5 text-center">We  
                    <span class="text-warning">provide </span>high quality products <span class="text-primary">just for you.</span>
                </div>
            </div>
        </div>
        <div class="col-12 md:col-5">
            <div class="md:px-8 px-4 py-4 md:pt-8">
                <div class="text-center">
                    <a class="align-items-center pb-0 mb-0" href="#">
                        <span class="">
                            <img :src="logoUrl" alt="logo" height="70" class="img-fluid" /></span>
                    </a>
                </div>
                <div class="text-900 font-bold text-3xl text-center mb-3"><span
                        class="primary-blue-font">Create an </span><span class="text-primary">account</span> with us</div>
                <div class="black-font font-bold text-xl text-center mb-6 text-center">Sign Up to Kawusa</div>
                <label for="email1" class="block text-900 font-medium mb-2">Phone number</label>
                <InputText id="email1" type="text" placeholder="Email address" class="w-full mb-5" style="padding: 1rem"
                    v-model="email" />

                <label for="password1" class="block text-900 font-medium mb-2">Password</label>
                <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true"
                    class="w-full mb-3" inputClass="w-full" :inputStyle="{ padding: '1rem' }"></Password>

                <div class="flex align-items-center justify-content-between mb-6">
                    <div class="flex align-items-center">
                        <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                        <label for="rememberme1">I agree to the terms and conditions</label>
                    </div>
                </div>
                <router-link to="/" rel="noopener">
                    <Button label="Register Now" class="w-full p-3 text-1xl p-button-raised mb-2 montserrat-font" routerLink="/"></Button>
                </router-link>
                <p class="text-center black-font font-bold  text-sm md:text-2xl lg:text-2xl my-2">Already have an account? <a
                        class="font-medium no-underline text-primary cursor-pointer"
                        routerLink="/auth/forgot-password"><router-link
                                to="/auth/login" rel="noopener"><span class="text-warning font-bold">Login Now</span></router-link></a></p>
            </div>
        </div>
    </div>
    <AppConfig simple />
</template>

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
