/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Space/Space.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory and @soribashi/blocks
 *   - Renders Box with w/h/miw/mih style props (no own CSS file)
 *   - w/h/miw/mih are now resolved by the builder's universal style-props
 *     layer (Task 2) before this render runs, since they're style-prop
 *     names; Space reads the already-resolved CSS off `getStyles('root')`
 *     instead of the raw prop values (which are no longer on `props` by the
 *     time render is called) and applies its own miw/mih-defaults-to-w/h
 *     fallback on top of the resolved values.
 */
import { defineComponent } from '@soribashi/factory';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';

export interface SpaceOwnProps extends BoxOwnProps {}

export const Space = defineComponent<SpaceOwnProps>({
  name: 'Space',
  selectors: ['root'] as const,
  render: ({ props, getStyles, ref }) => {
    const {
      classNames: _cn,
      styles: _s,
      vars: _v,
      attributes: _a,
      unstyled: _u,
      className: _className,
      style: _style,
      ...rest
    } = props as any;
    const { className, style } = getStyles('root');
    const mergedStyle = {
      ...style,
      minWidth: style?.minWidth ?? style?.width,
      minHeight: style?.minHeight ?? style?.height,
    };
    return <Box ref={ref} className={className} style={mergedStyle} {...rest} />;
  },
});
