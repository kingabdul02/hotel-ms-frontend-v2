// src/service/toastService.js
import { useToast } from "primevue/usetoast";
export const useToastService = () => {
    const toast = useToast();

    const showToast = (severity, summary, detail, life = 3000) => {
        toast.add({ severity, summary, detail, life });
    };

    return {
        showSuccess(summary, detail, life = 3000) {
            showToast('success', summary, detail, life);
        },
        showInfo(summary, detail, life = 3000) {
            showToast('info', summary, detail, life);
        },
        showWarn(summary, detail, life = 3000) {
            showToast('warn', summary, detail, life);
        },
        showError(summary, detail, life = 3000) {
            showToast('error', summary, detail, life);
        },
        showSecondary(summary, detail, life = 3000) {
            showToast('secondary', summary, detail, life);
        },
        showContrast(summary, detail, life = 3000) {
            showToast('contrast', summary, detail, life);
        }
    };
};
