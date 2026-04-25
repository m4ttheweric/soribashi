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

    const builtIn = config.unstyled ? '' : (config.classes?.[selector] ?? '');

    const themeClassNames = resolveClassNames(themeComponent.classNames, theme, config.props);
    const themeClass = themeClassNames[selector as string] ?? '';

    const instanceClassNamesRaw = config.classNames as ClassNames<P> | undefined;
    const instanceClassNames = resolveClassNames(instanceClassNamesRaw, theme, config.props);
    const instanceClass = instanceClassNames[selector as string] ?? '';

    const rootInstanceClass = isRoot ? (config.className ?? '') : '';
    const callSiteClass = options?.className ?? '';

    const className = cn(builtIn, themeClass, instanceClass, rootInstanceClass, callSiteClass);

    const themeStyles = resolveStyles(themeComponent.styles, theme, config.props);
    const instanceStylesRaw = config.styles as Styles<P> | undefined;
    const instanceStyles = resolveStyles(instanceStylesRaw, theme, config.props);
    const themeVarsResolverFromTheme = themeComponent.vars
      ? themeComponent.vars(theme, config.props)
      : {};
    const builtInVars = config.varsResolver ? config.varsResolver(theme, config.props) : {};

    const styleParts: CSSProperties[] = [
      themeStyles[selector as string] ?? {},
      instanceStyles[selector as string] ?? {},
      ((builtInVars as Record<string, unknown>)[selector as string] as CSSProperties | undefined) ?? {},
      (themeVarsResolverFromTheme[selector as string] as CSSProperties | undefined) ?? {},
    ];

    if (isRoot && config.style) styleParts.push(config.style);
    if (options?.style) styleParts.push(options.style);

    const style = mergeStyles(styleParts);

    const themeAttrs = (themeComponent.attributes?.[selector as string] ?? {}) as Record<
      string,
      unknown
    >;
    const instanceAttrs = (config.attributes?.[selector] as Record<string, unknown>) ?? {};

    const result: GetStylesResult = {
      className,
      ...themeAttrs,
      ...instanceAttrs,
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
