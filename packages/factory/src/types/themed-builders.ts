import type { ComponentPropsWithoutRef, ElementType, ReactElement } from 'react';
import type { ResolvedTheme, ThemeVocabulary } from '@soribashi/theme';
import type { DefinePolymorphicComponentConfig } from '../define-polymorphic-component.tsx';
import type { FactoryPayload } from './factory-payload.ts';
import type { StylesApiProps } from './props.ts';
import type { PolymorphicComponentProps } from './polymorphic.ts';
import type { ComponentExtendConfig } from './component-extend.ts';
import type { ThemeComponentEntry } from '../theme-component-entry.ts';
import type { VocabularyAxis, ThemedVocabularyProps } from './vocabulary-axes.ts';

/**
 * Theme-narrowed builder types returned by `createSoribashiBuilders(theme)`.
 *
 * The builder implementations are unchanged at runtime; `createSoribashiBuilders`
 * casts them to these types so a recipe's PUBLIC props gain the theme's vocabulary
 * literals for the global axes (size/intent). This is the type-level half of the
 * vocabulary-rails payoff: `<Button size="md">` autocompletes and `size="huge"`
 * is a compile error, while `variant` keeps coming from the recipe's local set.
 *
 * IMPORTANT — keep in sync with `definePolymorphicComponent`'s return shape in
 * `define-polymorphic-component.tsx`. This type mirrors that shape and adds
 * `ThemedVocabularyProps<TVocab, TVocabAxes>` to the public call/withProps props.
 * The cast in `createSoribashiBuilders` is sound because the runtime component
 * accepts these props verbatim (they flow through as data-attributes/props).
 */

/**
 * The `.extend()` arg shape. Mirrors define-polymorphic-component's
 * DefinePolymorphicProps AND folds in the theme-narrowed global-axis props, so
 * `Button.extend({ defaultProps: { size: 'md' } })` type-checks with `size`
 * narrowed to the theme vocabulary (Gap B fix — without this, removing size/intent
 * from the recipe's own props leaves them absent from the extend config too).
 */
type ThemedPolymorphicExtendProps<
  TOwnProps,
  TDefaultAs extends ElementType,
  TVocab extends ThemeVocabulary,
  TVocabAxes extends readonly VocabularyAxis[],
> = TOwnProps &
  ThemedVocabularyProps<TVocab, TVocabAxes> &
  StylesApiProps<FactoryPayload> &
  Omit<ComponentPropsWithoutRef<TDefaultAs>, keyof TOwnProps | keyof StylesApiProps<FactoryPayload>>;

/** The component value produced by a themed `definePolymorphicComponent` call. */
type ThemedPolymorphicComponent<
  TOwnProps,
  TDefaultAs extends ElementType,
  TSelectors extends readonly string[],
  TVocab extends ThemeVocabulary,
  TVocabAxes extends readonly VocabularyAxis[],
> = (<TAs extends ElementType = TDefaultAs>(
  props: PolymorphicComponentProps<
    TAs,
    TOwnProps & ThemedVocabularyProps<TVocab, TVocabAxes> & StylesApiProps<any>
  >,
) => ReactElement | null) & {
  withProps: <TAs extends ElementType = TDefaultAs>(
    presets: Partial<TOwnProps & ThemedVocabularyProps<TVocab, TVocabAxes> & StylesApiProps<any>> & {
      as?: TAs;
    },
  ) => ThemedPolymorphicComponent<TOwnProps, TDefaultAs, TSelectors, TVocab, TVocabAxes>;
  extend: (
    config: ComponentExtendConfig<
      ThemedPolymorphicExtendProps<TOwnProps, TDefaultAs, TVocab, TVocabAxes>
    >,
  ) => ThemeComponentEntry<ThemedPolymorphicExtendProps<TOwnProps, TDefaultAs, TVocab, TVocabAxes>>;
  classes?: Partial<Record<TSelectors[number], string>>;
  displayName?: string;
};

/**
 * Signature of the themed `definePolymorphicComponent`. Same config as the raw
 * builder; the return type folds in the theme's narrowed global-axis props.
 */
export type ThemedDefinePolymorphicComponent<TVocab extends ThemeVocabulary> = <
  TOwnProps,
  TDefaultAs extends ElementType,
  TSelectors extends readonly string[] = readonly string[],
  TVariants extends readonly string[] = readonly string[],
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
>(
  config: DefinePolymorphicComponentConfig<TOwnProps, TDefaultAs, TSelectors, TVariants, TVocabAxes>,
) => ThemedPolymorphicComponent<TOwnProps, TDefaultAs, TSelectors, TVocab, TVocabAxes>;

/** Convenience: extract the resolved vocabulary type from a ResolvedTheme. */
export type VocabularyOf<TTheme extends ResolvedTheme> = TTheme['vocabulary'];
