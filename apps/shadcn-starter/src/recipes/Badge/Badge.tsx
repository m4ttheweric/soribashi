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
    // band 1: structural (donor-faithful: shadcn badge.tsx)
    'inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow]',
    'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-(--border-focus)/50',
    '[&>svg]:pointer-events-none [&>svg]:size-3',
    // band 2: var-indirection
    'bg-(--badge-bg) text-(--badge-color) border-(--badge-border)',
    // band 3: data-attribute structural variants
    'data-[variant=filled]:border-transparent data-[variant=subtle]:border-transparent',
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
    return { root: { ...(auto.root ?? {}) } };
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
