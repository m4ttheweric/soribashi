import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'ui-browser',
    include: ['src/**/*.test.tsx'],
    exclude: ['src/**/*.visual.test.tsx'],
    setupFiles: ['./src/test-setup.browser.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
