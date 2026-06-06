import type { ThemeVocabulary } from '@soribashi/theme';

export type VocabularyAxis = 'size' | 'intent' | 'variant';

/**
 * The vocabulary axes that are GLOBAL (shared across recipes) and therefore
 * safe to thread from the theme into a recipe's public props. `variant` is
 * deliberately excluded: it is per-recipe (each recipe declares its own variant
 * set locally via its `variants` const), so its narrowed type comes from the
 * recipe itself, not the global theme vocabulary.
 */
export type GlobalVocabularyAxis = Extract<VocabularyAxis, 'size' | 'intent'>;

/**
 * Internal, render-context view of injected axes — typed as `string` because
 * inside a recipe's `render` the resolved value is just a string. Used by the
 * builder configs (`define-*.tsx`) for `defaults` and the render ctx props.
 */
export type InjectedVocabularyProps<TAxes extends readonly VocabularyAxis[]> = {
  [K in TAxes[number]]?: string;
};

/**
 * Public, theme-narrowed view of injected axes — used by the themed builders
 * returned from `createSoribashiBuilders(theme)`. For each opted-in GLOBAL axis,
 * the injected prop narrows to that axis's declared literal union (e.g.
 * `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`) instead of `string`. `variant` is
 * excluded (see GlobalVocabularyAxis) and continues to come from the recipe's
 * own props.
 *
 * Threading the theme's literals here is what makes `<Button size="md">`
 * autocomplete and reject out-of-vocabulary values at compile time.
 */
export type ThemedVocabularyProps<
  TVocab extends ThemeVocabulary,
  TAxes extends readonly VocabularyAxis[],
> = {
  [K in TAxes[number] & GlobalVocabularyAxis]?: NonNullable<TVocab[K]['type']>;
};
