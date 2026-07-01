import { forwardRef, type Ref } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { autoVars } from './auto-vars.ts';
import { makeWithProps } from './with-props.tsx';
import { validateVocabularyProps } from './validate-vocabulary-props.ts';
import type { FactoryPayload } from './types/factory-payload.ts';
import type { StylesApiProps } from './types/props.ts';
import type { GetStylesFn } from './types/render-context.ts';
import type { ThemeComponentEntry } from './theme-component-entry.ts';
import { makeExtendEntry } from './make-extend-entry.ts';
import type { ComponentExtendConfig } from './types/component-extend.ts';
import type { VocabularyAxis, InjectedVocabularyProps, VariantProp } from './types/vocabulary-axes.ts';

export interface DefineComponentConfig<
  TOwnProps,
  TSelectors extends readonly string[],
  TVariants extends readonly string[],
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
> {
  name: string;
  /**
   * @deprecated Dead config key — defineComponent never reads it (the render
   * function decides the element). Kept only because existing app recipes
   * still pass it; delete together with those call sites.
   */
  element?: keyof JSX.IntrinsicElements;
  vocabularyAxes?: TVocabAxes;
  selectors: TSelectors;
  variants?: TVariants;
  classes?: Partial<Record<TSelectors[number], string>>;
  defaults?: Partial<TOwnProps & InjectedVocabularyProps<TVocabAxes> & VariantProp<TVariants>>;
  vars?: (
    theme: ResolvedTheme,
    props: TOwnProps & { variant?: TVariants[number]; intent?: string },
  ) => Partial<Record<TSelectors[number], Record<string, string>>>;
  render: (ctx: {
    props: TOwnProps & InjectedVocabularyProps<TVocabAxes> & StylesApiProps<any> & { variant?: TVariants[number]; intent?: string };
    getStyles: GetStylesFn<
      { props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload
    >;
    ref: Ref<HTMLElement>;
  }) => React.ReactNode;
}

/**
 * Public component type produced by `defineComponent`. Call-site props include
 * the declared vocabulary axes (string-typed on the raw builder; theme-narrowed
 * via makeBuilders), the recipe's variant tuple, and the selector-keyed styles
 * API. `withProps` returns the same shape so static chains keep type-checking.
 */
export type DefineComponentResult<
  TOwnProps,
  TSelectors extends readonly string[],
  TVariants extends readonly string[],
  TVocabAxes extends readonly VocabularyAxis[],
  TExtra = unknown,
> = React.ForwardRefExoticComponent<
  DefineComponentPublicProps<TOwnProps, TSelectors, TVariants, TVocabAxes, TExtra> &
    React.RefAttributes<HTMLElement>
> & {
  extend: (
    config: ComponentExtendConfig<
      DefineComponentPublicProps<TOwnProps, TSelectors, TVariants, TVocabAxes, TExtra> & {
        variant?: TVariants[number];
        intent?: string;
      }
    >,
  ) => ThemeComponentEntry<
    DefineComponentPublicProps<TOwnProps, TSelectors, TVariants, TVocabAxes, TExtra> & {
      variant?: TVariants[number];
      intent?: string;
    }
  >;
  withProps: (
    presets: Partial<DefineComponentPublicProps<TOwnProps, TSelectors, TVariants, TVocabAxes, TExtra>>,
  ) => DefineComponentResult<TOwnProps, TSelectors, TVariants, TVocabAxes, TExtra>;
  classes?: Partial<Record<TSelectors[number], string>>;
  displayName?: string;
};

/**
 * `TExtra` is the theme-narrowing hook: the themed builders (makeBuilders)
 * instantiate it with `ThemedVocabularyProps<TVocab, TVocabAxes>` so global
 * axes intersect down from `string` to the theme's literal unions.
 */
export type DefineComponentPublicProps<
  TOwnProps,
  TSelectors extends readonly string[],
  TVariants extends readonly string[],
  TVocabAxes extends readonly VocabularyAxis[],
  TExtra = unknown,
> = TOwnProps &
  InjectedVocabularyProps<TVocabAxes> &
  VariantProp<TVariants> &
  TExtra &
  StylesApiProps<{ props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload>;

/**
 * The daily-use component authoring API.
 */
export function defineComponent<
  TOwnProps = Record<string, never>,
  TSelectors extends readonly string[] = readonly string[],
  TVariants extends readonly string[] = readonly string[],
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
>(config: DefineComponentConfig<TOwnProps, TSelectors, TVariants, TVocabAxes>) {
  const hasVariants = (config.variants?.length ?? 0) > 0;

  const Component = forwardRef<HTMLElement, any>((rawProps, ref) => {
    const merged = useProps<TOwnProps & StylesApiProps<any>>(
      config.name,
      (config.defaults ?? null) as Partial<TOwnProps & StylesApiProps<any>> | null,
      rawProps as TOwnProps & StylesApiProps<any>,
    );

    validateVocabularyProps(config.name, config.vocabularyAxes ?? [], merged as Record<string, unknown>, config.variants);

    const varsResolver = config.vars
      ? (theme: ResolvedTheme, props: any) => config.vars!(theme, props)
      : (theme: ResolvedTheme, props: any) =>
          autoVars(theme, config.name, props, hasVariants) as any;

    const getStyles = useStyles<
      { props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload
    >({
      name: config.name,
      classes: config.classes as any,
      className: (merged as any).className,
      style: (merged as any).style,
      classNames: (merged as any).classNames,
      styles: (merged as any).styles,
      vars: (merged as any).vars,
      attributes: (merged as any).attributes,
      unstyled: (merged as any).unstyled,
      props: merged as any,
      varsResolver: varsResolver as any,
    });

    return config.render({
      props: merged as any,
      getStyles: getStyles as any,
      ref,
    }) as React.ReactElement;
  });

  Component.displayName = config.name;
  (Component as any).__vocabularyAxes = config.vocabularyAxes ?? [];
  (Component as any).classes = config.classes;
  (Component as any).withProps = makeWithProps(Component as any);
  type DefineComponentProps = TOwnProps & StylesApiProps<any> & { variant?: TVariants[number]; intent?: string };

  (Component as any).extend = makeExtendEntry<DefineComponentProps>(config.name);

  return Component as unknown as DefineComponentResult<TOwnProps, TSelectors, TVariants, TVocabAxes>;
}
