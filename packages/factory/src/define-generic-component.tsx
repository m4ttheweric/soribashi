import { forwardRef } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { autoVars } from './auto-vars.ts';
import { makeWithProps } from './with-props.tsx';
import { validateVocabularyProps } from './validate-vocabulary-props.ts';
import type { ThemeComponentEntry } from './theme-component-entry.ts';
import type { ComponentExtendConfig } from './types/component-extend.ts';
import type { VocabularyAxis } from './types/vocabulary-axes.ts';

export interface DefineGenericComponentConfig {
  name: string;
  vocabularyAxes?: readonly VocabularyAxis[];
  selectors: readonly string[];
  variants?: readonly string[];
  classes?: Record<string, string>;
  defaults?: Record<string, unknown>;
  vars?: (theme: ResolvedTheme, props: any) => Record<string, Record<string, string>>;
  render: (ctx: { props: any; getStyles: any; ref: any }) => React.ReactNode;
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
export function defineGenericComponent<TSignature = GenericComponentFn>(
  config: DefineGenericComponentConfig,
): TSignature & GenericComponentStatics<TSignature> {
  const hasVariants = (config.variants?.length ?? 0) > 0;

  const Component = forwardRef<unknown, any>((rawProps, ref) => {
    const merged = useProps(config.name, (config.defaults ?? null) as any, rawProps as any);

    validateVocabularyProps(config.name, config.vocabularyAxes ?? [], merged as Record<string, unknown>);

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
  (Component as any).extend = (
    extendConfig: ComponentExtendConfig<any>,
  ): ThemeComponentEntry<any> => ({
    __soribashiThemeEntry: true as const,
    name: config.name,
    vocabulary: extendConfig.vocabulary as any,
    defaultProps: extendConfig.defaultProps ?? {},
    classNames: extendConfig.classNames,
    styles: extendConfig.styles,
    vars: extendConfig.vars,
    attributes: extendConfig.attributes,
  });
  (Component as any).withProps = makeWithProps(Component as any);

  return Component as unknown as TSignature & GenericComponentStatics<TSignature>;
}
