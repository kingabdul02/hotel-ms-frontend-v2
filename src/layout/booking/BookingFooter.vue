<script setup>
</script>

<template>
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
                            <li class="line-height-3 text-xl mb-2 text-white">• Institutional Master plan Development</li>
                            <li class="line-height-3 text-xl mb-2 text-white">• Conducive chalets and standard rooms</li>
                            <li class="line-height-3 text-xl mb-2 text-white">• Conference halls for retreats</li>
                            <li class="line-height-3 text-xl mb-2 text-white">• Capacity building and skills acquisition</li>
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
<style lang="scss" scoped></style>
