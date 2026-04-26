/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Space/Space.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory and @soribashi/blocks
 *   - Renders Box with w/h/miw/mih style props (no own CSS file)
 */
import { defineComponent } from '@soribashi/factory';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';

export interface SpaceOwnProps extends BoxOwnProps {}

export const Space = defineComponent<SpaceOwnProps>({
  name: 'Space',
  selectors: ['root'] as const,
  render: ({ props }) => {
    const {
      w,
      h,
      miw,
      mih,
      classNames: _cn,
      styles: _s,
      vars: _v,
      attributes: _a,
      unstyled: _u,
      className: _className,
      style: _style,
      ...rest
    } = props as any;
    return <Box w={w} h={h} miw={miw ?? w} mih={mih ?? h} {...rest} />;
  },
});
