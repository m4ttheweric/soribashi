/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Flex/Flex.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory and @soribashi/blocks/utils
 *   - Class name: 'sb-Flex-root' instead of 'mantine-Flex-root'
 *   - Renders Box for style-prop pass-through
 *   - v1 ships flat-value gap/align/justify/wrap/direction. Responsive
 *     `StyleProp<T>` for these is deferred (the infrastructure exists in
 *     parseStyleProps + InlineStyles; Flex would need a second style-props
 *     table for its non-Box-overlapping props).
 */
import { defineComponent } from '@soribashi/factory';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';
import { getSpacing } from '../utils/index.ts';

export interface FlexOwnProps extends BoxOwnProps {
  /** Theme spacing key or any valid CSS gap value */
  gap?: string | number;
  /** Theme spacing key or any valid CSS row-gap value */
  rowGap?: string | number;
  /** Theme spacing key or any valid CSS column-gap value */
  columnGap?: string | number;
  /** `align-items` CSS property */
  align?: React.CSSProperties['alignItems'];
  /** `justify-content` CSS property */
  justify?: React.CSSProperties['justifyContent'];
  /** `flex-wrap` CSS property */
  wrap?: React.CSSProperties['flexWrap'];
  /** `flex-direction` CSS property */
  direction?: React.CSSProperties['flexDirection'];
}

export const Flex = defineComponent<FlexOwnProps>({
  name: 'Flex',
  selectors: ['root'] as const,
  classes: { root: 'sb-Flex-root' },
  defaults: {} as Partial<FlexOwnProps>,
  vars: (_theme, props) => {
    const p = props as FlexOwnProps;
    return {
      root: {
        '--flex-gap': getSpacing(p.gap) ?? '',
        '--flex-row-gap': getSpacing(p.rowGap) ?? '',
        '--flex-column-gap': getSpacing(p.columnGap) ?? '',
        '--flex-align': String(p.align ?? ''),
        '--flex-justify': String(p.justify ?? ''),
        '--flex-wrap': String(p.wrap ?? ''),
        '--flex-direction': String(p.direction ?? ''),
      },
    };
  },
  render: ({ props, getStyles, ref }) => {
    const {
      gap: _g,
      rowGap: _rg,
      columnGap: _cg,
      align: _al,
      justify: _ju,
      wrap: _wr,
      direction: _di,
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
      <Box ref={ref} {...getStyles('root')} {...rest}>
        {children}
      </Box>
    );
  },
});
