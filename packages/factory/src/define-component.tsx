import { forwardRef, type Ref } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { autoVars } from './auto-vars.ts';
import { makeWithProps } from './with-props.tsx';
import type { FactoryPayload } from './types/factory-payload.ts';
import type { StylesApiProps } from './types/props.ts';
import type { GetStylesFn } from './types/render-context.ts';
import type { ThemeComponentEntry } from './theme-component-entry.ts';

const identity = <T,>(value: T): T => value;

export interface DefineComponentConfig<
  TOwnProps,
  TSelectors extends readonly string[],
  TVariants extends readonly string[],
> {
  name: string;
  element?: keyof JSX.IntrinsicElements;
  selectors: TSelectors;
  variants?: TVariants;
  classes?: Partial<Record<TSelectors[number], string>>;
  defaults?: Partial<TOwnProps>;
  vars?: (
    theme: ResolvedTheme,
    props: TOwnProps & { variant?: TVariants[number]; intent?: string },
  ) => Partial<Record<TSelectors[number], Record<string, string>>>;
  render: (ctx: {
    props: TOwnProps & StylesApiProps<any> & { variant?: TVariants[number]; intent?: string };
    getStyles: GetStylesFn<
      { props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload
    >;
    ref: Ref<HTMLElement>;
  }) => React.ReactNode;
}

/**
 * The daily-use component authoring API.
 */
export function defineComponent<
  TOwnProps = Record<string, never>,
  TSelectors extends readonly string[] = readonly string[],
  TVariants extends readonly string[] = readonly string[],
>(config: DefineComponentConfig<TOwnProps, TSelectors, TVariants>) {
  const hasVariants = (config.variants?.length ?? 0) > 0;

  const Component = forwardRef<HTMLElement, any>((rawProps, ref) => {
    const merged = useProps<TOwnProps & StylesApiProps<any>>(
      config.name,
      (config.defaults ?? null) as Partial<TOwnProps & StylesApiProps<any>> | null,
      rawProps as TOwnProps & StylesApiProps<any>,
    );

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
  type DefineComponentProps = TOwnProps & StylesApiProps<any> & { variant?: TVariants[number]; intent?: string };

  (Component as any).withDefaults = (
    defaults: Partial<DefineComponentProps>,
  ): ThemeComponentEntry<DefineComponentProps> => ({
    __soribashiThemeEntry: true as const,
    name: config.name,
    defaultProps: defaults,
  });

  return Component as unknown as React.ForwardRefExoticComponent<
    TOwnProps & StylesApiProps<any> & React.RefAttributes<HTMLElement>
  > & {
    extend: (cfg: any) => any;
    withProps: (
      presets: Partial<TOwnProps & StylesApiProps<any>>,
    ) => React.ComponentType<TOwnProps & StylesApiProps<any>>;
    withDefaults: (
      defaults: Partial<DefineComponentProps>,
    ) => ThemeComponentEntry<DefineComponentProps>;
    classes?: Partial<Record<TSelectors[number], string>>;
    displayName?: string;
  };
}
