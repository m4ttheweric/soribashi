import { describe, expect, it } from 'vitest';
import { borderResolver } from '../../src/Box/style-props/resolvers/border-resolver.ts';

describe('borderResolver', () => {
  it('numeric input is rem-converted', () => {
    expect(borderResolver(1)).toBe('0.0625rem');
    expect(borderResolver(2)).toBe('0.125rem');
  });
  it('"1px solid primary.500" → "0.0625rem solid var(--color-primary-500)"', () => {
    expect(borderResolver('1px solid primary.500')).toBe(
      '0.0625rem solid var(--color-primary-500)',
    );
  });
  it('"2px dashed surface.raised" → semantic-token color resolution', () => {
    expect(borderResolver('2px dashed surface.raised')).toBe(
      '0.125rem dashed var(--surface-raised)',
    );
  });
  it('"1px solid red" → CSS color passes through when theme lacks a red family', () => {
    const theme = { tokens: { colors: { primary: { '500': 'x' } } } } as never;
    expect(borderResolver('1px solid red', theme)).toBe('0.0625rem solid red');
  });
  it('"1px solid red" → token-resolved when theme declares a red family', () => {
    const theme = { tokens: { colors: { red: { '500': 'x' } } } } as never;
    expect(borderResolver('1px solid red', theme)).toBe(
      '0.0625rem solid var(--color-red-500)',
    );
  });
  it('"1px solid #abc" → hex passes through getThemeColor unchanged', () => {
    expect(borderResolver('1px solid #abc')).toBe('0.0625rem solid #abc');
  });
  it('"1px solid var(--my-color)" → CSS var passes through', () => {
    expect(borderResolver('1px solid var(--my-color)')).toBe(
      '0.0625rem solid var(--my-color)',
    );
  });
  it('"none" passes through (no dimensions, no color)', () => {
    expect(borderResolver('none')).toBe('none');
  });
  it('"1px solid transparent" → keyword passes through', () => {
    expect(borderResolver('1px solid transparent')).toBe('0.0625rem solid transparent');
  });
  it('undefined returns undefined', () => {
    expect(borderResolver(undefined)).toBeUndefined();
  });
  it('null returns undefined', () => {
    expect(borderResolver(null)).toBeUndefined();
  });
});
