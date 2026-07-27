export interface LedgerRow {
  id: string;
  species: 'floor' | 'identity' | 'invariant';
  tier: 'token' | 'measured';
  assert: 'min' | 'max' | 'range' | 'equals' | 'predicate';
  bound?: number | readonly [number, number];
  tolerance?: number;
  /** Where an external bound came from. Illegal on identity rows. */
  witness?: string;
  /** A recorded, deliberate difference. Must cite proof, never give a reason. */
  diverge?: string;
}

export const LEDGER: readonly LedgerRow[] = [
  { id: 'switch.thumb.centered', species: 'invariant', tier: 'measured', assert: 'predicate' },
  { id: 'radio.dot.centered', species: 'invariant', tier: 'measured', assert: 'predicate' },
  { id: 'tabs.indicator.withinList', species: 'invariant', tier: 'measured', assert: 'predicate' },
];

export function validateLedger(rows: readonly LedgerRow[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.id)) problems.push(`${row.id}: duplicate row id`);
    seen.add(row.id);

    if (row.species === 'floor' && row.assert === 'equals') {
      problems.push(
        `${row.id}: species 'floor' cannot use assert 'equals'; floors assert a bound, not a match`,
      );
    }
    if (row.species === 'identity' && row.witness !== undefined) {
      problems.push(
        `${row.id}: species 'identity' cannot carry a witness; identity values are our own decision`,
      );
    }
    if (row.diverge !== undefined && !row.diverge.startsWith('proof-via: ')) {
      problems.push(`${row.id}: diverge must start with 'proof-via: '; a reason is not a proof`);
    }
  }
  return problems;
}
