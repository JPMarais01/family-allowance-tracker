'use client';

import { useEffect } from 'react';
import { useThemeStore, type Theme } from '../../stores/ThemeStore';

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps): React.ReactNode {
  const { theme, setTheme } = useThemeStore();

  // Set default theme if provided and different from current
  useEffect(() => {
    if (defaultTheme && defaultTheme !== theme) {
      setTheme(defaultTheme);
    }
  }, [defaultTheme, setTheme, theme]);

  return <>{children}</>;
}
