import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    logo: string | null;
    setTheme: (theme: Theme) => void;
    setLogo: (logo: string | null) => void;
    initTheme: () => void;
}

const applyTheme = (theme: Theme): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';

    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolved = theme === 'system' ? systemTheme : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.setAttribute('data-kt-theme-mode', resolved);

    return resolved;
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'system', // Default to system preference
            resolvedTheme: 'light',
            logo: null,

            setTheme: (theme) => {
                const resolved = applyTheme(theme);
                set({ theme, resolvedTheme: resolved });
            },

            setLogo: (logo) => {
                set({ logo });
            },

            initTheme: () => {
                const { theme } = get();
                const resolved = applyTheme(theme);
                set({ resolvedTheme: resolved });
            },
        }),
        {
            name: 'bravos-theme',
            onRehydrateStorage: () => (state) => {
                // Apply theme on rehydration (page load)
                if (state) {
                    // Small delay to ensure DOM is ready
                    setTimeout(() => {
                        state.initTheme();
                    }, 0);
                }
            }
        }
    )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const { theme, setTheme } = useThemeStore.getState();
        if (theme === 'system') {
            // Re-apply to update resolved theme
            setTheme('system');
        }
    });
}
