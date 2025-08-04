<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed } from 'vue';

const { layoutConfig } = useLayout();

const logoUrl = computed(() => {
    return `/img/logo-nbte-2.png`;
});
</script>

<template>
    <div class="layout-footer pt-5">
        <!-- <img :src="logoUrl" alt="Logo" height="30" class="mr-2" />
        by
        <span class="font-medium ml-2">PrimeVue</span> -->
        <div class="footer-content text-center">
            <p><span class="text-400">NBTE Consult Limited</span> | <span class="text-400">© 2024 All rights reserved.</span></p>
        </div>
    </div>
</template>
<style lang="scss" scoped></style>
