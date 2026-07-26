import {
  defaultTokens,
  defineComponent,
  getSpacing,
  InlineStyles,
  isDev,
  type ResolvedTheme,
  useRandomClassName,
  useTheme,
} from '@soribashi/core';
import type { ReactNode } from 'react';
import classes from './Grid.module.css';

export const recipeCategory = 1 as const;

export type GridColsValue = number | Partial<Record<'base' | string, number>>;

export interface GridProps {
  /**
   * Number of columns, or a responsive object keyed by breakpoint name
   * (e.g. `{ base: 1, md: 2, xl: 4 }`). Mutually exclusive with
   * `minChildWidth`; deliberately not given a component-level default (see
   * the `Grid` config below), since detecting whether a caller genuinely
   * passed `cols` is how the `minChildWidth` conflict check works. @default 1
   */
  cols?: GridColsValue;
  /** Column gap: theme spacing key or any CSS gap value @default 'md' */
  spacing?: string | number;
  /** Row gap: theme spacing key or any CSS gap value @default `spacing` */
  verticalSpacing?: string | number;
  /**
   * Minimum child width before columns wrap (auto-fit). Mutually exclusive
   * with `cols`; if both are given, `minChildWidth` wins and a dev
   * `console.error` fires once.
   */
  minChildWidth?: string | number;
  children?: ReactNode;
}

export interface ResolvedGridCols {
  base: number;
  media: Array<{ query: string; cols: number }>;
}

const DEFAULT_BREAKPOINT_KEYS = Object.keys(defaultTokens.breakpoint ?? {});

/** Mirrors parse-style-props.ts's breakpointKeysFor: themed keys, else the default map. */
function gridBreakpointKeys(theme: ResolvedTheme): readonly string[] {
  const themed = theme.tokens.breakpoint;
  if (themed && Object.keys(themed).length > 0) return Object.keys(themed);
  return DEFAULT_BREAKPOINT_KEYS;
}

const warnedMissingGridBreakpoints = new Set<string>();

/** Mirrors parse-style-props.ts's mediaQueryFor: themed value first, default-map fallback, dev-warned once per key. */
function gridMediaQueryFor(theme: ResolvedTheme, key: string): string | undefined {
  const themed = theme.tokens.breakpoint?.[key];
  if (themed) return `(min-width: ${themed})`;
  if (isDev() && !warnedMissingGridBreakpoints.has(key)) {
    warnedMissingGridBreakpoints.add(key);
    // eslint-disable-next-line no-console
    console.warn(
      `[soribashi] <Grid> cols: theme.tokens.breakpoint has no "${key}" token; falling back to the default breakpoint map.`,
    );
  }
  const fallback = defaultTokens.breakpoint?.[key];
  return fallback ? `(min-width: ${fallback})` : undefined;
}

const warnedUnknownGridBreakpoints = new Set<string>();

