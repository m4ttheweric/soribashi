import type { CSSProperties } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { cn } from '../cn.ts';
import { useTheme } from '../provider/use-theme.ts';
import type { FactoryPayload, FactoryStylesNames } from '../types/factory-payload.ts';
import type { ClassNames, Styles, Attributes } from '../types/props.ts';
import type {
  GetStylesFn,
  GetStylesResult,
  GetStylesOptions,
} from '../types/render-context.ts';

export interface UseStylesConfig<P extends FactoryPayload> {
  name: string;
  classes?: Partial<Record<FactoryStylesNames<P>, string>>;
  className?: string;
  style?: CSSProperties;
  classNames?: ClassNames<P>;
  styles?: Styles<P>;
  attributes?: Attributes<P>;
  unstyled?: boolean;
  props: P['props'];
  varsResolver?: (
    theme: ResolvedTheme,
    props: P['props'],
  ) => Partial<Record<FactoryStylesNames<P>, Record<string, string>>>;
}

/**
 * Returns a `getStyles(selector, options?)` function. Resolution precedence
 * (highest to lowest): instance props > theme.components[name] > built-in classes.
 */
export function useStyles<P extends FactoryPayload>(
  config: UseStylesConfig<P>,
): GetStylesFn<P> {
  const theme = useTheme();
  const themeComponent = theme.components[config.name] ?? {};

  return (selector, options?: GetStylesOptions): GetStylesResult => {
    const isRoot = (selector as string) === 'root';

    // Suppress built-in class when config or per-call unstyled is set.
    const isUnstyled = config.unstyled || options?.unstyled;
    const builtIn = isUnstyled ? '' : (config.classes?.[selector] ?? '');

    const themeClassNames = resolveClassNames(themeComponent.classNames, theme, config.props);
    const themeClass = themeClassNames[selector as string] ?? '';

    // Root-level classNames (from <Root classNames={...}>).
    const instanceClassNamesRaw = config.classNames as ClassNames<P> | undefined;
    const instanceClassNames = resolveClassNames(instanceClassNamesRaw, theme, config.props);
    const instanceClass = instanceClassNames[selector as string] ?? '';

    // Part instance classNames (forwarded from the compound part's own props,
    // matching Mantine's TabsTab pattern: ctx.getStyles('tab', { classNames, ... })).
    const partClassNamesRaw = options?.classNames as ClassNames<P> | undefined;
    const partClassNames = resolveClassNames(partClassNamesRaw, theme, config.props);
    const partClassNamesClass = partClassNames[selector as string] ?? '';

    // Render-time per-call classNames override (from inside the render function,
    // e.g. getStyles({ callClassNames: { icon: 'y' } })). Resolved independently
    // so neither layer clobbers the other.
    const callClassNamesRaw = options?.callClassNames as ClassNames<P> | undefined;
    const callClassNames = resolveClassNames(callClassNamesRaw, theme, config.props);
    const callClassNamesClass = callClassNames[selector as string] ?? '';

    const rootInstanceClass = isRoot ? (config.className ?? '') : '';
    const callSiteClass = options?.className ?? '';

    const className = cn(builtIn, themeClass, instanceClass, partClassNamesClass, callClassNamesClass, rootInstanceClass, callSiteClass);

    const themeStyles = resolveStyles(themeComponent.styles, theme, config.props);
    const instanceStylesRaw = config.styles as Styles<P> | undefined;
    const instanceStyles = resolveStyles(instanceStylesRaw, theme, config.props);
    // Part instance styles (Mantine-matched layer).
    const partStylesRaw = options?.styles as Styles<P> | undefined;
    const partStyles = resolveStyles(partStylesRaw, theme, config.props);
    // Render-time per-call styles override.
    const callStylesRaw = options?.callStyles as Styles<P> | undefined;
    const callStyles = resolveStyles(callStylesRaw, theme, config.props);

    const themeVarsResolverFromTheme = themeComponent.vars
      ? themeComponent.vars(theme, config.props)
      : {};
    const builtInVars = config.varsResolver ? config.varsResolver(theme, config.props) : {};

    // Per-call vars from the part instance (forwarded via options.vars).
    const partVarsResolved = options?.vars
      ? (options.vars as (theme: ResolvedTheme, props: P['props']) => Partial<Record<string, Record<string, string>>>)(theme, config.props)
      : {};

    const styleParts: CSSProperties[] = [
      themeStyles[selector as string] ?? {},
      instanceStyles[selector as string] ?? {},
      partStyles[selector as string] ?? {},
      callStyles[selector as string] ?? {},
      filterDefinedValues(
        ((builtInVars as Record<string, unknown>)[selector as string] as Record<string, unknown> | undefined) ?? {},
      ) as CSSProperties,
      filterDefinedValues(
        (themeVarsResolverFromTheme[selector as string] as Record<string, unknown> | undefined) ?? {},
      ) as CSSProperties,
      filterDefinedValues(
        (partVarsResolved[selector as string] as Record<string, unknown> | undefined) ?? {},
      ) as CSSProperties,
    ];

    if (isRoot && config.style) styleParts.push(config.style);
    if (options?.style) styleParts.push(options.style);

    const style = mergeStyles(styleParts);

    const themeAttrs = (themeComponent.attributes?.[selector as string] ?? {}) as Record<
      string,
      unknown
    >;
    const instanceAttrs = (config.attributes?.[selector] as Record<string, unknown>) ?? {};
    // Per-call attributes from the part instance (forwarded via options.attributes).
    const partAttrsMap = options?.attributes as Partial<Record<string, Record<string, unknown>>> | undefined;
    const partCallAttrs = (partAttrsMap?.[selector as string] ?? {}) as Record<string, unknown>;

    const result: GetStylesResult = {
      className,
      ...themeAttrs,
      ...instanceAttrs,
      ...partCallAttrs,
    };

    if (Object.keys(style).length > 0) result.style = style;
    if (options?.variant !== undefined) {
      result['data-variant' as keyof GetStylesResult] = options.variant as never;
    }
    if (options?.active === true) {
      result['data-active' as keyof GetStylesResult] = true as never;
    }

    return result;
  };
}

function resolveClassNames<P extends FactoryPayload>(
  cn: ClassNames<P> | undefined,
  theme: ResolvedTheme,
  props: P['props'],
): Record<string, string> {
  if (!cn) return {};
  if (typeof cn === 'function') return cn(theme, props) as Record<string, string>;
  return cn as Record<string, string>;
}

function resolveStyles<P extends FactoryPayload>(
  s: Styles<P> | undefined,
  theme: ResolvedTheme,
  props: P['props'],
): Record<string, CSSProperties> {
  if (!s) return {};
  if (typeof s === 'function') return s(theme, props) as Record<string, CSSProperties>;
  return s as Record<string, CSSProperties>;
}

function mergeStyles(parts: CSSProperties[]): CSSProperties {
  return parts.reduce((acc, p) => Object.assign(acc, p), {} as CSSProperties);
}

/**
 * Strips keys with `undefined` values from a plain object.
 * Mirrors Mantine's `filterProps` used in `mergeVars` to ensure CSS variable
 * maps never pass `undefined` values into the style object.
 *
 * Reference: mantine/packages/@mantine/core/src/core/styles-api/use-styles/get-style/resolve-vars/merge-vars.ts
 */
function filterDefinedValues(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}
