import { forwardRef, type ComponentPropsWithoutRef, type ElementType, type Ref } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { autoVars } from './auto-vars.ts';
import { makeWithProps } from './with-props.tsx';
import { validateVocabularyProps } from './validate-vocabulary-props.ts';
import type { FactoryPayload } from './types/factory-payload.ts';
import type { StylesApiProps } from './types/props.ts';
import type { GetStylesFn } from './types/render-context.ts';
import type { PolymorphicComponentProps } from './types/polymorphic.ts';
import type { ThemeComponentEntry } from './theme-component-entry.ts';
import { makeExtendEntry } from './make-extend-entry.ts';
import type { ComponentExtendConfig } from './types/component-extend.ts';
import type { VocabularyAxis, InjectedVocabularyProps, VariantProp } from './types/vocabulary-axes.ts';

/**
 * Render-context type for polymorphic recipes (e.g., Button). Authors type
 * their `render` function's parameter via this so destructuring is fully typed
 * — no `as` casts needed inside the render body.
 *
 * `props` is the intersection of:
 *   - `TOwnProps` — the recipe's own prop interface
 *   - `StylesApiProps<TPayload>` — framework keys (className, style, classNames,
 *     styles, vars, attributes, unstyled) typed against the factory payload, NOT
 *     `<any>`. Destructuring these gives proper types.
 *   - `Omit<ComponentPropsWithoutRef<TDefaultAs>, ...>` — HTML attributes for the
 *     default element (e.g., `disabled` / `onClick` for `<button>`). The `Omit`
 *     guards against TOwnProps overrides for shared keys.
 *   - variant / intent — populated by `useProps` from theme + recipe defaults.
 *
 * The `...rest` after destructuring TOwnProps + framework keys is structurally
 * `ComponentPropsWithoutRef<TDefaultAs>`-compatible, so spreading on `<Element>`
 * works without an index-signature cast.
 *
 * Resolves the Wave 1 Gap 2 "documented convention" — the cast block is gone;
 * destructuring is the only remaining boilerplate (kept per the composition
 * rationale: recipes wrapping inner primitives need to forward framework keys).
 */
