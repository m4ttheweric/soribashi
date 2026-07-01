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
import { isDev } from '../utils/is-dev.ts';
import { extractStyleProps } from './style-props/extract-style-props.ts';
import { parseStyleProps } from './style-props/parse-style-props.ts';
import { STYLE_PROPS_DATA } from './style-props/style-props-data.ts';
import { getBoxMod, type BoxMod } from './get-box-mod.ts';
import type { BoxOwnProps, BoxStyleProps } from './Box.types.ts';

export type { BoxOwnProps, BoxMod, BoxStyleProps };

let warnedSxIgnored = false;

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
  render: ({ Element, props, getStyles, ref }) => {
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
      hiddenFrom,
      visibleFrom,
      lightHidden,
      darkHidden,
      sx,
      ...remainingProps
    } = props as any;

    if (sx !== undefined && isDev() && !warnedSxIgnored) {
      warnedSxIgnored = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[soribashi] The sx prop is accepted but never applied; use style, style props, or the Styles API instead.',
      );
    }

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

    // Build the class list: static root class + optional responsive class + visibility classes
    const visibilityClasses = [
      hiddenFrom ? `sb-hidden-from-${hiddenFrom}` : '',
      visibleFrom ? `sb-visible-from-${visibleFrom}` : '',
      lightHidden ? 'sb-light-hidden' : '',
      darkHidden ? 'sb-dark-hidden' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const className = [
      baseStyles.className,
      parsed.hasResponsiveStyles ? responsiveClassName : '',
      visibilityClasses,
    ]
      .filter(Boolean)
      .join(' ');

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
          ref={ref}
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
