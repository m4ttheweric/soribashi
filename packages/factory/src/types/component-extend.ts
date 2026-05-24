import type { CSSProperties } from 'react';
import type { ResolvedTheme, Vocabulary } from '@soribashi/theme';

/**
 * A vocabulary override is either:
 *   - A Vocabulary value (replace mode): the recipe's axis becomes that vocab.
 *   - A function (current: Vocabulary) => Vocabulary (extend mode): receives the
 *     theme-resolved global vocab for that axis and returns a new vocab.
 *
 * Evaluated once during createTheme()'s entry resolution; the resulting concrete
 * Vocabulary is stored on the ThemeComponentEntry for runtime lookup.
 */
export type VocabularyOverride =
  | Vocabulary
  | ((current: Vocabulary) => Vocabulary);

/**
 * Configuration passed to `Recipe.extend()`. Replaces the prior `withDefaults`
 * API with a richer surface that includes per-component vocabulary overrides,
 * default props, slot classNames/styles/vars/attributes.
 */
export interface ComponentExtendConfig<TOwnProps = Record<string, unknown>> {
  /** Per-component vocabulary overrides keyed by axis name. */
  vocabulary?: {
    size?: VocabularyOverride;
    intent?: VocabularyOverride;
    variant?: VocabularyOverride;
  };

  /** Default props applied when the consumer doesn't pass the prop. */
  defaultProps?: Partial<TOwnProps>;

  /** Per-slot class names applied to every render. */
  classNames?:
    | Record<string, string>
    | ((theme: ResolvedTheme, props: TOwnProps) => Record<string, string>);

  /** Per-slot inline styles. */
  styles?:
    | Record<string, CSSProperties>
    | ((theme: ResolvedTheme, props: TOwnProps) => Record<string, CSSProperties>);

  /** Per-slot CSS custom property declarations. */
  vars?: (theme: ResolvedTheme, props: TOwnProps) => Record<string, Record<string, string>>;

  /** Per-slot HTML attribute overrides. */
  attributes?: Record<string, Record<string, unknown>>;
}
