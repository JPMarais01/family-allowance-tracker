import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';

// Add any necessary providers here (e.g., ChakraProvider, Router, etc.)
// eslint-disable-next-line react-refresh/only-export-components
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';

// Override render method
export { customRender as render };
