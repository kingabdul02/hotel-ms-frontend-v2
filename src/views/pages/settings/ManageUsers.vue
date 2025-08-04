<script setup>
import { ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { UserService } from '@/service/UserService';
import { UserRegService } from '../../../service/UserRegService';
import { UserActivationService } from '../../../service/UserActivationService';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';
import { formatDateTime } from '@/utils/dateTimeFormatter';
import { FilterMatchMode } from 'primevue/api';

const toast = useToast();
const store = useStore();
const recordTitle = ref('User');
const operation = ref('');

const records = ref([]);
const deleteRecordDialog = ref(false);
const confirmDeactivationModal = ref(false);
const confirmActivationModal = ref(false);
const record = ref({
    name: '',
    address: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    role: ''
});
const activeUsers = ref(0);
const inactiveUsers = ref(0);
const userID = ref(0);
const username = ref('');
const filters = ref({});
const submitted = ref(false);
const validationErrors = ref({});
const dt = ref(null);
const recordService = new UserService();
const recordUserActivationService = new UserActivationService();
const regService = new UserRegService();
const recordDialog = ref(false);

const layout = ref('list');
const sortKey = ref(null);
const sortOrder = ref(null);
const sortField = ref(null);

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

onBeforeMount(() => {
    initFilters();
});

const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

const exportCSV = () => {
    dt.value.exportCSV();
};

onMounted(() => {
    scrollToTop();
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    recordService.getRecords().then((data) => {
        records.value = data;
        activeUsers.value = data.filter((user) => user.is_active).length;
        inactiveUsers.value = data.filter((user) => !user.is_active).length;
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    });
});

const openNew = () => {
    operation.value = 'Add New';
    record.value = {
        name: null,
        address: null,
        phone: null,
        email: null,
        password: null,
        password_confirmation: null,
        role: null
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
        name: 'User name',
        address: 'Address',
        email: 'Email',
        phone: 'Phone',
        password: 'Password',
        password_confirmation: 'Password confirmation',
        role: 'Role'
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
            throw new Error('Validation failed');
        }

        if (record.value.id) {
            await regService.updateRecord(record.value.id, record.value);
            const index = findIndexById(record.value.id);
            if (index !== -1) {
                records.value[index] = record.value;
            }
            records.value = await recordService.getRecords();
            toast.add({ severity: 'success', summary: 'Successful', detail: `${recordTitle.value} Updated`, life: 5000 });
            scrollToTop();
        } else {
            const data = await regService.addRecord(record.value);
            record.value.id = data.id;
            records.value.push(record.value);
            records.value = await recordService.getRecords();
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

const confirmUserDeactivation = (userId, userName) => {
    record.value = userId;
    userID.value = userId;
    username.value = userName;
    confirmDeactivationModal.value = true;
    console.log('username.value', username.value);
};

const confirmUserDeactivationConfirmed = () => {
    confirmDeactivationModal.value = false;
    deactivateUser();
};

const deactivateUser = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        console.log('userID.value.id', userID.value);
        await recordUserActivationService.deactivateUser(userID.value);
        records.value = records.value.filter((val) => val.id !== userID.value);
        toast.add({ severity: 'success', summary: 'Successful', detail: 'User Deactivated', life: 3000 });
        recordService.getRecords().then((data) => {
            records.value = data;
            activeUsers.value = data.filter((user) => user.is_active).length;
            inactiveUsers.value = data.filter((user) => !user.is_active).length;
            store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
        });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'User Deactivation Failed', life: 3000 });
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
        deleteRecordDialog.value = false;
        record.value = {};
    }
};

const confirmUserActivation = (userId, userName) => {
    record.value = userId;
    userID.value = userId;
    username.value = userName;
    confirmActivationModal.value = true;
    console.log('username.value', username.value);
};

const confirmUserActivationConfirmed = () => {
    confirmActivationModal.value = false;
    activateUser();
};

const activateUser = async () => {
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
        console.log('userID.value.id', userID.value);
        await recordUserActivationService.activateUser(userID.value);
        records.value = records.value.filter((val) => val.id !== userID.value);
        toast.add({ severity: 'success', summary: 'Successful', detail: 'User Activated', life: 3000 });
        recordService.getRecords().then((data) => {
            records.value = data;
            activeUsers.value = data.filter((user) => user.is_active).length;
            inactiveUsers.value = data.filter((user) => !user.is_active).length;
            store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
        });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'User Deactivation Failed', life: 3000 });
    } finally {
        store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
        deleteRecordDialog.value = false;
        record.value = {};
    }
};

