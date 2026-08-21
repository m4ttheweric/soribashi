import { autoVars } from '@soribashi/core';
import type { ReactNode } from 'react';
import { definePolymorphicComponent } from '../../builders.ts';
import classes from './Badge.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 1 = pure styled primitive (§ 2.1). Read by packages/ui/scripts/derive.ts to
 * build the agent-facing manifest; not itself derived, since it records an
 * authoring decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 1 as const;

/**
 * Badge's own variant set. Deliberately three, not the theme's full seven
 * (same rationale as Alert.tsx): `subtle`, `default`, `transparent`, and
 * `link` have no sane badge rendering, and inheriting them would commit
 * styling, contrast cells, and visual baselines for pairings no consumer
 * wants. Declared on the builder config (not via extend({ vocabulary })),
 * because RecipeMeta.variants, data-variant stamping, and dev validation all
 * key on this tuple.
 */
const BADGE_VARIANTS = ['filled', 'light', 'outline'] as const;

/**
 * Heights keyed on the ui theme's size vocabulary. Lives in the recipe (not
 * the framework) because @soribashi/ui is a consumer and owns these values
 * (CLAUDE.md invariant 2); a theme can still override per instance via
 * Badge.extend({ vars }) or per-render via Badge.extend({ defaultProps:
 * { size } }). Deliberately smaller than BUTTON_HEIGHTS: a badge is a
 * compact inline tag, not an interactive control sized for a pointer target.
 */
const BADGE_HEIGHTS: Record<string, string> = {
  xs: '1rem',
  sm: '1.125rem',
  md: '1.25rem',
  lg: '1.5rem',
  xl: '1.75rem',
};

export interface BadgeProps {
  children?: ReactNode;
}

/**
 * `size`/`intent`/`variant` are injected by `vocabularyAxes` rather than
 * declared on `BadgeProps` directly (vocabulary axis props come from the
 * builder, not the recipe's own prop type); `getStyles('root')` already
 * stamps `data-size`/`data-intent`/`data-variant` from them. All five
 * generic params are supplied explicitly (TOwnProps, TDefaultAs, TSelectors,
 * TVariants, TVocabAxes): Button.tsx's and Text.tsx's proven pattern for
 * definePolymorphicComponent, since inference alone has been observed to
 * silently drop the vocabulary-axis typing.
 */
export const Badge = definePolymorphicComponent<
  BadgeProps,
  'span',
  readonly ['root'],
  readonly ['filled', 'light', 'outline'],
  readonly ['size', 'intent', 'variant']
>({
  name: 'Badge',
  defaultElement: 'span',
  vocabularyAxes: ['size', 'intent', 'variant'] as const,
  selectors: ['root'] as const,
  variants: BADGE_VARIANTS,
  classes,
  defaults: { intent: 'primary', variant: 'filled', size: 'md' },
  // A recipe-supplied `vars` resolver REPLACES the builder's automatic
  // autoVars call rather than layering on top of it (see Button.tsx's
  // identical merge-in pattern and the skill's "Traps" section). Badge needs
  // both the auto-derived --badge-bg/-color/-border/... vars AND its own
  // size-driven --sb-badge-h dimension var, so autoVars is invoked
  // explicitly here and merged in.
  vars: (theme, props) => ({
    root: {
      ...(autoVars(theme, 'Badge', props as Record<string, unknown>, true).root ?? {}),
      '--sb-badge-h': BADGE_HEIGHTS[(props as { size?: string }).size ?? 'md'] ?? BADGE_HEIGHTS.md!,
    },
  }),
  render: ({ Element, props, getStyles, ref }) => {
    // Vocabulary axis props (size/intent/variant) are NOT stripped by the
    // builder before render (only `as` is) and getStyles('root') already
    // emits data-size/data-intent/data-variant, so they're destructured out
    // here rather than spread onto the DOM. classNames/styles/vars/
    // attributes/unstyled are the Styles API's own config surface, not valid
    // DOM attributes, and are stripped the same way Box.tsx strips them.
    const {
      children,
      size: _size,
      intent: _intent,
      variant: _variant,
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...rest
    } = props as BadgeProps & Record<string, unknown>;
    return (
      <Element ref={ref} {...rest} {...getStyles('root')}>
        {children}
      </Element>
    );
  },
});

export const badgeTheme = Badge.extend({});
