<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { RoomTypeService } from '@/service/RoomTypeService';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';
import { uploadImage } from '@/service/FileUploadService';

const toast = useToast();
const store = useStore();

const items = ref([]);
const itemDialog = ref(false);
const deleteitemDialog = ref(false);
const deleteItemsDialog = ref(false);
const confirmDeleteModal = ref(false);
const item = ref({});
const selectedRoomTypes = ref([]);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const validationErrors = ref({});
const itemService = new RoomTypeService();
const selectedFile = ref('');

onBeforeMount(() => {
    initFilters();
});

onMounted(() => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    itemService.getRoomTypes().then((data) => {
        items.value = data;
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    });
});

const openNew = () => {
    item.value = {};
    validationErrors.value = {};
    submitted.value = false;
    selectedFile.value = '';
    itemDialog.value = true;
};

const hideDialog = () => {
    itemDialog.value = false;
    submitted.value = false;
};

const onSelectedFiles = (event) => {
    selectedFile.value = event.files;
    console.log('file selected', selectedFile.value[0]);
};

const validateForm = () => {
    validationErrors.value = {};

    if (!item.value.description || !item.value.description.trim()) {
        validationErrors.value.description = 'Description is required.';
    }

    if (!item.value.name || !item.value.name.trim()) {
        validationErrors.value.name = 'Name is required.';
    }

    if (!item.value.chart_color_code || !item.value.chart_color_code.trim()) {
        validationErrors.value.chart_color_code = 'Chart color code is required.';
    }

    return Object.keys(validationErrors.value).length === 0;
};

const saveRoomType = async () => {
    submitted.value = true;

    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);

    try {
        if (!validateForm()) {
            throw new Error('Validation failed');
        }

        if (selectedFile.value && selectedFile.value.length > 0) {
            item.value.image_url = await uploadImage(selectedFile.value[0]);
        }

        if (item.value.chart_color_code && !item.value.chart_color_code.startsWith('#')) {
            item.value.chart_color_code = `#${item.value.chart_color_code}`;
        }

        if (item.value.id) {
            await itemService.updateRoomType(item.value.id, item.value);
            const index = findIndexById(item.value.id);
            if (index !== -1) {
                items.value[index] = item.value;
            }
            items.value = await itemService.getRoomTypes();
            toast.add({ severity: 'success', summary: 'Successful', detail: 'RoomType Updated', life: 3000 });
        } else {
            const data = await itemService.addRoomType(item.value);
            item.value.id = data.id;
            items.value.push(item.value);
            items.value = await itemService.getRoomTypes();
            toast.add({ severity: 'success', summary: 'Successful', detail: 'RoomType Created', life: 3000 });
        }

        itemDialog.value = false;
        item.value = {};
        selectedFile.value = [];
    } catch (error) {
        console.error(error);
        let errorMessage = 'Operation Failed';

        if (error.message === 'Validation failed') {
            errorMessage = 'Please fill in all required fields.';
        } else if (error.message === 'File upload failed') {
            errorMessage = 'File upload failed. Please try again.';
        }

        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
};

const editRoomType = (editRoomType) => {
    item.value = { ...editRoomType };
    validationErrors.value = {};
    selectedFile.value = item.value.image_url ? [item.value.image_url] : [];
    itemDialog.value = true;
};

const confirmDeleteRoomType = (editRoomType) => {
    item.value = { ...editRoomType };
    confirmDeleteModal.value = true;
};

const confirmDeleteRoomTypeConfirmed = () => {
    confirmDeleteModal.value = false;
    deleteRoomType();
};

const deleteRoomType = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        await itemService.deleteRoomType(item.value.id);
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

const confirmDeleteSelected = () => {
    deleteItemsDialog.value = true;
};

