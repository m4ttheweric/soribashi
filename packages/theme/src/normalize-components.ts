import type { ComponentThemeConfig, ThemeDefinition, ThemeVocabulary } from './types.ts';
import { isThemeComponentEntry } from './theme-component-entry.ts';
import type { Vocabulary } from './define-vocabulary.ts';
import type { VocabularyOverride } from './vocabulary-override.ts';

/**
 * Safely converts an unknown value to a string for error messages.
 * JSON.stringify throws on circular references, BigInt, etc.; this wrapper
 * falls back gracefully instead of obscuring the original error.
 */
function describe(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

/**
 * Resolves a single VocabularyOverride to a concrete Vocabulary.
 *
 * - Undefined → undefined (axis not overridden)
 * - Function form → invoked with the global vocab; result is a concrete Vocabulary
 * - Vocabulary (has __vocab: true) → passed through unchanged
 */
function resolveVocabOverride(
  override: VocabularyOverride | undefined,
  current: Vocabulary | undefined,
): Vocabulary | undefined {
  if (override === undefined) return undefined;
  if (typeof override === 'function') {
    if (current === undefined) {
      throw new Error(
        'Vocabulary function-form override needs a global vocabulary to extend from',
      );
    }
    return override(current);
  }
  // Already a concrete Vocabulary (__vocab: true)
  return override;
}

/**
 * Resolves a ThemeComponentEntry's vocabulary field from VocabularyOverride values
 * to concrete Vocabulary values using the resolved global ThemeVocabulary.
 *
 * Returns a ComponentThemeConfig with a fully resolved vocabulary field (or no
 * vocabulary field if the entry declared none).
 */
function resolveEntryVocabulary(
  entry: { defaultProps?: Record<string, unknown>; vocabulary?: Record<string, VocabularyOverride> },
  vocab: ThemeVocabulary,
): ComponentThemeConfig {
  const inputVocab = entry.vocabulary as
    | Partial<Record<'size' | 'intent' | 'variant', VocabularyOverride>>
    | undefined;

  if (!inputVocab) {
    return { defaultProps: entry.defaultProps };
  }

  const resolvedVocab: ComponentThemeConfig['vocabulary'] = {};
  const size = resolveVocabOverride(inputVocab.size, vocab.size);
  const intent = resolveVocabOverride(inputVocab.intent, vocab.intent);
  const variant = resolveVocabOverride(inputVocab.variant, vocab.variant);

  if (size !== undefined) resolvedVocab.size = size;
  if (intent !== undefined) resolvedVocab.intent = intent;
  if (variant !== undefined) resolvedVocab.variant = variant;

  // Only include vocabulary key if at least one axis was overridden
  const hasAny = size !== undefined || intent !== undefined || variant !== undefined;

  return {
    defaultProps: entry.defaultProps,
    ...(hasAny ? { vocabulary: resolvedVocab } : {}),
  };
}

/**
 * Normalizes `ThemeDefinition['components']` (either an array of
 * `ThemeComponentEntry` objects or an already-normalized record) into the
 * internal `Record<string, ComponentThemeConfig>` shape.
 *
 * When an array is provided, each element is validated at runtime — a clear
 * error is thrown if a caller accidentally passes a plain object instead of
 * using `Component.extend({...})`.
 *
 * The `vocabulary` parameter (the theme's resolved global vocabulary) is used
 * to evaluate function-form VocabularyOverride values on each entry. Replace-mode
 * overrides (plain Vocabulary objects) pass through unchanged.
 */
export function normalizeComponents(
  input: ThemeDefinition['components'] | undefined,
  vocabulary: ThemeVocabulary,
): Record<string, ComponentThemeConfig> {
  if (input === undefined) return {};
  if (Array.isArray(input)) {
    const out: Record<string, ComponentThemeConfig> = {};
    for (const entry of input) {
      if (!isThemeComponentEntry(entry)) {
        throw new Error(
          `createTheme: components array contains a non-ThemeComponentEntry value. ` +
          `Use Component.extend({...}) to construct entries; got: ${describe(entry)}`,
        );
      }
      // Last-write-wins: later entries override earlier ones with the same name.
      out[entry.name] = resolveEntryVocabulary(
        entry as { defaultProps?: Record<string, unknown>; vocabulary?: Record<string, VocabularyOverride> },
        vocabulary,
      );
    }
    return out;
  }
  return input as Record<string, ComponentThemeConfig>;
}
