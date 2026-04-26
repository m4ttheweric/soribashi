import { describe, expectTypeOf, it } from 'vitest';
import type { CompoundStylesApiProps, StylesApiProps } from '../src/index.ts';
import type { FactoryPayload } from '../src/types/factory-payload.ts';

interface TestPayload extends FactoryPayload {
  props: { x: string };
  stylesNames: 'root';
}

describe('CompoundStylesApiProps', () => {
  it('omits `unstyled` and `attributes` from StylesApiProps', () => {
    type Compound = CompoundStylesApiProps<TestPayload>;
    expectTypeOf<Compound>().not.toHaveProperty('unstyled');
    expectTypeOf<Compound>().not.toHaveProperty('attributes');
  });

  it('retains `classNames`, `styles`, `vars` from StylesApiProps', () => {
    type Compound = CompoundStylesApiProps<TestPayload>;
    type Full = StylesApiProps<TestPayload>;
    expectTypeOf<Compound['classNames']>().toEqualTypeOf<Full['classNames']>();
    expectTypeOf<Compound['styles']>().toEqualTypeOf<Full['styles']>();
    expectTypeOf<Compound['vars']>().toEqualTypeOf<Full['vars']>();
  });
});
