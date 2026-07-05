import { type PolymorphicRenderCtx, autoVars, defineVocabulary } from '@soribashi/core';
import type { ReactNode } from 'react';
import { definePolymorphicComponent } from '../../builders.ts';

const variants = ['filled', 'outline', 'subtle', 'ghost', 'link'] as const;
type Variant = (typeof variants)[number];

export interface ButtonOwnProps {
  variant?: Variant;
  children?: ReactNode;
}

const selectors = ['root'] as const;

/**
 * Walking-skeleton Button: the category 1 exemplar for the shadcn conversion.
 * Three-band static class string (spec section 6): structural literals,
 * var-indirection utilities (intent resolver + vars resolver), and
 * data-attribute-scoped structural variant utilities. No cva, no runtime
 * class composition, no hand-written data attributes.
 */
const classes = {
  root: [
    // band 1: structural literals (donor-faithful)
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md',
    'text-sm font-medium transition-colors outline-none',
    'focus-visible:ring-2 focus-visible:ring-(--border-focus)',
    'disabled:pointer-events-none disabled:opacity-50',
    // band 2: var-indirection (vocabulary-driven; values flow at runtime)
    'h-(--sb-button-h) px-(--sb-button-px)',
    'border border-(--button-border) bg-(--button-bg) text-(--button-color)',
    'hover:bg-(--button-hover)',
    // band 3: data-attribute-scoped structural variant utilities
    'data-[variant=link]:underline-offset-4 data-[variant=link]:hover:underline',
    'data-[variant=link]:border-transparent data-[variant=link]:bg-transparent',
  ].join(' '),
};

export const Button = definePolymorphicComponent<
  ButtonOwnProps,
  'button',
  typeof selectors,
  typeof variants,
  readonly ['size', 'intent', 'variant']
>({
  name: 'Button',
  defaultElement: 'button',
  vocabularyAxes: ['size', 'intent', 'variant'] as const,
  selectors,
  variants,
  classes,
  defaults: { intent: 'primary', variant: 'filled', size: 'md' },
  // A custom `vars` resolver REPLACES the builder's autoVars fallback
  // (define-polymorphic-component.tsx:127-130), so the intent-resolver output
  // is composed explicitly; dimension vars ride alongside it on root.
  vars: (theme, props) => {
    const auto = autoVars(theme, 'Button', props as Record<string, unknown>, true);
    return {
      root: {
        ...(auto.root ?? {}),
        '--sb-button-h': `var(--button-height-${(props as { size?: string }).size ?? 'md'})`,
        '--sb-button-px': `var(--button-px-${(props as { size?: string }).size ?? 'md'})`,
      },
    };
  },
  render: ({
    Element,
    props,
    getStyles,
    ref,
  }: PolymorphicRenderCtx<
    ButtonOwnProps,
    'button',
    typeof selectors,
    typeof variants,
    readonly ['size', 'intent', 'variant']
  >) => {
    const {
      variant,
      children,
      className,
      style,
      classNames,
      styles,
      unstyled,
      attributes,
      vars,
      ...rest
    } = props;
    void variant;
    return (
      <Element
        ref={ref}
        type={Element === 'button' ? 'button' : undefined}
        {...rest}
        {...getStyles('root')}
      >
        {children}
      </Element>
    );
  },
});

export const buttonTheme = Button.extend({
  vocabulary: { variant: defineVocabulary(variants) },
});
