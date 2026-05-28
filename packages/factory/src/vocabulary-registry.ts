import type { Vocabulary } from '@soribashi/theme';

export type VocabularyAxis = 'size' | 'intent' | 'variant';

/**
 * Module-level registry of vocabularies, keyed by component name (or `__global__`
 * for the theme-wide defaults). Populated by createSoribashiBuilders() once at
 * app startup; read by builders' useProps during render.
 *
 * Single-tenant: assumes ONE theme per process. Multi-tenant SSR scenarios are
 * out of scope (see spec § 14 risk 5).
 */
type ComponentVocabularies = Partial<Record<VocabularyAxis, Vocabulary>>;

const GLOBAL_KEY = '__global__';

let registry = new Map<string, ComponentVocabularies>();

/** Reset registry. Used by tests; never called from production code. */
export function resetRegistry(): void {
  registry = new Map();
}

/**
 * Register vocabularies for a component (or `__global__` for theme-wide defaults).
 * Idempotent — re-registering a component name merges with its prior entry
 * (later registration's keys overwrite earlier ones; untouched keys preserved).
 */
export function registerComponentVocabularies(
  componentName: string,
  vocab: ComponentVocabularies,
): void {
  registry.set(componentName, { ...registry.get(componentName), ...vocab });
}

/**
 * Resolve which vocabulary applies for a (component, axis) pair.
 * Lookup order:
 *   1. Per-component registration
 *   2. __global__ registration
 *   3. undefined (caller decides what to do — typically skip validation)
 */
export function resolveVocab(componentName: string, axis: VocabularyAxis): Vocabulary | undefined {
  const componentVocab = registry.get(componentName);
  if (componentVocab?.[axis]) return componentVocab[axis];
  return registry.get(GLOBAL_KEY)?.[axis];
}
