/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Title/Title.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory and local utils
 *   - Class name: 'sb-Title-root' instead of 'mantine-Title-root'
 *   - Reads sizing via getTitleSize → soribashi heading vars (--heading-h{N}-*)
 *   - Polymorphic h{order} via Box's `as` prop (Box supplies the as-handling)
 */
import { defineComponent } from '@soribashi/factory';
import { Box } from '../Box/Box.tsx';
import type { BoxOwnProps } from '../Box/Box.types.ts';
import { getTitleSize, type TitleOrder, type TitleSize } from './get-title-size.ts';

export type { TitleOrder, TitleSize };

export interface TitleOwnProps extends BoxOwnProps {
  /** Heading order (1-6); controls font-size when `size` is not set @default 1 */
  order?: TitleOrder;
  /** Heading size token (`h1`-`h6`), font-size token (`xs`-`3xl`), or any CSS font-size */
  size?: TitleSize;
  /** Number of lines after which heading is truncated (multi-line ellipsis) */
  lineClamp?: number;
  /** CSS `text-wrap` property @default 'wrap' */
  textWrap?: 'wrap' | 'nowrap' | 'balance' | 'pretty' | 'stable';
}

const ORDERS: ReadonlyArray<TitleOrder> = [1, 2, 3, 4, 5, 6];

export const Title = defineComponent<TitleOwnProps>({
  name: 'Title',
  selectors: ['root'] as const,
  classes: { root: 'sb-Title-root' },
  defaults: { order: 1 } as Partial<TitleOwnProps>,
  vars: (_theme, props) => {
    const p = props as TitleOwnProps;
    const order = (p.order ?? 1) as TitleOrder;
    const sizeVars = getTitleSize(order, p.size);
    return {
      root: {
        '--title-fw': sizeVars.fontWeight,
        '--title-lh': sizeVars.lineHeight,
        '--title-fz': sizeVars.fontSize,
        '--title-line-clamp': typeof p.lineClamp === 'number' ? String(p.lineClamp) : '',
        '--title-text-wrap': p.textWrap ?? '',
      },
    };
  },
  render: ({ props, getStyles }) => {
    const {
      order,
      size: _size,
      lineClamp,
      textWrap: _textWrap,
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

    if (!ORDERS.includes(order as TitleOrder)) {
      return null;
    }

    return (
      <Box
        {...getStyles('root')}
        as={`h${order}` as any}
        mod={[
          {
            'data-order': String(order),
            'data-line-clamp': typeof lineClamp === 'number',
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
