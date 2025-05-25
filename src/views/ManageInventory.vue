<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { ItemService } from '../service/ItemService';
import { ItemCategoryService } from '../service/ItemCategoryService';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';
import { uploadImage } from '../service/FileUploadService';

const toast = useToast();
const store = useStore();
const recordTitle = ref('Item');
const operation = ref('');

const records = ref([]);
const itemCategories = ref([]);
const itemDialog = ref(false);
const deleteitemDialog = ref(false);
const deleteRecordsDialog = ref(false);
const confirmDeleteModal = ref(false);
const detailsDialog = ref(false);
const record = ref({
    name: '',
    description: '',
    reorder_level: '',
    category_id: 0,
    unit_price: 0,
    image_url: '',
});
const selectedRecord = ref([]);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const validationErrors = ref({});
const recordService = new ItemService();
const itemService = new ItemService();
const itemCategoryService = new ItemCategoryService();
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
    recordService.getRecords().then((data) => {
        records.value = data;
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    });
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    itemCategoryService.getRecords().then((data) => {
        itemCategories.value = data;
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    });
    // store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
});

const openNew = () => {
    // Reset the item and validation errors
    operation.value = 'Add New'
    record.value = {
        name: null,
        description: null,
        reorder_level: null,
        category_id: null,
        unit_price: null,
        image_url: null
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
        description: 'Description',
        reorder_level: 'Reorder level',
        category_id: 'Category',
        unit_price: 'Unit price',
    };

    for (const field in requiredFields) {
        if (!record.value[field] || (typeof record.value[field] === 'string' && !record.value[field].trim())) {
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

        // Upload selected files and populate record.images
        if (selectedFiles.value && selectedFiles.value.length > 0) {
            const uploadedImages = await Promise.all(
                selectedFiles.value.map(async file => {
                    const response = await uploadImage(file);
                    return { url: response }; // Ensure the correct format
                })
            );
            record.value.images = uploadedImages;
        }

        if (record.value.id) {
            await itemService.updateRecord(record.value.id, record.value);
            const index = findIndexById(record.value.id);
            if (index !== -1) {
                records.value[index] = record.value;
            }
            records.value = await itemService.getRecords();
            toast.add({ severity: 'success', summary: 'Successful', detail: `${recordTitle.value} Updated`, life: 5000 });
            scrollToTop();
        } else {
            const data = await itemService.addRecord(record.value);
            record.value.id = data.id;
            records.value.push(record.value);
            records.value = await itemService.getRecords();
            toast.add({ severity: 'success', summary: 'Successful', detail: `${recordTitle.value} Created`, life: 5000 });
            scrollToTop();
        }

        itemDialog.value = false;
        record.value = {};
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



const editRecord = (editRecord) => {
    operation.value = 'Edit'
    record.value = { ...editRecord };
    validationErrors.value = {};
    selectedFiles.value = [];
    itemDialog.value = true;
};

const showDetails = (record) => {
    record.value = { ...record };
    detailsDialog.value = true;
};

const confirmDeleteRecord = (editRecord) => {
    record.value = { ...editRecord };
    confirmDeleteModal.value = true;
};

const confirmDeleteRecordConfirmed = () => {
    confirmDeleteModal.value = false;
    deleteRecord();
};

const deleteRecord = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        await recordService.deleteRecord(record.value.id);
        records.value = records.value.filter((val) => val.id !== record.value.id);
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Record Deleted', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Record Deletion Failed', life: 3000 });
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
        deleteitemDialog.value = false;
        record.value = {};
    }
};

