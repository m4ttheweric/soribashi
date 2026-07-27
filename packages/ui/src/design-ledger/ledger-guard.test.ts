import { describe, expect, it } from 'vitest';
import { LEDGER, type LedgerRow, validateLedger } from './ledger.ts';
import { REFERENCE } from './reference.ts';

const base: LedgerRow = {
  id: 'test.row',
  species: 'invariant',
  tier: 'measured',
  assert: 'predicate',
};

describe('ledger guard', () => {
  it('rejects a floor row asserting equality', () => {
    const rows = [{ ...base, id: 'f', species: 'floor', assert: 'equals' } as LedgerRow];
    expect(validateLedger(rows)).toEqual([
      "f: species 'floor' cannot use assert 'equals'; floors assert a bound, not a match",
    ]);
  });

  it('rejects an identity row carrying an external witness', () => {
    const rows = [{ ...base, id: 'i', species: 'identity', witness: 'shadcn' } as LedgerRow];
    expect(validateLedger(rows)).toEqual([
      "i: species 'identity' cannot carry a witness; identity values are our own decision",
    ]);
  });

  it('rejects a diverge entry that is not a proof-via reference', () => {
    const rows = [{ ...base, id: 'd', diverge: 'intentional' } as LedgerRow];
    expect(validateLedger(rows)).toEqual([
      "d: diverge must start with 'proof-via: '; a reason is not a proof",
    ]);
  });

  it('accepts a well formed diverge entry', () => {
    const rows = [{ ...base, id: 'd', diverge: 'proof-via: Switch.test.tsx "thumb clears 3:1"' }];
    expect(validateLedger(rows)).toEqual([]);
  });

  it('rejects duplicate row ids', () => {
    expect(validateLedger([base, base])).toEqual(['test.row: duplicate row id']);
  });

  it('the committed ledger is valid', () => {
    expect(validateLedger(LEDGER)).toEqual([]);
  });

  it('every floor row bound matches its reference.ts entry exactly', () => {
    // ledger.ts's `bound` is not load-bearing at runtime: ledger.test.ts and
    // ledger.browser.test.tsx both read the ACTUAL comparison threshold from
    // REFERENCE, not from LEDGER (fix round 1's finding: the two could drift
    // silently, since only one of them is ever compiled into an assertion).
    // This is the cross-check that makes ledger.ts's copy trustworthy to
    // read at a glance instead of just decorative.
    const floorRows = LEDGER.filter((row) => row.species === 'floor');
    expect(floorRows.length).toBeGreaterThan(0);
    for (const row of floorRows) {
      const entry = REFERENCE[row.id];
      expect(entry, `${row.id}: no REFERENCE entry to cross-check against`).toBeDefined();
      expect(row.bound, `${row.id}: ledger.ts's bound diverges from reference.ts's`).toEqual(
        entry!.bound,
      );
    }
  });
});
