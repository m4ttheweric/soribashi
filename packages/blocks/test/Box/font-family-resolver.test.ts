import { describe, expect, it } from 'vitest';
import { fontFamilyResolver } from '../../src/Box/style-props/resolvers/font-family-resolver.ts';

describe('fontFamilyResolver', () => {
  it('text → var(--font-family-sans)', () => {
    expect(fontFamilyResolver('text')).toBe('var(--font-family-sans)');
  });
  it('sans → var(--font-family-sans)', () => {
    expect(fontFamilyResolver('sans')).toBe('var(--font-family-sans)');
  });
  it('mono → var(--font-family-mono)', () => {
    expect(fontFamilyResolver('mono')).toBe('var(--font-family-mono)');
  });
  it('monospace → var(--font-family-mono)', () => {
    expect(fontFamilyResolver('monospace')).toBe('var(--font-family-mono)');
  });
  it('heading → var(--font-family-heading)', () => {
    expect(fontFamilyResolver('heading')).toBe('var(--font-family-heading)');
  });
  it('headings → var(--font-family-heading)', () => {
    expect(fontFamilyResolver('headings')).toBe('var(--font-family-heading)');
  });
  it('non-alias string passes through (e.g., "serif")', () => {
    expect(fontFamilyResolver('serif')).toBe('serif');
  });
  it('full font-family stack passes through', () => {
    expect(fontFamilyResolver('"Inter", sans-serif')).toBe('"Inter", sans-serif');
  });
  it('undefined returns undefined', () => {
    expect(fontFamilyResolver(undefined)).toBeUndefined();
  });
  it('null returns undefined', () => {
    expect(fontFamilyResolver(null)).toBeUndefined();
  });
});
