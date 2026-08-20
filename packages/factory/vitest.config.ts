import { defineConfig } from 'vitest/config';
import { soribashiSourceResolution } from '../../scripts/source-conditions.ts';

export default defineConfig({
  ...soribashiSourceResolution(),
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.{ts,tsx}', 'test/**/*.test-d.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});
