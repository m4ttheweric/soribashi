/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Container/Container.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory and @soribashi/blocks/utils
 *   - Class name: 'sb-Container-root' instead of 'mantine-Container-root'
 *   - Renders Box for style-prop pass-through (Box's `as` enables polymorphism)
 *   - Mantine's container-size scale used (xs=540 / sm=720 / md=960 / lg=1140 / xl=1320 px)
 *   - Both `block` and `grid` strategies supported. In grid strategy, children
 *     with `data-breakout` span the full grid; non-breakout children stay
 *     within max-width.
 */
import { defineComponent } from '@soribashi/factory';
import { getSize } from '../utils/index.ts';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';

export interface ContainerOwnProps extends BoxOwnProps {
  /** max-width: Mantine container size key (xs/sm/md/lg/xl) OR any CSS value @default 'md' */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | (string & {}) | number;
  /** When true, max-width is removed and Container takes 100% of its parent */
  fluid?: boolean;
  /** Centering strategy @default 'block' */
  strategy?: 'block' | 'grid';
}

export const Container = defineComponent<ContainerOwnProps>({
  name: 'Container',
  selectors: ['root'] as const,
  classes: { root: 'sb-Container-root' },
  defaults: { strategy: 'block' } as Partial<ContainerOwnProps>,
  vars: (_theme, props) => {
    const p = props as ContainerOwnProps;
    return {
      root: {
        '--container-size': p.fluid ? '' : getSize(p.size as string | number, 'container-size') ?? '',
      },
    };
  },
  render: ({ props, getStyles, ref }) => {
    const {
      size: _sz,
      fluid,
      strategy,
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
        mod={[
          { strategy, fluid: !!fluid },
          mod,
        ].filter(Boolean) as any}
        {...rest}
      >
        {children}
      </Box>
    );
  },
});
