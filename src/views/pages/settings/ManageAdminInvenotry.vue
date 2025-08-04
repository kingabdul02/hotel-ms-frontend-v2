<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { InventoryMovementService } from '../../../service/InventoryMovementService';
import { UseItemService } from '../../../service/UseItemService';
import { ItemService } from '../../../service/ItemService';
import { InventoryService } from '../../../service/InventoryService';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';
import { formatDateTime, formatDateTime2 } from '@/utils/dateTimeFormatter';

const toast = useToast();
const store = useStore();
const recordTitle = ref('Inventory');
const operation = ref('');

const records = ref([]);
const recordDialog = ref(false);
const useItemdDialog = ref(false);
const deleteRecordDialog = ref(false);
const confirmDeleteModal = ref(false);
const detailsDialog = ref(false);
const record = ref({
    item_id: 0,
    transaction_type: 'IN',
    quantity: 0,
    transaction_date: '',
    remarks: ''
});

const categoryId = ref(0);
const useItemRecord = ref({
    item_id: categoryId,
    transaction_type: 'out',
    quantity: null,
    transaction_date: '',
    remarks: ''
});
const selectedRecord = ref([]);
const itemCategories = ref([]);
const items = ref([]);
const inventories = ref([]);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const validationErrors = ref({});
const recordService = new InventoryMovementService();
const useItemService = new UseItemService();
const inventoryService = new InventoryService();
const itemService = new ItemService();
const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

onMounted(() => {
    scrollToTop();
    getInventoryData();
    // store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
});

const getInventoryData = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    itemService.getRecords().then((data) => {
        items.value = data;
        // console.log("items.value", items.value[24].images.data[0].url);
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    });
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    inventoryService.getRecords().then((data) => {
        inventories.value = data;
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    });
};

const populateRecords = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        const response = await itemService.getRecords2();
        console.log(response);
        records.value = response.map((item) => ({
            ...item,
            itemName: item.name,
            itemPhoto: item.image_url,
            inventoryQuantity: item.inventory.quantity,
            lastUpdated: item.inventory.last_updated,
            inventoryMovements: item.inventoryMovements.data
        }));
        console.log(response);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load inventory records', life: 3000 });
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

onBeforeMount(() => {
    initFilters();
});

const openNew = () => {
    operation.value = 'Add New';
    record.value = {
        item_id: null,
        transaction_type: 'IN',
        quantity: null,
        transaction_date: null,
        remarks: null
    };
    validationErrors.value = {};
    submitted.value = false;

    scrollToTop();
    recordDialog.value = true;
};

const useItemStarts = () => {
    operation.value = 'Use';
    useItemRecord.value = {
        item_id: categoryId,
        quantity: null,
        remarks: null
    };
    validationErrors.value = {};
    submitted.value = false;
    detailsDialog.value = true;
    useItemdDialog.value = true;
};

const hideDialog = () => {
    scrollToTop();
    recordDialog.value = false;
    submitted.value = false;
};

const hideItemDialog = () => {
    scrollToTop();
    useItemdDialog.value = false;
    detailsDialog.value = true;
    submitted.value = false;
};

const validateForm = () => {
    validationErrors.value = {};
    const requiredFields = {
        item_id: 'Item',
        quantity: 'Quantity',
        transaction_date: 'Transaction date',
        remarks: 'Remarks'
    };

    for (const field in requiredFields) {
        if (!record.value[field] || (typeof record.value[field] === 'string' && !record.value[field].trim())) {
            validationErrors.value[field] = `${requiredFields[field]} is required.`;
        }
    }

    return Object.keys(validationErrors.value).length === 0;
};

