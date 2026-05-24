import { resolveVocab, type VocabularyAxis } from './vocabulary-registry.ts';

/**
 * Detect whether the consumer is running in a dev build.
 *
 * Order of signals:
 *   1. Vite's `import.meta.env.DEV` — statically replaced at build time, works
 *      browser-side where `process` is not defined.
 *   2. `process.env.NODE_ENV` — Node / Vitest / Webpack / Rollup / Bun. Most
 *      bundlers statically replace this in production builds.
 *   3. Default `true` — if we can't detect the environment, prefer surfacing
 *      validation warnings over silently disabling them. The Zod cost is small;
 *      missing a real bug is not.
 */
const isDev = (): boolean => {
  // Vite — browser-safe; `import.meta.env.DEV` is a literal boolean after build.
  try {
    // @ts-ignore — import.meta.env is Vite-specific; not in the standard lib types.
    const viteEnv = import.meta?.env;
    if (viteEnv && typeof viteEnv.DEV === 'boolean') return viteEnv.DEV;
  } catch {
    // import.meta access threw (rare; environment that strips ESM import.meta) — fall through.
  }
  // Node / Vitest / non-Vite bundlers.
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV !== 'production';
  }
  // Unknown — default to dev so validation surfaces.
  return true;
};

/**
 * Validate vocabulary-axis props against the registry's Zod schemas.
 * Dev-only — production bundles eliminate the call via the isDev() check.
 */
export function validateVocabularyProps(
  componentName: string,
  axes: readonly VocabularyAxis[],
  props: Record<string, unknown>,
): void {
  if (!isDev()) return;
  for (const axis of axes) {
    const value = props[axis];
    if (value === undefined) continue;
    const vocab = resolveVocab(componentName, axis);
    if (!vocab) continue; // No registration → no validation (back-compat path)
    const result = vocab.schema.safeParse(value);
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.error(
        `[soribashi] <${componentName} ${axis}=${JSON.stringify(value)}> — value is not in the declared vocabulary.\n` +
          `  Allowed: ${vocab.values.join(', ')}\n` +
          `  Declared at: theme.components.${componentName}.${axis} or theme.vocabulary.${axis}.\n` +
          `  To allow this value, extend the component's vocabulary:\n` +
          `    ${componentName}.extend({ vocabulary: { ${axis}: (cur) => defineVocabulary([...cur.values, ${JSON.stringify(value)}]) } })`,
      );
    }
  }
}