const deleteSelectedRoomTypes = () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    const ids = selectedRoomTypes.value.map((item) => item.id);
    Promise.all(ids.map((id) => itemService.deleteRoomType(id)))
        .then(() => {
            items.value = items.value.filter((val) => !selectedRoomTypes.value.includes(val));
            deleteItemsDialog.value = false;
            selectedRoomTypes.value = [];
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
    <div class="grid">
        <div class="col-12">
            <div class="card">
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

                <DataTable
                    ref="dt"
                    :value="items"
                    v-model:selection="selectedItem"
                    :rowHover="true"
                    filterDisplay="menu"
                    showGridlines
                    dataKey="id"
                    :paginator="true"
                    :rows="10"
                    :filters="filters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items"
                >
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Manage RoomTypes</h5>
                            <IconField iconPosition="left" class="block mt-2 md:mt-0">
                                <InputIcon class="pi pi-search" />
                                <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Search..." />
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
                    <Column field="chart_color_code" header="Chart Color" :sortable="true">
                        <template #body="slotProps">
                            <span class="p-column-title">Chart Color</span>
                            {{ slotProps.data.chart_color_code }}
                        </template>
                    </Column>
                    <Column header="Image">
                        <template #body="slotProps">
                            <span class="p-column-title">Image</span>
                            <img :src="slotProps.data.image_url || '/img/noimage.gif'" :alt="slotProps.data.image_url" class="shadow-2 border-round" width="50" />
                        </template>
                    </Column>
                    <Column headerStyle="min-width:10rem;">
                        <template #body="slotProps">
                            <Button icon="pi pi-pencil" class="mr-2 p-button-text" severity="success" rounded @click="editRoomType(slotProps.data)" />
                            <Button icon="pi pi-trash" class="mt-2 p-button-text" severity="warning" rounded @click="confirmDeleteRoomType(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>

                <Dialog v-model:visible="itemDialog" modal style="width: 600px" header="RoomType Details" :closable="false">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText id="name" v-model="item.name" required autoFocus class="w-full" />
                        <small v-if="validationErrors.name" class="p-error">{{ validationErrors.name }}</small>
                    </div>
                    <div class="field">
                        <label for="description">Description</label>
                        <Textarea id="description" v-model="item.description" rows="3" class="w-full" />
                        <small v-if="validationErrors.description" class="p-error">{{ validationErrors.description }}</small>
                    </div>
                    <div class="field">
                        <label class="mr-2" for="chart_color_code">Chart Color</label>
                        <ColorPicker id="chart_color_code" v-model="item.chart_color_code" required inputId="cp-hex" format="hex" class="mb-3 mr-2" />
                        <small v-if="validationErrors.chart_color_code" class="p-error">{{ validationErrors.chart_color_code }}</small>
                    </div>

                    <div class="flex align-items-center gap-3 mb-3">
                        <label for="product-image" class="font-semibold w-10rem">Image</label>
                        <FileUpload name="image_url" url="/upload" @upload="onTemplatedUpload" :multiple="false" accept="image/*" :maxFileSize="1000000" @select="onSelectedFiles">
                            <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
                                <div class="flex flex-wrap justify-content-between align-items-center">
                                    <Button label="Choose" icon="pi pi-plus" class="mr-2" @click="chooseCallback" />
                                    <Button label="Upload" icon="pi pi-upload" class="mr-2" @click="uploadCallback" />
                                    <Button label="Clear" icon="pi pi-times" class="mr-2" @click="clearCallback" v-if="files.length" />
                                </div>
                            </template>
                        </FileUpload>
                        <div v-if="item.image_url">
                            <img :src="item.image_url" alt="Existing Image" class="mt-2" width="100" />
                        </div>
                    </div>

                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" @click="hideDialog" class="p-button-text" />
                        <Button label="Save" icon="pi pi-check" @click="saveRoomType" class="p-button-text" />
                    </template>
                </Dialog>

                <ConfirmDialog v-model:visible="deleteItemsDialog" header="Confirm" icon="pi pi-exclamation-triangle" acceptLabel="Yes" rejectLabel="No" acceptClass="p-button-danger" @accept="deleteSelectedRoomTypes">
                    <template #message>
                        <p>Are you sure you want to delete the selected room types?</p>
                    </template>
                </ConfirmDialog>

                <Dialog v-model:visible="confirmDeleteModal" modal header="Confirm Delete" :style="{ width: '30rem' }">
                    <p>
                        Are you sure you want to delete <strong>{{ item.name }}</strong
                        >?
                    </p>
                    <div class="flex justify-content-end gap-2">
                        <Button type="button" label="No" severity="secondary" @click="confirmDeleteModal = false"></Button>
                        <Button type="button" label="Yes" @click="confirmDeleteRoomTypeConfirmed()"></Button>
                    </div>
                </Dialog>
            </div>
        </div>
    </div>
</template>
