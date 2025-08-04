import { watch } from 'vue';
import { useLayout } from '@/layout/composables/layout';

export function useTheme() {
    const { isDarkTheme } = useLayout();

    const applyLightTheme = () => {
        // Theme customization logic can be added here if needed
    };

    const applyDarkTheme = () => {
        // Theme customization logic can be added here if needed
    };

    watch(
        isDarkTheme,
        (val) => {
            if (val) {
                applyDarkTheme();
            } else {
                applyLightTheme();
            }
        },
        { immediate: true }
    );

    return { isDarkTheme };
}
