/**
 * Type tests for SORI-14: `defineComponent`'s render-ctx `ref` and the
 * produced component's `ref` prop were hardcoded to `Ref<HTMLElement>` /
 * `RefAttributes<HTMLElement>`, so a recipe whose root is outside that type
 * (an inline `<svg>`, an `SVGSVGElement`) needed a cast at the render site,
 * and a consumer holding a `useRef<SVGSVGElement>(null)` needed a cast of
 * their own to pass it as `ref` (TS2322).
 *
 * `defineComponent` now takes a fifth, defaulted type param — `TElement
 * extends Element = HTMLElement` — threaded through both the render ctx's
 * `ref` and the produced component's `ref` prop. Every existing call site
 * (which never names this param) keeps exactly its old `HTMLElement` typing;
 * this file pins that alongside the new opt-in behaviour.
 */
import type { ComponentProps, Ref } from 'react';
import { describe, expectTypeOf, it } from 'vitest';
import { defineComponent } from '../../src/factory/define-component.tsx';

describe('SORI-14 — TElement default preserves existing HTMLElement typing', () => {
  it('the render ctx ref is Ref<HTMLElement> when TElement is not named', () => {
    defineComponent({
      name: 'ElementDefaultDiv',
      selectors: ['root'] as const,
      render: ({ ref, getStyles }) => {
        expectTypeOf(ref).toEqualTypeOf<Ref<HTMLElement>>();
        return null;
      },
    });
  });
});

describe('SORI-14 — an explicit TElement types the ref end to end, no cast', () => {
  const SvgIcon = defineComponent<
    Record<never, never>,
    readonly ['root'],
    readonly [],
    readonly [],
    SVGSVGElement
  >({
    name: 'ElementSvgIcon',
    selectors: ['root'] as const,
    render: ({ ref, getStyles }) => {
      // No cast: the render ctx's ref is already Ref<SVGSVGElement>, so it
      // assigns directly to a real <svg> without `as Ref<SVGSVGElement>`.
      expectTypeOf(ref).toEqualTypeOf<Ref<SVGSVGElement>>();
      return null;
    },
  });

  it('the produced component accepts an SVGSVGElement ref with no cast', () => {
    // A consumer holding a real SVG ref can pass it straight through — this
    // is the exact TS2322 the kit's Icon.tsx casts around today.
    expectTypeOf(SvgIcon).toHaveProperty('displayName');
    type SvgIconProps = ComponentProps<typeof SvgIcon>;
    expectTypeOf<SvgIconProps['ref']>().toEqualTypeOf<Ref<SVGSVGElement> | undefined>();
  });
});
