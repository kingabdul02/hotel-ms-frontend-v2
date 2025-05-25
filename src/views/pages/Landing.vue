<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { ref } from "vue";

const smoothScroll = (id) => {
    document.querySelector(id).scrollIntoView({
        behavior: 'smooth'
    });
};

const logoUrl = computed(() => {
    return `/img/logo-nbte-2.png`;
});

const showHall1Modal = ref(false);

const items = [
    {
        label: 'Conference Halls',
        command: () => {
            showHall1Modal.value = true;
        }
    },
    {
        label: 'Multi-Purpose halls',
        command: () => {
            // smoothScroll('#services');
            showHall1Modal.value = true;
        }
    },
];
</script>

<template>

    <div class="nav c-shadow md:px-8 lg:px-8 hide-on-print pb-1">
        <input type="checkbox" id="nav-check">
        <div class="nav-header">
            <div class="nav-title md:pt-4 lg:pt-4">
                <a class="flex align-items-center" href="#">
                    <img :src="logoUrl" alt="NBTE" height="40" class="mr-2" />
                    <span class="font-bold text-800">NBTE Consult Limited</span>
                </a>
            </div>
        </div>
        <div class="nav-btn pt-3">
            <label for="nav-check">
                <span></span>
                <span></span>
                <span></span>
            </label>
        </div>

        <div class="nav-links">
            <ul class="list-none flex lg:align-items-center select-none flex-column lg:flex-row cursor-pointer">
                <li>
                    <a @click="smoothScroll('#home')"
                        class="flex md:ml-6 pt-5 md:pt-1 lg:pt-1 nv-link font-bold p-ripple" v-ripple>
                        <span>Home</span>
                    </a>
                </li>
                <li>
                    <a @click="smoothScroll('#about')"
                        class="flex md:ml-6 pt-5 md:pt-1 lg:pt-1 nv-link font-bold p-ripple" v-ripple>
                        <span>About Us</span>
                    </a>
                </li>
                <li>
                    <a @click="smoothScroll('#services')"
                        class="flex md:ml-6 pt-5 md:pt-1 lg:pt-1 nv-link font-bold p-ripple" v-ripple>
                        <span>Services</span>
                    </a>
                </li>
                <li>
                    <a @click="smoothScroll('#contact')"
                        class="flex md:ml-6 pt-5 md:pt-1 lg:pt-1 nv-link font-bold p-ripple" v-ripple>
                        <span>Contact Us</span>
                    </a>
                </li>
                <li>
                    <a @click="smoothScroll('#contact')"
                        class="flex md:ml-6 pt-5 md:pt-1 lg:pt-1 nv-link font-bold p-ripple" v-ripple>
                        <Button label="Get Consulting" class="px-5 py-3 montserrat-font" />
                    </a>
                </li>
            </ul>
        </div>
    </div>
    <div id="home" class="py-5"></div>
    <div class="surface-0 flex justify-content-center">
        <div class="landing-wrapper overflow-hidden">

            <div class="grid grid-nogutter m-0 p-0 min-h-screen"
                style="background-image: url('/img/building/nbte-16.jpeg');  background-size: cover; background-position: center; background-repeat: no-repeat; border-radius: 15px;">

                <div class="col-12 md:col-5 trans-ash" style="border-radius: 15px;">
                    <div class="px-4 md:px-8 lg:px-8 pt-8 md:pt-0 lg:pt-0">
                        <div class="text-left md:py-8 lg:py-8">
                            <p class="text-white font-bold mb-3"><i
                                    class="pi pi-circle-fill text-primary mr-2"></i><span>Welcome to NBTE Consult
                                    Limited Kaduna</span></p>
                            <div class="text-white font-bold text-5xl comfortaa-font line-height-2 mb-3">
                                To provide <span class="text-primary">competitive, efficient, innovative</span> products
                                and services to our clients.
                            </div>
                            <div class="font-bold text-xl line-height-3 light-font mb-5 pr-8">To be an
                                innovative and unique <br> company for the delivery of high <br> quality service and
                                products.
                            </div>

                            <router-link to="/booking">
                                <Button label="Book a Room" class="px-5 py-3 montserrat-font" />
                            </router-link>
                        </div>
                    </div>
                </div>
                <div class="md:col-7 p-0 m-0 full-height-bg">
                </div>
            </div>

            <div id="about" class="grid grid-nogutter m-0 p-0">
                <div class="col-12 md:col-6 lg:col-6 smoke-bg md:p-8 lg:p-8 p-6 flex-order-1 lg:flex-order-0">
                    <div class="md:pl-8 lg:pl-8">
                        <div style="height: 200px;" class="image-container c-shadow img-fit">
                            <Image src="/img/building/nbte-31.jpeg" class="img-fit" alt="Image" />
                        </div>
                        <p class="font-bold mb-3 mt-6"><i class="pi pi-circle-fill text-primary mr-2"></i><span>Welcome
                                to NBTE Consult Limited Kaduna</span></p>
                        <h2 class="font-bold text-700 mb-1">Company History</h2>
                        <p class="text-500 mb-3">
                            NBTE Consult Ltd is a multi-disciplinary professional consultancy outfit, with Corporate
                            Affairs Commission (CAC) registration, and other relevant professional bodies in its
                            areas of operation.
                        </p>
                        <p class="text-500">
                            It is an innovative creation of National Board for Technical Education (NBTE) in 2021,
                            with the aim of providing services in the TVET sector, industry & commerce, which
                            includes consultancy, capacity building, procurement and general services.
                        </p>
                    </div>
                </div>
                <div class="col-12 md:col-6 lg:col-6">
                    <div class="text-left md:p-8 lg:p-8 p-5 pt-6">
                        <div class="md:pr-8 lg:pr-8">

                            <div class="grid p-3">
                                <div class="col-12 md:col-6 lg:col-6">
                                    <div class="grid p-3 surface-border border-1 md:mr-2 lg:mr-2">
                                        <div class="col-2 p-0">
                                            <img src="/img/cac-logo.jpg" height="30" alt="NBTE">
                                        </div>
                                        <div class="col-10 p-0">
                                            <p class="text-700 font-bold mb-0">Certified</p>
                                            <p class="text-400 text-sm">Corporate Affairs Commission (CAC) registration
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 md:col-6 lg:col-6">
                                    <div class="grid p-3 surface-border border-1 md:mr-2 lg:mr-2">
                                        <div class="col-2 p-0">
                                            <img src="/img/bpp.jpg" height="30" alt="NBTE">
                                        </div>
                                        <div class="col-10 p-0">
                                            <p class="text-700 font-bold mb-0">Certified</p>
                                            <p class="text-400 text-sm">Bureau of Public Procurement registration
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 md:col-6 lg:col-6">
                                    <div class="grid p-3 surface-border border-1 md:mr-2 lg:mr-2">
                                        <div class="col-2 p-0">
                                            <img src="/img/the-Industrial-Training-Fund.webp" height="30" alt="NBTE">
                                        </div>
                                        <div class="col-10 p-0">
                                            <p class="text-700 font-bold mb-0">Certified</p>
                                            <p class="text-400 text-sm">The Industrial Training Fund registration
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 md:col-6 lg:col-6">
                                    <div class="grid p-3 surface-border border-1 md:mr-2 lg:mr-2">
                                        <div class="col-2 p-0">
                                            <img src="/img/nsit.png" height="30" alt="NBTE">
                                        </div>
                                        <div class="col-10 p-0">
                                            <p class="text-700 font-bold mb-0">Certified</p>
                                            <p class="text-400 text-sm">Nigerian Social Ibsurance Fund registration
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 md:col-6 lg:col-6">
                                    <div class="grid p-3 surface-border border-1 md:mr-2 lg:mr-2">
                                        <div class="col-2 p-0">
                                            <img src="/img/pencom.jpeg" height="30" alt="NBTE">
                                        </div>
                                        <div class="col-10 p-0">
                                            <p class="text-700 font-bold mb-0">Certified</p>
                                            <p class="text-400 text-sm">Pension Commission registration
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 md:col-6 lg:col-6">
                                    <div class="grid p-3 surface-border border-1 md:mr-2 lg:mr-2">
                                        <div class="col-2 p-0">
                                            <img src="/img/federal-inland-revenue-service-icon-2048x1461-q7rhav8e.png"
                                                height="30" alt="NBTE">
                                        </div>
                                        <div class="col-10 p-0">
                                            <p class="text-700 font-bold mb-0">Certified</p>
                                            <p class="text-400 text-sm">Federal Inland Revenue registration
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <ul class="list-none p-0 m-0 mb-4 flex-grow-1 text-500 font-bold">
                                <li class="flex align-items-center mb-3">
                                    <i class="pi pi-check-circle text-primary font-bold mr-2"></i>
                                    <span>Consultancy</span>
                                </li>
                                <li class="flex align-items-center mb-3">
                                    <i class="pi pi-check-circle text-primary font-bold mr-2"></i>
                                    <span>Capacity Building</span>
                                </li>
                                <li class="flex align-items-center mb-3">
                                    <i class="pi pi-check-circle text-primary font-bold mr-2"></i>
                                    <span>Procurement & general services</span>
                                </li>
                            </ul>
                            <a @click="smoothScroll('#contact')">
                                <Button label="More About Us" class="px-5 py-3 uppercase montserrat-font mb-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div id="services" class="py-4 px-4 lg:px-8 mt-5 mx-0 lg:mx-8">
                <div class="grid justify-content-center">
                    <div class="col-12 text-center mt-8 mb-4">
                        <p class="font-bold mb-0 pb-0"><i class="pi pi-circle-fill text-primary mr-2"></i><span>We Are
                                Experts In</span></p>
                        <h2 class="font-bold text-700 mb-1 pt-1 mt-1">The Services We Offer</h2>
                    </div>
                    <div class="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                        <div class="px-4 md:px-0 lg:px-0">
                            <div style="height: 100px !important;"
                                class="smoke-bg surface-border border-1 p-3 h-full quick-access-tab">
                                <div class="flex justify-content-between mb-3">
                                    <div>
                                        <h5 class="font-bold text-700 mb-1">Conducive accommodation and serene
                                            environment.</h5>
                                    </div>
                                    <div class="flex align-items-center justify-content-center bg-bluegray-100 border-round"
                                        style="width:2.5rem;height:2.5rem">
                                        <i class="pi pi-building text-white text-xl"></i>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                        <div class="px-4 md:px-0 lg:px-0">
                            <div style="height: 100px !important;"
                                class="smoke-bg surface-border border-1 p-3 h-full quick-access-tab">
                                <div class="flex justify-content-between mb-3">
                                    <div>
                                        <h5 class="font-bold text-700 mb-1">Events and Multipurpose Halls</h5>
                                    </div>
                                    <div class="flex align-items-center justify-content-center bg-bluegray-100 border-round"
                                        style="width:2.5rem;height:2.5rem">
                                        <i class="pi pi-database text-white text-xl"></i>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                        <div class="px-4 md:px-0 lg:px-0">
                            <div style="height: 100px !important;"
                                class="smoke-bg surface-border border-1 p-3 h-full quick-access-tab">
                                <div class="flex justify-content-between mb-3">
                                    <div>
                                        <h5 class="font-bold text-700 mb-1">Conference halls suitable for retreats</h5>
                                    </div>
                                    <div class="flex align-items-center justify-content-center bg-bluegray-100 border-round"
                                        style="width:2.5rem;height:2.5rem">
                                        <i class="pi pi-home text-white text-xl"></i>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                        <div class="px-4 md:px-0 lg:px-0">
                            <div style="height: 100px !important;"
                                class="smoke-bg surface-border border-1 p-3 h-full quick-access-tab">
                                <div class="flex justify-content-between mb-3">
                                    <div>
                                        <h5 class="font-bold text-700 mb-1">Capacity building and skills acquisition
                                        </h5>
                                    </div>
                                    <div class="flex align-items-center justify-content-center bg-bluegray-100 border-round"
                                        style="width:2.5rem;height:2.5rem">
                                        <i class="pi pi-briefcase text-white text-xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                        <div class="px-4 md:px-0 lg:px-0">
                            <div style="height: 100px !important;"
                                class="smoke-bg surface-border border-1 p-3 h-full quick-access-tab">
                                <div class="flex justify-content-between mb-3">
                                    <div>
                                        <h5 class="font-bold text-700 mb-1">Vocational training and ICT services in the
                                            TVET institutions</h5>
                                    </div>
                                    <div class="flex align-items-center justify-content-center bg-bluegray-100 border-round"
                                        style="width:2.5rem;height:2.5rem">
                                        <i class="pi pi-pencil text-white text-xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                        <div class="px-4 md:px-0 lg:px-0">
                            <div style="height: 100px !important;"
                                class="smoke-bg surface-border border-1 p-3 h-full quick-access-tab">
                                <div class="flex justify-content-between mb-3">
                                    <div>
                                        <h5 class="font-bold text-700 mb-1">Hospitality Management</h5>
                                    </div>
                                    <div class="flex align-items-center justify-content-center bg-bluegray-100 border-round"
                                        style="width:2.5rem;height:2.5rem">
                                        <i class="pi pi-code text-white text-xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0">
                        <div class="px-4 md:px-0 lg:px-0">
                            <div style="height: 100px !important;"
                                class="bg-primary surface-border border-1 p-3 h-full quick-access-tab">
                                <div class="flex justify-content-between mb-3">
                                    <div>
                                        <h5 class="font-bold text-white mb-1">Office spaces in Abuja</h5>
                                    </div>
                                    <div class="flex align-items-center justify-content-center bg-bluegray-100 border-round"
                                        style="width:2.5rem;height:2.5rem">
                                        <i class="pi pi-building text-primary text-xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Dialog v-model:visible="showHall1Modal" modal header="Hall Reservations" :style="{ width: '60vw' }"
                    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
                    <div class="p-3">
                        <h2>Contact Us for Hotel Hall Reservations</h2>
                        <p>
                            If you are interested in reserving our hotel hall for your event, please contact us using
                            the information below:
                        </p>
                        <ul>
                            <li class="pb-2 text-primary">
                                <strong class="text-900">Phone:</strong>
                                <a href="tel:+2347031174468" class="text-primary"> +234 703 117 4468</a>
                            </li>
                            <li class="pb-2 text-primary">
                                <strong class="text-900">Email:</strong>
                                <a href="mailto:info@nbteconsult.com" class="text-primary"> info@nbteconsult.com</a>
                            </li>
                            <li class="pb-2 text-primary">
                                <strong class="text-900">Address:</strong> No, 9 Kajuru close, Off Degel Road, Unguwar
                                Rimi, Kaduna
                            </li>
                        </ul>
                        <p>
                            Our reservation team is available from Monday to Friday, 9:00 AM to 6:00 PM. We look forward
                            to helping you plan your event!
                        </p>
                    </div>
                </Dialog>
                <div class="grid mt-4">
                    <div class="col-12 md:col-6 lg:col-6">
                        <h2 class="font-bold text-700 mb-4">Book a Room With Us</h2>
                        <p class="font-bold pb-0 text-primary"><i class="pi pi-circle-fill mr-2"></i><span>Managing
                                your bookings can be tedious, let’s handle that for you.</span></p>
                        <p class="text-500 mb-4">
                            Welcome to your home away from home! Discover the perfect blend of luxury and comfort in the
                            heart of Kaduna City, Kaduna State. Whether you're here for business or leisure, our
                            spacious rooms, exceptional amenities, and personalized service ensure a memorable
                            stay.Indulge in delicious meals from our in-house kitchen, and enjoy peace of mind with our
                            top-notch security. Take advantage of our exclusive rates when you book directly with us.
                            Click to secure your reservation and embark on a remarkable journey with us. Your perfect
                            stay awaits!
                        </p>
                        <router-link to="/booking">
                            <Button label="Book a Room" class="px-5" />
                        </router-link>
                        <SplitButton label="Hall reservations" class="montserrat-font ml-4" @click="save"
                            :model="items" />
                    </div>
                    <div class="col-12 md:col-6 lg:col-6">
                        <div class="grid">
                            <div class="col-12 md:col-6 lg:col-6">
                                <div style="height: 200px !important;" class="image-container img-fit c-shadow">
                                    <Image src="/img/building/nbte-30.jpeg" alt="Image" />
                                </div>
                            </div>
                            <div class="col-12 md:col-6 lg:col-6">
                                <div style="height: 200px !important;" class="image-container img-fit c-shadow">
                                    <Image src="/img/building/nbte-20.jpeg" alt="Image" />
                                </div>
                            </div>
                            <div class="col-12 md:col-6 lg:col-6">
                                <div style="height: 200px !important;" class="image-container img-fit c-shadow">
                                    <Image src="/img/building/nbte-29.jpeg" alt="Image" />
                                </div>
                            </div>
                            <div class="col-12 md:col-6 lg:col-6">
                                <div style="height: 200px !important;" class="image-container img-fit c-shadow">
                                    <Image src="/img/building/nbte-18.jpeg" alt="Image" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 text-center mt-8 mb-4">
                    <h2 class="font-bold text-700 mb-1 pt-1 mt-1">The management team</h2>
                </div>
                <div class="grid">
                    <div class="col-12 md:col-4 lg:col-4">
                        <div class="image-container-2 shadow-1 border-1 surface-border border-round"
                            style="position: relative;">
                            <Image src="/img/team/team-12.png" alt="Image" />
                            <div class="overlay text-center">
                                <p class="text mb-1"> K.S Nuhu.</p>
                                <p class="text-sm text-500">Managing Director/CEO</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-4 lg:col-4">
                        <div class="image-container-2 shadow-1 border-1 surface-border border-round"
                            style="position: relative;">
                            <Image src="/img/team/team-1.jpeg" alt="Image" />
                            <div class="overlay text-center">
                                <p class="text mb-1">A.S Maude</p>
                                <p class="text-sm text-500">Asst. General Manager (Operations)</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-4 lg:col-4">
                        <div class="image-container-2 shadow-1 border-1 surface-border border-round"
                            style="position: relative;">
                            <Image src="/img/team/team-4.jpeg" alt="Image" />
                            <div class="overlay text-center">
                                <p class="text mb-1">Patrick N Yari</p>
                                <p class="text-sm text-500">Business Consultant</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 text-center mt-8 mb-4">
                    <h2 class="font-bold text-700 mb-1 pt-1 mt-1">Meet the Staff</h2>
                </div>
                <div class="grid">

                    <div class="col-12 md:col-4 lg:col-4">
                        <div class="image-container-2 shadow-1 border-1 surface-border border-round"
                            style="position: relative;">
                            <Image src="/img/team/team-12.jpg" alt="Image" />
                            <div class="overlay text-center">
                                <p class="text mb-1">Ahmed Kasimu Aliyu</p>
                                <p class="text-sm text-500">Manager: Finance & Accounting</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-12 md:col-4 lg:col-4">
                        <div class="image-container-2 shadow-1 border-1 surface-border border-round"
                            style="position: relative;">
                            <Image src="/img/team/team-2.jpeg" alt="Image" />
                            <div class="overlay text-center">
                                <p class="text mb-1">Ismail A Aliyu</p>
                                <p class="text-sm text-500">Internal Auditor</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-12 md:col-4 lg:col-4">
                        <div class="image-container-2 shadow-1 border-1 surface-border border-round"
                            style="position: relative;">
                            <Image src="/img/team/team-5.jpeg" alt="Image" />
                            <div class="overlay text-center">
                                <p class="text mb-1">Mohammad B Ibrahim</p>
                                <p class="text-sm text-500">Head: Admin & HR</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-12 md:col-4 lg:col-4">
                        <div class="image-container-2 shadow-1 border-1 surface-border border-round"
                            style="position: relative;">
                            <Image src="/img/team/team-10.jpeg" alt="Image" />
                            <div class="overlay text-center">
                                <p class="text mb-1">Ibrahim Attahiru</p>
                                <p class="text-sm text-500">Front Desk Officer</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-12 md:col-4 lg:col-4">
                        <div class="image-container-2 shadow-1 border-1 surface-border border-round"
                            style="position: relative;">
                            <Image src="/img/team/team-6.jpeg" alt="Image" />
                            <div class="overlay text-center">
                                <p class="text mb-1">Shittu Abdulsamad</p>
                                <p class="text-sm text-500">Front Desk Officer</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-12 md:col-4 lg:col-4">
                        <div class="image-container-2 shadow-1 border-1 surface-border border-round"
                            style="position: relative;">
                            <Image src="/img/team/team-3.jpeg" alt="Image" />
                            <div class="overlay text-center">
                                <p class="text mb-1">Zaharaddeen A Tureta</p>
                                <p class="text-sm text-500">Front Desk Officer</p>
                            </div>
                        </div>
                    </div>



                    <div class="col-12 md:col-4 lg:col-4">
                        <div class="image-container-2 shadow-1 border-1 surface-border border-round"
                            style="position: relative;">
                            <Image src="/img/team/team-7.jpeg" alt="Image" />
                            <div class="overlay text-center">
                                <p class="text mb-1">Tijjani Mainasara</p>
                                <p class="text-sm text-500">ICT Officer</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 mt-8">
                        <div class="text-center">
                            <h2 class="font-bold text-700 mb-1 pt-1 mt-1">Our Partners</h2>
                            <p class="font-bold pb-0"><i class="pi pi-circle-fill mr-2 text-primary"></i><span>People
                                    and organisations we have a standing and long lasting relationships with</span></p>

                        </div>
                    </div>
                    <div class="col-6 md:col-2 lg:col-2 text-center">
                        <img src="/img/logo-nbte-2.png" alt="logo" class="img-fit img-fluid" width="80" />
                    </div>
                    <div class="col-6 md:col-2 lg:col-2 text-center">
                        <img src="/img/cac.png" alt="logo" class="img-fit img-fluid" width="200" />
                    </div>
                </div>
            </div>
            <div id="contact" class="min-h-screen smoke-bg md:p-8 lg:p-8">
                <div class="grid grid-nogutter card shadow-7">
                    <div class="col-12 md:col-6 lg:col-6">
                        <div class="p-4">
                            <p class="font-bold text-6xl">Get in <span class="text-primary">touch</span></p>
                            <p class="text-500">Office Address: No, 9 Kajuru close, Off Degel Road, Unguwar Rimi, Kaduna
                            </p>
                            <p class="text-500">For complaints, talk to our customer care department <a
                                    class="text-primary" href="nbteconsult@gmail.com">nbteconsult@gmail.com</a>,</p>
                            <p class="text-500">For Sales enquiries and bookings, talk to our sales department, <a
                                    class="text-primary" href="info@nbteconsult.com">info@nbteconsult.com</a>,</p>
                            <p class="text-700 text-2xl font-bold">Call Us</p>
                            <p class="text-500">For anything urgent, you can call us 24/7 anywhere in the world and we
                                will be happy to hear from you</p>
                            <div class="grid">
                                <div class="col-12 md:col-6 lg:col-6">
                                    <p class="text-500">Telephone number 1: <a class="text-primary"
                                            href="tel:+234 812 367 3883">+234 812 367 3883</a>,</p>
                                </div>
                                <div class="col-12 md:col-6 lg:col-6">
                                    <p class="text-500">Telephone number 2: <a class="text-primary"
                                            href="tel:+234 703 117 4468">+234 703 117 4468</a>,</p>
                                </div>
                            </div>
                            <div class="p-fluid">
                                <h5 class="font-bold">Send us a message</h5>
                                <div class="formgrid grid">
                                    <div class="field col">
                                        <label class="text-500" for="name2">Name</label>
                                        <InputText id="name2" type="text" placeholder="Enter name" />
                                    </div>
                                    <div class="field col">
                                        <label class="text-500" for="email2">Email Address</label>
                                        <InputText id="email2" type="email" placeholder="Enter email address" />
                                    </div>
                                    <div class="field col-12">
                                        <label class="text-500" for="email2">Comment</label>
                                        <Textarea placeholder="Your Message" :autoResize="true" rows="3" cols="30" />
                                    </div>
                                    <div class="field col-12 text-center">
                                        <Button label="Submit" class="px-5 py-3 montserrat-font" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-6 lg:col-6 md:p-3 lg:p-3">
                        <div class="p-2 border-1 surface-border border-round shadow-2">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15691.118706536154!2d7.4622144!3d10.518012!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x104d4b0cc584a911%3A0x5c9b45182a1a500a!2sNBTE%20Consult%20Ltd!5e0!3m2!1sen!2sng!4v1714246795125!5m2!1sen!2sng"
                                width="100%" height="600" style="border:0;" allowfullscreen="true" loading="lazy"
                                referrerpolicy="no-referrer-when-downgrade"></iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="footer-bg pb-6">
        <div class="px-4 pt-6 lg:mx-8 grid justify-content-between text-center md:text-left">
            <div class="col-12 md:col-3 lg:col-3 text-center md:text-left lg:text-left">
                <div class="" style="margin-top: -1.5rem">
                    <a @click="smoothScroll('#home')"
                        class="flex flex-wrap align-items-center justify-content-center md:justify-content-start md:mb-0 mb-3 cursor-pointer">
                        <img src="/img/logo-nbte.png" alt="footer sections" width="30" height="30" class="mr-2" />
                        <h5 class="font-medium text-2xl text-white pb-1">NBTE Consult Limited</h5>
                    </a>
                </div>
            </div>
            <div class="col-12 md:col-3 lg:col-3 text-center md:text-left lg:text-left">
                <div class="flex justify-content-center mb-3">
                    <div class="flex align-items-center justify-content-center bg-bluegray-700 mr-3"
                        style="width:3rem;height:3rem; border-radius: 20px">
                        <i class="pi pi-phone text-primary text-xl"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-1xl my-1">Call Us</div>
                        <div class="text-white text-1xl mb-1">+234 703 117 4468 <br> +234 812 367 3883</div>
                    </div>
                </div>
            </div>
            <div class="col-12 md:col-3 lg:col-3 text-center md:text-left lg:text-left">
                <div class="flex justify-content-center mb-3">
                    <div class="flex align-items-center justify-content-center bg-bluegray-700 mr-3"
                        style="width:3rem;height:3rem; border-radius: 20px">
                        <i class="pi pi-at text-primary text-xl"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-1xl my-1">Email Us</div>
                        <div class="text-white text-1xl mb-1">info@nbteconsult.com</div>
                    </div>
                </div>
            </div>
            <div class="col-12 md:col-3 lg:col-3 text-center md:text-left lg:text-left">
                <div class="flex justify-content-center mb-3">
                    <div class="flex align-items-center justify-content-center bg-bluegray-700 mr-3"
                        style="width:3rem;height:3rem; border-radius: 20px">
                        <i class="pi pi-map-marker text-primary text-xl"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-1xl my-1">Location</div>
                        <div class="text-white text-1xl mb-1">No, 9 Kajuru close, Off Degel Road, Unguwar Rimi, Kaduna
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12 border-top-1 mt-4"></div>

            <div class="col-12">
                <div class="grid text-center md:text-left">
                    <div class="col-12 md:col-3 px-4">
                        <p class="font-bold pb-0 text-primary"><i class="pi pi-circle-fill mr-2"></i><span>Quick
                                Links</span></p>
                        <a @click="smoothScroll('#home')"
                            class="line-height-3 text-xl block cursor-pointer mb-2 text-white">Home</a>
                        <a @click="smoothScroll('#about')"
                            class="line-height-3 text-xl block cursor-pointer mb-2 text-white">About Us</a>
                        <a @click="smoothScroll('#services')"
                            class="line-height-3 text-xl block cursor-pointer mb-2 text-white">Services</a>
                        <a @click="smoothScroll('#contact')"
                            class="line-height-3 text-xl block cursor-pointer mb-2 text-white">Contact Us</a>
                    </div>

                    <div class="col-12 md:col-3 mt-4 md:mt-0 px-4">
                        <p class="font-bold pb-0 text-primary"><i class="pi pi-circle-fill mr-2"></i><span>Our
                                Services</span></p>
                        <ul class="list-none p-0 m-0">
                            <li class="line-height-3 text-xl mb-2 text-white">• Project Feasibility Studies</li>
                            <li class="line-height-3 text-xl mb-2 text-white">• Architectural Design Services</li>
                            <li class="line-height-3 text-xl mb-2 text-white">• Consultant & Programs</li>
                            <li class="line-height-3 text-xl mb-2 text-white">• Hospitality Management</li>
                        </ul>
                    </div>
                    <div class="col-12 md:col-3 mt-4 md:mt-0 px-4">
                        <p class="font-bold pb-0 text-primary"><i class="pi pi-circle-fill mr-2"></i><span>More
                                Services</span></p>
                        <ul class="list-none p-0 m-0">
                            <li class="line-height-3 text-xl mb-2 text-white">• Institutional Master plan Development
                            </li>
                            <li class="line-height-3 text-xl mb-2 text-white">• Conducive chalets and standard rooms
                            </li>
                            <li class="line-height-3 text-xl mb-2 text-white">• Conference halls for retreats</li>
                            <li class="line-height-3 text-xl mb-2 text-white">• Capacity building and skills acquisition
                            </li>
                        </ul>
                    </div>

                    <div class="col-12 md:col-3 mt-4 md:mt-0 px-4">
                        <p class="font-bold pb-0 text-primary"><i class="pi pi-circle-fill mr-2"></i><span>Get In
                                Touch</span></p>
                        <InputGroup>
                            <InputText placeholder="Your Email" />
                            <Button label="Subscribe" />
                        </InputGroup>
                    </div>
                </div>
            </div>
            <div class="col-12 border-top-1 mt-4"></div>
            <footer class="col-12 pb-0">
                <div class="footer-content text-center">
                    <p>
                        <span class="text-400">NBTE Consult Limited</span> | <span class="text-400">© 2024 All rights
                            reserved.</span>
                    </p>
                </div>
            </footer>

        </div>
    </div>
</template>

<style scoped></style>
