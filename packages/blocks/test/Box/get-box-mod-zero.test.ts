/**
 * TDD regression test for BUG GBM-Z1:
 *   getBoxMod({ count: 0 }) incorrectly filters the numeric-0 value.
 *
 * Mantine source: packages/@mantine/core/src/core/Box/get-box-mod/get-box-mod.ts (63dafbbf)
 * Mantine's getMod() filters: undefined, '', false, null — but NOT 0.
 * Soribashi previously also filtered v === 0, which was wrong.
 *
 * After the fix, numeric 0 is treated as a valid truthy-enough mod value and
 * forwarded to the DOM as data-count="0".
 */
import { describe, expect, it } from 'vitest';
import { getBoxMod } from '../../src/Box/get-box-mod.ts';

describe('getBoxMod — numeric-0 filter (GBM-Z1, Mantine parity)', () => {
  it('GBM-Z1a: numeric 0 is NOT filtered (Mantine keeps it)', () => {
    // Mantine: getMod filters undefined / '' / false / null but NOT 0
    expect(getBoxMod({ count: 0 })).toEqual({ 'data-count': 0 });
  });

  it('GBM-Z1b: numeric 0 in an array mod item is kept', () => {
    expect(getBoxMod([{ level: 0 }])).toEqual({ 'data-level': 0 });
  });

  it('GBM-Z1c: false is still filtered (Mantine filters it)', () => {
    expect(getBoxMod({ active: false })).toEqual({});
  });

  it('GBM-Z1d: null is still filtered', () => {
    expect(getBoxMod({ active: null })).toEqual({});
  });

  it('GBM-Z1e: empty string is still filtered', () => {
    expect(getBoxMod({ label: '' })).toEqual({});
  });

  it('GBM-Z1f: undefined is still filtered', () => {
    expect(getBoxMod({ active: undefined })).toEqual({});
  });

  it('GBM-Z1g: mixed record with 0 and falsy — only 0 survives, others are filtered', () => {
    expect(getBoxMod({ count: 0, active: false, label: '', x: null, y: undefined })).toEqual({
      'data-count': 0,
    });
  });
});