const findIndexById = (id) => {
    return records.value.findIndex((record) => record.id === id);
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const deleteSelectedRoomTypes = () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    const ids = selectedRecord.value.map((item) => record.id);
    Promise.all(ids.map((id) => itemService.deleteRecord(id)))
        .then(() => {
            records.value = records.value.filter((val) => !selectedRecord.value.includes(val));
            deleteRecordsDialog.value = false;
            selectedRecord.value = [];
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Record Deleted', life: 3000 });
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Record Deletion Failed', life: 3000 });
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
    <Dialog v-model:visible="detailsDialog" modal header="Record Details" :style="{ width: '50vw' }">
    <div class="p-fluid">
        <div class="field">
            <label class="font-bold mr-2">Name</label>
            <span>{{ record.name }}</span>
        </div>
        <div class="field">
            <label class="font-bold mr-2">Category</label>
            <span>{{ record.category_id ?? 'Not set' }}</span>
            <!-- <span>{{ itemCategories.value.find(type => type.id === record.category_id)?.name }}</span> -->
        </div>
        <div class="field">
            <label class="font-bold mr-2">Unit price</label>
            <span>{{ record.unit_price }}</span>
        </div>
        <div class="field">
            <label class="font-bold mr-2">Reorder level</label>
            <span>{{ record.reorder_level }}</span>
        </div>
        <div class="field">
            <label class="font-bold mr-2">Description</label>
            <span>{{ record.description }}</span>
        </div>
        <div class="field">
            <label class="font-bold mr-2">Image</label>
            <div v-if="record.image_url && record.image_url.length">
                <img :src="image_url" alt="Item Image" class="mt-2" width="100" />
            </div>
        </div>
    </div>
    <template #footer>
        <Button label="Close" icon="pi pi-times" @click="detailsDialog = false" class="p-button-danger" />
    </template>
</Dialog>

    <div class="grid">
        <div class="col-12">
            <div v-if="itemDialog" class="card">
                <h5 class="font-bold uppercase">
                    <span class="text-primary">{{ operation }}:</span> {{ recordTitle }}
                </h5>
                <hr>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-6">
                        <label for="name">Name</label>
                        <InputText id="name" v-model="record.name" required autoFocus class="w-full"
                            placeholder="Enter name" />
                        <small v-if="validationErrors.name" class="p-error">{{ validationErrors.name }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="category_id">Category</label>
                        <Dropdown id="category_id" v-model="record.category_id" :options="itemCategories" optionLabel="name"
                            optionValue="id" placeholder="Select a Category" class="w-full" />
                        <small v-if="validationErrors.category_id" class="p-error">{{ validationErrors.category_id }}
                        </small>
                    </div>
                </div>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-6">
                        <label for="unit_price">Unit price</label>
                        <InputNumber id="unit_price" v-model="record.unit_price" required class="w-full"
                            placeholder="Enter unit price" />
                        <small v-if="validationErrors.unit_price" class="p-error">{{ validationErrors.unit_price }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="reorder_level">Reorder level</label>
                        <InputText id="reorder_level" v-model="record.reorder_level" required autoFocus class="w-full"
                            placeholder="Enter reorder level" />
                        <small v-if="validationErrors.reorder_level" class="p-error">{{ validationErrors.reorder_level
                            }}</small>
                    </div>
                </div>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-6">
                        <label for="description">Description</label>
                        <InputText id="description" v-model="record.description" required autoFocus class="w-full"
                            placeholder="Enter description" />
                        <small v-if="validationErrors.description" class="p-error">{{ validationErrors.description
                            }}</small>
                    </div>
                </div>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-12">
                        <label for="images">Image</label>
                        <FileUpload name="image" customUpload :multiple="true" accept="image/*" :maxFileSize="1000000"
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

                            <div v-if="record.image && record.image.length">
                                <img :src="image.url" alt="Existing Image" class="mt-2" width="100" />
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

                <DataTable ref="dt" :value="records" v-model:selection="selectedRecord" :rowHover="true"
                    filterDisplay="menu" showGridlines dataKey="id" :paginator="true" :rows="10" :filters="filters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0 uppercase"><span class="text-primary">Manage : </span> {{ recordTitle }}s</h5>
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
                    <Column field="category?.name" header="Category" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Category</span>
                            {{ slotProps.data.category?.name ?? 'Not set' }}
                        </template>
                    </Column>
                    <Column field="unit_price" header="Unit price (₦)" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Unit price (₦)</span>
                            ₦{{ slotProps.data.unit_price }}
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
                            <Button icon="pi pi-eye" class="mr-2" severity="info" rounded
                                @click="showDetails(slotProps.data)" />
                            <Button icon="pi pi-pencil" class="mr-2" severity="success" rounded
                                @click="editRecord(slotProps.data)" />
                            <Button icon="pi pi-trash" class="mt-2" severity="warning" rounded
                                @click="confirmDeleteRecord(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>

                <!-- <Dialog v-model:visible="itemDialog" modal style="width: 600px" header="Add New Record"
                    :closable="false">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText id="name" v-model="record.name" required autoFocus class="w-full" />
                        <small v-if="validationErrors.name" class="p-error">{{ validationErrors.name }}</small>
                    </div>
                    <div class="field">
                        <label for="category_id">Category</label>
                        <Dropdown id="category_id" v-model="record.category_id" :options="itemCategories" optionLabel="name"
                            optionValue="id" placeholder="Select a Category" class="w-full" />
                        <small v-if="validationErrors.category_id" class="p-error">{{ validationErrors.category_id
                            }}</small>
                    </div>
                    <div class="field">
                        <label for="unit_price">Unit price</label>
                        <InputNumber id="unit_price" v-model="record.unit_price" required class="w-full" />
                    </div>
                    <div class="field">
                        <label for="reorder_level">No of Guests</label>
                        <InputNumber id="reorder_level" v-model="record.reorder_level" required class="w-full" />
                    </div>
                    <div class="field">
                        <label for="no_of_bedrooms">No of Bedrooms</label>
                        <InputNumber id="no_of_bedrooms" v-model="record.no_of_bedrooms" required class="w-full" />
                    </div>
                    <div class="field">
                        <label for="description">No of Beds</label>
                        <InputNumber id="description" v-model="record.description" required class="w-full" />
                    </div>
                    <div class="field">
                        <label for="no_of_baths">No of Baths</label>
                        <InputNumber id="no_of_baths" v-model="record.no_of_baths" required class="w-full" />
                    </div>

                    <div class="flex align-items-center gap-3 mb-3">
                        <label for="product-image" class="font-semibold w-10rem">Images</label>
                        <FileUpload name="images" url="/upload" @upload="onTemplatedUpload" :multiple="true"
                            accept="image/*" :maxFileSize="1000000" @select="onSelectedFiles">
                            <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
                                <div class="flex flex-wrap justify-content-between align-items-center">
                                    <Button label="Choose" icon="pi pi-plus" class="mr-2" @click="chooseCallback" />
                                    <Button label="Upload" icon="pi pi-upload" class="mr-2" @click="uploadCallback" />
                                    <Button label="Clear" icon="pi pi-times" class="mr-2" @click="clearCallback"
                                        v-if="files.length" />
                                </div>
                            </template>
                        </FileUpload>
                        <div v-if="record.images && record.images.length">
                            <div v-for="image in record.images" :key="image.url">
                                <img :src="image.url" alt="Existing Image" class="mt-2" width="100" />
                            </div>
                        </div>
                    </div>

                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" outlined @click="hideDialog"
                            class="p-button-danger" />
                        <Button label="Save" icon="pi pi-check" @click="saveItem" class="p-button-primary" />
                    </template>
                </Dialog> -->

                <ConfirmDialog v-model:visible="deleteRecordsDialog" header="Confirm" icon="pi pi-exclamation-triangle"
                    acceptLabel="Yes" rejectLabel="No" acceptClass="p-button-danger" @accept="deleteSelectedRoomTypes">
                    <template #message>
                        <p>Are you sure you want to delete the selected room types?</p>
                    </template>
                </ConfirmDialog>

                <Dialog v-model:visible="confirmDeleteModal" modal header="Confirm Delete" :style="{ width: '30rem' }">
                    <p>Are you sure you want to delete <strong>{{ record.name }}</strong>?</p>
                    <div class="flex justify-content-end gap-2">
                        <Button type="button" label="No" severity="secondary"
                            @click="confirmDeleteModal = false"></Button>
                        <Button type="button" label="Yes" @click="confirmDeleteRecordConfirmed()"></Button>
                    </div>
                </Dialog>
            </div>
        </div>
    </div>
</template>
