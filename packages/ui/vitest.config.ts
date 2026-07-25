import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'ui-logic',
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
