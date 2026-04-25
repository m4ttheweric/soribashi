/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Group/Group.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory and @soribashi/blocks/utils
 *   - Token names: --mantine-spacing-md → --spacing-md (handled by getSpacing)
 *   - Class name: 'sb-Group-root' instead of 'mantine-Group-root'
 *   - Renders Box for style-prop pass-through (gives Group polymorphism via Box)
 */
import { defineComponent } from '@soribashi/factory';
import { getSpacing } from '../utils/index.ts';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';
import { filterFalsyChildren } from './filter-falsy-children.ts';

export interface GroupOwnProps extends BoxOwnProps {
  /** `justify-content` CSS property @default 'flex-start' */
  justify?: React.CSSProperties['justifyContent'];
  /** `align-items` CSS property @default 'center' */
  align?: React.CSSProperties['alignItems'];
  /** `flex-wrap` CSS property @default 'wrap' */
  wrap?: React.CSSProperties['flexWrap'];
  /** Theme spacing key or any valid CSS gap value @default 'md' */
  gap?: string | number;
  /** Children expand to fill the row when true @default false */
  grow?: boolean;
  /**
   * When grow=true, computes child max-width based on number of children
   * to keep them visually distinct rather than letting content drive width.
   * @default true
   */
  preventGrowOverflow?: boolean;
}

export const Group = defineComponent<GroupOwnProps>({
  name: 'Group',
  selectors: ['root'] as const,
  classes: { root: 'sb-Group-root' },
  defaults: {
    preventGrowOverflow: true,
    gap: 'md',
    align: 'center',
    justify: 'flex-start',
    wrap: 'wrap',
  } as Partial<GroupOwnProps>,
  vars: (_theme, props) => {
    const p = props as GroupOwnProps & { children?: React.ReactNode };
    const childCount = filterFalsyChildren(p.children).length;
    const resolvedGap = getSpacing(p.gap ?? 'md') ?? 'var(--spacing-md)';
    const childWidth =
      p.grow && p.preventGrowOverflow !== false && childCount > 0
        ? `calc(${100 / childCount}% - (${resolvedGap} - ${resolvedGap} / ${childCount}))`
        : '';
    return {
      root: {
        '--group-gap': resolvedGap,
        '--group-align': String(p.align ?? 'center'),
        '--group-justify': String(p.justify ?? 'flex-start'),
        '--group-wrap': String(p.wrap ?? 'wrap'),
        '--group-child-width': childWidth,
      },
    };
  },
  render: ({ props, getStyles }) => {
    const {
      gap: _gap,
      align: _align,
      justify: _justify,
      wrap: _wrap,
      grow,
      preventGrowOverflow: _pgo,
      children,
      mod,
      classNames: _cn,
      styles: _s,
      vars: _v,
      attributes: _a,
      unstyled: _u,
      ...rest
    } = props as any;

    const filtered = filterFalsyChildren(children);

    return (
      <Box
        {...getStyles('root')}
        mod={[{ grow: !!grow }, mod].filter(Boolean) as any}
        {...rest}
      >
        {filtered}
      </Box>
    );
  },
});
