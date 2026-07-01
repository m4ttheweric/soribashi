import type { ReactNode } from 'react';
/**
 * Type tests for phase 2 goal 7 (withProps return types keep statics so
 * `.withProps().withProps()` and `.withProps().extend()` chains type-check;
 * both already work at runtime) and goals 1-2 on the raw polymorphic builder
 * (vocabulary axes + selector-keyed styles API on public props).
 */
import { describe, expectTypeOf, it } from 'vitest';
import { defineComponent } from '../src/define-component.tsx';
import { defineCompound } from '../src/define-compound.tsx';
import { defineGenericComponent } from '../src/define-generic-component.tsx';
import { definePolymorphicComponent } from '../src/define-polymorphic-component.tsx';

const chipVariants = ['dot', 'pill'] as const;

interface ChipOwnProps {
  children?: ReactNode;
}

describe('goal 7 — defineComponent withProps chains keep statics', () => {
  const Chip = defineComponent<
    ChipOwnProps,
    readonly ['root'],
    typeof chipVariants,
    readonly ['size']
  >({
    name: 'ChainChip',
    vocabularyAxes: ['size'] as const,
    selectors: ['root'] as const,
    variants: chipVariants,
    render: () => null,
  });

  it('.withProps().withProps() type-checks', () => {
    const Chained = Chip.withProps({ size: 'md' }).withProps({ variant: 'dot' });
    expectTypeOf(Chained).toHaveProperty('withProps');
    expectTypeOf(Chained).toHaveProperty('extend');
  });

  it('.withProps().extend() type-checks and keeps prop constraints', () => {
    const entry = Chip.withProps({ size: 'md' }).extend({ defaultProps: { variant: 'pill' } });
    void entry;
    // @ts-expect-error — 'square' is not in the variants tuple
    Chip.withProps({}).extend({ defaultProps: { variant: 'square' } });
  });
});

describe('goals 1-2 + 7 — raw definePolymorphicComponent', () => {
  const Text = definePolymorphicComponent<
    ChipOwnProps,
    'p',
    readonly ['root', 'body'],
    typeof chipVariants,
    readonly ['size', 'variant']
  >({
    name: 'ChainText',
    defaultElement: 'p',
    vocabularyAxes: ['size', 'variant'] as const,
    selectors: ['root', 'body'] as const,
    variants: chipVariants,
    render: ({ Element, getStyles }) => <Element {...getStyles('root')} />,
  });

  it('public props include declared axes (string-typed) and the variant tuple', () => {
    const el = <Text size="md" variant="dot" />;
    void el;
    // @ts-expect-error — 'square' is not in the variants tuple
    const bad = <Text variant="square" />;
    void bad;
  });

  it('classNames are selector-keyed at call sites', () => {
    const ok = <Text classNames={{ root: 'x', body: 'y' }} />;
    void ok;
    // @ts-expect-error — 'nonexistent' is not a declared selector
    const bad = <Text classNames={{ nonexistent: 'x' }} />;
    void bad;
  });

  it('.withProps().withProps() and .withProps().extend() type-check', () => {
    const Chained = Text.withProps({ size: 'md' }).withProps({ variant: 'dot' });
    expectTypeOf(Chained).toHaveProperty('extend');
    const entry = Text.withProps({}).extend({ defaultProps: { variant: 'pill' } });
    void entry;
  });

  it('withProps result keeps polymorphism', () => {
    const SpanText = Text.withProps({ as: 'span' });
    const el = <SpanText as="a" href="/x" />;
    void el;
  });
});

describe('goal 7 — defineCompound withProps chains keep statics', () => {
  const Foo = defineCompound({
    name: 'ChainFoo',
    variants: ['a', 'b'] as const,
    classes: { root: 'cf-root' },
    parts: { root: { render: () => null } },
  });

  it('.withProps().withProps() and .withProps().extend() type-check', () => {
    const Chained = Foo.withProps({ variant: 'a' }).withProps({ variant: 'b' });
    expectTypeOf(Chained).toHaveProperty('extend');
    const entry = Foo.withProps({ variant: 'a' }).extend({ classNames: { root: 'x' } });
    void entry;
  });
});

describe('goal 7 — defineGenericComponent withProps chains keep statics', () => {
  const List = defineGenericComponent({
    name: 'ChainList',
    selectors: ['root'] as const,
    render: () => null,
  });

  it('.withProps().withProps() and .withProps().extend() type-check', () => {
    const Chained = List.withProps({}).withProps({});
    expectTypeOf(Chained).toHaveProperty('extend');
    const entry = List.withProps({}).extend({ defaultProps: {} });
    void entry;
  });
});
