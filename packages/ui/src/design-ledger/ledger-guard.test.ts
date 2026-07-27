import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { coverageReport, LEDGER, type LedgerRow, validateLedger } from './ledger.ts';
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

describe('ledger coverage', () => {
  it('every declared row names a tier', () => {
    const untiered = LEDGER.filter((r) => r.tier !== 'token' && r.tier !== 'measured');
    expect(untiered.map((r) => r.id)).toEqual([]);
  });

  it('reports which recipes are covered and which are not', () => {
    const report = coverageReport(
      [
        {
          id: 'switch.thumb.centered',
          species: 'invariant',
          tier: 'measured',
          assert: 'predicate',
        },
      ],
      ['Switch', 'Button', 'Alert'],
    );
    expect(report).toContain('1/1 rows declared');
    expect(report).toContain('covering 1 of 3 recipes');
    expect(report).toContain('uncovered: Alert, Button');
  });

  it('every recipe referencing --accent-primary is mounted in the focus ring scan', () => {
    const recipesDir = join(import.meta.dirname, '..', 'recipes');
    const referencing = readdirSync(recipesDir).filter((name) => {
      const css = join(recipesDir, name, `${name}.module.css`);
      try {
        return readFileSync(css, 'utf8').includes('--accent-primary');
      } catch {
        return false;
      }
    });

    const browserTest = readFileSync(join(import.meta.dirname, 'ledger.browser.test.tsx'), 'utf8');

    // A bare `includes('<' + name)` is fooled the moment one recipe's name is
    // a PREFIX of another's, which is not hypothetical: "Text" is a literal
    // prefix of both "TextInput" and "Textarea" in this exact recipe set
    // (checked across every recipe directory name). Textarea/TextInput are
    // mounted in ledger.browser.test.tsx, so its source text contains
    // "<Textarea" and "<TextInput", both of which also contain "<Text" as a
    // substring. If "Text" ever starts referencing --accent-primary, a plain
    // substring search would read it as mounted purely because its sibling's
    // longer tag happens to start the same way, silently reopening the exact
    // gap this test exists to close. Requiring that the character right
    // after the name is not itself an identifier character (so `<Text ` /
    // `<Text>` / `<Text.Foo` count as a real mount but `<TextInput` does not)
    // is what tells an actual `<Text ...>` mount apart from a same-prefixed
    // sibling's tag.
    const isMounted = (name: string) => new RegExp(`<${name}(?![A-Za-z0-9])`).test(browserTest);
    const unmounted = referencing.filter((name) => !isMounted(name));

    expect(
      unmounted,
      `these recipes reference --accent-primary but are never mounted in ledger.browser.test.tsx, so the focus.ring.uniform scan cannot see their rules: ${unmounted.join(', ')}`,
    ).toEqual([]);
  });
});
