import { describe, expect, expectTypeOf, it } from 'vitest';
import { defineVocabulary } from '../src/define-vocabulary.ts';

describe('defineVocabulary', () => {
  it('returns an object with __vocab brand, schema, and values', () => {
    const v = defineVocabulary(['xs', 'sm', 'md']);
    expect(v.__vocab).toBe(true);
    expect(v.values).toEqual(['xs', 'sm', 'md']);
    expect(typeof v.schema.safeParse).toBe('function');
  });

  it('schema accepts declared values', () => {
    const v = defineVocabulary(['compact', 'standard', 'comfortable']);
    expect(v.schema.safeParse('compact').success).toBe(true);
    expect(v.schema.safeParse('standard').success).toBe(true);
    expect(v.schema.safeParse('comfortable').success).toBe(true);
  });

  it('schema rejects undeclared values', () => {
    const v = defineVocabulary(['safe', 'critical']);
    const result = v.schema.safeParse('warning');
    expect(result.success).toBe(false);
  });

  it('preserves literal types via const-asserted generic', () => {
    const v = defineVocabulary(['primary', 'secondary']);
    // The inferred type of values should be readonly ['primary', 'secondary'],
    // not readonly string[]. We can't directly assert types at runtime, but
    // we can verify by trying to safeParse — if the inferred enum is too wide,
    // safeParse would accept any string.
    expect(v.schema.safeParse('tertiary').success).toBe(false);
  });

  it('preserves literal types at compile time (typeof v[\"type\"])', () => {
    // The `type` phantom is reachable only via TypeScript; this assertion
    // would fail typecheck if the `const` modifier on the generic ever
    // broke and inference widened to `string`.
    const v = defineVocabulary(['compact', 'standard', 'comfortable']);
    expectTypeOf(v.type).toEqualTypeOf<'compact' | 'standard' | 'comfortable' | undefined>();
    expectTypeOf(v.values).toEqualTypeOf<readonly ('compact' | 'standard' | 'comfortable')[]>();
  });

  it('exposes the optional `type` phantom as undefined at runtime', () => {
    const v = defineVocabulary(['a', 'b']);
    // The `type` field is type-only (phantom); at runtime it's undefined.
    // This test exists to document the runtime contract.
    expect(v.type).toBeUndefined();
  });
});
