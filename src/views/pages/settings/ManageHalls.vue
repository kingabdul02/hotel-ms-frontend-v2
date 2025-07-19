<template>
    <Dialog v-model:visible="detailsDialog" modal header=" " :style="{ width: '60vw' }">
        <div class="surface-section">
            <div class="font-medium text-3xl text-900 mb-3"><strong class="text-primary">Hall Name:</strong> {{ item.name }}</div>
            <div class="text-500 mb-5">{{item.description}}
            </div>
            <ul class="list-none p-0 m-0">
                <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
                    <div class="text-primary w-6 md:w-4 font-bold">Price :</div>
                    <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{ item.price }}</div>
                </li>
                <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
                    <div class="text-primary w-6 md:w-4 font-bold">Capacity :</div>
                    <div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{ item.capacity }}</div>
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
                        <label for="price">Price</label>
                        <InputNumber id="price" v-model="item.price" required class="w-full"
                            placeholder="Enter price" />
                        <small v-if="validationErrors.price" class="p-error">{{ validationErrors.price }}</small>
                    </div>
                </div>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-6">
                        <label for="capacity">Capacity</label>
                        <InputNumber id="capacity" v-model="item.capacity" required class="w-full"
                            placeholder="Enter capacity" />
                        <small v-if="validationErrors.capacity" class="p-error">{{ validationErrors.capacity
                            }}</small>
                    </div>
                    <div class="field col-12 md:col-12">
                        <label for="description">Description</label>
                        <Textarea id="description" v-model="item.description" rows="3" cols="20" />
                        <small v-if="validationErrors.description" class="p-error">{{ validationErrors.description
                            }}</small>
                    </div>
                </div>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-12">
                        <label for="images">Images</label>
                        <FileUpload name="images" customUpload :multiple="true" accept="image/*" :maxFileSize="1000000"
                            @select="onSelectedFiles">
                            <template #header="{ chooseCallback, clearCallback, files }">
                                <Button label="Choose" icon="pi pi-plus" class="mr-2" @click="chooseCallback" />
                                <Button label="Clear" icon="pi pi-times" class="mr-2" @click="clearCallback"
                                    v-if="files.length" />
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
                    <Column field="price" header="Price (₦)" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Price (₦)</span>
                            ₦{{ slotProps.data.price }}
                        </template>
                    </Column>
                    <Column field="capacity" header="Capacity" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Capacity</span>
                            {{ slotProps.data.capacity }}
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
                                @click="editItem(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-text" severity="warning" rounded
                                @click="confirmDeleteItem(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>

                <ConfirmDialog v-model:visible="deleteItemsDialog" header="Confirm" icon="pi pi-exclamation-triangle"
                    acceptLabel="Yes" rejectLabel="No" acceptClass="p-button-danger" @accept="deleteSelectedItems">
                    <template #message>
                        <p>Are you sure you want to delete the selected halls?</p>
                    </template>
                </ConfirmDialog>

                <Dialog v-model:visible="confirmDeleteModal" modal header="Confirm Delete" :style="{ width: '30rem' }">
                    <p>Are you sure you want to delete <strong>{{ item.name }}</strong>?</p>
                    <div class="flex justify-content-end gap-2">
                        <Button type="button" label="No" severity="secondary"
                            @click="confirmDeleteModal = false"></Button>
                        <Button type="button" label="Yes" @click="confirmDeleteItemConfirmed()"></Button>
                    </div>
                </Dialog>
            </div>
        </div>
    </div>
</template>

<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { HallService } from '../../../service/HallService';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';
import { uploadImage } from '../../../service/FileUploadService';

const toast = useToast();
const store = useStore();
const itemTitle = ref('Hall');
const operation = ref('');

const items = ref([]);
const itemDialog = ref(false);
const deleteitemDialog = ref(false);
const deleteItemsDialog = ref(false);
const confirmDeleteModal = ref(false);
const detailsDialog = ref(false);
const item = ref({
    name: '',
    price: 0,
    capacity: 0,
    description: '',
    images: []
});
const selectedItem = ref([]);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const validationErrors = ref({});
const itemService = new HallService();
const selectedFiles = ref([]);
const scrollToTop = () => {
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
    itemService.getHalls().then((data) => {
        items.value = data;
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    });
});

const openNew = () => {
    operation.value = 'Add New'
    item.value = {
        name: null,
        price: null,
        capacity: null,
        description: null,
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
        price: 'Price',
        capacity: 'Capacity',
        description: 'Description'
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
                    return { url: response };
                })
            );
            item.value.images = uploadedImages;
        }

        if (item.value.id) {
            await itemService.updateHall(item.value.id, item.value);
            const index = findIndexById(item.value.id);
            if (index !== -1) {
                items.value[index] = item.value;
            }
            items.value = await itemService.getHalls();
            toast.add({ severity: 'success', summary: 'Successful', detail: `${itemTitle.value} Updated`, life: 5000 });
            scrollToTop();
        } else {
            const data = await itemService.addHall(item.value);
            item.value.id = data.id;
            items.value.push(item.value);
            items.value = await itemService.getHalls();
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

const editItem = (editItem) => {
    operation.value = 'Edit'
    item.value = { ...editItem };
    validationErrors.value = {};
    selectedFiles.value = [];
    itemDialog.value = true;
};

const showDetails = (hall) => {
    item.value = { ...hall };
    detailsDialog.value = true;
};

const confirmDeleteItem = (editItem) => {
    item.value = { ...editItem };
    confirmDeleteModal.value = true;
};

const confirmDeleteItemConfirmed = () => {
    confirmDeleteModal.value = false;
    deleteItem();
};

const deleteItem = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        await itemService.deleteHall(item.value.id);
        items.value = items.value.filter((val) => val.id !== item.value.id);
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Hall Deleted', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Hall Deletion Failed', life: 3000 });
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

const deleteSelectedItems = () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    const ids = selectedItem.value.map((item) => item.id);
    Promise.all(ids.map((id) => itemService.deleteHall(id)))
        .then(() => {
            items.value = items.value.filter((val) => !selectedItem.value.includes(val));
            deleteItemsDialog.value = false;
            selectedItem.value = [];
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Halls Deleted', life: 3000 });
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Halls Deletion Failed', life: 3000 });
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
