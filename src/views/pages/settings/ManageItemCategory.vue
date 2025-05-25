<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { ItemCategoryService } from '../../../service/ItemCategoryService';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';

const toast = useToast();
const store = useStore();
const recordTitle = ref('Item Category');
const operation = ref('');

const records = ref([]);
const recordDialog = ref(false);
const deleteRecordDialog = ref(false);
const confirmDeleteModal = ref(false);
const detailsDialog = ref(false);
const record = ref({
    name: '',
    description: '',
});
const selectedRecord = ref([]);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const validationErrors = ref({});
const recordService = new ItemCategoryService();
const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
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
});

const openNew = () => {
    operation.value = 'Add New';
    record.value = {
        name: null,
        description: null,
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

const validateForm = () => {
    validationErrors.value = {};
    const requiredFields = {
        name: 'Name',
        description: 'Description',
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

        if (record.value.id) {
            await recordService.updateRecord(record.value.id, record.value);
            const index = findIndexById(record.value.id);
            if (index !== -1) {
                records.value[index] = record.value;
            }
            records.value = await recordService.getRecords();
            toast.add({ severity: 'success', summary: 'Successful', detail: `${recordTitle.value} Updated`, life: 5000 });
            scrollToTop();
        } else {
            const data = await recordService.addRecord(record.value);
            record.value.id = data.id;
            records.value.push(record.value);
            records.value = await recordService.getRecords();
            toast.add({ severity: 'success', summary: 'Successful', detail: `${recordTitle.value} Created`, life: 5000 });
            scrollToTop();
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
</script>

<template>
    <Dialog v-model:visible="detailsDialog" modal header="Record Details" :style="{ width: '50vw' }">
        <div class="p-fluid">
            <div class="field">
                <label class="font-bold mr-2">Name:</label>
                <span> {{ record.name }}</span>
            </div>
            <div class="field">
                <label class="font-bold mr-2">Description</label>
                <span>{{ record.description }}</span>
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
                        <InputText id="name" v-model="record.name" required autoFocus class="w-full"
                            placeholder="Enter name" />
                        <small v-if="validationErrors.name" class="p-error">{{ validationErrors.name }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="description">Description</label>
                        <InputText id="description" v-model="record.description" required autoFocus class="w-full"
                            placeholder="Enter description" />
                        <small v-if="validationErrors.description" class="p-error">{{ validationErrors.description }}</small>
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

                <DataTable ref="dt" :value="records" v-model:selection="selectedRecord" :rowHover="true"
                    filterDisplay="menu" showGridlines dataKey="id" :paginator="true" :rows="10" :filters="filters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0 uppercase"><span class="text-primary">Manage : </span> {{ recordTitle }}(s)
                            </h5>
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
                    <Column field="description" header="Description" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Description</span>
                            {{ slotProps.data.description }}
                        </template>
                    </Column>
                    <Column headerStyle="min-width:10rem;">
                        <template #body="slotProps">
                            <Button icon="pi pi-eye" class="mr-2 p-button-text" severity="info" rounded
                                @click="showDetails(slotProps.data)" />
                            <Button icon="pi pi-pencil" class="mr-2 p-button-text" severity="success" rounded
                                @click="editRecord(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-text" severity="danger" rounded
                                @click="confirmDeleteRecord(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>

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
