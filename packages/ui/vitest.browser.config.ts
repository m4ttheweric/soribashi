import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'ui-browser',
    include: ['src/**/*.test.tsx'],
    exclude: ['src/**/*.visual.test.tsx'],
    // No src/**/*.test.tsx files exist yet in this task; Task 4 (Button) adds
    // the first one. Without this, vitest exits 1 on an empty project and
    // breaks the default `bun run test` run. Remove once Task 4 lands.
    passWithNoTests: true,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
