'use client';

import { type ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';

export interface ProviderProps {
  children: ReactNode;
}

export function Provider({ children }: ProviderProps): React.ReactElement {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      {children}
    </ThemeProvider>
  );
}
