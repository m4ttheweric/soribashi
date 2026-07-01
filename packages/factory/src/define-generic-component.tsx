import type { ResolvedTheme } from '@soribashi/theme';
import { type Ref, forwardRef } from 'react';
import { autoVars } from './auto-vars.ts';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { makeExtendEntry } from './make-extend-entry.ts';
import type { ThemeComponentEntry } from './theme-component-entry.ts';
import type { ComponentExtendConfig } from './types/component-extend.ts';
import type { FactoryPayload } from './types/factory-payload.ts';
import type { GetStylesFn } from './types/render-context.ts';
import type { VariantProp, VocabularyAxis } from './types/vocabulary-axes.ts';
import { validateVocabularyProps } from './validate-vocabulary-props.ts';
import { makeWithProps } from './with-props.tsx';

/**
 * Render ctx for generic recipes. `props` stays `any` by design: the Wave 4A
 * TSignature pattern owns call-site prop typing (the author-supplied generic
 * call signature cannot be projected back into the render body), so internal
 * prop safety comes from the author's own narrowing. `getStyles` IS typed
 * against the declared selectors — annotate the render param with
 * `GenericRenderCtx<typeof selectors>` when passing TSignature explicitly
 * (explicit type args disable inference of the remaining params).
 */
export interface GenericRenderCtx<TSelectors extends readonly string[] = readonly string[]> {
  props: any;
  getStyles: GetStylesFn<{ props: any; stylesNames: TSelectors[number] } & FactoryPayload>;
  ref: Ref<unknown>;
}

export interface DefineGenericComponentConfig<
  TSelectors extends readonly string[] = readonly string[],
  TVariants extends readonly string[] = readonly string[],
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
> {
  name: string;
  vocabularyAxes?: TVocabAxes;
  selectors: TSelectors;
  variants?: TVariants;
  classes?: Partial<Record<TSelectors[number], string>>;
  defaults?: Record<string, unknown> & VariantProp<TVariants>;
  vars?: (
    theme: ResolvedTheme,
    props: any,
  ) => Partial<Record<TSelectors[number], Record<string, string>>>;
  render: (ctx: GenericRenderCtx<TSelectors>) => React.ReactNode;
}

/**
 * The shape of a generic component: a function generic over T that takes
 * props (depending on T) and returns a React element. This is the type we
 * want to preserve through `withProps`.
 */
export type GenericComponentFn = <T>(
  props: any & React.RefAttributes<unknown>,
) => React.ReactElement | null;

/**
 * The static methods attached to a generic component. `withProps` returns
 * the same generic shape so callers can continue to pass type parameters.
 */
export interface GenericComponentStatics<TSignature = GenericComponentFn> {
  extend: (cfg: ComponentExtendConfig<any>) => ThemeComponentEntry<any>;
  /** Preserves the generic signature on the partially-applied component. */
  withProps: (presets: Record<string, unknown>) => TSignature & GenericComponentStatics<TSignature>;
  classes?: Record<string, string>;
  displayName?: string;
}

/**
 * Defines a generic component preserved through the type system. Use for
 * components like Select<TItem>, ComboBox<TOption>, MultiSelect<TItem>, etc.
 *
 * The returned function is generic: `Select<User>(props)` types `props` against
 * `User`. `withProps` preserves this — `Select.withProps({ searchable: true })`
 * returns a component that's still generic; you can still write `<Result<User> ...>`.
 *
 * The type argument is the author-supplied generic call SIGNATURE (mirrors
 * Mantine's `genericFactory<Payload>(ui: Payload['signature'])`). It defaults to
 * `GenericComponentFn` for callers that do not need inference. Runtime behavior
 * is identical regardless of the signature; all safety is at the call site.
 */
export function defineGenericComponent<
  TSignature = GenericComponentFn,
  const TSelectors extends readonly string[] = readonly string[],
  const TVariants extends readonly string[] = readonly string[],
  const TVocabAxes extends readonly VocabularyAxis[] = readonly [],
>(
  config: DefineGenericComponentConfig<TSelectors, TVariants, TVocabAxes>,
): TSignature & GenericComponentStatics<TSignature> {
  const hasVariants = (config.variants?.length ?? 0) > 0;

  const Component = forwardRef<unknown, any>((rawProps, ref) => {
    const merged = useProps(config.name, (config.defaults ?? null) as any, rawProps as any);

    validateVocabularyProps(
      config.name,
      config.vocabularyAxes ?? [],
      merged as Record<string, unknown>,
      config.variants,
    );

    const varsResolver = config.vars
      ? (theme: ResolvedTheme, props: any) => config.vars!(theme, props)
      : (theme: ResolvedTheme, props: any) =>
          autoVars(theme, config.name, props, hasVariants) as any;

    const getStyles = useStyles({
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
  (Component as any).extend = makeExtendEntry<any>(config.name);
  (Component as any).withProps = makeWithProps(Component as any);

  return Component as unknown as TSignature & GenericComponentStatics<TSignature>;
}
