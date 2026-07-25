import { autoVars, definePolymorphicComponent } from '@soribashi/core';
import type { ReactNode } from 'react';
import classes from './Button.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 1 = pure styled primitive (§ 2.1, Wave 1, this recipe is the pilot).
 * Read by packages/ui/scripts/derive.ts to build the agent-facing manifest;
 * not itself derived, since it records an authoring decision, not a fact
 * recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 1 as const;

const BUTTON_VARIANTS = ['filled', 'outline', 'subtle', 'ghost', 'link'] as const;

/**
 * Heights keyed on the ui theme's size vocabulary. Lives in the recipe (not
 * the framework) because @soribashi/ui is a consumer and owns these values;
 * a theme can still override per instance via Button.extend({ vars }).
 */
const BUTTON_HEIGHTS: Record<string, string> = {
  xs: '1.75rem',
  sm: '2rem',
  md: '2.25rem',
  lg: '2.5rem',
  xl: '2.75rem',
};

export const Button = definePolymorphicComponent({
  name: 'Button',
  defaultElement: 'button',
  vocabularyAxes: ['size', 'intent', 'variant'] as const,
  selectors: ['root', 'label'] as const,
  variants: BUTTON_VARIANTS,
  classes,
  defaults: { intent: 'primary', variant: 'filled', size: 'md' },
  // A recipe-supplied `vars` resolver replaces the builder's automatic
  // autoVars call rather than layering on top of it (see
  // define-polymorphic-component.tsx: `config.vars ? config.vars(...) :
  // autoVars(...)`, mutually exclusive, not additive). Button needs both the
  // auto-derived --button-bg/--button-color/--button-border/... vars AND its
  // own --sb-button-h dimension var, so autoVars is invoked explicitly here
  // and merged in; this is what keeps Global Constraint 10 ("the builder
  // calls autoVars internally... do not hand-wire these") true in practice
  // once a recipe needs a size-driven var of its own.
  vars: (theme, props) => ({
    root: {
      ...(autoVars(theme, 'Button', props as Record<string, unknown>, true).root ?? {}),
      '--sb-button-h':
        BUTTON_HEIGHTS[(props as { size?: string }).size ?? 'md'] ?? BUTTON_HEIGHTS.md!,
    },
  }),
  render: ({ Element, props, getStyles, ref }) => {
    // Vocabulary axis props (size/intent/variant) are NOT stripped by the
    // builder before render (only `as` is; see define-polymorphic-component.tsx)
    // and getStyles('root') already emits data-size/data-intent/data-variant,
    // so they're destructured out here rather than spread onto the DOM.
    // classNames/styles/vars/attributes/unstyled are the Styles API's own
    // config surface (consumed internally by useStyles via config.*, not by
    // getStyles's return value) and are not valid DOM attributes either, so
    // they're stripped the same way Box.tsx strips them.
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
    } = props as typeof props & { children?: ReactNode };
    const domProps = Element === 'button' ? { type: 'button' as const, ...rest } : rest;
    return (
      <Element ref={ref} {...domProps} {...getStyles('root')}>
        <span {...getStyles('label')}>{children}</span>
      </Element>
    );
  },
});

export const buttonTheme = Button.extend({});