const findIndexById = (id) => {
    return records.value.findIndex((record) => record.id === id);
};

const onSortChange = (event) => {
    const value = event.value.value;
    const sortValue = event.value;

    if (value.indexOf('!') === 0) {
        sortOrder.value = -1;
        sortField.value = value.substring(1, value.length);
        sortKey.value = sortValue;
    } else {
        sortOrder.value = 1;
        sortField.value = value;
        sortKey.value = sortValue;
    }
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div v-if="recordDialog" class="card">
                <h5 class="font-bold uppercase">
                    <span class="text-primary">{{ operation }}:</span> {{ recordTitle }}
                </h5>
                <hr />
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-6">
                        <label for="name">Username</label>
                        <InputText id="name" v-model="record.name" required autoFocus class="w-full" placeholder="Enter Username" />
                        <small v-if="validationErrors.name" class="p-error">{{ validationErrors.name }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="address">Address</label>
                        <InputText id="address" v-model="record.address" required autoFocus class="w-full" placeholder="Enter address" />
                        <small v-if="validationErrors.address" class="p-error">{{ validationErrors.address }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="phone">Phone</label>
                        <InputText id="phone" v-model="record.phone" required autoFocus class="w-full" placeholder="Enter phone" />
                        <small v-if="validationErrors.phone" class="p-error">{{ validationErrors.phone }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="email">Email</label>
                        <InputText id="email" v-model="record.email" required autoFocus class="w-full" placeholder="Enter email" />
                        <small v-if="validationErrors.email" class="p-error">{{ validationErrors.email }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="password">Password</label>
                        <InputText id="password" v-model="record.password" required autoFocus class="w-full" placeholder="Enter password" />
                        <small v-if="validationErrors.password" class="p-error">{{ validationErrors.password }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="password_confirmation">Confirmation</label>
                        <InputText id="password_confirmation" v-model="record.password_confirmation" required autoFocus class="w-full" placeholder="Enter confirmation" />
                        <small v-if="validationErrors.password_confirmation" class="p-error">{{ validationErrors.password_confirmation }}</small>
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="role">Role</label>
                        <Dropdown id="role" v-model="record.role" :options="[{ name: 'Manager' }, { name: 'FrontDesk' }, { name: 'InventoryStaff' }]" optionLabel="name" optionValue="name" placeholder="Select a Role" class="w-full" />
                        <small v-if="validationErrors.role" class="p-error">{{ validationErrors.role }}</small>
                    </div>
                </div>
                <hr />
                <Button label="Cancel" icon="pi pi-times" outlined @click="hideDialog" class="p-button-danger mr-2" />
                <Button label="Save" icon="pi pi-check" @click="saveRecord" class="p-button-primary" />
            </div>
            <div v-if="!recordDialog" class="card shadow-1">
                <div class="surface-section p-5 border-1 surface-border border-round mb-4">
                    <ul class="list-none p-0 m-0 flex align-items-center font-medium mb-3">
                        <li>
                            <a class="text-primary no-underline line-height-3 cursor-pointer">User Management</a>
                        </li>
                        <li class="px-2">
                            <i class="pi pi-angle-right text-500 line-height-3"></i>
                        </li>
                        <li>
                            <span class="text-900 line-height-3">List of Users</span>
                        </li>
                    </ul>
                    <div class="flex align-items-start flex-column lg:justify-content-between lg:flex-row">
                        <div>
                            <div class="font-bold text-3xl text-900">Users</div>
                            <div class="flex align-items-center text-700 flex-wrap">
                                <div class="mr-5 flex align-items-center mt-3">
                                    <i class="pi pi-users text-primary font-bold mr-2"></i>
                                    <span>Total Users <Badge :value="records?.length" severity="contrast"></Badge></span>
                                </div>
                                <div class="mr-5 flex align-items-center mt-3">
                                    <i class="pi pi-users text-primary font-bold mr-2"></i>
                                    <span>Active Users <Badge :value="activeUsers" severity="success"></Badge></span>
                                </div>
                                <div class="flex align-items-center mt-3">
                                    <i class="pi pi-users text-primary font-bold mr-2"></i>
                                    <span>Inactive Users <Badge :value="inactiveUsers" severity="danger"></Badge></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="Add Record" icon="pi pi-user-plus" class="mr-2" severity="success" @click="openNew" />
                        </div>
                    </template>
                    <template v-slot:end>
                        <!-- <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)" /> -->
                    </template>
                </Toolbar>
                <DataView :value="records" :layout="layout" :paginator="true" :rows="9" :sortOrder="sortOrder" :sortField="sortField">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0 uppercase"><span class="text-primary">Manage : </span>{{ recordTitle }}(s)</h5>
                            <IconField iconPosition="left" class="block mt-2 md:mt-0">
                                <InputIcon class="pi pi-search" />
                                <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Search..." />
                            </IconField>
                        </div>
                    </template>

                    <template #list="slotProps">
                        <div class="grid grid-nogutter">
                            <div v-for="(item, index) in slotProps.items" :key="index" class="col-12">
                                <div v-if="item?.role !== 'Guest' && item?.email !== 'admin@hotelms.com'" class="flex flex-column sm:flex-row sm:align-items-center p-4 gap-3" :class="{ 'border-top-1 surface-border': index !== 0 }">
                                    <div class="md:w-10rem relative">
                                        <img class="block xl:block mx-auto border-round img-fit shadow-2 border-round" src="/img/team/user-icon-2.jpg" width="80" :alt="item?.name" />
                                        <Tag v-if="item.is_active === true" value="Active" severity="success" class="absolute" style="left: 4px; top: 4px"></Tag>
                                        <Tag v-if="item.is_active === false" value="Inactive" severity="secondary" class="absolute" style="left: 4px; top: 4px"></Tag>
                                    </div>
                                    <div class="flex flex-column md:flex-row justify-content-between md:align-items-center flex-1 gap-4">
                                        <div class="flex flex-row md:flex-column justify-content-between align-items-start gap-2">
                                            <div>
                                                <div class="text-lg font-medium text-900 mb-2">{{ item?.name }}</div>
                                                <span class="font-medium text-secondary text-sm">{{ item?.email }}</span>
                                            </div>
                                            <div class="surface-100 p-1" style="border-radius: 30px">
                                                <div class="surface-0 flex align-items-center gap-2 justify-content-center py-1 px-2" style="border-radius: 30px; box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)">
                                                    <span class="text-900 font-medium text-sm px-2">{{ item?.role }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex flex-column md:align-items-end gap-5">
                                            <small class="text-500"><strong>Created at: </strong>{{ formatDateTime(item?.created_at) }}</small>
                                            <div class="flex flex-row-reverse md:flex-row gap-2">
                                                <Button v-if="item.is_active === false" icon="pi pi-user-plus" outlined label="Activate" class="flex-auto md:flex-initial white-space-nowrap" @click="confirmUserActivation(item?.id, item?.name)" />
                                                <Button
                                                    v-if="item.is_active === true"
                                                    icon="pi pi-user-minus"
                                                    label="Deactivate"
                                                    class="flex-auto md:flex-initial white-space-nowrap p-button-danger"
                                                    @click="confirmUserDeactivation(item?.id, item?.name)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </DataView>
                <Dialog v-model:visible="confirmDeactivationModal" modal header="Confirm User Deactivation" :style="{ width: '30rem' }">
                    <p>
                        Are you sure you want to Deactivate <strong>{{ username }}</strong
                        >?
                    </p>
                    <div class="flex justify-content-end gap-2">
                        <Button type="button" label="No" severity="secondary" @click="confirmDeactivationModal = false"></Button>
                        <Button type="button" label="Yes" @click="confirmUserDeactivationConfirmed()"></Button>
                    </div>
                </Dialog>
                <Dialog v-model:visible="confirmActivationModal" modal header="Confirm User Activation" :style="{ width: '30rem' }">
                    <p>
                        Are you sure you want to Deactivate <strong>{{ username }}</strong
                        >?
                    </p>
                    <div class="flex justify-content-end gap-2">
                        <Button type="button" label="No" severity="secondary" @click="confirmActivationModal = false"></Button>
                        <Button type="button" label="Yes" @click="confirmUserActivationConfirmed()"></Button>
                    </div>
                </Dialog>
            </div>
        </div>
    </div>
</template>
