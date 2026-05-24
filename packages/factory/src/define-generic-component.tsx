import { forwardRef } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { autoVars } from './auto-vars.ts';
import { makeWithProps } from './with-props.tsx';
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
export interface GenericComponentStatics {
  extend: (cfg: ComponentExtendConfig<any>) => ThemeComponentEntry<any>;
  withProps: (presets: any) => GenericComponentFn & GenericComponentStatics;
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
 * @deprecated — no current consumers; will be removed in a future release if no use case emerges.
 */
export function defineGenericComponent<TOwnPropsTemplate>(
  config: DefineGenericComponentConfig,
): GenericComponentFn & GenericComponentStatics {
  const hasVariants = (config.variants?.length ?? 0) > 0;

  const Component = forwardRef<unknown, any>((rawProps, ref) => {
    const merged = useProps(config.name, (config.defaults ?? null) as any, rawProps as any);

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
    extendConfig: ComponentExtendConfig<TOwnPropsTemplate>,
  ): ThemeComponentEntry<TOwnPropsTemplate> => ({
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

  return Component as unknown as GenericComponentFn & GenericComponentStatics;
}
