/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/SimpleGrid/SimpleGrid.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory and @soribashi/blocks/utils
 *   - Class name: 'sb-SimpleGrid-root' instead of 'mantine-SimpleGrid-root'
 *   - Renders Box for style-prop pass-through
 *   - v1 ships flat-value cols/spacing + auto-fill/auto-fit modes. Mantine's
 *     responsive cols and type='container' mode deferred.
 */
import { defineComponent } from '@soribashi/factory';
import { getSpacing } from '../utils/index.ts';
import { rem } from '../utils/rem.ts';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';

export interface SimpleGridOwnProps extends BoxOwnProps {
  /** Number of columns @default 1 */
  cols?: number;
  /** Theme spacing key or CSS gap value @default 'md' */
  spacing?: string | number;
  /** Override row spacing */
  verticalSpacing?: string | number;
  /** When set, switches to auto-fill/auto-fit mode where columns are determined
   * by min column width rather than a fixed count. */
  type?: 'simple' | 'container';
  /** Mode for grid-template-columns when set: auto-fill packs as many as fit,
   *  auto-fit collapses empty tracks. Pairs with `minColumnWidth`. */
  autoCols?: 'auto-fill' | 'auto-fit';
  /** Minimum column width when autoCols is set */
  minColumnWidth?: string | number;
}

export const SimpleGrid = defineComponent<SimpleGridOwnProps>({
  name: 'SimpleGrid',
  selectors: ['root'] as const,
  classes: { root: 'sb-SimpleGrid-root' },
  defaults: { cols: 1, spacing: 'md' } as Partial<SimpleGridOwnProps>,
  vars: (_theme, props) => {
    const p = props as SimpleGridOwnProps;
    const spacing = getSpacing(p.spacing) ?? 'var(--spacing-md)';
    const minWidth =
      typeof p.minColumnWidth === 'number'
        ? rem(p.minColumnWidth) ?? '12rem'
        : p.minColumnWidth ?? '12rem';
    return {
      root: {
        '--sg-cols': String(p.cols ?? 1),
        '--sg-spacing-x': spacing,
        '--sg-spacing-y': getSpacing(p.verticalSpacing) ?? spacing,
        '--sg-min-col-width': minWidth,
      },
    };
  },
  render: ({ props, getStyles }) => {
    const {
      cols: _co,
      spacing: _sp,
      verticalSpacing: _vs,
      type: _ty,
      autoCols,
      minColumnWidth: _mcw,
      children,
      mod,
      classNames: _cn,
      styles: _s,
      vars: _v,
      attributes: _a,
      unstyled: _u,
      ...rest
    } = props as any;
    return (
      <Box
        {...getStyles('root')}
        mod={[autoCols ? { 'auto-cols': autoCols } : null, mod].filter(Boolean) as any}
        {...rest}
      >
        {children}
      </Box>
    );
  },
});
