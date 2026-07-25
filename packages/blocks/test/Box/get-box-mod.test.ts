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

// Relocated from the old combined Box/style-props.test.ts when the style-prop
// engine moved to @soribashi/factory: getBoxMod itself stays in blocks (it is
// Box's data-attribute API, not part of the style-prop engine), so its tests
// stay colocated with the source here rather than moving with the engine.
describe('getBoxMod', () => {
  it('handles string input', () => {
    expect(getBoxMod('active')).toEqual({ 'data-active': true });
  });

  it('handles record input — boolean true → true', () => {
    expect(getBoxMod({ active: true })).toEqual({ 'data-active': true });
  });

  it('handles record input — false/null/undefined/"" are omitted; numeric 0 is kept (Mantine parity)', () => {
    // Mantine getMod filters: undefined, '', false, null — but NOT numeric 0.
    // See: packages/@mantine/core/src/core/Box/get-box-mod/get-box-mod.ts (63dafbbf)
    expect(getBoxMod({ active: true, loading: false, x: null, y: undefined, z: 0, q: '' })).toEqual(
      {
        'data-active': true,
        'data-z': 0,
      },
    );
  });

  it('truthy non-boolean values become the data-attribute value', () => {
    expect(getBoxMod({ size: 'lg' })).toEqual({ 'data-size': 'lg' });
  });

  it('preserves keys that already start with data-', () => {
    expect(getBoxMod({ 'data-state': 'open' })).toEqual({ 'data-state': 'open' });
  });

  it('handles array input — merges items', () => {
    expect(getBoxMod([{ active: true }, 'open', { size: 'lg' }])).toEqual({
      'data-active': true,
      'data-open': true,
      'data-size': 'lg',
    });
  });

  it('returns empty object for undefined', () => {
    expect(getBoxMod(undefined)).toEqual({});
  });
});
