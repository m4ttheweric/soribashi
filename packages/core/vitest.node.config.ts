import { defineConfig } from 'vitest/config';
import { soribashiSourceResolution } from '../../scripts/source-conditions.ts';

/**
 * Pure-logic tier: the theme model and the codegen emitters. No DOM, no React.
 *
 * Split from `vitest.dom.config.ts` (rather than folded into one config)
 * because the factory tier needs jsdom, `globals: true`, and a setup file, and
 * paying for those on the theme/codegen suites buys nothing. Before the four
 * packages merged, these were `packages/theme/vitest.config.ts` and
 * `packages/codegen/vitest.config.ts`; the two node-tier suites simply became
 * two `include` globs of one project.
 */
export default defineConfig({
  ...soribashiSourceResolution(),
  test: {
    name: 'core-node',
    environment: 'node',
    include: ['test/theme/**/*.test.ts', 'test/codegen/**/*.test.ts', 'test/exports/**/*.test.ts'],
  },
});
