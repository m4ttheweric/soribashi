import { resolveVocab, type VocabularyAxis } from './vocabulary-registry.ts';

const isDev = (): boolean => {
  // Vite + Vitest both set NODE_ENV; bundlers tree-shake the branch in prod.
  return (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV !== 'production'
  );
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
