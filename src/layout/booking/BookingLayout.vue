<script setup>
import { computed, watch, ref } from 'vue';
import BookingTopbar from './BookingTopbar.vue';
import UserTopbar from './UserTopbar.vue';
import BookingFooter from './BookingFooter.vue';
import { useLayout } from '@/layout/composables/layout';
import BookingHeader from './BookingHeader.vue';

const { layoutConfig, layoutState, isSidebarActive } = useLayout();

const outsideClickListener = ref(null);

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        'layout-theme-light': layoutConfig.darkTheme.value === 'light',
        'layout-theme-dark': layoutConfig.darkTheme.value === 'dark',
        'layout-overlay': layoutConfig.menuMode.value === 'overlay',
        'layout-static': layoutConfig.menuMode.value === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive.value && layoutConfig.menuMode.value === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive.value,
        'layout-mobile-active': layoutState.staticMenuMobileActive.value,
        'p-ripple-disabled': layoutConfig.ripple.value === false
    };
});
const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                layoutState.overlayMenuActive.value = false;
                layoutState.staticMenuMobileActive.value = false;
                layoutState.menuHoverActive.value = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
};
const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
};
const isOutsideClicked = (event) => {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};
</script>

<script></script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <div class="hide-on-print">
            <booking-topbar></booking-topbar>
        </div>

        <!-- <UserTopbar></UserTopbar> -->
        <BookingHeader></BookingHeader>
        <!-- <div class="py-5"></div> -->
        <div class="md:px-8 lg:px-8 pb-8 pt-6 lg:pt-8 md:pt-8">
            <div class="md:px-8 lg:px-8">
                <router-view></router-view>
            </div>
        </div>
        <div class="hide-on-print">
            <booking-footer></booking-footer>
        </div>

        <div class="layout-mask"></div>
    </div>
    <Toast />
</template>

<style lang="scss" scoped></style>
