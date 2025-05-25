<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { RoomsService } from '../../../service/RoomsService';
import { RoomTypeService } from '../../../service/RoomTypeService';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';
import { uploadImage } from '../../../service/FileUploadService';

const toast = useToast();
const store = useStore();
const itemTitle = ref('Room');
const operation = ref('');

const items = ref([]);
const roomTypes = ref([]);
const itemDialog = ref(false);
const deleteitemDialog = ref(false);
const deleteItemsDialog = ref(false);
const confirmDeleteModal = ref(false);
const detailsDialog = ref(false);
const item = ref({
    name: '',
    room_type_id: 0,
    price: 0,
    no_of_guests: 0,
    no_of_bedrooms: 0,
    no_of_beds: 0,
    no_of_baths: 0,
    images: []
});
const selectedItem = ref([]);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const validationErrors = ref({});
const itemService = new RoomsService();
const roomTypeService = new RoomTypeService();
const selectedFiles = ref([]);
const scrollToTop = () => {
    // Scroll to the top with animation
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

onBeforeMount(() => {
    initFilters();
});

onMounted(() => {
    scrollToTop();
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    itemService.getRooms().then((data) => {
        items.value = data;
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    });
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    roomTypeService.getRoomTypes().then((data) => {
        roomTypes.value = data;
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    });
});

const openNew = () => {
    // Reset the item and validation errors
    operation.value = 'Add New'
    item.value = {
        name: null,
        room_type_id: null,
        price: null,
        no_of_guests: null,
        no_of_bedrooms: null,
        no_of_beds: null,
        no_of_baths: null,
        images: []
    };
    validationErrors.value = {};
    submitted.value = false;
    selectedFiles.value = [];

    scrollToTop();
    itemDialog.value = true;
};


const hideDialog = () => {
    scrollToTop();
    itemDialog.value = false;
    submitted.value = false;
};

const onSelectedFiles = (event) => {
    selectedFiles.value = event.files;
};

const validateForm = () => {
    validationErrors.value = {};
    const requiredFields = {
        name: 'Name',
        room_type_id: 'Room Type',
        price: 'Price',
        no_of_guests: 'Number of Guests',
        no_of_bedrooms: 'Number of Bedrooms',
        no_of_beds: 'Number of Beds',
        no_of_baths: 'Number of Baths'
    };

    for (const field in requiredFields) {
        if (!item.value[field] || (typeof item.value[field] === 'string' && !item.value[field].trim())) {
            validationErrors.value[field] = `${requiredFields[field]} is required.`;
        }
    }

    return Object.keys(validationErrors.value).length === 0;
};


const saveItem = async () => {
    submitted.value = true;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);

    try {
        if (!validateForm()) {
            throw new Error("Validation failed");
        }
        if (selectedFiles.value && selectedFiles.value.length > 0) {
            const uploadedImages = await Promise.all(
                selectedFiles.value.map(async file => {
                    const response = await uploadImage(file);
                    return { url: response }; // Ensure the correct format
                })
            );
            item.value.images = uploadedImages;
        }

        if (item.value.id) {
            await itemService.updateRoom(item.value.id, item.value);
            const index = findIndexById(item.value.id);
            if (index !== -1) {
                items.value[index] = item.value;
            }
            items.value = await itemService.getRooms();
            toast.add({ severity: 'success', summary: 'Successful', detail: `${itemTitle.value} Updated`, life: 5000 });
            scrollToTop();
        } else {
            const data = await itemService.addRoom(item.value);
            item.value.id = data.id;
            items.value.push(item.value);
            items.value = await itemService.getRooms();
            toast.add({ severity: 'success', summary: 'Successful', detail: `${itemTitle.value} Created`, life: 5000 });
            scrollToTop();
        }

        itemDialog.value = false;
        item.value = {};
        selectedFiles.value = [];
    } catch (error) {
        console.error(error);
        let errorMessage = "Operation Failed";

        if (error.message === "Validation failed") {
            errorMessage = "Please fill in all required fields.";
        } else if (error.message === "File upload failed") {
            errorMessage = "File upload failed. Please try again.";
        }

        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};



const editRooms = (editRooms) => {
    operation.value = 'Edit'
    item.value = { ...editRooms };
    validationErrors.value = {};
    selectedFiles.value = [];
    itemDialog.value = true;
};

const showDetails = (room) => {
    item.value = { ...room };
    detailsDialog.value = true;
};

const confirmDeleteRoomType = (editRooms) => {
    item.value = { ...editRooms };
    confirmDeleteModal.value = true;
};

const confirmDeleteRoomTypeConfirmed = () => {
    confirmDeleteModal.value = false;
    deleteItem();
};

const deleteItem = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        await itemService.deleteRoom(item.value.id);
        items.value = items.value.filter((val) => val.id !== item.value.id);
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Room Deleted', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Room Deletion Failed', life: 3000 });
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
        deleteitemDialog.value = false;
        item.value = {};
    }
};

