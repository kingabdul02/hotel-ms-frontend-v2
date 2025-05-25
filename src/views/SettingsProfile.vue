<script setup>
</script>

<template>
    <div class="card p-0">
        <div class="col-12 p-0"
            style="background-image: url('/img/building/nbte-16.jpeg'); height: 250px; background-size: cover; background-position: center; background-repeat: no-repeat;">
            <div class="overlay-4 overlay-3 pt-8">
            </div>
        </div>
        <div class="p-5">
            <Fieldset style="margin-top: -80px;">
                <template #legend>
                    <div class="flex items-center pl-2">
                        
                        <span class="font-bold p-2 montserrat-font uppercase text-primary">User Profile</span>
                    </div>
                </template>
                <div class="flex align-items-start flex-column lg:justify-content-between lg:flex-row montserrat-font">
                    <div>
                        <Avatar image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png" class="my-3"
                            size="xlarge" shape="circle" />
                        <div class="font-medium text-3xl text-900">User name</div>
                        <div class="flex align-items-center text-700 flex-wrap">
                            <div class="mr-5 flex align-items-center mt-3">
                                <i class="pi pi-at mr-2"></i>
                                <span>useremail@mail.com</span>
                            </div>
                            <div class="mr-5 flex align-items-center mt-3">
                                <i class="pi pi-id-card mr-2"></i>
                                <span>UserRole</span>
                            </div>
                            <div class="flex align-items-center mt-3">
                                <i class="pi pi-clock mr-2"></i>
                                <span><strong>Created at:</strong> 1st May, 2023 11:20PM</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 lg:mt-0">
                        <Button label="Update" class="p-button-outlined mr-2" icon="pi pi-user-edit"></Button>
                        <Button label="Change Password" icon="pi pi-key"></Button>
                    </div>
                </div>
            </Fieldset>
        </div>
    </div>
</template>
