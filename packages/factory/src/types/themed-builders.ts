import type { ResolvedTheme, ThemeVocabulary } from '@soribashi/theme';
import type { ElementType } from 'react';
import type { DefineComponentConfig, DefineComponentResult } from '../define-component.tsx';
import type {
  AnyPartConfig,
  CompoundComponent,
  CompoundSlotKeys,
  DefineCompoundConfig,
  ExtractPartProps,
  PartsRecord,
} from '../define-compound.tsx';
import type {
  DefineGenericComponentConfig,
  GenericComponentFn,
  GenericComponentStatics,
} from '../define-generic-component.tsx';
import type {
  DefinePolymorphicComponentConfig,
  PolymorphicComponentResult,
} from '../define-polymorphic-component.tsx';
import type {
  InjectedVocabularyProps,
  ThemedVocabularyProps,
  VariantProp,
  VocabularyAxis,
} from './vocabulary-axes.ts';

/**
 * Theme-narrowed builder types returned by `makeBuilders<TTheme>()` /
 * `createSoribashiBuilders(theme)`.
 *
 * The builder implementations are unchanged at runtime; makeBuilders casts
 * them to these types so a recipe's PUBLIC props gain the theme's vocabulary
 * literals for the global axes (size/intent) — `<Button size="md">`
 * autocompletes, `size="huge"` is a compile error — while `variant` keeps
 * coming from the recipe's local variants tuple. The same narrowing applies
 * inside `defaults`, so `defaults: { size: 'humongous' }` fails to compile.
 *
 * Each themed type reuses the raw builder's config and result types with two
 * twists: the config's `defaults` is intersected with
 * `ThemedVocabularyProps<TVocab, TVocabAxes>` (narrowing global-axis values),
 * and the result's `TExtra` hook is instantiated with the same, narrowing the
 * public call-site props. The casts in makeBuilders are sound because the
 * runtime components accept these props verbatim.
 */

/** Themed `defaults` fragment shared by all four themed builder configs. */
type ThemedDefaults<
  TVocab extends ThemeVocabulary,
  TVocabAxes extends readonly VocabularyAxis[],
> = { defaults?: Partial<ThemedVocabularyProps<TVocab, TVocabAxes>> };

export type ThemedDefineComponent<TVocab extends ThemeVocabulary> = <
  TOwnProps = Record<never, never>,
  TSelectors extends readonly string[] = readonly string[],
  TVariants extends readonly string[] = readonly string[],
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
>(
  config: DefineComponentConfig<TOwnProps, TSelectors, TVariants, TVocabAxes> &
    ThemedDefaults<TVocab, TVocabAxes>,
) => DefineComponentResult<
  TOwnProps,
  TSelectors,
  TVariants,
  TVocabAxes,
  ThemedVocabularyProps<TVocab, TVocabAxes>
>;

export type ThemedDefinePolymorphicComponent<TVocab extends ThemeVocabulary> = <
  TOwnProps,
  TDefaultAs extends ElementType,
  TSelectors extends readonly string[] = readonly string[],
  TVariants extends readonly string[] = readonly string[],
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
>(
  config: DefinePolymorphicComponentConfig<
    TOwnProps,
    TDefaultAs,
    TSelectors,
    TVariants,
    TVocabAxes
  > &
    ThemedDefaults<TVocab, TVocabAxes>,
) => PolymorphicComponentResult<
  TOwnProps,
  TDefaultAs,
  TSelectors,
  TVariants,
  TVocabAxes,
  ThemedVocabularyProps<TVocab, TVocabAxes>
>;

export type ThemedDefineCompound<TVocab extends ThemeVocabulary> = <
  TParts extends PartsRecord,
  const TVariants extends readonly string[] = readonly [],
  TCtxExtra extends object = object,
  TClasses extends Partial<Record<string, string>> = Partial<Record<string, string>>,
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
>(
  config: DefineCompoundConfig<TParts, TVariants, TCtxExtra, TVocabAxes> & {
    classes?: TClasses;
    defaults?: Partial<
      ExtractPartProps<TParts['root']> &
        InjectedVocabularyProps<TVocabAxes> &
        VariantProp<TVariants> &
        ThemedVocabularyProps<TVocab, TVocabAxes>
    >;
    parts: TParts & { root: AnyPartConfig };
  },
) => CompoundComponent<
  TParts,
  TVariants,
  TVocabAxes,
  CompoundSlotKeys<TParts, TClasses>,
  ThemedVocabularyProps<TVocab, TVocabAxes>
>;

export type ThemedDefineGenericComponent<TVocab extends ThemeVocabulary> = <
  TSignature = GenericComponentFn,
  const TSelectors extends readonly string[] = readonly string[],
  const TVariants extends readonly string[] = readonly string[],
  const TVocabAxes extends readonly VocabularyAxis[] = readonly [],
>(
  config: DefineGenericComponentConfig<TSelectors, TVariants, TVocabAxes> &
    ThemedDefaults<TVocab, TVocabAxes>,
) => TSignature & GenericComponentStatics<TSignature>;

/** Convenience: extract the resolved vocabulary type from a ResolvedTheme. */
export type VocabularyOf<TTheme extends ResolvedTheme> = TTheme['vocabulary'];
