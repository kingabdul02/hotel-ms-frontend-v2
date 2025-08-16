<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';
import { POSOutletService } from '@/service/POSOutletService';

const toast = useToast();
const store = useStore();
const recordTitle = ref('Outlet');
const operation = ref('');

const records = ref([]);
const recordDialog = ref(false);
const confirmDeleteModal = ref(false);
const detailsDialog = ref(false);
const record = ref({
    id: null,
    name: '',
    type: '',
    status: 'active',
    operating_hours: {},
});
const selectedRecord = ref([]);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const validationErrors = ref({});
const recordService = new POSOutletService();

const initFilters = () => {
    filters.value = { global: { value: null, matchMode: FilterMatchMode.CONTAINS } };
};

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

onBeforeMount(initFilters);

onMounted(async () => {
    scrollToTop();
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try { records.value = await recordService.getRecords(); }
    catch (e) { toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load outlets' }); }
    finally { store.commit(LOADING_SPINNER_SHOW_MUTATION, false); }
});

const openNew = () => {
    operation.value = 'Add New';
    record.value = { id: null, name: '', type: '', status: 'active', operating_hours: {} };
    validationErrors.value = {}; submitted.value = false; recordDialog.value = true; scrollToTop();
};

const hideDialog = () => { recordDialog.value = false; submitted.value = false; };

const validateForm = () => {
    validationErrors.value = {};
    const required = { name: 'Name', type: 'Type', status: 'Status' };
    Object.entries(required).forEach(([k, label]) => { if (!record.value[k] || String(record.value[k]).trim()==='') validationErrors.value[k] = `${label} is required.`; });
    return Object.keys(validationErrors.value).length === 0;
};

const saveRecord = async () => {
    submitted.value = true; if (!validateForm()) return;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        if (record.value.id) {
            await recordService.updateRecord(record.value.id, record.value);
            records.value = await recordService.getRecords();
            toast.add({ severity: 'success', summary: 'Updated', detail: `${recordTitle.value} updated` });
        } else {
            await recordService.addRecord(record.value);
            records.value = await recordService.getRecords();
            toast.add({ severity: 'success', summary: 'Created', detail: `${recordTitle.value} created` });
        }
        recordDialog.value = false; record.value = {};
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message || 'Save failed' });
    } finally { store.commit(LOADING_SPINNER_SHOW_MUTATION, false); }
};

const editRecord = (r) => { operation.value = 'Edit'; record.value = { ...r }; validationErrors.value = {}; recordDialog.value = true; };
const showDetails = (r) => { record.value = { ...r }; detailsDialog.value = true; };
const confirmDeleteRecord = (r) => { record.value = { ...r }; confirmDeleteModal.value = true; };
const confirmDeleteRecordConfirmed = () => { confirmDeleteModal.value = false; deleteItem(); };

const deleteItem = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try { await recordService.deleteRecord(record.value.id); records.value = records.value.filter((val) => val.id !== record.value.id); toast.add({ severity: 'success', summary: 'Deleted', detail: 'Record deleted' }); }
    catch (e) { toast.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' }); }
    finally { store.commit(LOADING_SPINNER_SHOW_MUTATION, false); record.value = {}; }
};

const exportCSV = () => dt.value.exportCSV();
</script>

<template>
    <Dialog v-model:visible="detailsDialog" modal header="Record Details" :style="{ width: '40rem' }">
        <div class="p-fluid">
            <div class="field"><label class="font-bold mr-2">Name:</label><span> {{ record.name }}</span></div>
            <div class="field"><label class="font-bold mr-2">Type:</label><span> {{ record.type }}</span></div>
            <div class="field"><label class="font-bold mr-2">Status:</label><span> {{ record.status }}</span></div>
        </div>
        <template #footer>
            <Button label="Close" icon="pi pi-times" @click="detailsDialog = false" class="p-button-danger" />
        </template>
    </Dialog>

    <div class="grid">
        <div class="col-12">
            <div v-if="recordDialog" class="card">
                <h5 class="font-bold uppercase"><span class="text-primary">{{ operation }}:</span> {{ recordTitle }}</h5>
                <hr />
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-4">
                        <label for="name">Name</label>
                        <InputText id="name" v-model="record.name" placeholder="e.g. Restaurant" class="w-full" />
                        <small v-if="validationErrors.name" class="p-error">{{ validationErrors.name }}</small>
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="type">Type</label>
                        <Dropdown id="type" v-model="record.type" :options="['restaurant','bar','spa','minibar','shop','other']" placeholder="Select type" class="w-full" />
                        <small v-if="validationErrors.type" class="p-error">{{ validationErrors.type }}</small>
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="status">Status</label>
                        <Dropdown id="status" v-model="record.status" :options="['active','inactive']" placeholder="Select status" class="w-full" />
                        <small v-if="validationErrors.status" class="p-error">{{ validationErrors.status }}</small>
                    </div>
                </div>
                <hr />
                <Button label="Cancel" icon="pi pi-times" outlined @click="hideDialog" class="p-button-danger mr-2" />
                <Button label="Save" icon="pi pi-check" @click="saveRecord" class="p-button-primary" />
            </div>

            <div v-if="!recordDialog" class="card">
                <Toolbar class="mb-4">
                    <template #start>
                        <Button label="Add Record" icon="pi pi-plus" severity="success" @click="openNew" />
                    </template>
                    <template #end>
                        <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)" />
                    </template>
                </Toolbar>

                <DataTable ref="dt" :value="records" v-model:selection="selectedRecord" :rowHover="true" filterDisplay="menu" showGridlines dataKey="id" :paginator="true" :rows="10" :filters="filters" paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25]" currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0 uppercase"><span class="text-primary">Manage : </span> {{ recordTitle }}(s)</h5>
                            <IconField iconPosition="left" class="block mt-2 md:mt-0">
                                <InputIcon class="pi pi-search" />
                                <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Search..." />
                            </IconField>
                        </div>
                    </template>
                    <Column field="name" header="Name" sortable />
                    <Column field="type" header="Type" sortable />
                    <Column field="status" header="Status" sortable />
                    <Column headerStyle="min-width:10rem;">
                        <template #body="{ data }">
                            <Button icon="pi pi-eye" class="mr-2 p-button-text" severity="info" rounded @click="showDetails(data)" />
                            <Button icon="pi pi-pencil" class="mr-2 p-button-text" severity="success" rounded @click="editRecord(data)" />
                            <Button icon="pi pi-trash" class="p-button-text" severity="danger" rounded @click="confirmDeleteRecord(data)" />
                        </template>
                    </Column>
                </DataTable>

                <Dialog v-model:visible="confirmDeleteModal" modal header="Confirm Delete" :style="{ width: '30rem' }">
                    <p>Are you sure you want to delete <strong>{{ record.name }}</strong>?</p>
                    <div class="flex justify-content-end gap-2">
                        <Button type="button" label="No" severity="secondary" @click="confirmDeleteModal = false" />
                        <Button type="button" label="Yes" @click="confirmDeleteRecordConfirmed()" />
                    </div>
                </Dialog>
            </div>
        </div>
    </div>
</template>
