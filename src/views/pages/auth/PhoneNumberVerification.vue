<script setup>
import { ref, computed } from 'vue';

const logoUrl = computed(() => {
    return `/img/logo-nbte-2.png`;
});
</script>

<template>
    <div class="grid m-0 p-0 min-h-screen min-w-screen overflow-hidden">
        <div class="col-12 md:col-3 lg:col-3"></div>
        <div class="col-12 md:col-6 lg:col-6">
            <div class="md:px-8 px-4 py-4 md:pt-8">
                <div class="text-center">
                    <router-link to="/auth/forgot-password" rel="noopener">
                        <Button icon="pi pi-arrow-left" class="float-button"></Button>
                    </router-link>
                    <span class="align-items-center">
                        <img :src="logoUrl" alt="logo" height="70" class="img-fluid" />
                    </span>
                </div>
                <p class="text-600 font-bold text-3xl text-center mb-3">Verify your phone number</p>
                <p class="text-600 montserrat-font text-center mb-4 text-center">Please enter OTP sent to +234******273
                    to
                    verity your phone</p>
                <div class="flex justify-content-center mb-4">
                    <InputOtp v-model="value" integerOnly />
                </div>
                <p class="text-600 montserrat-font text-center mb-4 text-center">Resend code in <span
                        class="text-primary font-bold">53</span> s</p>
                <router-link to="/auth/new-password" rel="noopener">
                    <Button type="button" class="w-full p-3 text-1xl mb-2 montserrat-font"
                        label="Continue" :loading="loading[3]" @click="load(3)" />
                </router-link>
                <p class="text-center text-600 font-bold  text-sm md:text-xl lg:text-xl my-2">Already have an
                    account? <a class="font-medium no-underline text-primary cursor-pointer"
                        routerLink="/auth/forgot-password"><router-link to="/auth/login" rel="noopener"><span
                                class="text-primary font-bold">Login Now</span></router-link></a></p>
            </div>
        </div>
        <div class="col-12 md:col-3 lg:col-3"></div>
    </div>
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

<style>
/* Add styling as needed */
.otp-field {
    margin: 0 5px;
}

.p-inputtext {
    padding: 1.5rem 1.75rem;
}
</style>
