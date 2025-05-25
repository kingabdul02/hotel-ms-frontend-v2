<script setup>
import { ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { FilterMatchMode } from 'primevue/api';
import { ItemService } from '../../../service/ItemService';
import { ItemCategoryService } from '../../../service/ItemCategoryService';
import { uploadImage } from '../../../service/FileUploadService';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';

const toast = useToast();
const store = useStore();
const recordTitle = ref('Inventory Item');
const operation = ref('');

const records = ref([]);
const recordDialog = ref(false);
const deleteRecordDialog = ref(false);
const confirmDeleteModal = ref(false);
const detailsDialog = ref(false);
const record = ref({
    name: "",
    description: "",
    category_id: null,
    unit_price: 0,
    reorder_level: "",
    image_url: "",
});
const selectedRecord = ref([]);
const itemCategories = ref([]);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const validationErrors = ref({});
const selectedFile = ref(null); // Define selectedFile
const recordService = new ItemService();
const itemCategoryService = new ItemCategoryService();
const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

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
    itemCategoryService.getRecords().then((data) => {
        itemCategories.value = data;
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    });
});

const openNew = () => {
    operation.value = 'Add New';
    record.value = {
        name: "",
        description: "",
        unit_price: 0,
        category_id: null,
        reorder_level: "",
        image_url: "",
    };
    validationErrors.value = {};
    submitted.value = false;
    scrollToTop();
    recordDialog.value = true;
};

const hideDialog = () => {
    scrollToTop();
    recordDialog.value = false;
    submitted.value = false;
};

const onSelectedFiles = (event) => {
    selectedFile.value = event.files;
    console.log('file selected', selectedFile.value[0]);
};

const validateForm = () => {
    validationErrors.value = {};
    const requiredFields = {
        name: "Item Name",
        description: "Description",
        category_id: "Item Category",
        unit_price: "Unit Price",
        reorder_level: "Reorder level",
        // image_url: "Image",
    };

    for (const field in requiredFields) {
        if (!record.value[field] || (typeof record.value[field] === 'string' && !record.value[field].trim())) {
            validationErrors.value[field] = `${requiredFields[field]} is required.`;
        }
    }

    return Object.keys(validationErrors.value).length === 0;
};

const saveRecord = async () => {
    submitted.value = true;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);

    try {
        if (!validateForm()) {
            throw new Error("Validation failed");
        }

        if (selectedFile.value && selectedFile.value.length > 0) {
            const uploadedImage = await uploadImage(selectedFile.value[0]);
            record.value.image_url = uploadedImage
        }
        
        if (record.value.id) {
            await recordService.updateRecord(record.value.id, record.value);
            const index = findIndexById(record.value.id);
            if (index !== -1) {
                records.value[index] = record.value;
            }
            records.value = await recordService.getRecords();
            toast.add({ severity: 'success', summary: 'Successful', detail: `${recordTitle.value} Updated`, life: 5000 });
        } else {
            const data = await recordService.addRecord(record.value);
            record.value.id = data.id;
            records.value.push(record.value);
            records.value = await recordService.getRecords();
            toast.add({ severity: 'success', summary: 'Successful', detail: `${recordTitle.value} Created`, life: 5000 });
        }

        recordDialog.value = false;
        record.value = {};
    } catch (error) {
        let errorMessage = error?.response?.data?.message ?? "Operation Failed";

        if (error.message === "Validation failed") {
            errorMessage = "Please fill in all required fields.";
        }

        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

const editRecord = (editRecord) => {
    operation.value = 'Edit';
    record.value = { ...editRecord };
    validationErrors.value = {};
    recordDialog.value = true;
};

const showDetails = (detailsRecord) => {
    record.value = { ...detailsRecord };
    detailsDialog.value = true;
};

const confirmDeleteRecord = (deleteRecord) => {
    record.value = { ...deleteRecord };
    confirmDeleteModal.value = true;
};

const confirmDeleteRecordConfirmed = () => {
    confirmDeleteModal.value = false;
    deleteItem();
};

const deleteItem = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        await recordService.deleteRecord(record.value.id);
        records.value = records.value.filter((val) => val.id !== record.value.id);
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Record Deleted', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Record Deletion Failed', life: 3000 });
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
        deleteRecordDialog.value = false;
        record.value = {};
    }
};

const findIndexById = (id) => {
    return records.value.findIndex((record) => record.id === id);
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFile.value = file;
    }
};

const onTemplatedUpload = (event) => {
    // Implement the logic for templated upload if required
};

const getItemCategoryName = (category_id) => {
    const category = itemCategories.value.find(cat => cat.id === category_id);
    return category ? category.name : '';
};
</script>


