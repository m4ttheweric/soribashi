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
 *   - Prop renames for Mantine parity: minColumnWidth→minColWidth,
 *     autoCols→autoFlow, type='simple'→type='media'. Added autoRows.
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
  /** Determines type of queries used for responsive styles @default 'media' */
  type?: 'media' | 'container';
  /** Mode for grid-template-columns when minColWidth is set: auto-fill packs as many
   *  as fit, auto-fit collapses empty tracks. @default 'auto-fill' */
  autoFlow?: 'auto-fill' | 'auto-fit';
  /** Minimum column width when autoFlow is set */
  minColWidth?: string | number;
  /** Sets the size of implicitly created grid rows (grid-auto-rows) */
  autoRows?: string;
  /** @deprecated renamed to `autoFlow` for Mantine parity — remove before v1 */
  autoCols?: 'auto-fill' | 'auto-fit';
  /** @deprecated renamed to `minColWidth` for Mantine parity — remove before v1 */
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
    // Support legacy minColumnWidth as a deprecated fallback
    const resolvedMinColWidth = p.minColWidth ?? p.minColumnWidth;
    const minWidth =
      typeof resolvedMinColWidth === 'number'
        ? rem(resolvedMinColWidth) ?? '12rem'
        : resolvedMinColWidth ?? '12rem';
    const vars: Record<string, string> = {
      '--sg-cols': String(p.cols ?? 1),
      '--sg-spacing-x': spacing,
      '--sg-spacing-y': getSpacing(p.verticalSpacing) ?? spacing,
      '--sg-min-col-width': minWidth,
    };
    if (p.autoRows !== undefined) {
      vars['--sg-auto-rows'] = p.autoRows;
    }
    return { root: vars };
  },
  render: ({ props, getStyles }) => {
    const {
      cols: _co,
      spacing: _sp,
      verticalSpacing: _vs,
      type: _ty,
      autoFlow,
      // Support legacy autoCols as a deprecated fallback
      autoCols: _legacyAutoCols,
      minColWidth,
      // Support legacy minColumnWidth as a deprecated fallback
      minColumnWidth: _legacyMinColumnWidth,
      autoRows: _ar,
      children,
      mod,
      classNames: _cn,
      styles: _s,
      vars: _v,
      attributes: _a,
      unstyled: _u,
      ...rest
    } = props as any;

    const resolvedMinColWidth = minColWidth ?? _legacyMinColumnWidth;
    const resolvedAutoFlow = autoFlow ?? _legacyAutoCols;

    // When minColWidth (or legacy minColumnWidth) is provided, default autoFlow to 'auto-fill'
    const autoColsAttr =
      resolvedMinColWidth !== undefined ? resolvedAutoFlow ?? 'auto-fill' : undefined;

    // minColumnWidth and autoCols are already consumed above — don't forward to DOM
    return (
      <Box
        {...getStyles('root')}
        mod={[autoColsAttr ? { 'auto-cols': autoColsAttr } : null, mod].filter(Boolean) as any}
        {...rest}
      >
        {children}
      </Box>
    );
  },
});
