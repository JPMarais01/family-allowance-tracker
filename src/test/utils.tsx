/* eslint-disable react-refresh/only-export-components */
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import React, { ReactElement } from 'react';

// This provider setup is simpler since Shadcn UI doesn't require a provider like Chakra UI
// We can add other providers here as needed (e.g., Router, Theme, etc.)
const AllTheProviders = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  return <>{children}</>;
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library

export * from '@testing-library/react';

// Override render method
export { customRender as render };