const findIndexById = (id) => {
    return items.value.findIndex((item) => item.id === id);
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const deleteSelectedRoomTypes = () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    const ids = selectedItem.value.map((item) => item.id);
    Promise.all(ids.map((id) => itemService.deleteItem(id)))
        .then(() => {
            items.value = items.value.filter((val) => !selectedItem.value.includes(val));
            deleteItemsDialog.value = false;
            selectedItem.value = [];
            toast.add({ severity: 'success', summary: 'Successful', detail: 'RoomTypes Deleted', life: 3000 });
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'RoomTypes Deletion Failed', life: 3000 });
        })
        .finally(() => {
            store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
        });
};

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};
</script>

<template>
    <Dialog v-model:visible="detailsDialog" modal header=" " :style="{ width: '60vw' }">
        <div class="surface-section">
            <div class="font-medium text-3xl text-900 mb-3"><strong class="text-primary">Room Name:</strong> {{ item.name }}</div>
            <div class="text-500 mb-5">{{item.roomType?.description}}
            </div>
            <ul class="list-none p-0 m-0">
                <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
                    <div class="text-primary w-6 md:w-4 font-bold">Room Type :</div>
                    <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{ item.roomType?.name }}</div>
                </li>
                <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
                    <div class="text-primary w-6 md:w-4 font-bold">Price :</div>
                    <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{ item.price }}</div>
                </li>
                <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
                    <div class="text-primary w-6 md:w-4 font-bold">Number of Guests :</div>
                    <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{ item.no_of_guests }}</div>
                </li>
                <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
                    <div class="text-primary w-6 md:w-4 font-bold">Number of Bedrooms :</div>
                    <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{ item.no_of_bedrooms }}</div>
                </li>
                <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
                    <div class="text-primary w-6 md:w-4 font-bold">Number of Beds :</div>
                    <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{ item.no_of_beds }}</div>
                </li>
                <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
                    <div class="text-primary w-6 md:w-4 font-bold">Number of Bathrooms :</div>
                    <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{ item.no_of_baths }}</div>
                </li>
                <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
                    <div class="text-primary w-6 md:w-4 font-bold">Images :</div>
                    <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
                        <div class="grid grid-nogutter">
                            <div v-if="item.images && item.images.length">
                                <div v-for="image in item.images" :key="image.url">
                                    <img :src="image.url" alt="Existing Image" class="mt-2" width="100" />
                                </div>
                            </div>
                            <!-- <div v-for="image in item.images" :key="image?.data?.id" class="col-12 md:col-6">
                                <img :src="image?.data?.url" alt="Room Image" class="w-full shadow-2 mb-3" />
                            </div> -->
                        </div>
                    </div>
                </li>
            </ul>
        </div>
        <template #footer>
            <Button label="Close" icon="pi pi-times" @click="detailsDialog = false" class="p-button-danger" />
        </template>
    </Dialog>

    <div class="grid">
        <div class="col-12">
            <div v-if="itemDialog" class="card">
                <h5 class="font-bold uppercase">
                    <span class="text-primary">{{ operation }}:</span> {{ itemTitle }}
                </h5>
                <hr>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-6">
                        <label for="name">Name</label>
                        <InputText id="name" v-model="item.name" required autoFocus class="w-full"
                            placeholder="Enter name" />
                        <small v-if="validationErrors.name" class="p-error">{{ validationErrors.name }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="room_type_id">Room Type</label>
                        <Dropdown id="room_type_id" v-model="item.room_type_id" :options="roomTypes" optionLabel="name"
                            optionValue="id" placeholder="Select a Room Type" class="w-full" />
                        <small v-if="validationErrors.room_type_id" class="p-error">{{ validationErrors.room_type_id }}
                        </small>
                    </div>
                </div>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-6">
                        <label for="price">Price</label>
                        <InputNumber id="price" v-model="item.price" required class="w-full"
                            placeholder="Enter price" />
                        <small v-if="validationErrors.price" class="p-error">{{ validationErrors.price }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="no_of_guests">No of Guests</label>
                        <InputNumber id="no_of_guests" v-model="item.no_of_guests" required class="w-full"
                            placeholder="Enter number of guests" />
                        <small v-if="validationErrors.no_of_guests" class="p-error">{{ validationErrors.no_of_guests
                            }}</small>
                    </div>
                </div>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-6">
                        <label for="no_of_bedrooms">No of Bedrooms</label>
                        <InputNumber id="no_of_bedrooms" v-model="item.no_of_bedrooms" required class="w-full"
                            placeholder="Enter number of bedrooms" />
                        <small v-if="validationErrors.no_of_bedrooms" class="p-error">{{ validationErrors.no_of_bedrooms
                            }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="no_of_beds">No of Beds</label>
                        <InputNumber id="no_of_beds" v-model="item.no_of_beds" required class="w-full"
                            placeholder="Enter number of beds" />
                        <small v-if="validationErrors.no_of_beds" class="p-error">{{ validationErrors.no_of_beds
                            }}</small>
                    </div>
                </div>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-6">
                        <label for="no_of_baths">No of Baths</label>
                        <InputNumber id="no_of_baths" v-model="item.no_of_baths" required class="w-full"
                            placeholder="Enter number of baths" />
                        <small v-if="validationErrors.no_of_baths" class="p-error">{{ validationErrors.no_of_baths
                            }}</small>
                    </div>
                    <div class="field col-12 md:col-12">
                        <label for="images">Images</label>
                        <FileUpload name="images" customUpload :multiple="true" accept="image/*" :maxFileSize="1000000"
                            @select="onSelectedFiles">
                            <template #header="{ chooseCallback, clearCallback, files }">
                                <div class="flex flex-wrap justify-content-between align-items-center">
                                    <Button label="Choose" icon="pi pi-plus" class="mr-2" @click="chooseCallback" />
                                    <Button label="Clear" icon="pi pi-times" class="mr-2" @click="clearCallback"
                                        v-if="files.length" />
                                </div>
                            </template>
                        </FileUpload>
                        <div class="flex align-items-center gap-3 mb-3">

                            <div v-if="item.images && item.images.length">
                                <div v-for="image in item.images" :key="image.url">
                                    <img :src="image.url" alt="Existing Image" class="mt-2" width="100" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr>
                <Button label="Cancel" icon="pi pi-times" outlined @click="hideDialog" class="p-button-danger mr-2" />
                <Button label="Save" icon="pi pi-check" @click="saveItem" class="p-button-primary" />
            </div>
            <div v-if="!itemDialog" class="card">
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="New" icon="pi pi-plus" class="mr-2" severity="success" @click="openNew" />
                        </div>
                    </template>
                    <template v-slot:end>
                        <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)" />
                    </template>
                </Toolbar>

                <DataTable ref="dt" :value="items" v-model:selection="selectedItem" :rowHover="true"
                    filterDisplay="menu" showGridlines dataKey="id" :paginator="true" :rows="10" :filters="filters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0 uppercase"><span class="text-primary">Manage : </span> {{ itemTitle }}s</h5>
                            <IconField iconPosition="left" class="block mt-2 md:mt-0">
                                <InputIcon class="pi pi-search" />
                                <InputText class="w-full sm:w-auto" v-model="filters['global'].value"
                                    placeholder="Search..." />
                            </IconField>
                        </div>
                    </template>
                    <Column field="name" header="Name" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Name</span>
                            {{ slotProps.data.name }}
                        </template>
                    </Column>
                    <Column field="roomType?.name" header="Type" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Type</span>
                            {{ slotProps.data.roomType?.name ?? 'Not set' }}
                        </template>
                    </Column>
                    <Column field="price" header="Price (₦)" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Price (₦)</span>
                            ₦{{ slotProps.data.price }}
                        </template>
                    </Column>
                    <Column header="Image">
                        <template #body="slotProps">
                            <span class="p-column-title">Image</span>
                            <img :src="slotProps.data.images?.data[0]?.url || '/img/noimage.gif'"
                                :alt="slotProps.data.name" class="shadow-2 border-round" width="50" />
                        </template>
                    </Column>
                    <Column headerStyle="min-width:10rem;">
                        <template #body="slotProps">
                            <Button icon="pi pi-eye" class="mr-2 p-button-text" severity="info" rounded
                                @click="showDetails(slotProps.data)" />
                            <Button icon="pi pi-pencil" class="mr-2 p-button-text" severity="success" rounded
                                @click="editRooms(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-text" severity="warning" rounded
                                @click="confirmDeleteRoomType(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>

                <ConfirmDialog v-model:visible="deleteItemsDialog" header="Confirm" icon="pi pi-exclamation-triangle"
                    acceptLabel="Yes" rejectLabel="No" acceptClass="p-button-danger" @accept="deleteSelectedRoomTypes">
                    <template #message>
                        <p>Are you sure you want to delete the selected room types?</p>
                    </template>
                </ConfirmDialog>

                <Dialog v-model:visible="confirmDeleteModal" modal header="Confirm Delete" :style="{ width: '30rem' }">
                    <p>Are you sure you want to delete <strong>{{ item.name }}</strong>?</p>
                    <div class="flex justify-content-end gap-2">
                        <Button type="button" label="No" severity="secondary"
                            @click="confirmDeleteModal = false"></Button>
                        <Button type="button" label="Yes" @click="confirmDeleteRoomTypeConfirmed()"></Button>
                    </div>
                </Dialog>
            </div>
        </div>
    </div>
</template>
