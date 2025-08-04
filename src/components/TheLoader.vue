<script>
export default {
    props: {
        text: {
            required: false,
            type: String,
            default: 'Loading . . .'
        }
    }
};
</script>
<template>
    <div>
        <div class="loading-container">
            <ProgressSpinner />
            <div class="loading-text xl:text-5xl lg:text-5xl md:text-5xl text-4xl text-with-shadow">{{ text }}</div>
        </div>
        <div class="overlay"></div>
    </div>
</template>

<style scoped>
.loading-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 10000;
    /* Ensure the loading spinner is on top of the overlay */
}

.loading-text {
    margin-top: 10px;
    font-weight: bold;
    color: #fff;
    /* Adjust text color as needed */
}

.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.749);
    /* Semi-transparent black overlay */
    z-index: 9999;
    /* Ensure the overlay is above other content */
}
</style>
