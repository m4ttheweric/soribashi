import type { ComponentProps, ReactNode } from 'react';
/**
 * Type tests for the vocabulary rails on the RAW builders (phase 2 goals 1-3):
 *   1. Public props include declared vocabulary axes (string-typed raw).
 *   2. classNames/styles/attributes keys are selector-keyed.
 *   3. defaults variant values type-check against the recipe's variants tuple.
 *
 * Compile-time assertions via @ts-expect-error are validated by the root tsc
 * run; expectTypeOf assertions run under vitest's type checker conventions.
 */
import { describe, expectTypeOf, it } from 'vitest';
import { defineComponent } from '../src/define-component.tsx';
import { type PartRenderCtx, defineCompound } from '../src/define-compound.tsx';

const badgeVariants = ['dot', 'pill'] as const;

interface BadgeOwnProps {
  children?: ReactNode;
}

const Badge = defineComponent<
  BadgeOwnProps,
  readonly ['root', 'label'],
  typeof badgeVariants,
  readonly ['size', 'intent', 'variant']
>({
  name: 'RailsBadge',
  vocabularyAxes: ['size', 'intent', 'variant'] as const,
  selectors: ['root', 'label'] as const,
  variants: badgeVariants,
  classes: { root: 'b-root', label: 'b-label' },
  render: () => null,
});

type BadgeProps = ComponentProps<typeof Badge>;

describe('raw defineComponent public props include vocabulary axes (goal 1)', () => {
  it('accepts declared axes at call sites, string-typed on the raw builder', () => {
    const ok: BadgeProps = { size: 'md', intent: 'primary', variant: 'dot' };
    void ok;
    expectTypeOf<BadgeProps['size']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<BadgeProps['intent']>().toEqualTypeOf<string | undefined>();
  });

  it('narrows variant to the recipe tuple', () => {
    expectTypeOf<BadgeProps['variant']>().toEqualTypeOf<'dot' | 'pill' | undefined>();
    // @ts-expect-error — 'square' is not in the variants tuple
    const bad: BadgeProps = { variant: 'square' };
    void bad;
  });
});

describe('selector-keyed styles API on defineComponent (goal 2)', () => {
  it('accepts classNames keyed by declared selectors', () => {
    const ok: BadgeProps = { classNames: { root: 'x', label: 'y' } };
    void ok;
  });

  it('rejects classNames slot typos', () => {
    // @ts-expect-error — 'nonexistent' is not a declared selector
    const bad: BadgeProps = { classNames: { nonexistent: 'x' } };
    void bad;
  });

  it('rejects styles and attributes slot typos', () => {
    // @ts-expect-error — 'nonexistent' is not a declared selector
    const badStyles: BadgeProps = { styles: { nonexistent: {} } };
    void badStyles;
    // @ts-expect-error — 'nonexistent' is not a declared selector
    const badAttrs: BadgeProps = { attributes: { nonexistent: {} } };
    void badAttrs;
  });
});

describe('typed defaults against the variants tuple (goal 3, raw)', () => {
  it('rejects a defaults variant typo', () => {
    defineComponent<BadgeOwnProps, readonly ['root'], typeof badgeVariants, readonly ['variant']>({
      name: 'RailsBadgeDefaults',
      vocabularyAxes: ['variant'] as const,
      selectors: ['root'] as const,
      variants: badgeVariants,
      // @ts-expect-error — 'square' is not in the variants tuple
      defaults: { variant: 'square' },
      render: () => null,
    });
    // Valid tuple member still accepted
    defineComponent<BadgeOwnProps, readonly ['root'], typeof badgeVariants, readonly ['variant']>({
      name: 'RailsBadgeDefaultsOk',
      vocabularyAxes: ['variant'] as const,
      selectors: ['root'] as const,
      variants: badgeVariants,
      defaults: { variant: 'dot' },
      render: () => null,
    });
  });
});

// ---------------------------------------------------------------------------
// defineCompound Root
// ---------------------------------------------------------------------------

interface RailsTabsRootProps {
  children?: ReactNode;
}

const tabsVariants = ['default', 'pills'] as const;

const RailsTabs = defineCompound({
  name: 'RailsTabs',
  vocabularyAxes: ['size', 'variant'] as const,
  variants: tabsVariants,
  classes: { root: 't-root', list: 't-list' },
  parts: {
    root: {
      render: ({ children }: PartRenderCtx<RailsTabsRootProps, object, typeof tabsVariants>) =>
        children,
    },
    list: { render: () => null },
  },
});

type RailsTabsProps = ComponentProps<typeof RailsTabs>;

describe('raw defineCompound Root public props include vocabulary axes (goal 1)', () => {
  it('accepts declared axes at Root call sites', () => {
    const ok: RailsTabsProps = { size: 'md', variant: 'pills' };
    void ok;
    expectTypeOf<RailsTabsProps['size']>().toEqualTypeOf<string | undefined>();
  });

  it('narrows Root variant to the recipe tuple', () => {
    expectTypeOf<RailsTabsProps['variant']>().toEqualTypeOf<'default' | 'pills' | undefined>();
    // @ts-expect-error — 'square' is not in the variants tuple
    const bad: RailsTabsProps = { variant: 'square' };
    void bad;
  });
});

describe('slot-keyed styles API on defineCompound Root (goals 2 + 6a)', () => {
  it('accepts classNames keyed by classes/part slot keys', () => {
    const ok: RailsTabsProps = { classNames: { root: 'x', list: 'y' } };
    void ok;
  });

  it('rejects classNames slot typos on Root', () => {
    // @ts-expect-error — 'nonexistent' is not a slot key
    const bad: RailsTabsProps = { classNames: { nonexistent: 'x' } };
    void bad;
  });
});

describe('typed compound defaults against the variants tuple (goal 3, raw)', () => {
  it('rejects a defaults variant typo', () => {
    defineCompound({
      name: 'RailsTabsDefaults',
      variants: tabsVariants,
      classes: { root: 'x' },
      // @ts-expect-error — 'square' is not in the variants tuple
      defaults: { variant: 'square' },
      parts: {
        root: { render: () => null },
      },
    });
  });
});

// ---------------------------------------------------------------------------
// Goal 5 — NoInfer on defaults (the README footgun)
// ---------------------------------------------------------------------------

describe('goal 5 — defaults no longer poison call-site prop types (NoInfer)', () => {
  it('zero-type-param recipe with vocab-axis defaults keeps axes wide at call sites', () => {
    const Toggle = defineComponent({
      name: 'NoInferToggle',
      vocabularyAxes: ['size'] as const,
      selectors: ['root'] as const,
      variants: ['on', 'off'] as const,
      defaults: { size: 'md', variant: 'on' },
      render: () => null,
    });
    type ToggleProps = ComponentProps<typeof Toggle>;
    // Previously size was inferred as the literal 'md' from defaults, so any
    // other value failed to compile. Axes stay string-typed on the raw builder.
    const ok: ToggleProps = { size: 'lg', variant: 'off' };
    void ok;
    expectTypeOf<ToggleProps['size']>().toEqualTypeOf<string | undefined>();
  });

  it('own-prop defaults require TOwnProps from an explicit param or render annotation', () => {
    const Chip = defineComponent<{ tone?: string }, readonly ['root']>({
      name: 'NoInferChip',
      selectors: ['root'] as const,
      defaults: { tone: 'md' },
      render: () => null,
    });
    type ChipProps = ComponentProps<typeof Chip>;
    const ok: ChipProps = { tone: 'lg' };
    void ok;
  });
});
