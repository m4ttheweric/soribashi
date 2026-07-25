import { defineConfig, devices } from '@playwright/test';

/**
 * Soribashi browser-parity Playwright configuration.
 *
 * The test suite navigates to /browser-fixtures.html and runs computed-style
 * assertions against each of the 14 soribashi blocks.
 *
 * Run:  bunx playwright test
 */
export default defineConfig({
  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* No retries — these are deterministic CSS assertions */
  retries: 0,

  /* Single worker is fine for 42 fast assertions */
  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'tests/browser-parity/playwright-report' }],
  ],

  use: {
    /* Viewport wide enough that "hiddenFrom=md" fires (≥ 768px = 48rem) */
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'blocks',
      testDir: './tests/browser-parity',
      testMatch: '**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' },
    },
  ],

  // No webServer entry: apps/pilot, apps/playground and apps/shadcn-starter were
  // all removed in slice 1a ("remove the ejected apps", 2026-07-24). Playground's
  // Vite dev server used to boot here on :5173 for the `blocks` project above —
  // nothing serves that port now, so `bun run test:browser` cannot connect until
  // a replacement exists. Slice 1b's apps/workshop is meant to be that
  // replacement: once it exists, add back a webServer entry that boots it on
  // :5173 (or repoint the `blocks` project's baseURL at wherever it serves from).
});
