import { createTheme, defineVocabulary } from '@soribashi/theme';
import type { ComponentProps, ReactNode } from 'react';
/**
 * Type tests for phase 2 goals 1 + 3 on the THEMED path: makeBuilders returns
 * all four builders typed against the theme vocabulary, so global-axis props
 * (size/intent) narrow to the theme's literal unions on public props AND in
 * `defaults`. Covers the audit's exact scenarios: Badge accepts size="md"
 * narrowed to theme literals, rejects size="banana", and defaults typos like
 * size: 'humongous' are compile errors.
 */
import { describe, expectTypeOf, it } from 'vitest';
import { makeBuilders } from '../src/create-builders.ts';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
  vocabulary: {
    size: defineVocabulary(['sm', 'md', 'lg']),
    intent: defineVocabulary(['primary', 'danger']),
  },
});

const { defineComponent, definePolymorphicComponent, defineCompound, defineGenericComponent } =
  makeBuilders<typeof theme>();

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
  name: 'ThemedBadge',
  vocabularyAxes: ['size', 'intent', 'variant'] as const,
  selectors: ['root', 'label'] as const,
  variants: badgeVariants,
  classes: { root: 'tb-root', label: 'tb-label' },
  defaults: { size: 'md', intent: 'primary', variant: 'dot' },
  render: () => null,
});

type BadgeProps = ComponentProps<typeof Badge>;

describe('themed defineComponent narrows global axes to theme literals (goal 1)', () => {
  it('accepts size="md" narrowed to the theme literals', () => {
    const ok: BadgeProps = { size: 'md', intent: 'danger', variant: 'dot' };
    void ok;
    expectTypeOf<BadgeProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
    expectTypeOf<BadgeProps['intent']>().toEqualTypeOf<'primary' | 'danger' | undefined>();
  });

  it('rejects size="banana"', () => {
    // @ts-expect-error — 'banana' is not in the theme size vocabulary
    const bad: BadgeProps = { size: 'banana' };
    void bad;
  });

  it('keeps selector-keyed classNames on the themed path (goal 2)', () => {
    const ok: BadgeProps = { classNames: { root: 'x' } };
    void ok;
    // @ts-expect-error — 'nonexistent' is not a declared selector
    const bad: BadgeProps = { classNames: { nonexistent: 'x' } };
    void bad;
  });
});

describe('themed defaults type-check against theme literals (goal 3)', () => {
  it('rejects defaults size typos on defineComponent', () => {
    defineComponent<BadgeOwnProps, readonly ['root'], typeof badgeVariants, readonly ['size']>({
      name: 'ThemedBadgeDefaults',
      vocabularyAxes: ['size'] as const,
      selectors: ['root'] as const,
      variants: badgeVariants,
      // @ts-expect-error — 'humongous' is not in the theme size vocabulary
      defaults: { size: 'humongous' },
      render: () => null,
    });
  });

  it('rejects defaults typos on definePolymorphicComponent (audit scenario)', () => {
    definePolymorphicComponent<
      BadgeOwnProps,
      'span',
      readonly ['root'],
      typeof badgeVariants,
      readonly ['size', 'intent']
    >({
      name: 'ThemedPolyDefaults',
      defaultElement: 'span',
      vocabularyAxes: ['size', 'intent'] as const,
      selectors: ['root'] as const,
      variants: badgeVariants,
      // @ts-expect-error — 'loud' is not in the theme intent vocabulary
      defaults: { intent: 'loud' },
      render: () => null,
    });
  });

  it('rejects defaults typos on defineGenericComponent', () => {
    defineGenericComponent({
      name: 'ThemedGenericDefaults',
      vocabularyAxes: ['size'] as const,
      selectors: ['root'] as const,
      // @ts-expect-error — 'humongous' is not in the theme size vocabulary
      defaults: { size: 'humongous' },
      render: () => null,
    });
  });
});

describe('themed defineCompound narrows Root global axes (goal 1)', () => {
  const Foo = defineCompound({
    name: 'ThemedFoo',
    vocabularyAxes: ['size', 'variant'] as const,
    variants: ['default', 'pills'] as const,
    classes: { root: 'tf-root' },
    parts: { root: { render: () => null } },
  });

  type FooProps = ComponentProps<typeof Foo>;

  it('narrows Root size to the theme literals and keeps the variant tuple', () => {
    const ok: FooProps = { size: 'lg', variant: 'pills' };
    void ok;
    expectTypeOf<FooProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
    // @ts-expect-error — 'banana' is not in the theme size vocabulary
    const bad: FooProps = { size: 'banana' };
    void bad;
  });

  it('rejects compound defaults size typos (goal 3)', () => {
    defineCompound({
      name: 'ThemedFooDefaults',
      vocabularyAxes: ['size'] as const,
      classes: { root: 'x' },
      // @ts-expect-error — 'humongous' is not in the theme size vocabulary
      defaults: { size: 'humongous' },
      parts: { root: { render: () => null } },
    });
  });
});
