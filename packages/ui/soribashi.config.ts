import { uiTheme } from './src/theme.ts';

/**
 * The @soribashi/ui package's own codegen config (SORI-13).
 *
 * It lives here, and writes here, because `uiTheme` is this package's theme:
 * the generated CSS is this package's build artifact, exported as
 * `@soribashi/ui/theme.css` for apps (and this package's own browser tests) to
 * import. It previously lived at the repo root and wrote into apps/workshop,
 * which made the package's browser tests depend on an app's build artifact
 * three directories up.
 *
 * Paths are relative to this directory: `bun run codegen` at the repo root
 * delegates here with `--cwd packages/ui`, matching what the soribashi-init
 * registry item scaffolds for a consumer repo.
 */
export default {
  theme: uiTheme,
  output: { css: 'src/generated/theme.css' },
  watch: ['src/theme.ts', '../theme/src/**/*.ts'],
};
