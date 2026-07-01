/**
 * Type tests for phase 2 goal 6 — compound type machinery:
 *   (a) slot keys thread into part public props and getStyles annotations
 *   (b) PartRenderCtx carries the styles-API framework keys (no hand-casts)
 *   (d) CompoundStylesApiProps aligns with the runtime (unstyled/attributes
 *       ARE forwarded by parts, so the type no longer omits them)
 */
import { describe, expectTypeOf, it } from 'vitest';
import type { ComponentProps, ReactNode } from 'react';
import {
  defineCompound,
  type PartRenderCtx,
  type PolymorphicPartRenderCtx,
} from '../src/define-compound.tsx';
import type { CompoundStylesApiProps, StylesApiProps, ClassNames } from '../src/types/props.ts';
import type { FactoryPayload } from '../src/types/factory-payload.ts';

interface MachineRootProps {
  children?: ReactNode;
}
interface MachineLabelProps {
  truncate?: boolean;
}

const Machine = defineCompound({
  name: 'Machine',
  classes: { root: 'm-root', label: 'm-label', icon: 'm-icon' },
  parts: {
    root: {
      render: ({ children }: PartRenderCtx<MachineRootProps, object>) => children,
    },
    label: {
      render: (_ctx: PartRenderCtx<MachineLabelProps, object>) => null,
    },
    trigger: {
      polymorphic: true,
      defaultElement: 'button',
      render: (_ctx: PolymorphicPartRenderCtx<{ value?: string }, object>) => null,
    },
  },
});

describe('goal 6a — slot keys thread into part public props', () => {
  it('part classNames accept known slot keys', () => {
    type LabelProps = ComponentProps<typeof Machine.Label>;
    const ok: LabelProps = { classNames: { label: 'x', icon: 'y' } };
    void ok;
  });

  it('part classNames reject slot typos', () => {
    type LabelProps = ComponentProps<typeof Machine.Label>;
    // @ts-expect-error — 'nonexistent' is not a slot key of Machine
    const bad: LabelProps = { classNames: { nonexistent: 'x' } };
    void bad;
  });

  it('annotated PartRenderCtx getStyles({ part }) rejects slot typos (spec-approved path)', () => {
    const renderLabel = (
      ctx: PartRenderCtx<MachineLabelProps, object, readonly string[], 'root' | 'label' | 'icon'>,
    ) => {
      const ok = ctx.getStyles({ part: 'icon' });
      void ok;
      // @ts-expect-error — 'icno' is not a slot key
      const bad = ctx.getStyles({ part: 'icno' });
      void bad;
      return null;
    };
    void renderLabel;
  });
});

describe('goal 6b — PartRenderCtx carries framework keys', () => {
  type Ctx = PartRenderCtx<MachineLabelProps, object, readonly string[], 'root' | 'label'>;

  it('props include the styles-API framework keys without hand-casts', () => {
    expectTypeOf<Ctx['props']['className']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<Ctx['props']['unstyled']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<Ctx['props']['truncate']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<Ctx['props']>().toHaveProperty('style');
    expectTypeOf<Ctx['props']>().toHaveProperty('styles');
    expectTypeOf<Ctx['props']>().toHaveProperty('vars');
    expectTypeOf<Ctx['props']>().toHaveProperty('attributes');
  });

  it('props classNames are keyed by the slot keys', () => {
    expectTypeOf<Ctx['props']['classNames']>().toEqualTypeOf<
      ClassNames<{ props: MachineLabelProps; stylesNames: 'root' | 'label' } & FactoryPayload> | undefined
    >();
  });
});

describe('goal 6d — CompoundStylesApiProps matches the runtime contract', () => {
  interface TestPayload extends FactoryPayload {
    props: { x: string };
    stylesNames: 'root';
  }

  it('retains unstyled and attributes (the runtime forwards both from parts)', () => {
    type Compound = CompoundStylesApiProps<TestPayload>;
    type Full = StylesApiProps<TestPayload>;
    expectTypeOf<Compound['unstyled']>().toEqualTypeOf<Full['unstyled']>();
    expectTypeOf<Compound['attributes']>().toEqualTypeOf<Full['attributes']>();
  });
});
