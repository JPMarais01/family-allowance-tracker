import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeState {
  // State
  theme: Theme;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',

      // Actions
      setTheme: (theme: Theme) => {
        set({ theme });
        if (typeof window !== 'undefined') {
          applyThemeToDOM(theme);
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme =
          currentTheme === 'dark' ? 'light' : currentTheme === 'light' ? 'system' : 'dark';
        set({ theme: newTheme });
        if (typeof window !== 'undefined') {
          applyThemeToDOM(newTheme);
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: state => ({ theme: state.theme }),
    }
  )
);

// Helper function to apply theme to DOM
function applyThemeToDOM(theme: Theme): void {
  if (typeof window === 'undefined' || !window.document) {
    return;
  }

  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    let systemTheme: Theme = 'light';

    // Check if matchMedia is available (it's not in test environment)
    if (window.matchMedia) {
      systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    root.classList.add(systemTheme);
    return;
  }

  root.classList.add(theme);
}

// Initialize theme on load
if (typeof window !== 'undefined' && window.document) {
  const theme = useThemeStore.getState().theme;
  applyThemeToDOM(theme);

  // Listen for system theme changes if matchMedia is available
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (useThemeStore.getState().theme === 'system') {
        applyThemeToDOM('system');
      }
    });
  }
}
