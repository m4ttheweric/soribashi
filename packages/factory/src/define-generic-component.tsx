import { forwardRef } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { autoVars } from './auto-vars.ts';
import { makeWithProps } from './with-props.tsx';

const identity = <T,>(value: T): T => value;

export interface DefineGenericComponentConfig {
  name: string;
  selectors: readonly string[];
  variants?: readonly string[];
  classes?: Record<string, string>;
  defaults?: Record<string, unknown>;
  vars?: (theme: ResolvedTheme, props: any) => Record<string, Record<string, string>>;
  render: (ctx: { props: any; getStyles: any; ref: any }) => React.ReactNode;
}

/**
 * Defines a generic component preserved through the type system. Use for
 * components like Select<TItem>, ComboBox<TOption>, MultiSelect<TItem>, etc.
 */
export function defineGenericComponent<TOwnPropsTemplate>(
  config: DefineGenericComponentConfig,
): <T>(props: any & React.RefAttributes<unknown>) => React.ReactElement | null {
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
  (Component as any).classes = config.classes;
  (Component as any).extend = identity;
  (Component as any).withProps = makeWithProps(Component as any);

  return Component as any;
}
