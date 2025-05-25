<script setup>
import { computed, watch, ref } from 'vue';
import BookingTopbar from './BookingTopbar.vue';
import BookingFooter from './BookingFooter.vue';
import { useLayout } from '@/layout/composables/layout';
import BookingHeader from './BookingHeader.vue';
import UserTopbar from './UserTopbar.vue';

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

<template>
    <div id="app" class="layout-wrapper" :class="containerClass">
        <UserTopbar></UserTopbar>
        <BookingHeader></BookingHeader>
        <div class="py-5"></div>
        <div class="md:px-8 lg:px-8">
            <div class="md:px-8 lg:px-8">
                <router-view></router-view>
            </div>
        </div>
        <booking-footer></booking-footer>
        <div class="layout-mask"></div>
    </div>
    <Toast />
</template>

<style lang="scss" scoped>
/* CSS animation for smooth scrolling */
@keyframes scrollAnimation {
    0% {
        opacity: 0;
        transform: translateY(-100%);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

#app {
    animation: scrollAnimation 0.5s ease;
}
</style>

<script>
export default {
    name: 'App',
    mounted() {
        this.scrollToTopWithAnimation();
    },
    methods: {
        scrollToTopWithAnimation() {
            // Scroll to the top of the page with animation
            const scrollDuration = 500; // Duration of the scroll animation in milliseconds
            const scrollStep = -window.scrollY / (scrollDuration / 15); // 15 milliseconds per step

            const scrollInterval = setInterval(() => {
                if (window.scrollY !== 0) {
                    window.scrollBy(0, scrollStep);
                } else {
                    clearInterval(scrollInterval);
                }
            }, 15);
        }
    }
};
</script>
