import { describe, expectTypeOf, it } from 'vitest';
import type { CompoundStylesApiProps, StylesApiProps } from '../src/index.ts';
import type { FactoryPayload } from '../src/types/factory-payload.ts';

interface TestPayload extends FactoryPayload {
  props: { x: string };
  stylesNames: 'root';
}

// Phase 2 goal 6d: the part runtime forwards unstyled and attributes from the
// part instance into getStyles, so CompoundStylesApiProps no longer omits them
// (intentional divergence from Mantine, whose parts don't forward either).
describe('CompoundStylesApiProps', () => {
  it('matches the full StylesApiProps surface, including unstyled/attributes', () => {
    type Compound = CompoundStylesApiProps<TestPayload>;
    type Full = StylesApiProps<TestPayload>;
    expectTypeOf<Compound['unstyled']>().toEqualTypeOf<Full['unstyled']>();
    expectTypeOf<Compound['attributes']>().toEqualTypeOf<Full['attributes']>();
  });

  it('retains `classNames`, `styles`, `vars` from StylesApiProps', () => {
    type Compound = CompoundStylesApiProps<TestPayload>;
    type Full = StylesApiProps<TestPayload>;
    expectTypeOf<Compound['classNames']>().toEqualTypeOf<Full['classNames']>();
    expectTypeOf<Compound['styles']>().toEqualTypeOf<Full['styles']>();
    expectTypeOf<Compound['vars']>().toEqualTypeOf<Full['vars']>();
  });
});
