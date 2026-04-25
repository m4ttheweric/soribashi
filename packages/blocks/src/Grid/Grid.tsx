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
 *     deferred (the GridProvider context machinery isn't built in soribashi yet).
 */
import { defineComponent } from '@soribashi/factory';
import { getSpacing } from '../utils/index.ts';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';

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
  /** `overflow` CSS property @default 'visible' */
  overflow?: React.CSSProperties['overflow'];
}

export interface GridColOwnProps extends BoxOwnProps {
  /** Column span (1..columns) */
  span?: number | 'auto' | 'content';
  /** Column offset */
  offset?: number;
  /** `order` CSS property */
  order?: number;
  /** `align-self` CSS property */
  alignSelf?: React.CSSProperties['alignSelf'];
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
  render: ({ props, getStyles }) => {
    const {
      gap: _g,
      rowGap: _rg,
      columnGap: _cg,
      columns: _co,
      justify: _ju,
      align: _al,
      overflow: _ov,
      children,
      classNames: _cn,
      styles: _s,
      vars: _v,
      attributes: _a,
      unstyled: _u,
      ...rest
    } = props as any;
    return (
      <Box {...getStyles('root')} {...rest}>
        <div {...getStyles('inner')}>{children}</div>
      </Box>
    );
  },
});

const GridCol = defineComponent<GridColOwnProps>({
  name: 'GridCol',
  selectors: ['root'] as const,
  classes: { root: 'sb-Grid-col' },
  defaults: { span: 12 } as Partial<GridColOwnProps>,
  vars: (_theme, props) => {
    const p = props as GridColOwnProps;
    return {
      root: {
        '--col-flex-basis':
          p.span === 'auto'
            ? 'auto'
            : p.span === 'content'
              ? 'auto'
              : typeof p.span === 'number'
                ? `calc(${(p.span / 12) * 100}% - var(--grid-column-gap, var(--spacing-md)))`
                : '',
        '--col-width':
          p.span === 'content'
            ? 'auto'
            : typeof p.span === 'number'
              ? `calc(${(p.span / 12) * 100}% - var(--grid-column-gap, var(--spacing-md)))`
              : '100%',
        '--col-max-width': p.span === 'content' ? 'unset' : '100%',
        '--col-flex-grow': p.span === 'auto' ? '1' : '0',
        '--col-offset': p.offset === undefined ? '' : `${(p.offset / 12) * 100}%`,
        '--col-order': p.order === undefined ? '' : String(p.order),
        '--col-align-self': String(p.alignSelf ?? ''),
      },
    };
  },
  render: ({ props, getStyles }) => {
    const {
      span: _sp,
      offset: _of,
      order: _or,
      alignSelf: _as,
      children,
      classNames: _cn,
      styles: _s,
      vars: _v,
      attributes: _a,
      unstyled: _u,
      ...rest
    } = props as any;
    return (
      <Box {...getStyles('root')} {...rest}>
        {children}
      </Box>
    );
  },
});

export const Grid = Object.assign(GridRoot, { Col: GridCol }) as typeof GridRoot & {
  Col: typeof GridCol;
};
