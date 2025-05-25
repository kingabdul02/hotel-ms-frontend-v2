<script setup>
</script>

<template>
    <div class="grid p-2 md:p-3 lg:p-3 px-0 m-0">
        <div class="col-12 md:col-4 lg:col-4 p-2 md:p-3 lg:p-3"></div>
        <div class="text-4xl md:text-6xl lg:text-6xl text-center font-bold col-12 md:col-4 lg:col-4 p-2 md:p-3 lg:p-3">
            Popular Rooms</div>
        <div class="col-12 md:col-4 lg:col-4 text-center md:text-right lg:text-right pt-4">
            <Button icon="pi pi-arrow-left" severity="secondary" class="mr-2" rounded outlined aria-label="Bookmark" />
            <Button icon="pi pi-arrow-right" severity="secondary" rounded outlined aria-label="Bookmark" />
        </div>
    </div>
    <div class="grid m-0">
        <div class="col-12 md:col-4 lg:col-4">
            <div @click="navigateToRooms" style="background-image: url('/img/building/nbte-29.jpeg');
                height: 730px;
                border-radius: 25px;
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;" class="quick-access-tab card p-0">
                <div class="card__overlay">
                    <h2 class="text-center font-bold text-white text-with-shadow">Rooms</h2>
                </div>
            </div>


        </div>
        <div class="col-12 md:col-8 lg:col-8">
            <div class="grid">
                <div class="col-12 md:col-6 lg:col-6">
                    <div @click="navigateToRooms" style="background-image: url('/img/building/nbte-3.jpeg');
            height: 350px;
            border-radius: 25px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;" class="card p-0 quick-access-tab">
                        <div class="card__overlay">
                            <h2 class="text-left font-bold text-white">
                                <span class="mr-2">
                                    <Tag
                                        style="background: #6B77E5; color: var(--surface-0); border-radius: 25px; padding: 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;">
                                        <span class="uppercase montserrat-font">Available</span>
                                    </Tag>
                                </span>
                                <span>
                                    <Tag
                                        style="background: #ffffff; color: #000000; border-radius: 25px; padding: 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;">
                                        <span class="uppercase montserrat-font">Featured</span>
                                    </Tag>
                                </span>
                            </h2>
                        </div>
                    </div>
                </div>
                <div class="col-12 md:col-6 lg:col-6">
                    <div @click="navigateToRooms" style="background-image: url('/img/building/nbte-18.jpeg');
            height: 350px;
            border-radius: 25px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;" class="card p-0 quick-access-tab">
                        <div class="card__overlay">
                            <h2 class="text-left font-bold text-white">
                                <span class="mr-2">
                                    <Tag
                                        style="background: #6B77E5; color: var(--surface-0); border-radius: 25px; padding: 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;">
                                        <span class="uppercase montserrat-font">Available</span>
                                    </Tag>
                                </span>
                                <span>
                                    <Tag
                                        style="background: #ffffff; color: #000000; border-radius: 25px; padding: 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;">
                                        <span class="uppercase montserrat-font">Featured</span>
                                    </Tag>
                                </span>
                            </h2>
                        </div>
                    </div>
                </div>
                <div @click="navigateToRooms" class="col-12 md:col-6 lg:col-6">
                    <div style="background-image: url('/img/building/nbte-10.jpeg');
            height: 350px;
            border-radius: 25px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;" class="card p-0 quick-access-tab">
                        <div class="card__overlay">
                            <h2 class="text-left font-bold text-white">
                                <span>
                                    <Tag
                                        style="background: #FEBB02; color: #ffffff; border-radius: 25px; padding: 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;">
                                        <span class="uppercase montserrat-font">Booked</span>
                                    </Tag>
                                </span>
                            </h2>
                        </div>
                    </div>
                </div>
                <div class="col-12 md:col-6 lg:col-6">
                    <div @click="navigateToRooms" style="background-image: url('/img/building/nbte-19.jpeg');
            height: 350px;
            border-radius: 25px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;" class="card p-0 quick-access-tab">
                        <div class="card__overlay">
                            <h2 class="text-left font-bold text-white">
                                <span class="mr-2">
                                    <Tag
                                        style="background: #6B77E5; color: var(--surface-0); border-radius: 25px; padding: 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;">
                                        <span class="uppercase montserrat-font">Available</span>
                                    </Tag>
                                </span>
                                <span>
                                    <Tag
                                        style="background: #ffffff; color: #000000; border-radius: 25px; padding: 5px 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;">
                                        <span class="uppercase montserrat-font">Featured</span>
                                    </Tag>
                                </span>
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="grid mt-8 px-3">
        <div class="col-12 md:col-6 lg:col-6">
            <h2 class="font-bold text-700 mb-4">Our Hotel</h2>
            <hr>
            <!-- <p class="font-bold pb-0 text-primary"><i class="pi pi-circle-fill mr-2"></i><span>Managing
                    your bookings can be tedious, let’s handle that for you.</span></p> -->
            <p class="text-500 mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras eu urna mi. Cras sagittis
                tortor nec eros sollicitudin dignissim. Nullam faucibus est et erat tincidunt dictum. Lorem
                ipsum dolor sit amet, consectetur adipiscing elit. Cras eu urna mi. Cras sagittis tortor nec
                eros sollicitudin dignissim. Nullam faucibus est et erat tincidunt dictum.
            </p>
            <Button label="Show more" class="px-5 py-3 montserrat-font" />
        </div>
        <div class="col-12 md:col-6 lg:col-6">
            <h2 class="font-bold text-700 mb-4">Our Amenities</h2>
            <div class="grid px-6">
                <div class="col-12 md:col-6 lg:col-6">
                    <div class="grid">
                        <div class="flex align-items-center justify-content-center mr-2">
                            <img src="/img/icons8-kitchen-64.png" alt="RevUP Logo" height="20"
                                class="img-fluid img-fit">
                        </div>
                        <div>
                            <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Kitchen</h2>
                        </div>
                    </div>
                </div>
                <div class="col-12 md:col-6 lg:col-6">
                    <div class="grid">
                        <div class="flex align-items-center justify-content-center mr-2">
                            <img src="/img/icons8-pets-50.png" alt="RevUP Logo" height="20" class="img-fluid img-fit">
                        </div>
                        <div>
                            <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">No Pets Allowed</h2>
                        </div>
                    </div>
                </div>
                <div class="col-12 md:col-6 lg:col-6">
                    <div class="grid">
                        <div class="flex align-items-center justify-content-center mr-2">
                            <img src="/img/icons8-tumble-dryer-50.png" alt="RevUP Logo" height="20"
                                class="img-fluid img-fit">
                        </div>
                        <div>
                            <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Free washer - in building</h2>
                        </div>
                    </div>
                </div>
                <div class="col-12 md:col-6 lg:col-6">
                    <div class="grid">
                        <div class="flex align-items-center justify-content-center mr-2">
                            <img src="/img/icons8-air-conditioner-50.png" alt="RevUP Logo" height="20"
                                class="img-fluid img-fit">
                        </div>
                        <div>
                            <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Air conditioning</h2>
                        </div>
                    </div>
                </div>
                <!-- <div class="col-12 md:col-6 lg:col-6">
                    <div class="grid">
                        <div class="flex align-items-center justify-content-center mr-2">
                            <img src="/img/icons8-security-camera-50.png" alt="RevUP Logo" height="20"
                                class="img-fluid img-fit">
                        </div>
                        <div>
                            <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Security cameras
                            </h2>
                        </div>
                    </div>
                </div> -->
                <div class="col-12 md:col-6 lg:col-6">
                    <div class="grid">
                        <div class="flex align-items-center justify-content-center mr-2">
                            <img src="/img/icons8-refrigerator-50.png" alt="RevUP Logo" height="20"
                                class="img-fluid img-fit">
                        </div>
                        <div>
                            <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Refrigerator</h2>
                        </div>
                    </div>
                </div>
                <div class="col-12 md:col-6 lg:col-6">
                    <div class="grid">
                        <div class="flex align-items-center justify-content-center mr-2">
                            <img src="/img/icons8-glyph-48.png" alt="RevUP Logo" height="20" class="img-fluid img-fit">
                        </div>
                        <div>
                            <h2 class="montserrat-font mt-3 text-xl text-700 font-bold">Bicycles</h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="text-900 font-bold text-6xl my-6 text-center">Our Hotel</div>
    <div class="grid">
        <div class="col-12 lg:col-3">
            <div class="h-full">
                <div @click="navigateToRooms" class="card h-full p-3 quick-access-tab" style="border-radius: 40px;">
                    <div style="background-image: url('/img/building/nbte-21.jpeg');
            height: 200px;
            border-radius: 25px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;" class="p-0 c-shadow mb-4">
                    </div>
                    <div class="my-3 text-sm font-bold">Room</div>
                    <div class="flex justify-content-between align-items-center mb-3">
                        <div class="mt-0 font-bold text-xl">Guest Rooms</div>
                        <span>
                            <i class="pi pi-user mr-2"></i><span>2</span>
                        </span>
                    </div>
                    <p class="mb-4">Indulge in Tranquillity: Your Home Away from Home.</p>
                </div>
            </div>
        </div>
        <div class="col-12 lg:col-3">
            <div class="h-full">
                <div @click="navigateToRooms" class="card h-full p-3 quick-access-tab" style="border-radius: 40px;">
                    <div style="background-image: url('/img/building/nbte-20.jpeg');
            height: 200px;
            border-radius: 25px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;" class="p-0 c-shadow mb-4">
                    </div>
                    <div class="my-3 text-sm font-bold">Room</div>
                    <div class="flex justify-content-between align-items-center mb-3">
                        <div class="mt-0 font-bold text-xl">Guest Rooms</div>
                        <span>
                            <i class="pi pi-user mr-2"></i><span>2</span>
                        </span>
                    </div>
                    <p class="mb-4">Indulge in Tranquillity: Your Home Away from Home.</p>
                </div>
            </div>
        </div>
        <div class="col-12 lg:col-3">
            <div class="h-full">
                <div @click="navigateToRooms" class="card h-full p-3 quick-access-tab" style="border-radius: 40px;">
                    <div style="background-image: url('/img/building/nbte-18.jpeg');
                        height: 200px;
                        border-radius: 25px;
                        background-size: cover;
                        background-position: center;
                        background-repeat: no-repeat;" class="p-0 c-shadow mb-4">
                    </div>
                    <div class="my-3 text-sm font-bold">Room</div>
                    <div class="flex justify-content-between align-items-center mb-3">
                        <div class="mt-0 font-bold text-xl">Standard Room</div>
                        <span>
                            <i class="pi pi-user mr-2"></i><span>2</span>
                        </span>
                    </div>
                    <p class="mb-4">Serene Sanctuaries: Where Comfort Meets Hospitality.
                    </p>
                </div>
            </div>
        </div>
        <div class="col-12 lg:col-3">
            <div class="h-full">
                <div @click="navigateToRooms" class="card h-full p-3 quick-access-tab" style="border-radius: 40px;">
                    <div style="background-image: url('/img/building/nbte-17.jpeg');
                        height: 200px;
                        border-radius: 25px;
                        background-size: cover;
                        background-position: center;
                        background-repeat: no-repeat;" class="p-0 c-shadow mb-4">
                    </div>
                    <div class="my-3 text-sm font-bold">Room</div>
                    <div class="flex justify-content-between align-items-center mb-3">
                        <div class="mt-0 font-bold text-xl">Standard Room</div>
                        <span>
                            <i class="pi pi-user mr-2"></i><span>2</span>
                        </span>
                    </div>
                    <p class="mb-4">Serene Sanctuaries: Where Comfort Meets Hospitality.
                    </p>
                </div>
            </div>
        </div>

    </div>
    <div class="grid px-4">
        <div class="col-12">
            <h1 class="font-bold text-900 my-6 text-center">Hotel Policies</h1>
        </div>
        <div class="col-12 md:col-6 lg:col-6">
            <h2 class="font-bold text-700 mb-4">House rules</h2>
            <hr>
            <p class="text-500 mb-4 mt-4"><i class="pi pi-circle-fill"></i> Check-in: After 4:00 PM</p>
            <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> Checkout: 10:00 AM</p>
            <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> Not suitable for infants (under 2 years)</p>
            <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> No smoking</p>
            <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> No pets</p>
            <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> No parties or events</p>
        </div>
        <div class="col-12 md:col-6 lg:col-6">
            <h2 class="font-bold text-700 mb-4">Health & safety</h2>
            <hr>
            <p class="text-500 mb-4 mt-4"><i class="pi pi-circle-fill"></i> 24 hour cleaning service, available upon
                request.</p>
            <p class="text-500 mb-4 mt-4"><i class="pi pi-circle-fill"></i> No smoking.</p>
            <p class="text-500 mb-4 mt-4"><i class="pi pi-circle-fill"></i> Smoke alarm</p>
            <p class="text-500 mb-4 mt-4"><i class="pi pi-circle-fill"></i> Security Deposit - if you damage the room,
                you will be charged.</p>
        </div>
    </div>
    <div class="min-h-screen md:py-8 lg:py-8">
        <p class="font-bold text-center md:text-left lg:text-left text-4xl md:text-5xl lg:text-5xl text-center">Location
        </p>
        <div class="p-2 border-1 surface-border border-round shadow-2">
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15691.118706536154!2d7.4622144!3d10.518012!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x104d4b0cc584a911%3A0x5c9b45182a1a500a!2sNBTE%20Consult%20Ltd!5e0!3m2!1sen!2sng!4v1714246795125!5m2!1sen!2sng"
                width="100%" height="600" style="border:0;" allowfullscreen="true" loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"></iframe>
            <div class="grid px-3">
                <div class="col-12 pb-0">
                    <h2
                        class="font-bold text-900 mt-4 text-center md:text-left lg:text-left text-3xl md:text-5xl lg:text-5xl">
                        Major attractions nearby <i class="pi pi-map-marker font-bold text-2xl"></i></h2>
                </div>
                <div class="col-12 md:col-6 lg:col-6 pt-0">
                    <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> Play lounge is a good place to relax. 5
                        minutes drive from here.</p>
                    <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> Close to Friday mosque</p>
                    <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> 20 minutes drive to central market</p>
                </div>
                <div class="col-12 md:col-6 lg:col-6 pt-0">
                    <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> Play lounge is a good place to relax. 5
                        minutes drive from here.</p>
                    <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> Close to Friday mosque</p>
                    <p class="text-500 mb-4"><i class="pi pi-circle-fill"></i> 20 minutes drive to central market</p>
                </div>
            </div>
        </div>
    </div>
    <h1 class="font-bold text-900 mt-4 text-center text-3xl md:text-5xl lg:text-5xl">
        Reviews and Ratings</h1>
    <div class="grid px-3 mb-8">
        <div class="col-12 md:col-6 lg:col-6 pt-6 px-6">

            <div class="grid p-0">
                <div class="col-12 md:col-5 lg:col-5 pl-0">
                    <div class="text-center">
                        <p>Overall Rating & Reviews</p>
                        <h1 class="text-8xl text-primary">4.6</h1>
                        <p><i class="pi pi-star-fill text-primary mr-2"></i><i
                                class="pi pi-star-fill text-primary mr-2"></i><i
                                class="pi pi-star-fill text-primary mr-2"></i><i
                                class="pi pi-star-fill text-primary mr-2"></i><i
                                class="pi pi-star-fill light-font mr-2"></i>
                        </p>
                        <p>Based on 200 reviews <span class="text-primary">Rate now</span></p>
                    </div>

                </div>
                <div class="col-12 md:col-7 lg:col-7 pl-0">
                    <p class="mb-5">Indoor Area
                        <i class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill light-font mr-2"></i>
                        <ProgressBar :value="50" style="height: 12px"></ProgressBar>
                    </p>
                    <p class="mb-5">Indoor Area
                        <i class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill light-font mr-2"></i>
                        <ProgressBar :value="50" style="height: 12px"></ProgressBar>
                    </p>
                    <p class="mb-5">Indoor Area
                        <i class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill light-font mr-2"></i>
                        <ProgressBar :value="50" style="height: 12px"></ProgressBar>
                    </p>
                    <p class="mb-5">Indoor Area
                        <i class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill text-primary mr-2"></i><i
                            class="pi pi-star-fill light-font mr-2"></i>
                        <ProgressBar :value="50" style="height: 12px"></ProgressBar>
                    </p>
                </div>
            </div>
        </div>
        <div class="col-12 md:col-6 lg:col-6 py-4 md:px-0">
            <div class="p-4 md:px-0">
                <Panel class="p-3 mb-4 shadow-3">
                    <template #header>
                        <div class="flex align-items-center gap-2">
                            <Avatar image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png" size="large"
                                shape="circle" />
                            <div>
                                <span class="font-bold block">Ahmed Modee</span>
                                <small class="p-text-secondary">Updated 2 hours ago</small>
                            </div>
                        </div>
                    </template>
                    <template #icons>
                        <p class="text-primary">4.5 <i class="pi pi-star"></i></p>
                    </template>
                    <p class="m-0">
                        If you wanna take a break from work you find a great location and hospitality in this rooftop in
                        the
                        heart of the
                        town. Food is really tasty and staff really great!
                    </p>
                    <div class="flex mb-0 gap-3 pt-2">
                        <div style="background-image: url('/img/bed-3.jpeg');
                    height: 80px;
                    width: 80px;
                    border-radius: 5px;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;" class="p-0 c-shadow  mb-4">
                        </div>
                        <div style="background-image: url('/img/bed-3.jpeg');
                    height: 80px;
                    width: 80px;
                    border-radius: 5px;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;" class="p-0 c-shadow  mb-4">
                        </div>
                        <div style="background-image: url('/img/bed-3.jpeg');
                    height: 80px;
                    width: 80px;
                    border-radius: 5px;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;" class="p-0 c-shadow  mb-4">
                        </div>
                    </div>
                </Panel>
                <Panel class="p-3 mb-4 shadow-3">
                    <template #header>
                        <div class="flex align-items-center gap-2">
                            <Avatar image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png" size="large"
                                shape="circle" />
                            <div>
                                <span class="font-bold block">Ahmed Modee</span>
                                <small class="p-text-secondary">Updated 2 hours ago</small>
                            </div>
                        </div>
                    </template>
                    <template #icons>
                        <p class="text-primary">4.5 <i class="pi pi-star"></i></p>
                    </template>
                    <p class="m-0">
                        If you wanna take a break from work you find a great location and hospitality in this rooftop in
                        the
                        heart of the
                        town. Food is really tasty and staff really great!
                    </p>
                    <div class="flex mb-0 gap-3 pt-2">
                        <div style="background-image: url('/img/bed-3.jpeg');
                    height: 80px;
                    width: 80px;
                    border-radius: 5px;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;" class="p-0 c-shadow  mb-4">
                        </div>
                        <div style="background-image: url('/img/bed-3.jpeg');
                    height: 80px;
                    width: 80px;
                    border-radius: 5px;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;" class="p-0 c-shadow  mb-4">
                        </div>
                        <div style="background-image: url('/img/bed-3.jpeg');
                    height: 80px;
                    width: 80px;
                    border-radius: 5px;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;" class="p-0 c-shadow  mb-4">
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    </div>
</template>

<style scoped></style>

<script>
export default {
    methods: {
        navigateToRoom() {
            // Use Vue Router's push method to navigate to the desired route
            this.$router.push('/booking/rooms/details/room-c-12');
        },
        navigateToRooms() {
            this.$router.push('/booking/rooms');
        }
    }
}
</script>