const validateItemForm = () => {
    validationErrors.value = {};
    const requiredFields = {
        // item_id: 'Item',
        quantity: 'Quantity',
        remarks: 'Remarks'
    };

    for (const field in requiredFields) {
        if (!useItemRecord.value[field] || (typeof useItemRecord.value[field] === 'string' && !useItemRecord.value[field].trim())) {
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
            throw new Error('Validation failed');
        }

        if (record.value.id) {
            await recordService.updateRecord(record.value.id, record.value);
            const index = findIndexById(record.value.id);
            if (index !== -1) {
                records.value[index] = {
                    ...record.value,
                    itemName: items.value.find((item) => item.id === record.value.item_id)?.name || 'Unknown',
                    itemPhoto: items.value.find((item) => item.id === record.value.item_id)?.image_url || 'Unknown'
                };
            }
            store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
            inventoryService.getRecords().then((data) => {
                inventories.value = data;
                store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
            });
            toast.add({ severity: 'success', summary: 'Successful', detail: `${recordTitle.value} Updated`, life: 5000 });
            scrollToTop();
        } else {
            const data = await recordService.addRecord(record.value);
            record.value.id = data.id;
            records.value.push({
                ...record.value,
                itemName: items.value.find((item) => item.id === record.value.item_id)?.name || 'Unknown'
            });
            store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
            inventoryService.getRecords().then((data) => {
                inventories.value = data;
                store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
            });
            toast.add({ severity: 'success', summary: 'Successful', detail: `${recordTitle.value} Created`, life: 5000 });
            scrollToTop();
        }

        recordDialog.value = false;
        record.value = {};
    } catch (error) {
        let errorMessage = error?.response?.data?.message ?? 'Operation Failed';

        if (error.message === 'Validation failed') {
            errorMessage = 'Please fill in all required fields.';
        }

        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

const useItem = async () => {
    submitted.value = true;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);

    try {
        if (!validateItemForm()) {
            throw new Error('Validation failed');
        }

        // Add new item logic
        const data = await useItemService.useItem(useItemRecord.value);
        useItemRecord.value.id = data.id;
        // useItemRecords.value.push({
        //     ...useItemRecord.value,
        //     itemName: items.value.find(item => item.id === useItemRecord.value.item_id)?.name || 'Unknown',
        //     itemPhoto: items.value.find(item => item.id === useItemRecord.value.item_id)?.image_url || 'Unknown',
        // });

        store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
        inventoryService.getRecords().then((data) => {
            inventories.value = data;
            store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
        });
        toast.add({ severity: 'success', summary: 'Successful', detail: `Inventory Updated`, life: 5000 });
        scrollToTop();

        useItemdDialog.value = false;
        detailsDialog.value = false;
        useItemRecord.value = {};
    } catch (error) {
        // let errorMessage = error?.response?.data?.message ?? "Operation Failed";

        if (error.message === 'Validation failed') {
            errorMessage = 'Please fill in all required fields.';
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

const categoryName = ref('');

// const showDetails = (detailsRecord) => {
//     record.value = { ...detailsRecord };
//     console.log('record.value', record.value);
//     categoryName.value = record?.category?.name;
//     console.log('categoryName.value', categoryName.value);
//     detailsDialog.value = true;
// };

const showDetails = (detailsRecord) => {
    // Destructure category from detailsRecord to safely access its properties
    const { category } = detailsRecord;

    // Assign the detailsRecord to record
    record.value = { ...detailsRecord };
    console.log('record.value', record.value);

    // Assign the category name, handling cases where category might be undefined
    categoryName.value = category ? category.name : '';
    categoryId.value = category ? category.id : '';
    console.log('categoryName.value', categoryName.value);
    console.log('categoryId.value', categoryId.value);

    // Show the details dialog
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
    <Dialog v-model:visible="detailsDialog" modal header="Record Details" :style="{ width: '70vw' }">
        <div v-if="useItemdDialog" class="card">
            <h5 class="font-bold uppercase">
                <span class="text-primary">{{ operation }}:</span> {{ categoryName }}
            </h5>
            <hr />
            <div class="p-fluid formgrid grid">
                <!-- <div class="field col-12 md:col-6">
                    <label for="item_id">Item</label>
                    <Dropdown id="item_id" v-model="useItemRecord.item_id" :options="items" optionLabel="name" optionValue="id"
                        placeholder="Select a Item" class="w-full" />
                    <small v-if="validationErrors.item_id" class="p-error">{{ validationErrors.item_id }}
                    </small>
                </div> -->
                <div class="field col-12 md:col-6">
                    <label for="quantity">Quantity</label>
                    <InputText id="quantity" v-model="useItemRecord.quantity" required autoFocus class="w-full" placeholder="Enter Quantity" />
                    <small v-if="validationErrors.quantity" class="p-error">{{ validationErrors.quantity }}</small>
                </div>
                <div class="field col-12 md:col-6">
                    <label for="transaction_date">Transaction date</label>
                    <Calendar v-model="useItemRecord.transaction_date" placeholder="Transaction date" showIcon iconDisplay="input" inputId="transaction_date" :minDate="today" />
                    <small v-if="validationErrors.transaction_date" class="p-error">{{ validationErrors.transaction_date }}</small>
                </div>
                <div class="field col-12 md:col-6">
                    <label for="remarks">Remarks</label>
                    <InputText id="remarks" v-model="useItemRecord.remarks" required autoFocus class="w-full" placeholder="Enter remarks" />
                    <small v-if="validationErrors.remarks" class="p-error">{{ validationErrors.remarks }}</small>
                </div>
            </div>
            <hr />
            <Button label="Cancel" icon="pi pi-times" outlined @click="hideItemDialog" class="p-button-danger mr-2" />
            <Button label="Save" icon="pi pi-check" @click="useItem" class="p-button-primary" />
        </div>
        <div v-if="!useItemdDialog">
            <div class="p-fluid">
                <div class="field">
                    <label class="font-bold mr-2">Item</label>
                    <span>{{ record?.name }}</span>
                </div>
                <div class="field">
                    <img :src="record?.image_url || '/img/noimage.gif'" :alt="record?.image_url" class="shadow-2 border-round" width="50" />
                </div>
                <div class="field">
                    <label class="font-bold mr-2">Item Category</label>
                    <span>{{ record?.category?.name }}</span>
                </div>
                <div class="field">
                    <label class="font-bold mr-2">Item Description</label>
                    <span>{{ record?.description }}</span>
                </div>
                <div class="field">
                    <label class="font-bold mr-2">Available Quantity</label>
                    <span>{{ record?.inventory?.quantity }}</span>
                </div>
                <div class="field">
                    <label class="font-bold mr-2">Last Updated</label>
                    <span>{{ formatDateTime(record?.inventory?.last_updated) }}</span>
                </div>
            </div>
            <div class="card">
                <div class="flex justify-content-between align-items-center mb-2">
                    <div class="font-bold text-3xl text-900"><span class="text-primary">Inventory Movements</span></div>
                    <div>
                        <Button icon="pi pi-sort-amount-down" label="Use Inventory Item" class="p-button-primary" @click="useItemStarts()" severity="success" />
                    </div>
                </div>
                <DataTable ref="dt" :value="record?.inventoryMovements?.data" showGridlines :rowHover="true" dataKey="id">
                    <Column field="transaction_date" header="Transaction date" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Transaction date</span>
                            {{ formatDateTime2(slotProps.data.transaction_date) }}
                        </template>
                    </Column>
                    <Column field="transaction_type" header="Transaction Type" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Transaction type</span>
                            <Tag v-if="slotProps.data.transaction_type === 'IN'" severity="success" value="IN" class="px-3"></Tag>
                            <Tag v-if="slotProps.data.transaction_type === 'OUT'" severity="danger" value="OUT" class="px-3"></Tag>
                        </template>
                    </Column>
                    <Column field="quantity" header="Quantity" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Quantity</span>
                            {{ slotProps.data.quantity }}
                        </template>
                    </Column>
                    <Column field="transaction_date" header="Remarks" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Remarks</span>
                            {{ slotProps.data.remarks }}
                        </template>
                    </Column>
                    <!-- <Column field="transaction_date" header="Remarks" :sortable="true">
                    <template #body="slotProps">
                        <span class="p-column-title">Action(s)</span>
                        <Button icon="pi pi-sort-amount-down" label="Use" class="mr-2 p-button-text"
                            @click="useItemStarts()" severity="success" rounded />
                    </template>
                </Column> -->
                </DataTable>
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
                <hr />
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-6">
                        <label for="item_id">Item</label>
                        <Dropdown id="item_id" v-model="record.item_id" :options="items" optionLabel="name" optionValue="id" placeholder="Select a Item" class="w-full" />
                        <small v-if="validationErrors.item_id" class="p-error">{{ validationErrors.item_id }} </small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="quantity">Quantity</label>
                        <InputText id="quantity" v-model="record.quantity" required autoFocus class="w-full" placeholder="Enter Quantity" />
                        <small v-if="validationErrors.quantity" class="p-error">{{ validationErrors.quantity }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="transaction_date">Transaction date</label>
                        <Calendar v-model="record.transaction_date" placeholder="Transaction date" showIcon iconDisplay="input" inputId="transaction_date" :minDate="today" />
                        <small v-if="validationErrors.transaction_date" class="p-error">{{ validationErrors.transaction_date }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="remarks">Remarks</label>
                        <InputText id="remarks" v-model="record.remarks" required autoFocus class="w-full" placeholder="Enter remarks" />
                        <small v-if="validationErrors.remarks" class="p-error">{{ validationErrors.remarks }}</small>
                    </div>
                </div>
                <hr />
                <Button label="Cancel" icon="pi pi-times" outlined @click="hideDialog" class="p-button-danger mr-2" />
                <Button label="Save" icon="pi pi-check" @click="saveRecord" class="p-button-primary" />
            </div>
            <div v-if="!recordDialog" class="card">
                <div class="surface-section p-5 border-1 surface-border border-round mb-4">
                    <ul class="list-none p-0 m-0 flex align-items-center font-medium mb-3">
                        <li>
                            <a class="text-primary no-underline line-height-3 cursor-pointer">{{ recordTitle }}</a>
                        </li>
                        <li class="px-2">
                            <i class="pi pi-angle-right text-500 line-height-3"></i>
                        </li>
                        <li>
                            <span class="text-900 line-height-3">Manage {{ recordTitle }}</span>
                        </li>
                    </ul>
                    <div class="flex align-items-start flex-column lg:justify-content-between lg:flex-row">
                        <div>
                            <div class="font-bold text-3xl text-900">Inventory Movements</div>
                            <div class="flex align-items-center text-700 flex-wrap">
                                <div class="mr-5 flex align-items-center mt-3">
                                    <i class="pi pi-box text-primary font-bold mr-2"></i>
                                    <span> Inventory records <Badge :value="inventories?.length" severity="success"> </Badge> </span>
                                </div>
                                <div class="mr-5 flex align-items-center mt-3">
                                    <i class="pi pi-box text-primary font-bold mr-2"></i>
                                    <span> Items <Badge :value="items?.length" severity="success"></Badge></span>
                                </div>
                                <div class="flex align-items-center mt-3">
                                    <i class="pi pi-box text-primary font-bold mr-2"></i>
                                    <span> Item Categories <Badge :value="itemCategories?.length" severity="success"> </Badge> </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="Initiate Re-stock" icon="pi pi-plus" class="mr-2" severity="success" @click="openNew" />
                        </div>
                    </template>
                    <template v-slot:end>
                        <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)" />
                    </template>
                </Toolbar>

                <DataTable
                    ref="dt"
                    :value="inventories"
                    v-model:selection="selectedRecord"
                    :rowHover="true"
                    filterDisplay="menu"
                    showGridlines
                    dataKey="id"
                    :paginator="true"
                    :rows="10"
                    :filters="filters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                >
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0 uppercase"><span class="text-primary">Manage : </span> {{ recordTitle }}(s)</h5>
                            <IconField iconPosition="left" class="block mt-2 md:mt-0">
                                <InputIcon class="pi pi-search" />
                                <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Search..." />
                            </IconField>
                        </div>
                    </template>
                    <Column field="item_id" header="Image">
                        <template #body="slotProps">
                            <span class="p-column-title"></span>
                            <img :src="slotProps.data.image_url || '/img/noimage.gif'" :alt="slotProps.data.image_url" class="shadow-2 border-round" width="50" />
                        </template>
                    </Column>
                    <Column headerStyle="min-width:15rem;" field="item_id" header="Item" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Item</span>
                            {{ slotProps.data.name }}
                        </template>
                    </Column>
                    <Column headerStyle="min-width:15rem;" field="item_category" header="Item Category" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Item Category</span>
                            {{ slotProps.data.category.name }}
                        </template>
                    </Column>
                    <Column field="quantity" header="Available Quantity" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Available Quantity</span>
                            {{ slotProps.data.inventory.quantity }}
                        </template>
                    </Column>
                    <Column field="transaction_date" header="Last Updated" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Last Updated</span>
                            {{ formatDateTime(slotProps.data.inventory.last_updated) }}
                        </template>
                    </Column>
                    <Column headerStyle="min-width:13rem;" header="Action(s)">
                        <template #body="slotProps">
                            <Button icon="pi pi-eye" class="mr-2 p-button-text" severity="info" rounded @click="showDetails(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>