<template>
    <Dialog v-model:visible="detailsDialog" modal header="Record Details" :style="{ width: '50vw' }">
        <div class="p-fluid">
            <div class="field">
                <label class="font-bold mr-2">Name:</label>
                <span>{{ record?.name }}</span>
            </div>
            <div class="field">
                <img :src="record?.image_url || '/img/noimage.gif'" :alt="record?.image_url" class="shadow-2 border-round" width="50" />
            </div>
            <div class="field">
                <label class="font-bold mr-2">Description:</label>
                <span>{{ record?.description }}</span>
            </div>
            <div class="field">
                <label class="font-bold mr-2">Unit price:</label>
                <span>{{ record?.unit_price }}</span>
            </div>
            <div class="field">
                <label class="font-bold mr-2">Category:</label>
                <span>{{ getItemCategoryName(record?.category_id) }}</span>
            </div>
            <div class="field">
                <label class="font-bold mr-2">Reorder level:</label>
                <span>{{ record?.reorder_level }}</span>
            </div>
        </div>
        <template #footer>
            <Button label="Close" icon="pi pi-times" @click="detailsDialog = false" class="p-button-danger" />
        </template>
    </Dialog>

    <div class="grid">
        <div class="col-12">
            <div v-if="recordDialog" class="card">
                <h5 class="font-bold uppercase">
                    <span class="text-primary">{{ operation }}:</span> {{ recordTitle }}
                </h5>
                <hr>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-6">
                        <label for="name">Name</label>
                        <InputText id="name" v-model="record.name" required autoFocus class="w-full" placeholder="Enter name" />
                        <small v-if="validationErrors.name" class="p-error">{{ validationErrors.name }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="description">Description</label>
                        <InputText id="description" v-model="record.description" required autoFocus class="w-full" placeholder="Enter description" />
                        <small v-if="validationErrors.description" class="p-error">{{ validationErrors.description }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="reorder_level">Reorder level</label>
                        <InputText id="reorder_level" v-model="record.reorder_level" required autoFocus class="w-full" placeholder="Enter reorder level" />
                        <small v-if="validationErrors.reorder_level" class="p-error">{{ validationErrors.reorder_level }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="unit_price">Unit price</label>
                        <InputText id="unit_price" v-model="record.unit_price" required autoFocus class="w-full" placeholder="Enter unit price" />
                        <small v-if="validationErrors.unit_price" class="p-error">{{ validationErrors.unit_price }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="category_id">Category</label>
                        <Dropdown id="category_id" v-model="record.category_id" :options="itemCategories" optionLabel="name" optionValue="id" placeholder="Select a Category" class="w-full" />
                        <small v-if="validationErrors.category_id" class="p-error">{{ validationErrors.category_id }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="image_url">Image</label>
                        <!-- <input type="file" @change="handleFileUpload" class="w-full" /> -->
                        <FileUpload name="image_url" url="/upload" @upload="onTemplatedUpload" :multiple="false"
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
                        <small v-if="validationErrors.image_url" class="p-error">{{ validationErrors.image_url }}</small>
                    </div>
                </div>
                <hr>
                <Button label="Cancel" icon="pi pi-times" outlined @click="hideDialog" class="p-button-danger mr-2" />
                <Button label="Save" icon="pi pi-check" @click="saveRecord" class="p-button-primary" />
            </div>
            <div v-if="!recordDialog" class="card">
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="Add Record" icon="pi pi-plus" class="mr-2" severity="success" @click="openNew" />
                        </div>
                    </template>
                    <template v-slot:end>
                        <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)" />
                    </template>
                </Toolbar>

                <DataTable ref="dt" :value="records" v-model:selection="selectedRecord" :rowHover="true" filterDisplay="menu" showGridlines dataKey="id" :paginator="true" :rows="10" :filters="filters" paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5, 10, 25]" currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0 uppercase"><span class="text-primary">Manage : </span> {{ recordTitle }}(s)</h5>
                            <IconField iconPosition="left" class="block mt-2 md:mt-0">
                                <InputIcon class="pi pi-search" />
                                <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Search..." />
                            </IconField>
                        </div>
                    </template>
                    <Column headerStyle="min-width:15rem;" field="name" header="Item Name" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Item Name</span>
                            {{ slotProps.data.name }}
                        </template>
                    </Column>
                    <Column field="unit_price" header="Unit price" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Unit price</span>
                            {{ slotProps.data.unit_price }}
                        </template>
                    </Column>
                    <Column field="description" header="Description" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Description</span>
                            {{ slotProps.data.description }}
                        </template>
                    </Column>
                    <Column headerStyle="min-width:13rem;">
                        <template #body="slotProps">
                            <Button icon="pi pi-eye" class="mr-2 p-button-text" severity="info" rounded @click="showDetails(slotProps.data)" />
                            <Button icon="pi pi-pencil" class="mr-2 p-button-text" severity="success" rounded @click="editRecord(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-text" severity="danger" rounded @click="confirmDeleteRecord(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>

                <Dialog v-model:visible="confirmDeleteModal" modal header="Confirm Delete" :style="{ width: '30rem' }">
                    <p>Are you sure you want to delete <strong>{{ record.name }}</strong>?</p>
                    <div class="flex justify-content-end gap-2">
                        <Button type="button" label="No" severity="secondary" @click="confirmDeleteModal = false"></Button>
                        <Button type="button" label="Yes" @click="confirmDeleteRecordConfirmed()"></Button>
                    </div>
                </Dialog>
            </div>
        </div>
    </div>
</template>

<style>
/* Add any additional styles here */
</style>
