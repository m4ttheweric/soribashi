import type { ResolvedTheme } from '@soribashi/theme';
import { forwardRef, type JSX, type Ref } from 'react';
import { autoVars } from './auto-vars.ts';
import { buildDataAttrs } from './data-attrs.ts';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { makeExtendEntry } from './make-extend-entry.ts';
import { attachRecipeMeta } from './recipe-meta.ts';
import type { UniversalStyleProps } from './style-props/style-props.types.ts';
import { useStyleProps } from './style-props/use-style-props.tsx';
import type { ThemeComponentEntry } from './theme-component-entry.ts';
import type { ComponentExtendConfig } from './types/component-extend.ts';
import type { FactoryPayload } from './types/factory-payload.ts';
import type { StylesApiProps } from './types/props.ts';
import type { GetStylesFn } from './types/render-context.ts';
import type {
  InjectedVocabularyProps,
  VariantProp,
  VocabularyAxis,
} from './types/vocabulary-axes.ts';
import { validateVocabularyProps } from './validate-vocabulary-props.ts';
import { makeWithProps } from './with-props.tsx';

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
  /**
   * NoInfer keeps `defaults` out of TOwnProps inference: without it, a
   * zero-type-param recipe with `defaults: { size: 'md' }` locked `size` to
   * the literal 'md' at every call site (the README footgun). Own-prop
   * defaults now require TOwnProps to come from an explicit type param or an
   * annotated render ctx; vocabulary-axis and variant defaults keep working
   * param-free via the other intersection members.
   */
  defaults?: Partial<
    NoInfer<TOwnProps> & InjectedVocabularyProps<TVocabAxes> & VariantProp<TVariants>
  >;
  vars?: (
    theme: ResolvedTheme,
    props: TOwnProps & { variant?: TVariants[number]; intent?: string },
  ) => Partial<Record<TSelectors[number], Record<string, string>>>;
  render: (ctx: {
    props: TOwnProps &
      InjectedVocabularyProps<TVocabAxes> &
      StylesApiProps<any> & { variant?: TVariants[number]; intent?: string };
    getStyles: GetStylesFn<{ props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload>;
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
    presets: Partial<
      DefineComponentPublicProps<TOwnProps, TSelectors, TVariants, TVocabAxes, TExtra>
    >,
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
  StylesApiProps<{ props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload> &
  UniversalStyleProps;

/**
 * The daily-use component authoring API.
 */
export function defineComponent<
  // Record<never, never> (no index signature) rather than Record<string, never>:
  // an index signature of `never` would poison the vocabulary-axis and styles
  // intersections for zero-type-param recipes now that NoInfer keeps `defaults`
  // out of TOwnProps inference.
  TOwnProps = Record<never, never>,
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

    const sp = useStyleProps(merged as Record<string, unknown>);

    validateVocabularyProps(config.name, config.vocabularyAxes ?? [], sp.rest, config.variants);

    const varsResolver = config.vars
      ? (theme: ResolvedTheme, props: any) => config.vars!(theme, props)
      : (theme: ResolvedTheme, props: any) =>
          autoVars(theme, config.name, props, hasVariants) as any;

    const getStyles = useStyles<
      { props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload
    >({
      name: config.name,
      classes: config.classes as any,
      className: (sp.rest as any).className,
      style: (sp.rest as any).style,
      classNames: (sp.rest as any).classNames,
      styles: (sp.rest as any).styles,
      vars: (sp.rest as any).vars,
      attributes: (sp.rest as any).attributes,
      unstyled: (sp.rest as any).unstyled,
      dataAttrs: buildDataAttrs(config.vocabularyAxes ?? [], hasVariants, sp.rest),
      props: sp.rest as any,
      varsResolver: varsResolver as any,
      stylePropsStyle: sp.rootStyle as any,
      stylePropsClassName: sp.rootClassName,
    });

    const rendered = config.render({
      props: sp.rest as any,
      getStyles: getStyles as any,
      ref,
    }) as React.ReactElement;

    return sp.styleNode ? (
      <>
        {sp.styleNode}
        {rendered}
      </>
    ) : (
      rendered
    );
  });

  Component.displayName = config.name;
  attachRecipeMeta(Component, {
    builder: 'defineComponent',
    name: config.name,
    slots: config.selectors,
    parts: [],
    vocabularyAxes: config.vocabularyAxes ?? [],
    variants: config.variants ?? [],
    defaults: config.defaults ?? {},
  });
  (Component as any).__vocabularyAxes = config.vocabularyAxes ?? [];
  (Component as any).classes = config.classes;
  (Component as any).withProps = makeWithProps(Component as any);
  type DefineComponentProps = TOwnProps &
    StylesApiProps<any> & { variant?: TVariants[number]; intent?: string };

  (Component as any).extend = makeExtendEntry<DefineComponentProps>(config.name);

  return Component as unknown as DefineComponentResult<
    TOwnProps,
    TSelectors,
    TVariants,
    TVocabAxes
  >;
}
