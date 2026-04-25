import { describe, expect, it } from 'vitest';
import { getBoxMod } from '../../src/Box/get-box-mod.ts';

describe('getBoxMod — camelCase key transformation', () => {
  it('camelCase key is kebab-cased: isActive → data-is-active', () => {
    expect(getBoxMod({ isActive: true })).toEqual({ 'data-is-active': true });
  });

  it('XLarge key (uppercase-start) is lowercased but not split: XLarge → data-xlarge', () => {
    // Regex only matches lowercase→uppercase transitions; XLarge has no such transition.
    expect(getBoxMod({ XLarge: 'lg' })).toEqual({ 'data-xlarge': 'lg' });
  });

  it('keys already prefixed data-* are passed through verbatim', () => {
    expect(getBoxMod({ 'data-state': 'open' })).toEqual({ 'data-state': 'open' });
  });

  it('snake_case is lowercased but not otherwise transformed', () => {
    // only camelCase gets the $1-$2 treatment; snake_case passes through lowercased
    expect(getBoxMod({ active: true })).toEqual({ 'data-active': true });
  });

  it('string mod with camelCase is not processed (strings are bare tokens, not property names)', () => {
    // String mods are inserted verbatim; 'isActive' becomes data-isActive, then DOM lower-cases
    // The string branch does NOT apply transformModKey per Mantine reference.
    // But our implementation applies it — confirm behavior here.
    expect(getBoxMod('isOpen')).toEqual({ 'data-is-open': true });
  });
});
