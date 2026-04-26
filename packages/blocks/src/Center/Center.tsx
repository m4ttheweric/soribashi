/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Center/Center.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory
 *   - Class name: 'sb-Center-root' instead of 'mantine-Center-root'
 *   - Renders Box for style-prop pass-through (gives Center polymorphism via Box)
 *   - mod={['inline', inline]} → mod is set only when inline truthy, so
 *     :where([data-inline]) presence selector applies
 */
import { defineComponent } from '@soribashi/factory';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';

export interface CenterOwnProps extends BoxOwnProps {
  /** When true, uses inline-flex instead of flex @default false */
  inline?: boolean;
}

export const Center = defineComponent<CenterOwnProps>({
  name: 'Center',
  selectors: ['root'] as const,
  classes: { root: 'sb-Center-root' },
  defaults: { inline: false } as Partial<CenterOwnProps>,
  render: ({ props, getStyles }) => {
    const {
      inline,
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
        {...getStyles('root')}
        mod={[{ inline: !!inline }, mod].filter(Boolean) as any}
        {...rest}
      >
        {children}
      </Box>
    );
  },
});
