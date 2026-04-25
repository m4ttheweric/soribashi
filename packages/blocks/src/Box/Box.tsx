/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/Box.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Imports retargeted to @soribashi/factory and @soribashi/theme
 *   - Uses definePolymorphicComponent (forwardRef-wrapped) instead of Mantine's polymorphicFactory
 *   - Class name: 'sb-Box-root' instead of 'mantine-Box-root'
 *   - Drops Mantine's nonce, sx, classNamesPrefix, deduplicateInlineStyles internals
 */
import {
  definePolymorphicComponent,
  InlineStyles,
  useRandomClassName,
  useTheme,
} from '@soribashi/factory';
import type { CSSProperties } from 'react';
import { extractStyleProps } from './style-props/extract-style-props.ts';
import { parseStyleProps } from './style-props/parse-style-props.ts';
import { STYLE_PROPS_DATA } from './style-props/style-props-data.ts';
import { getBoxMod, type BoxMod } from './get-box-mod.ts';
import type { BoxOwnProps, BoxStyleProps } from './Box.types.ts';

export type { BoxOwnProps, BoxMod, BoxStyleProps };

/**
 * Polymorphic root primitive. Accepts the full set of Mantine-style style props
 * (`p`, `m`, `bg`, `c`, `bd`, `bdrs`, `fz`, `lh`, `lts`, `opacity`, sizing,
 * positioning, flex), the `mod` API for data-attributes, and the standard
 * Styles API overrides.
 *
 * Style props with responsive object values (`p={{ base: 'xs', md: 'lg' }}`)
 * generate a per-instance class with media-query rules via `<InlineStyles>`.
 */
export const Box = definePolymorphicComponent<BoxOwnProps, 'div'>({
  name: 'Box',
  defaultElement: 'div',
  selectors: ['root'] as const,
  classes: { root: 'sb-Box-root' },
  render: ({ Element, props, getStyles }) => {
    const {
      mod,
      variant,
      children,
      // Standard Styles API props (handled by useStyles inside define-polymorphic-component;
      // we strip them here so they don't leak to the DOM)
      classNames: _cn,
      styles: _s,
      vars: _v,
      attributes: _a,
      unstyled: _u,
      className: _c,
      style: instanceStyle,
      // Visibility props — consumed here, never forwarded to the DOM
      hiddenFrom: _hiddenFrom,
      visibleFrom: _visibleFrom,
      lightHidden: _lightHidden,
      darkHidden: _darkHidden,
      sx: _sx,
      ...remainingProps
    } = props as any;

    const theme = useTheme();
    const { styleProps, rest } = extractStyleProps(remainingProps, STYLE_PROPS_DATA);
    const parsed = parseStyleProps({ styleProps, data: STYLE_PROPS_DATA, theme });

    const responsiveClassName = useRandomClassName();
    const modAttrs = getBoxMod(mod);

    const baseStyles = getStyles('root');
    const mergedStyle: CSSProperties = {
      ...(baseStyles.style ?? {}),
      ...(instanceStyle ?? {}),
      ...(parsed.inlineStyles as CSSProperties),
    };

    const className = parsed.hasResponsiveStyles
      ? `${baseStyles.className} ${responsiveClassName}`
      : baseStyles.className;

    return (
      <>
        {parsed.hasResponsiveStyles && (
          <InlineStyles
            selector={`.${responsiveClassName}`}
            styles={parsed.styles}
            media={parsed.media}
          />
        )}
        <Element
          {...baseStyles}
          className={className}
          style={mergedStyle}
          data-variant={variant}
          {...modAttrs}
          {...rest}
        >
          {children}
        </Element>
      </>
    );
  },
});