function minWidthInPx(query: string): number {
  const match = query.match(/min-width:\s*([\d.]+)(rem|em|px)?/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const value = Number.parseFloat(match[1]!);
  return match[2] === 'px' ? value : value * 16;
}

/**
 * Resolves a `Grid` `cols` value into a base column count plus a
 * smallest-first list of per-breakpoint overrides. Breakpoint keys resolve
 * through `theme.tokens.breakpoint` with the same per-key semantics as
 * `packages/factory/src/style-props/parse-style-props.ts`'s
 * `breakpointKeysFor`/`mediaQueryFor` (themed value first, the default
 * breakpoint map as a dev-warned fallback); a key that isn't a recognised
 * breakpoint at all is skipped with its own dev warning, rather than
 * silently dropped the way parse-style-props's own iteration-over-known-keys
 * approach would.
 *
 * Exported from Grid.tsx itself, not a fifth recipe file: the four-file rule
 * (packages/ui's authoring-a-recipe skill) means the render path and this
 * module's own test file both reach for the same implementation here.
 */
export function resolveGridCols(cols: GridColsValue, theme: ResolvedTheme): ResolvedGridCols {
  if (typeof cols === 'number') {
    return { base: cols, media: [] };
  }

  const base = cols.base ?? 1;
  const breakpointKeys = gridBreakpointKeys(theme);
  const media: Array<{ query: string; cols: number }> = [];

  for (const [key, value] of Object.entries(cols)) {
    if (key === 'base' || value === undefined) continue;
    if (!breakpointKeys.includes(key)) {
      if (isDev() && !warnedUnknownGridBreakpoints.has(key)) {
        warnedUnknownGridBreakpoints.add(key);
        // eslint-disable-next-line no-console
        console.warn(`[soribashi] <Grid> cols has an unknown breakpoint key "${key}"; skipping.`);
      }
      continue;
    }
    const query = gridMediaQueryFor(theme, key);
    if (query === undefined) continue;
    media.push({ query, cols: value });
  }

  // Smallest-first so later (larger) breakpoints win in source order at
  // equal specificity, matching parse-style-props.ts's sortMediaAscending.
  media.sort((a, b) => minWidthInPx(a.query) - minWidthInPx(b.query));
  return { base, media };
}

let warnedColsMinChildConflict = false;

export const Grid = defineComponent<GridProps>({
  name: 'Grid',
  selectors: ['root'] as const,
  classes,
  defaults: { spacing: 'md' },
  vars: (theme, props) => {
    const p = props as GridProps;
    const hasCols = p.cols !== undefined;
    const hasMinChild = p.minChildWidth !== undefined;

    if (hasCols && hasMinChild && isDev() && !warnedColsMinChildConflict) {
      warnedColsMinChildConflict = true;
      // eslint-disable-next-line no-console
      console.error(
        '[soribashi] <Grid> received both `cols` and `minChildWidth`; `minChildWidth` wins and `cols` is ignored.',
      );
    }

    const spacing = p.spacing ?? 'md';
    const verticalSpacing = p.verticalSpacing ?? spacing;

    const root: Record<string, string> = {
      '--sb-grid-gap-x': getSpacing(spacing) ?? '',
      '--sb-grid-gap-y': getSpacing(verticalSpacing) ?? '',
    };

    if (hasMinChild) {
      root['--sb-grid-min-child'] = getSpacing(p.minChildWidth) ?? String(p.minChildWidth);
    } else {
      const colsValue = hasCols ? p.cols! : 1;
      const resolved = resolveGridCols(colsValue, theme);
      // A genuinely responsive cols value (at least one resolved media
      // entry) must NOT set --sb-grid-cols here: this vars-resolver output
      // becomes an inline style on the element, and an inline declaration
      // beats any non-!important stylesheet rule, including the
      // media-query overrides `render` injects via InlineStyles below. The
      // base value rides in InlineStyles' own `styles` (the same
      // class-scoped rule the media overrides live in) instead, so ordinary
      // cascade rules (the media rule comes later in source order and wins
      // at equal specificity) actually apply. Mirrors
      // parse-style-props.ts's split: a responsive style prop's base value
      // goes into the class rule, never inline.
      if (resolved.media.length === 0) {
        root['--sb-grid-cols'] = String(resolved.base);
      }
    }

    return { root };
  },
  render: ({ props, getStyles, ref }) => {
    // useTheme/useRandomClassName are called unconditionally (React hook
    // rules), same rationale as useStyleProps.tsx's identical pattern: the
    // responsive-vs-static decision below must not change hook call order
    // across renders of the same instance.
    const theme = useTheme();
    const cls = useRandomClassName();
    const {
      cols,
      spacing: _spacing,
      verticalSpacing: _verticalSpacing,
      minChildWidth,
      children,
      classNames: _cn,
      styles: _st,
      vars: _v,
      attributes: _at,
      unstyled: _un,
      ...rest
    } = props as GridProps & Record<string, unknown>;

    const hasMinChild = minChildWidth !== undefined;
    const resolved =
      !hasMinChild && cols !== undefined && typeof cols === 'object'
        ? resolveGridCols(cols, theme)
        : null;
    const isResponsive = resolved !== null && resolved.media.length > 0;

    // Base AND media overrides live in the same class-scoped rule here (not
    // split between an inline style and this stylesheet); see the matching
    // comment in `vars` above for why that split is load-bearing.
    const styleNode = isResponsive ? (
      <InlineStyles
        selector={`.${cls}`}
        styles={{ '--sb-grid-cols': String(resolved.base) }}
        media={Object.fromEntries(
          resolved.media.map((m) => [m.query, { '--sb-grid-cols': String(m.cols) }]),
        )}
      />
    ) : null;

    // `{...rest}` then `{...baseStyles}` last matches every other
    // packages/ui recipe's spread order (Stack/Group/Center/AspectRatio's
    // `{...rest} {...getStyles('root')}`; blocks' pre-deletion Box.tsx
    // actually spreads the opposite way, baseStyles before rest, so that is
    // not the precedent here). The explicit className prop after baseStyles
    // is Grid's own addition on top of that shared order: baseStyles carries
    // the built-in class plus any universal-style-props responsive class,
    // and className below appends Grid's own per-instance responsive class
    // without dropping baseStyles's other entries (style/data-* attrs stay
    // intact from the earlier spread).
    const baseStyles = getStyles('root');
    const className = styleNode ? [baseStyles.className, cls].join(' ') : baseStyles.className;

    return (
      <>
        {styleNode}
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          {...rest}
          data-min-child={hasMinChild ? 'true' : undefined}
          {...baseStyles}
          className={className}
        >
          {children}
        </div>
      </>
    );
  },
});

export const gridTheme = Grid.extend({});
