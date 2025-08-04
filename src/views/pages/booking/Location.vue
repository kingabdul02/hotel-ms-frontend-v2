<script setup></script>

<template>
    <div class="min-h-screen md:pb-8 lg:pb-8">
        <p class="font-bold text-center md:text-left lg:text-left text-4xl md:text-5xl lg:text-5xl text-center">Location</p>
        <div class="p-2 border-1 surface-border border-round shadow-2">
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15691.118706536154!2d7.4622144!3d10.518012!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x104d4b0cc584a911%3A0x5c9b45182a1a500a!2sNBTE%20Consult%20Ltd!5e0!3m2!1sen!2sng!4v1714246795125!5m2!1sen!2sng"
                width="100%"
                height="600"
                style="border: 0"
                allowfullscreen="true"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
            <div class="grid px-3">
                <div class="col-12 pb-0">
                    <h2 class="font-bold text-900 mt-4 text-center md:text-left lg:text-left text-3xl md:text-5xl lg:text-5xl">Major attractions nearby <i class="pi pi-map-marker font-bold text-2xl"></i></h2>
                </div>
                <div class="col-12 md:col-6 lg:col-6 pt-0">
                    <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> Play lounge is a good place to relax. 5 minutes drive from here.</p>
                    <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> Close to Friday mosque</p>
                    <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> 20 minutes drive to central market</p>
                </div>
                <div class="col-12 md:col-6 lg:col-6 pt-0">
                    <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> Play lounge is a good place to relax. 5 minutes drive from here.</p>
                    <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> Close to Friday mosque</p>
                    <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> 20 minutes drive to central market</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
