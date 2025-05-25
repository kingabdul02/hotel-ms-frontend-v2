<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import SignupValidations from '../../../service/SignupValidations';
import {
  LOADING_SPINNER_SHOW_MUTATION,
  LOGIN_ACTION,
  GET_USER_DATA_GETTER,
} from '../../../store/storeconstants';
import { useToast } from "primevue/usetoast";
const toast = useToast();

const email = ref('');
const password = ref('');
const checked = ref(false);
const loading = ref(false);
const errors = ref({});
const error = ref('');

const router = useRouter();
const store = useStore();

const userData = computed(() => store.getters['auth/' + GET_USER_DATA_GETTER]);
const userEmail = computed(() => userData.value.email);



const showSuccess = () => {
    toast.add({ severity: 'success', summary: 'Login Successful', detail: 'Welcome back! ' + userEmail.value, life: 5000 });
};

const logoUrl = computed(() => '/img/logo-nbte-2.png');

const onLogin = async () => {
  const validations = new SignupValidations(email.value, password.value);
  errors.value = validations.checkValidations();

  if (Object.keys(errors.value).length) {
    return false;
  }

  error.value = '';
  store.commit(LOADING_SPINNER_SHOW_MUTATION, true);

  try {
    await store.dispatch('auth/' + LOGIN_ACTION, {
      email: email.value,
      password: password.value,
    });
    router.push('/dashboard/landing');
    setTimeout(() => {
      // Navigate to dashboard upon successful login
      showSuccess();
    }, 500); // Show success message after successful login
  } catch (e) {
    // Handle the error properly and log it
    if (e.response && e.response.data && e.response.data.message) {
      error.value = e.response.data.message;
    } else {
      error.value = e || 'An error occurred';
    }
  } finally {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
  }
};
</script>

<template>
  <div class="grid m-0 p-0 min-h-screen">
    <div class="col-12 md:col-5">
      <div class="md:px-8 lg:px-8 px-4 pt-8">
        <div class="text-center">
          <span class="align-items-center">
            <img :src="logoUrl" alt="logo" height="70" class="img-fluid" />
          </span>
        </div>
        <div class="text-900 font-bold md:text-6xl lg:text-6xl text-5xl text-center mb-3">
          <span class="primary-blue-font">Welcome </span><span class="text-primary"> back!</span>
        </div>
        <div class="text-600 font-bold text-xl text-center mb-6 text-center">
          Please sign-in to your account
        </div>
        <Message v-if="error" severity="error">{{ error }}</Message>
        <form @submit.prevent="onLogin">
          <div class="mb-5">
            <label for="email" class="block text-600 font-medium mb-2 font-bold">Email</label>
            <InputText id="email" type="email" placeholder="Email address" class="w-full" style="padding: 1rem;"
              v-model="email" />
            <small class="text-red-600" v-if="errors.email">{{ errors.email }}</small>
          </div>
          <div class="mb-5">
            <label for="password" class="block text-600 font-medium mb-2 font-bold">Password</label>
            <Password id="password" v-model="password" placeholder="Password" :toggleMask="true" class="w-full"
              inputClass="w-full" :inputStyle="{ padding: '1rem' }"></Password>
            <small class="text-red-600 mb-3" v-if="errors.password">{{ errors.password }}</small>
          </div>
          <div class="flex align-items-center justify-content-between mb-6">
            <div class="flex align-items-center">
              <Checkbox v-model="checked" id="rememberme" binary class="mr-2"></Checkbox>
              <label for="rememberme" class="text-600">Remember me</label>
            </div>
            <router-link to="/auth/forgot-password" rel="noopener">
              <a class="text-right cursor-pointer text-primary">
                <strong>Forgot password?</strong>
              </a>
            </router-link>
          </div>
          <Button type="submit" class="w-full p-3 montserrat-font text-xl " label="Log in" :loading="loading" />
        </form>
      </div>
    </div>
    <div class="md:col-7 p-0 m-0 shadow-8"
      style="background-image: url('/img/building/nbte-1.jpeg'); background-size: cover; background-position: center; background-repeat: no-repeat;">
      <div class="overlay-2"></div>
    </div>
  </div>
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
