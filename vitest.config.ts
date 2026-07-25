import { defineConfig } from 'vitest/config';

// Vitest 4 removed the standalone `vitest.workspace.ts` file (the
// `test.workspace` option was removed too); `test.projects` on a root
// config is the documented replacement. See https://vitest.dev/guide/projects.
export default defineConfig({
  test: {
    projects: [
      './packages/theme/vitest.config.ts',
      './packages/codegen/vitest.config.ts',
      './packages/factory/vitest.config.ts',
      './packages/blocks/vitest.config.ts',
    ],
  },
});
