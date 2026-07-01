import { resolveVocab, resolveComponentVocab, type VocabularyAxis } from './vocabulary-registry.ts';

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
 *
 * `localVariants` (the recipe's own `config.variants`) is the authoritative
 * fallback for the `variant` axis: it is checked before the registry's
 * __global__ vocabulary, so a recipe-local variant never false-positives
 * against theme-wide defaults. A per-component theme registration still wins.
 */
export function validateVocabularyProps(
  componentName: string,
  axes: readonly VocabularyAxis[],
  props: Record<string, unknown>,
  localVariants?: readonly string[],
): void {
  if (!isDev()) return;
  for (const axis of axes) {
    const value = props[axis];
    if (value === undefined) continue;

    if (
      axis === 'variant' &&
      localVariants &&
      localVariants.length > 0 &&
      !resolveComponentVocab(componentName, 'variant')
    ) {
      if (!localVariants.includes(value as string)) {
        reportInvalidValue(componentName, axis, value, localVariants);
      }
      continue;
    }

    const vocab = resolveVocab(componentName, axis);
    if (!vocab) continue; // No registration → no validation (back-compat path)
    const result = vocab.schema.safeParse(value);
    if (!result.success) {
      reportInvalidValue(componentName, axis, value, vocab.values);
    }
  }
}

function reportInvalidValue(
  componentName: string,
  axis: VocabularyAxis,
  value: unknown,
  allowed: readonly string[],
): void {
  // eslint-disable-next-line no-console
  console.error(
    `[soribashi] <${componentName} ${axis}=${JSON.stringify(value)}>: value is not in the declared vocabulary.\n` +
      `  Allowed: ${allowed.join(', ')}\n` +
      `  Declared at: the recipe's own \`variants\` config, theme.components.${componentName}.${axis}, or theme.vocabulary.${axis}.\n` +
      `  To allow this value:\n` +
      `    1. Extend the component's vocabulary:\n` +
      `       ${componentName}.extend({ vocabulary: { ${axis}: (cur) => defineVocabulary([...cur.values, ${JSON.stringify(value)}]) } })\n` +
      `    2. Include that entry in createTheme({ components: [...] }) and call registerTheme(theme).`,
  );
}
