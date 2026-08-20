import { defineConfig } from 'vitest/config';

// Vitest 4 removed the standalone `vitest.workspace.ts` file (the
// `test.workspace` option was removed too); `test.projects` on a root
// config is the documented replacement. See https://vitest.dev/guide/projects.
export default defineConfig({
  test: {
    projects: [
      './packages/core/vitest.node.config.ts',
      './packages/core/vitest.dom.config.ts',
      './packages/ui/vitest.config.ts',
      './packages/ui/vitest.browser.config.ts',
    ],
  },
});
