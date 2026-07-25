import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // The root `test:visual` script invokes this file directly via
  // `--config packages/ui/vitest.visual.config.ts` from the repo root (this
  // project is deliberately NOT in root vitest.config.ts's `test.projects`
  // list, see the brief), so Vite's default `root` (the process cwd) would
  // otherwise resolve `include` against the repo root instead of this
  // package, silently matching zero files. Anchoring `root` to this config
  // file's own directory makes the invocation cwd-independent.
  root: import.meta.dirname,
  test: {
    name: 'ui-visual',
    include: ['src/**/*.visual.test.tsx'],
    // Same setup file as vitest.browser.config.ts (Task 2): loads the generated
    // theme.css once so every visual test renders against real recipe styles
    // instead of each test file importing it individually.
    setupFiles: ['./src/test-setup.browser.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    expect: {
      toMatchScreenshot: {
        comparatorName: 'pixelmatch',
        comparatorOptions: {
          // Vitest 4.1's visual-regression docs (installed version confirmed
          // against @vitest/browser-playwright's expect-element.js) do not set a
          // default for either value ("that's up for the user to decide"); the
          // docs' own example config uses exactly these two numbers together,
          // which is what's pinned here: `threshold` (0-1, per-pixel Lab color
          // distance tolerance) absorbs anti-aliasing/subpixel font rendering
          // noise, `allowedMismatchedPixelRatio` (fraction of the image) is the
          // recommended knob over a fixed `allowedMismatchedPixels` count
          // because it scales with each fixture's screenshot size instead of a
          // magic constant.
          threshold: 0.2,
          allowedMismatchedPixelRatio: 0.01,
        },
      },
    },
  },
});
