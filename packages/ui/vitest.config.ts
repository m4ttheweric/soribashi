import { defineConfig } from 'vitest/config';
import { soribashiSourceResolution } from '../../scripts/source-conditions.ts';

export default defineConfig({
  ...soribashiSourceResolution(),
  test: {
    name: 'ui-logic',
    environment: 'node',
    // `src/**/*.test.ts` (non-`.tsx`) picks up pure-logic node-tier tests
    // colocated with a recipe (e.g. Select/items.test.ts): no browser needed,
    // so it belongs here rather than in `ui-browser`'s `src/**/*.test.tsx`
    // glob, which is `.tsx`-only and would never match a `.ts` file anyway.
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
