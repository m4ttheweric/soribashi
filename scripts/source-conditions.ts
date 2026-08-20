/**
 * Shared Vite/Vitest resolution opt-in for consuming `@soribashi/*` as source.
 *
 * Every publishable `@soribashi/*` package's `exports` map points at its built
 * `dist/` — that is what consumers install, and it is why a consumer never
 * type-checks or bundles our TypeScript source. Each map also lists a
 * `"soribashi-source"` condition FIRST, pointing back at `src/`.
 *
 * Anything inside this repo that resolves `@soribashi/*` opts into that
 * condition so the workspace keeps running against source with no build step:
 *   - `tsc`  — `customConditions` in tsconfig.base.json
 *   - `bun`  — `--conditions=soribashi-source` in the root package.json scripts
 *   - Vite / Vitest — this module
 *
 * `conditions` covers client/browser resolution and `ssr.resolve.conditions`
 * covers the Node side (vite-node, `environment: 'node'` and `'jsdom'` runs),
 * so both are set. Vite replaces rather than merges these lists when they are
 * specified, hence the explicit defaults alongside our own condition.
 */
export const SORIBASHI_SOURCE_CONDITION = 'soribashi-source';

/**
 * Spread into a Vite/Vitest `defineConfig` object to opt the whole config into
 * source resolution for `@soribashi/*`.
 *
 * Returned fresh per call (rather than exported as a shared frozen constant)
 * because Vite types these as mutable `string[]` and may normalize them in
 * place; handing every config its own arrays keeps one config from mutating
 * another's.
 */
export function soribashiSourceResolution() {
  return {
    resolve: {
      conditions: [SORIBASHI_SOURCE_CONDITION, 'module', 'browser', 'development|production'],
    },
    ssr: {
      resolve: {
        conditions: [SORIBASHI_SOURCE_CONDITION, 'module', 'node', 'development|production'],
      },
    },
  };
}
