import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base:
    process.env.NODE_ENV === 'production'
      ? 'https://jpmarais01.github.io/family-allowance-tracker/'
      : '/',
});
