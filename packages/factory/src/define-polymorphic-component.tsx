import { forwardRef, type ElementType, type Ref } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { autoVars } from './auto-vars.ts';
import { makeWithProps } from './with-props.tsx';
import type { FactoryPayload } from './types/factory-payload.ts';
import type { StylesApiProps } from './types/props.ts';
import type { GetStylesFn } from './types/render-context.ts';
import type { PolymorphicComponentProps } from './types/polymorphic.ts';

const identity = <T,>(value: T): T => value;

export interface DefinePolymorphicComponentConfig<
  TOwnProps,
  TDefaultAs extends ElementType,
  TSelectors extends readonly string[],
  TVariants extends readonly string[],
> {
  name: string;
  defaultElement: TDefaultAs;
  selectors: TSelectors;
  variants?: TVariants;
  classes?: Partial<Record<TSelectors[number], string>>;
  defaults?: Partial<TOwnProps>;
  vars?: (
    theme: ResolvedTheme,
    props: TOwnProps & { variant?: TVariants[number]; intent?: string },
  ) => Partial<Record<TSelectors[number], Record<string, string>>>;
  render: (ctx: {
    Element: ElementType;
    props: TOwnProps & StylesApiProps<any> & { variant?: TVariants[number]; intent?: string };
    getStyles: GetStylesFn<
      { props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload
    >;
    ref: Ref<unknown>;
  }) => React.ReactNode;
}

/**
 * Polymorphic component definition with `as` prop support.
 */
export function definePolymorphicComponent<
  TOwnProps,
  TDefaultAs extends ElementType,
  TSelectors extends readonly string[] = readonly string[],
  TVariants extends readonly string[] = readonly string[],
>(config: DefinePolymorphicComponentConfig<TOwnProps, TDefaultAs, TSelectors, TVariants>) {
  const hasVariants = (config.variants?.length ?? 0) > 0;

  const Component = forwardRef<unknown, any>((rawProps, ref) => {
    const { as: asProp, ...rest } = rawProps as { as?: ElementType };
    const Element: ElementType = asProp ?? config.defaultElement;

    const merged = useProps<TOwnProps & StylesApiProps<any>>(
      config.name,
      (config.defaults ?? null) as Partial<TOwnProps & StylesApiProps<any>> | null,
      rest as TOwnProps & StylesApiProps<any>,
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
      Element,
      props: merged as any,
      getStyles: getStyles as any,
      ref,
    }) as React.ReactElement;
  });

  Component.displayName = config.name;
  (Component as any).classes = config.classes;
  (Component as any).extend = identity;
  (Component as any).withProps = makeWithProps(Component as any);

  // The component itself is generic over the target element type.
  // Callers can pass `as="span"` and TS instantiates TAs='span' so the
  // resulting props correctly include span's HTML attributes.
  type PolymorphicComponentLike = (<TAs extends ElementType = TDefaultAs>(
    props: PolymorphicComponentProps<TAs, TOwnProps & StylesApiProps<any>>,
  ) => React.ReactElement | null) & {
    displayName?: string;
  };

  type WithPropsFn = <TAs extends ElementType = TDefaultAs>(
    presets: Partial<TOwnProps & StylesApiProps<any>> & { as?: TAs },
  ) => PolymorphicComponentLike;

  return Component as unknown as PolymorphicComponentLike & {
    extend: (cfg: any) => any;
    withProps: WithPropsFn;
    classes?: Partial<Record<TSelectors[number], string>>;
    displayName?: string;
  };
}