export type PolymorphicRenderCtx<
  TOwnProps,
  TDefaultAs extends ElementType,
  TSelectors extends readonly string[] = readonly string[],
  TVariants extends readonly string[] = readonly string[],
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
> = {
  Element: ElementType;
  props: TOwnProps
    & InjectedVocabularyProps<TVocabAxes>
    & StylesApiProps<{ props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload>
    & Omit<ComponentPropsWithoutRef<TDefaultAs>, keyof TOwnProps | keyof StylesApiProps<FactoryPayload>>
    & { variant?: TVariants[number]; intent?: string };
  getStyles: GetStylesFn<
    { props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload
  >;
  ref: Ref<unknown>;
};

export interface DefinePolymorphicComponentConfig<
  TOwnProps,
  TDefaultAs extends ElementType,
  TSelectors extends readonly string[],
  TVariants extends readonly string[],
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
> {
  name: string;
  defaultElement: TDefaultAs;
  vocabularyAxes?: TVocabAxes;
  selectors: TSelectors;
  variants?: TVariants;
  classes?: Partial<Record<TSelectors[number], string>>;
  defaults?: Partial<TOwnProps & InjectedVocabularyProps<TVocabAxes>>;
  vars?: (
    theme: ResolvedTheme,
    props: TOwnProps & { variant?: TVariants[number]; intent?: string },
  ) => Partial<Record<TSelectors[number], Record<string, string>>>;
  render: (ctx: PolymorphicRenderCtx<TOwnProps, TDefaultAs, TSelectors, TVariants, TVocabAxes>) => React.ReactNode;
}

/**
 * Polymorphic component definition with `as` prop support.
 */
export function definePolymorphicComponent<
  TOwnProps,
  TDefaultAs extends ElementType,
  TSelectors extends readonly string[] = readonly string[],
  TVariants extends readonly string[] = readonly string[],
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
>(config: DefinePolymorphicComponentConfig<TOwnProps, TDefaultAs, TSelectors, TVariants, TVocabAxes>) {
  const hasVariants = (config.variants?.length ?? 0) > 0;

  const Component = forwardRef<unknown, any>((rawProps, ref) => {
    const merged = useProps<TOwnProps & StylesApiProps<any>>(
      config.name,
      (config.defaults ?? null) as Partial<TOwnProps & StylesApiProps<any>> | null,
      rawProps as TOwnProps & StylesApiProps<any>,
    );

    // `as` resolves AFTER useProps (Mantine semantics) so theme defaultProps
    // can retarget the element; stripping it here keeps it off the DOM.
    const { as: asProp, ...rest } = merged as { as?: ElementType };
    const Element: ElementType = asProp ?? config.defaultElement;

    validateVocabularyProps(config.name, config.vocabularyAxes ?? [], rest as Record<string, unknown>, config.variants);

    const varsResolver = config.vars
      ? (theme: ResolvedTheme, props: any) => config.vars!(theme, props)
      : (theme: ResolvedTheme, props: any) =>
          autoVars(theme, config.name, props, hasVariants) as any;

    const getStyles = useStyles<
      { props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload
    >({
      name: config.name,
      classes: config.classes as any,
      className: (rest as any).className,
      style: (rest as any).style,
      classNames: (rest as any).classNames,
      styles: (rest as any).styles,
      vars: (rest as any).vars,
      attributes: (rest as any).attributes,
      unstyled: (rest as any).unstyled,
      props: rest as any,
      varsResolver: varsResolver as any,
    });

    return config.render({
      Element,
      props: rest as any,
      getStyles: getStyles as any,
      ref,
    }) as React.ReactElement;
  });

  Component.displayName = config.name;
  (Component as any).__vocabularyAxes = config.vocabularyAxes ?? [];
  (Component as any).classes = config.classes;
  (Component as any).withProps = makeWithProps(Component as any);
  type DefinePolymorphicProps = TOwnProps
    & StylesApiProps<any>
    & Omit<ComponentPropsWithoutRef<TDefaultAs>, keyof TOwnProps | keyof StylesApiProps<FactoryPayload>>
    & { variant?: TVariants[number]; intent?: string };

  (Component as any).extend = makeExtendEntry<DefinePolymorphicProps>(config.name);

  return Component as unknown as PolymorphicComponentResult<
    TOwnProps,
    TDefaultAs,
    TSelectors,
    TVariants,
    TVocabAxes
  >;
}

/**
 * Public call-site props of a raw polymorphic recipe: own props, declared
 * vocabulary axes (string-typed; theme-narrowed via makeBuilders), the
 * recipe's variant tuple, and the selector-keyed styles API.
 */
type PolymorphicPublicProps<
  TOwnProps,
  TSelectors extends readonly string[],
  TVariants extends readonly string[],
  TVocabAxes extends readonly VocabularyAxis[],
> = TOwnProps &
  InjectedVocabularyProps<TVocabAxes> &
  VariantProp<TVariants> &
  StylesApiProps<{ props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload>;

type PolymorphicExtendProps<
  TOwnProps,
  TDefaultAs extends ElementType,
  TSelectors extends readonly string[],
  TVariants extends readonly string[],
  TVocabAxes extends readonly VocabularyAxis[],
> = PolymorphicPublicProps<TOwnProps, TSelectors, TVariants, TVocabAxes> &
  Omit<ComponentPropsWithoutRef<TDefaultAs>, keyof TOwnProps | keyof StylesApiProps<FactoryPayload>> & {
    variant?: TVariants[number];
    intent?: string;
  };

/**
 * The component value produced by a raw `definePolymorphicComponent` call.
 * Generic over the target element at the call site (`as="span"` narrows props
 * to span attributes); `withProps` returns the same shape so static chains
 * (`.withProps().withProps()`, `.withProps().extend()`) keep type-checking.
 */
export type PolymorphicComponentResult<
  TOwnProps,
  TDefaultAs extends ElementType,
  TSelectors extends readonly string[],
  TVariants extends readonly string[],
  TVocabAxes extends readonly VocabularyAxis[],
> = (<TAs extends ElementType = TDefaultAs>(
  props: PolymorphicComponentProps<
    TAs,
    PolymorphicPublicProps<TOwnProps, TSelectors, TVariants, TVocabAxes>
  >,
) => React.ReactElement | null) & {
  withProps: <TAs extends ElementType = TDefaultAs>(
    presets: Partial<PolymorphicPublicProps<TOwnProps, TSelectors, TVariants, TVocabAxes>> & {
      as?: TAs;
    },
  ) => PolymorphicComponentResult<TOwnProps, TDefaultAs, TSelectors, TVariants, TVocabAxes>;
  extend: (
    config: ComponentExtendConfig<
      PolymorphicExtendProps<TOwnProps, TDefaultAs, TSelectors, TVariants, TVocabAxes>
    >,
  ) => ThemeComponentEntry<
    PolymorphicExtendProps<TOwnProps, TDefaultAs, TSelectors, TVariants, TVocabAxes>
  >;
  classes?: Partial<Record<TSelectors[number], string>>;
  displayName?: string;
};
