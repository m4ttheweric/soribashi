/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Stack/Stack.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory and @soribashi/blocks/utils
 *   - Token names: --mantine-spacing-md → --spacing-md (handled by getSpacing)
 *   - Class name: 'sb-Stack-root' instead of 'mantine-Stack-root'
 *   - Renders Box for style-prop pass-through (Box's `as` prop gives Stack
 *     polymorphism without Stack itself being a polymorphic factory)
 */
import { defineComponent } from '@soribashi/factory';
import { getSpacing } from '../utils/index.ts';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';

export interface StackOwnProps extends BoxOwnProps {
  /** Key of theme spacing or any valid CSS gap value @default 'md' */
  gap?: string | number;
  /** `align-items` CSS property @default 'stretch' */
  align?: React.CSSProperties['alignItems'];
  /** `justify-content` CSS property @default 'flex-start' */
  justify?: React.CSSProperties['justifyContent'];
}

export const Stack = defineComponent<StackOwnProps>({
  name: 'Stack',
  selectors: ['root'] as const,
  classes: { root: 'sb-Stack-root' },
  defaults: { gap: 'md', align: 'stretch', justify: 'flex-start' } as Partial<StackOwnProps>,
  vars: (_theme, props) => ({
    root: {
      '--stack-gap': getSpacing((props as StackOwnProps).gap) ?? '',
      '--stack-align': String((props as StackOwnProps).align ?? 'stretch'),
      '--stack-justify': String((props as StackOwnProps).justify ?? 'flex-start'),
    },
  }),
  render: ({ props, getStyles }) => {
    const {
      gap: _gap,
      align: _align,
      justify: _justify,
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
