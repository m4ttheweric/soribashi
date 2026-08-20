import { defineConfig } from 'vitest/config';
import { soribashiSourceResolution } from '../../scripts/source-conditions.ts';

/**
 * Component-factory tier: everything that renders React under jsdom, plus the
 * `*.test-d.ts` type-level suites that ride the same project. Was
 * `packages/factory/vitest.config.ts` before the four packages merged.
 */
export default defineConfig({
  ...soribashiSourceResolution(),
  test: {
    name: 'core-dom',
    environment: 'jsdom',
    globals: true,
    include: ['test/factory/**/*.test.{ts,tsx}', 'test/factory/**/*.test-d.ts'],
    setupFiles: ['./test/factory/setup.ts'],
  },
});
