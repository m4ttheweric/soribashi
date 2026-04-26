/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/AspectRatio/AspectRatio.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory
 *   - Class name: 'sb-AspectRatio-root' instead of 'mantine-AspectRatio-root'
 *   - Renders Box for style-prop pass-through
 *   - Behavior fix: aspect-ratio applied to children via CSS rule, not the
 *     wrapper. img/video children automatically get object-fit: cover.
 */
import { defineComponent } from '@soribashi/factory';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';

export interface AspectRatioOwnProps extends BoxOwnProps {
  /** Aspect ratio, e.g., 16/9, 4/3, 1 @default 1 */
  ratio?: number;
}

export const AspectRatio = defineComponent<AspectRatioOwnProps>({
  name: 'AspectRatio',
  selectors: ['root'] as const,
  classes: { root: 'sb-AspectRatio-root' },
  vars: (_theme, props) => ({
    root: {
      '--ar-ratio': String((props as AspectRatioOwnProps).ratio ?? 1),
    },
  }),
  render: ({ props, getStyles }) => {
    const {
      ratio: _r,
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
      <Box {...getStyles('root')} {...rest}>
        {children}
      </Box>
    );
  },
});
