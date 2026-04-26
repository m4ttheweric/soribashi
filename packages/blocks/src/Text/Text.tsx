/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Text/Text.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory and @soribashi/blocks/utils
 *   - Class name: 'sb-Text-root' instead of 'mantine-Text-root'
 *   - Polymorphic via Mantine pattern: defaultElement='p', span shorthand
 *     swaps to 'span'. Box wrapping gives full polymorphism via `as`.
 *   - Token names: --mantine-* → --soribashi
 *   - lineClamp, inline, inherit, gradient variant supported
 *   - truncate accepts boolean | 'start' | 'end' (RTL truncation via 'start')
 */
import { defineComponent } from '@soribashi/factory';
import { getFontSize, getLineHeight } from '../utils/index.ts';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';

export type TextTruncate = boolean | 'start' | 'end';

export interface TextOwnProps extends BoxOwnProps {
  /** Theme font-size key or any CSS value @default 'md' */
  size?: string | number;
  /** Number of lines after which Text is truncated (multi-line ellipsis) */
  lineClamp?: number;
  /** Truncate side: 'start' (RTL) | 'end' | true (= 'end') */
  truncate?: TextTruncate;
  /** Sets line-height: 1 for centering @default false */
  inline?: boolean;
  /** Inherit font properties from parent @default false */
  inherit?: boolean;
  /** Variant: 'text' (default) or 'gradient' */
  variant?: 'text' | 'gradient';
  /** Gradient definition when variant='gradient' */
  gradient?: { from: string; to: string; deg?: number };
  /** Shorthand for as='span' */
  span?: boolean;
}

function getTextTruncate(truncate: TextTruncate | undefined): 'start' | 'end' | undefined {
  if (truncate === 'start') return 'start';
  if (truncate === 'end' || truncate === true) return 'end';
  return undefined;
}

function buildGradient(gradient: { from: string; to: string; deg?: number } | undefined): string | undefined {
  if (!gradient) return undefined;
  const deg = gradient.deg ?? 45;
  return `linear-gradient(${deg}deg, ${gradient.from}, ${gradient.to})`;
}

export const Text = defineComponent<TextOwnProps>({
  name: 'Text',
  selectors: ['root'] as const,
  classes: { root: 'sb-Text-root' },
  defaults: { inherit: false } as Partial<TextOwnProps>,
  vars: (_theme, props) => {
    const p = props as TextOwnProps;
    return {
      root: {
        '--text-fz': getFontSize(p.size as string | number | undefined) ?? '',
        '--text-lh': getLineHeight(p.size as string | number | undefined) ?? '',
        '--text-gradient': p.variant === 'gradient' ? (buildGradient(p.gradient) ?? '') : '',
        '--text-line-clamp': typeof p.lineClamp === 'number' ? String(p.lineClamp) : '',
      },
    };
  },
  render: ({ props, getStyles }) => {
    const {
      size: _sz,
      lineClamp,
      truncate,
      inline,
      inherit,
      gradient: _gr,
      span,
      variant,
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
    const tag = span ? 'span' : 'p';
    return (
      <Box
        {...getStyles('root')}
        as={tag}
        variant={variant}
        mod={[
          {
            'data-truncate': getTextTruncate(truncate),
            'data-line-clamp': typeof lineClamp === 'number',
            'data-inline': !!inline,
            'data-inherit': !!inherit,
          },
          mod,
        ].filter(Boolean) as any}
        {...rest}
      >
        {children}
      </Box>
    );
  },
});
