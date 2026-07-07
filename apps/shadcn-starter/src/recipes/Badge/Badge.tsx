import { type PolymorphicRenderCtx, autoVars, defineVocabulary } from '@soribashi/core';
import type { ReactNode } from 'react';
import { definePolymorphicComponent } from '../../builders.ts';

export const variants = ['filled', 'outline', 'subtle'] as const;
type Variant = (typeof variants)[number];

export interface BadgeOwnProps {
  variant?: Variant;
  children?: ReactNode;
}

const selectors = ['root'] as const;

const classes = {
  root: [
    // band 1: structural literals
    'inline-flex items-center rounded-md border font-semibold transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--border-focus)',
    // band 2: var-indirection
    'h-(--sb-badge-h) px-(--sb-badge-px) text-(--sb-badge-fs)',
    'bg-(--badge-bg) text-(--badge-color) border-(--badge-border)',
    // band 3: data-attribute structural variants
    'data-[variant=outline]:bg-transparent',
  ].join(' '),
};

export const Badge = definePolymorphicComponent<
  BadgeOwnProps,
  'span',
  typeof selectors,
  typeof variants,
  readonly ['size', 'intent', 'variant']
>({
  name: 'Badge',
  defaultElement: 'span',
  vocabularyAxes: ['size', 'intent', 'variant'] as const,
  selectors,
  variants,
  classes,
  defaults: { intent: 'primary', variant: 'filled', size: 'sm' },
  vars: (theme, props) => {
    const auto = autoVars(theme, 'Badge', props as Record<string, unknown>, true);
    return {
      root: {
        ...(auto.root ?? {}),
        '--sb-badge-h': `var(--badge-height-${(props as { size?: string }).size ?? 'sm'})`,
        '--sb-badge-px': `var(--badge-px-${(props as { size?: string }).size ?? 'sm'})`,
        '--sb-badge-fs': `var(--badge-fs-${(props as { size?: string }).size ?? 'sm'})`,
      },
    };
  },
  render: ({
    Element,
    props,
    getStyles,
    ref,
  }: PolymorphicRenderCtx<
    BadgeOwnProps,
    'span',
    typeof selectors,
    typeof variants,
    readonly ['size', 'intent', 'variant']
  >) => {
    const {
      variant,
      intent,
      size,
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
    void intent;
    void size;
    return (
      <Element ref={ref} {...rest} {...getStyles('root')}>
        {children}
      </Element>
    );
  },
});

export const badgeTheme = Badge.extend({
  vocabulary: { variant: defineVocabulary(variants) },
});
