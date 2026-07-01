/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Grid/Grid.tsx + GridCol/GridCol.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory and @soribashi/blocks/utils
 *   - Class names: 'sb-Grid-root', 'sb-Grid-inner', 'sb-Grid-col'
 *   - Renders Box for style-prop pass-through
 *   - v1 ships flat-value gap and span. Mantine's full responsive
 *     `StyleProp<T>` for col span/offset/order plus type='container' mode is
 *     deferred.
 *   - Column math ported from Mantine's helper functions (get-column-*.ts),
 *     parameterized on the parent Grid's `columns` prop (not hardcoded 12).
 *   - `grow` prop added to Grid; propagated to Grid.Col via GridContext.
 *   - Grid.Col `align` (Mantine parity, maps to CSS `align-self`)
 *     for migration compat and will be removed in a future release.
 */
import { defineComponent } from '@soribashi/factory';
import { getSpacing } from '../utils/index.ts';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';
import { GridProvider, useGridContext } from './Grid.context.ts';
import { getColumnFlexBasis } from './get-column-flex-basis.ts';
import { getColumnMaxWidth } from './get-column-max-width.ts';
import { getColumnFlexGrow } from './get-column-flex-grow.ts';
import { getColumnOffset } from './get-column-offset.ts';

export interface GridOwnProps extends BoxOwnProps {
  /** Gap between rows + columns. Theme spacing key or any CSS value @default 'md' */
  gap?: string | number;
  /** Override row gap */
  rowGap?: string | number;
  /** Override column gap */
  columnGap?: string | number;
  /** Number of columns @default 12 */
  columns?: number;
  /** `justify-content` */
  justify?: React.CSSProperties['justifyContent'];
  /** `align-items` */
  align?: React.CSSProperties['alignItems'];
  /** If set, columns in the last row expand to fill all available space @default false */
  grow?: boolean;
  /** `overflow` CSS property @default 'visible' */
  overflow?: React.CSSProperties['overflow'];
}

export interface GridColOwnProps extends BoxOwnProps {
  /** Column span (1..columns), 'auto', or 'content' */
  span?: number | 'auto' | 'content';
  /** Column offset */
  offset?: number;
  /** `order` CSS property */
  order?: number;
  /**
   * `align-self` CSS property.
   * Mantine parity: prop is named `align`, maps to CSS `align-self`.
   */
  align?: React.CSSProperties['alignSelf'];
}

const GridRoot = defineComponent<GridOwnProps>({
  name: 'Grid',
  selectors: ['root', 'inner'] as const,
  classes: { root: 'sb-Grid-root', inner: 'sb-Grid-inner' },
  defaults: { gap: 'md', columns: 12 } as Partial<GridOwnProps>,
  vars: (_theme, props) => {
    const p = props as GridOwnProps;
    const gap = getSpacing(p.gap) ?? 'var(--spacing-md)';
    return {
      root: {
        '--grid-justify': String(p.justify ?? ''),
        '--grid-align': String(p.align ?? ''),
        '--grid-overflow': String(p.overflow ?? 'visible'),
        '--grid-gap': gap,
        '--grid-row-gap': getSpacing(p.rowGap) ?? gap,
        '--grid-column-gap': getSpacing(p.columnGap) ?? gap,
        '--grid-columns': String(p.columns ?? 12),
      },
    };
  },
  render: ({ props, getStyles, ref }) => {
    const {
      gap: _g,
      rowGap: _rg,
      columnGap: _cg,
      columns,
      justify: _ju,
      align: _al,
      grow,
      overflow: _ov,
      children,
      classNames: _cn,
      styles: _s,
      vars: _v,
      attributes: _a,
      unstyled: _u,
      className: _className,
      style: _style,
      ...rest
    } = props as any;
    return (
      <GridProvider value={{ columns: columns ?? 12, grow }}>
        <Box ref={ref} {...getStyles('root')} {...rest}>
          <div {...getStyles('inner')}>{children}</div>
        </Box>
      </GridProvider>
    );
  },
});

const GridCol = defineComponent<GridColOwnProps>({
  name: 'GridCol',
  selectors: ['root'] as const,
  classes: { root: 'sb-Grid-col' },
  defaults: { span: 12 } as Partial<GridColOwnProps>,
  vars: (_theme, props) => {
    // NOTE: vars() runs outside the React tree so we cannot call useGridContext() here.
    // The context-aware logic is handled in the render function by injecting CSS custom
    // properties directly on the element's style. The vars() hook provides defaults.
    const p = props as GridColOwnProps;
    return {
      root: {
        '--col-order': p.order === undefined ? '' : String(p.order),
        '--col-align-self': String(p.align ?? ''),
      },
    };
  },
  render: ({ props, getStyles, ref }) => {
    const {
      span,
      offset,
      order: _or,
      align: _al,
      children,
      classNames: _cn,
      styles: _s,
      vars: _v,
      attributes: _a,
      unstyled: _u,
      className: _className,
      style: _style,
      ...rest
    } = props as any;

    // Access parent Grid context for columns
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useGridContext();

    const flexBasis = getColumnFlexBasis(span, ctx.columns);
    const maxWidth = getColumnMaxWidth(span, ctx.columns, ctx.grow);
    const flexGrow = getColumnFlexGrow(span, ctx.grow);
    const colOffset = getColumnOffset(offset, ctx.columns);
    const colWidth = span === 'content' ? 'auto' : undefined;

    // Build the CSS variable overrides that depend on context.
    // These are applied as inline style on the rendered element.
    const colVars: Record<string, string> = {};
    if (flexBasis !== undefined) colVars['--col-flex-basis'] = flexBasis;
    if (maxWidth !== undefined) colVars['--col-max-width'] = maxWidth;
    if (flexGrow !== undefined) colVars['--col-flex-grow'] = flexGrow;
    if (colOffset !== undefined) colVars['--col-offset'] = colOffset;
    if (colWidth !== undefined) colVars['--col-width'] = colWidth;

    const stylesResult = getStyles('root');

    return (
      <Box
        ref={ref}
        {...stylesResult}
        style={{ ...(stylesResult.style as object | undefined), ...colVars }}
        {...rest}
      >
        {children}
      </Box>
    );
  },
});

export const Grid = Object.assign(GridRoot, { Col: GridCol }) as typeof GridRoot & {
  Col: typeof GridCol;
};
