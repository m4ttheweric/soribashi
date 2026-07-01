/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Paper/Paper.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory and @soribashi/blocks/utils
 *   - Class name: 'sb-Paper-root' instead of 'mantine-Paper-root'
 *   - Renders Box for style-prop pass-through (gives Paper polymorphism via Box)
 *   - Drops the soribashi-specific `p` (padding) baked-in default — consumers
 *     pass `p="md"` via Box's style props now (matches Mantine; padding is not
 *     a Paper concern)
 *   - Drops the soribashi-specific `bg` enum — Box's bg style prop accepts any
 *     theme color reference (e.g., bg="surface.raised")
 */
import { defineComponent } from '@soribashi/factory';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';
import { getRadius, getShadow } from '../utils/index.ts';

export interface PaperOwnProps extends BoxOwnProps {
  /** Theme shadow key or any valid CSS box-shadow value */
  shadow?: string;
  /** Theme radius key or any valid CSS border-radius value */
  radius?: string | number;
  /** Adds a 1px border to the root element */
  withBorder?: boolean;
}

export const Paper = defineComponent<PaperOwnProps>({
  name: 'Paper',
  selectors: ['root'] as const,
  classes: { root: 'sb-Paper-root' },
  vars: (_theme, props) => {
    const p = props as PaperOwnProps;
    return {
      root: {
        '--paper-radius': p.radius === undefined ? '' : (getRadius(p.radius) ?? ''),
        '--paper-shadow': getShadow(p.shadow as string | undefined) ?? '',
      },
    };
  },
  render: ({ props, getStyles, ref }) => {
    const {
      shadow: _sh,
      radius: _rd,
      withBorder,
      children,
      mod,
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
      <Box
        ref={ref}
        {...getStyles('root')}
        mod={[{ 'with-border': !!withBorder }, mod].filter(Boolean) as any}
        {...rest}
      >
        {children}
      </Box>
    );
  },
});
