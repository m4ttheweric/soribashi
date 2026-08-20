import type { ReactNode } from 'react';
/**
 * SORI-14: `.extend({ defaultProps: { as } })` is the sanctioned way for a
 * theme to retarget a polymorphic recipe's element — the builder resolves `as`
 * after `useProps` precisely so that works, and a runtime test in
 * define-polymorphic-component.test.tsx pins it. The TYPE lagged: `as` appeared
 * in none of the three arms of `PolymorphicExtendProps`, so the config failed
 * excess-property checking (TS2353) and call sites needed an
 * `as unknown as Parameters<typeof X.extend>[0]` cast.
 *
 * Compile-time assertions; `bun run typecheck` is the gate.
 */
import { describe, expectTypeOf, it } from 'vitest';
import { definePolymorphicComponent } from '../../src/factory/define-polymorphic-component.tsx';

interface ChipOwnProps {
  children?: ReactNode;
  label?: string;
}

const chipVariants = ['filled', 'outline'] as const;

const Chip = definePolymorphicComponent<
  ChipOwnProps,
  'span',
  readonly ['root'],
  typeof chipVariants
>({
  name: 'TypedChip',
  defaultElement: 'span',
  selectors: ['root'] as const,
  variants: chipVariants,
  classes: { root: 'chip-root' },
  render: () => null,
});

describe('polymorphic .extend accepts `as` in defaultProps', () => {
  it('takes a host element tag with no cast', () => {
    const entry = Chip.extend({ defaultProps: { as: 'button' } });
    expectTypeOf(entry).not.toBeNever();
  });

  it('takes a component type, not just an intrinsic tag', () => {
    const Anchor = (props: { href?: string }) => {
      void props;
      return null;
    };
    const entry = Chip.extend({ defaultProps: { as: Anchor } });
    expectTypeOf(entry).not.toBeNever();
  });

  it('still carries the recipe`s own props and vocabulary alongside as', () => {
    const entry = Chip.extend({
      defaultProps: { as: 'a', label: 'tag', variant: 'outline', intent: 'primary' },
    });
    expectTypeOf(entry).not.toBeNever();
  });

  it('does not open the config up to arbitrary unknown keys', () => {
    // @ts-expect-error — `nope` is not a prop of this recipe
    Chip.extend({ defaultProps: { as: 'a', nope: true } });
  });

  it('still rejects a variant outside the recipe tuple', () => {
    // @ts-expect-error — 'ghost' is not in the variants tuple
    Chip.extend({ defaultProps: { as: 'a', variant: 'ghost' } });
  });
});
