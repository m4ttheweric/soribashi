import { getRadius, getShadow } from '@soribashi/core';
import type { ReactNode } from 'react';
import { definePolymorphicComponent } from '../../builders.ts';
import classes from './Paper.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 1 = pure styled primitive (§ 2.1). Read by packages/ui/scripts/derive.ts to
 * build the agent-facing manifest; not itself derived, since it records an
 * authoring decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 1 as const;

export interface PaperProps {
  /** Border-radius theme token key or raw CSS value @default 'md' */
  radius?: string | number;
  /** Box-shadow theme token key or raw CSS value; unset renders no shadow */
  shadow?: string;
  /** Adds a themed 1px border @default false */
  withBorder?: boolean;
  children?: ReactNode;
}

/**
 * A surface: raised background, themed radius/shadow, optional border. No
 * vocabulary axes (no size/intent/variant), so this needs only the two
 * generics Box.tsx also gets away with (TOwnProps, TDefaultAs); nothing here
 * feeds an axis's typing the way Text.tsx's `size` does.
 */
export const Paper = definePolymorphicComponent<PaperProps, 'div'>({
  name: 'Paper',
  defaultElement: 'div',
  selectors: ['root'] as const,
  classes,
  defaults: { radius: 'md', withBorder: false },
  vars: (_theme, props) => {
    const { radius, shadow } = props as PaperProps;
    return {
      root: {
        '--sb-paper-radius': getRadius(radius),
        '--sb-paper-shadow': getShadow(shadow) ?? '',
      },
    };
  },
  render: ({ Element, props, getStyles, ref }) => {
    // withBorder is Paper's own prop, stamped as a bare data-attribute by
    // hand (this recipe has no `mod` prop; that shorthand is Box-only).
    // classNames/styles/vars/attributes/unstyled are the Styles API's own
    // config surface (consumed internally by useStyles via config.*, not by
    // getStyles's return value) and are not valid DOM attributes, so they're
    // stripped the same way Box.tsx strips them.
    const {
      radius: _radius,
      shadow: _shadow,
      withBorder,
      children,
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...rest
    } = props as PaperProps & Record<string, unknown>;
    return (
      <Element
        ref={ref}
        {...rest}
        data-with-border={withBorder ? 'true' : undefined}
        {...getStyles('root')}
      >
        {children}
      </Element>
    );
  },
});

export const paperTheme = Paper.extend({});
