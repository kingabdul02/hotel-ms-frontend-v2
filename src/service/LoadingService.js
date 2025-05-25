// LoadingService.js
import { ref } from "vue";

const loading = ref(false);
const loadingText = ref("");

export const useLoading = () => {
    const block = (text = "Loading...") => {
        loadingText.value = text;
        loading.value = true;
    };

    const unblock = () => {
        loading.value = false;
    };

    return { loading, loadingText, block, unblock };
};
