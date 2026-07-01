/**
 * Detect whether the consumer is running in a dev build. Mirrors the detection
 * in @soribashi/factory's validate-vocabulary-props (kept private there):
 * Vite's import.meta.env.DEV first, then process.env.NODE_ENV, defaulting to
 * dev so warnings surface when the environment is unknown.
 */
export const isDev = (): boolean => {
  try {
    // @ts-ignore — import.meta.env is Vite-specific; not in the standard lib types.
    const viteEnv = import.meta?.env;
    if (viteEnv && typeof viteEnv.DEV === 'boolean') return viteEnv.DEV;
  } catch {
    // import.meta access threw (rare; environment that strips ESM import.meta) — fall through.
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV !== 'production';
  }
  return true;
};
