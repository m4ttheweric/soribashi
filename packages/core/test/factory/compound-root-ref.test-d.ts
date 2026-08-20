import type { Ref } from 'react';
/**
 * SORI-21: a compound part that needs a real handle on its own element used to
 * face `ref: Ref<unknown>` and had to cast on every assignment. `PartRenderCtx`
 * now takes a trailing, defaulted element type param, so the part names its
 * element once and merges with the (now exported) `mergeRefs`.
 *
 * Compile-time assertions; `bun run typecheck` is the gate.
 */
import { describe, expectTypeOf, it } from 'vitest';
import type {
  PartRenderCtx,
  PolymorphicPartRenderCtx,
} from '../../src/factory/define-compound.tsx';
import { mergeRefs } from '../../src/factory/index.ts';

interface MenuProps {
  open?: boolean;
}

describe('PartRenderCtx element type param', () => {
  it('defaults to Ref<unknown>, leaving every existing annotation unchanged', () => {
    expectTypeOf<PartRenderCtx<MenuProps, object>['ref']>().toEqualTypeOf<Ref<unknown>>();
  });

  it('narrows the ref when the part names its element', () => {
    type Ctx = PartRenderCtx<MenuProps, object, readonly string[], string, HTMLDivElement>;
    expectTypeOf<Ctx['ref']>().toEqualTypeOf<Ref<HTMLDivElement>>();
  });

  it('carries through to polymorphic parts', () => {
    type Ctx = PolymorphicPartRenderCtx<
      MenuProps,
      object,
      readonly string[],
      string,
      HTMLButtonElement
    >;
    expectTypeOf<Ctx['ref']>().toEqualTypeOf<Ref<HTMLButtonElement>>();
    expectTypeOf<Ctx['Element']>().not.toBeNever();
  });

  it('merges a local ref with the forwarded one without a cast', () => {
    type Ctx = PartRenderCtx<MenuProps, object, readonly string[], string, HTMLDivElement>;
    const localRef = { current: null } as { current: HTMLDivElement | null };
    const forwarded = null as unknown as Ctx['ref'];

    // The hand-rolled version of this was the 8-line setRefs callback in the
    // ticket, written only because the barrel appeared to have no mergeRefs.
    const merged = mergeRefs(localRef, forwarded);
    expectTypeOf(merged).parameter(0).toEqualTypeOf<HTMLDivElement | null>();
  });
});
