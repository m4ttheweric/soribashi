import type { CSSProperties } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { cn } from '../cn.ts';
import { useTheme } from '../provider/use-theme.ts';
import type { FactoryPayload, FactoryStylesNames } from '../types/factory-payload.ts';
import type { ClassNames, Styles, Vars, Attributes } from '../types/props.ts';
import type {
  GetStylesFn,
  GetStylesResult,
  GetStylesOptions,
} from '../types/render-context.ts';

export interface UseStylesConfig<P extends FactoryPayload> {
  /**
   * Theme lookup name(s). With an array, theme entries are resolved for every
   * listed name and later names take precedence (Mantine's
   * `name: string | string[]` contract for compound sub-components).
   */
  name: string | string[];
  classes?: Partial<Record<FactoryStylesNames<P>, string>>;
  className?: string;
  style?: CSSProperties;
  classNames?: ClassNames<P>;
  styles?: Styles<P>;
  vars?: Vars<P>;
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
  const baseNames = Array.isArray(config.name) ? config.name : [config.name];

  return (selector, options?: GetStylesOptions): GetStylesResult => {
    const isRoot = (selector as string) === 'root';

    // Compound parts append their flat part name (e.g. TabsTab) per call so a
    // theme entry produced by `Part.extend({...})` applies to the part's slots.
    const names = options?.themeName ? [...baseNames, options.themeName] : baseNames;
    const themeEntries = names.map((n) => theme.components[n] ?? {});

    // Suppress built-in class when config or per-call unstyled is set.
    const isUnstyled = config.unstyled || options?.unstyled;
    const builtIn = isUnstyled ? '' : (config.classes?.[selector] ?? '');

    const themeClass = cn(
      ...themeEntries.map(
        (entry) => resolveClassNames(entry.classNames, theme, config.props)[selector as string] ?? '',
      ),
    );

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

    const themeStyles = mergeStyles(
      themeEntries.map(
        (entry) => resolveStyles(entry.styles, theme, config.props)[selector as string] ?? {},
      ),
    );
    const instanceStylesRaw = config.styles as Styles<P> | undefined;
    const instanceStyles = resolveStyles(instanceStylesRaw, theme, config.props);
    // Part instance styles (Mantine-matched layer).
    const partStylesRaw = options?.styles as Styles<P> | undefined;
    const partStyles = resolveStyles(partStylesRaw, theme, config.props);
    // Render-time per-call styles override.
    const callStylesRaw = options?.callStyles as Styles<P> | undefined;
    const callStyles = resolveStyles(callStylesRaw, theme, config.props);

    // Undefined values are filtered per entry, so a later entry's undefined
    // never erases an earlier entry's value.
    const themeVars = mergeStyles(
      themeEntries.map((entry) =>
        filterDefinedValues(
          ((entry.vars ? entry.vars(theme, config.props) : {}) as Record<string, unknown>)[
            selector as string
          ] as Record<string, unknown> ?? {},
        ) as CSSProperties,
      ),
    );
    const builtInVars = config.varsResolver ? config.varsResolver(theme, config.props) : {};

    // Instance vars (from the component's own `vars` prop). Mantine order:
    // varsResolver -> theme component vars -> instance vars (instance highest).
    const instanceVarsResolved = config.vars ? config.vars(theme, config.props) : {};

    // Per-call vars from the part instance (forwarded via options.vars).
    const partVarsResolved = options?.vars
      ? (options.vars as (theme: ResolvedTheme, props: P['props']) => Partial<Record<string, Record<string, string>>>)(theme, config.props)
      : {};

    const styleParts: CSSProperties[] = [
      themeStyles,
      instanceStyles[selector as string] ?? {},
      partStyles[selector as string] ?? {},
      callStyles[selector as string] ?? {},
      filterDefinedValues(
        ((builtInVars as Record<string, unknown>)[selector as string] as Record<string, unknown> | undefined) ?? {},
      ) as CSSProperties,
      themeVars,
      filterDefinedValues(
        ((instanceVarsResolved as Record<string, unknown>)[selector as string] as Record<string, unknown> | undefined) ?? {},
      ) as CSSProperties,
      filterDefinedValues(
        (partVarsResolved[selector as string] as Record<string, unknown> | undefined) ?? {},
      ) as CSSProperties,
    ];

    if (isRoot && config.style) styleParts.push(config.style);
    if (options?.style) styleParts.push(options.style);

    const style = mergeStyles(styleParts);

    const themeAttrs = sanitizeAttributes(
      Object.assign(
        {},
        ...themeEntries.map((entry) => entry.attributes?.[selector as string] ?? {}),
      ) as Record<string, unknown>,
      names[0]!,
      selector as string,
    );
    const instanceAttrs = sanitizeAttributes(
      (config.attributes?.[selector] as Record<string, unknown>) ?? {},
      names[0]!,
      selector as string,
    );
    // Per-call attributes from the part instance (forwarded via options.attributes).
    const partAttrsMap = options?.attributes as Partial<Record<string, Record<string, unknown>>> | undefined;
    const partCallAttrs = sanitizeAttributes(
      (partAttrsMap?.[selector as string] ?? {}) as Record<string, unknown>,
      names[0]!,
      selector as string,
    );

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
/**
 * Drops `className` and `style` from an attributes map. Attributes are spread
 * into the getStyles result AFTER the computed className (and the computed
 * style is assigned after them), so either key would silently fight the
 * styles-API output. Warn in dev and route authors to classNames/styles.
 */
function sanitizeAttributes(
  attrs: Record<string, unknown>,
  componentName: string,
  selector: string,
): Record<string, unknown> {
  if (!('className' in attrs) && !('style' in attrs)) return attrs;
  if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(
      `[soribashi] attributes for ${componentName} slot "${selector}" contain className/style; these keys are ignored. Use classNames/styles instead.`,
    );
  }
  const { className: _className, style: _style, ...rest } = attrs;
  return rest;
}

function filterDefinedValues(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}
