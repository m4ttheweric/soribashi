import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { soribashiSourceResolution } from '../../scripts/source-conditions.ts';

export default defineConfig({
  ...soribashiSourceResolution(),
  plugins: [react()],
  // Anchors `include` resolution to this package's directory regardless of
  // invocation cwd, same rationale as vitest.visual.config.ts's `root`: Vite's
  // default `root` is the process cwd, which would silently match zero files
  // if this config were ever invoked via `--config` from the repo root.
  root: import.meta.dirname,
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
