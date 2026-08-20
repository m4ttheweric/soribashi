/**
 * Detect whether the consumer is running in a dev build. Mirrors the private
 * detection in validate-vocabulary-props.ts (this copy is the public,
 * re-exported version): Vite's import.meta.env.DEV first, then
 * process.env.NODE_ENV, defaulting to dev so warnings surface when the
 * environment is unknown.
 */
export const isDev = (): boolean => {
  try {
    // Cast rather than `@ts-expect-error` (SORI-23): whether `import.meta.env`
    // is already declared depends on the ambient types in scope. Under
    // `types: ["bun"]` bun-types declares it, so a suppression here has nothing
    // to suppress and TypeScript reports TS2578 ("Unused '@ts-expect-error'
    // directive") instead. A cast through `unknown` is correct under every
    // tsconfig, declared or not.
    const viteEnv = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
    if (viteEnv && typeof viteEnv.DEV === 'boolean') return viteEnv.DEV;
  } catch {
    // import.meta access threw (rare; environment that strips ESM import.meta) — fall through.
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV !== 'production';
  }
  return true;
};
