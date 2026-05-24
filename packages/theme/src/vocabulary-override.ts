import type { Vocabulary } from './define-vocabulary.ts';

/**
 * A vocabulary override is either:
 *   - A Vocabulary value (replace mode): the recipe's axis becomes that vocab.
 *   - A function (current: Vocabulary) => Vocabulary (extend mode): receives the
 *     theme-resolved global vocab for that axis and returns a new vocab.
 *
 * Evaluated once during createTheme()'s entry resolution (normalizeComponents);
 * the resulting concrete Vocabulary is stored on the ThemeComponentEntry for
 * runtime lookup.
 */
export type VocabularyOverride =
  | Vocabulary
  | ((current: Vocabulary) => Vocabulary);
