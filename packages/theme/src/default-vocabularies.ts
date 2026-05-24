import { defineVocabulary, type Vocabulary } from './define-vocabulary.ts';

/**
 * Internal-only default vocabularies. Used by createTheme() when the consumer
 * omits an axis from `vocabulary`. NOT exported from `packages/theme/src/index.ts`
 * — consumers reach these values only by calling createTheme() without overriding
 * the relevant axis. There is no other path.
 *
 * Soribashi has no opinion on what these values should be. The defaults exist
 * solely so a consumer who hasn't yet declared their vocabulary can still get
 * a working theme.
 */

export const DEFAULT_VOCABULARIES = {
  size: defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl']),
  intent: defineVocabulary([
    'primary',
    'neutral',
    'success',
    'warning',
    'danger',
    'info',
  ]),
  variant: defineVocabulary([
    'filled',
    'outline',
    'subtle',
    'ghost',
    'link',
  ]),
} as const satisfies Record<string, Vocabulary>;
