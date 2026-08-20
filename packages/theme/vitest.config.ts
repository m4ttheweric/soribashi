import { defineConfig } from 'vitest/config';
import { soribashiSourceResolution } from '../../scripts/source-conditions.ts';

export default defineConfig({
  ...soribashiSourceResolution(),
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
