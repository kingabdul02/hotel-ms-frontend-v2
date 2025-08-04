<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { LOGOUT_ACTION, IS_USER_AUTHENTICATE_GETTER, GET_USER_DATA_GETTER } from '../../store/storeconstants';

const { layoutConfig, onMenuToggle } = useLayout();
const router = useRouter();
const store = useStore(); // Use the Vuex store instance

const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);

const userData = computed(() => store.getters['auth/' + GET_USER_DATA_GETTER]);
const userEmail = computed(() => userData.value.email);

const menu = ref();
const items = ref([
    {
        label: 'Options',
        items: [
            {
                label: 'Profile',
                icon: 'pi pi-user',
                command: () => {
                    goToProfile();
                }
            },
            {
                label: 'Logout',
                icon: 'pi pi-sign-out',
                command: () => {
                    performLogout();
                }
            }
        ]
    }
]);

const toggle = (event) => {
    menu.value.toggle(event);
};

onMounted(() => {
    bindOutsideClickListener();
});

onBeforeUnmount(() => {
    unbindOutsideClickListener();
});

const logoUrl = computed(() => {
    return `/img/logo-nbte-2.png`;
});

const onTopBarMenuButton = () => {
    topbarMenuActive.value = !topbarMenuActive.value;
};

const topbarMenuClasses = computed(() => {
    return {
        'layout-topbar-menu-mobile-active': topbarMenuActive.value
    };
});

const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                topbarMenuActive.value = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
};

const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener.value);
        outsideClickListener.value = null;
    }
};

const isOutsideClicked = (event) => {
    if (!topbarMenuActive.value) return;

    const sidebarEl = document.querySelector('.layout-topbar-menu');
    const topbarEl = document.querySelector('.layout-topbar-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};

const isAuthenticated = computed(() => store.getters['auth/' + IS_USER_AUTHENTICATE_GETTER]);

const performLogout = async () => {
    await store.dispatch('auth/' + LOGOUT_ACTION);
    router.push('/auth/login');
};

const goToProfile = () => {
    // Navigate to the profile page
    router.push('/profile'); // Adjust the path to your profile page
};
</script>

<template>
    <div class="layout-topbar">
        <router-link to="/" class="layout-topbar-logo">
            <img :src="logoUrl" alt="logo" />
            <span class="font-bold">NBTE Consult Limited</span>
        </router-link>

        <button class="p-link layout-topbar-menu-button layout-topbar-button" @click="onTopBarMenuButton()">
            <i class="pi pi-ellipsis-v"></i>
        </button>

        <div class="layout-topbar-menu" :class="topbarMenuClasses">
            <div v-if="isAuthenticated">
                <Chip @click="toggle" icon="pi pi-user" class="montserrat-font xl:mt-0 lg:mt-0 md:mt-0 mt-4 surface-border border-3 c-shadow cursor-pointer" :label="userEmail" />
                <Button @click="toggle" icon="pi pi-chevron-down" severity="secondary" class="pt-3 ml-1" text rounded aria-label="Favorite" />
                <Menu class="montserrat-font mt-2" ref="menu" id="overlay_menu" :model="items" :popup="true" />
            </div>
        </div>
    </div>
</template>
