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
  { id: 'select.popup.clearsTrigger', species: 'invariant', tier: 'measured', assert: 'predicate' },
  { id: 'focus.ring.uniform', species: 'invariant', tier: 'measured', assert: 'predicate' },
  {
    id: 'dialog.scrim.effectiveDarkness',
    species: 'floor',
    tier: 'token',
    assert: 'range',
    bound: [0.4, 0.7],
    witness: 'see reference.ts',
  },
  // Two rows, not one: fix round 1 found that a single skeleton.deltaL row,
  // measured light-only, could not see that the shipped fill (correct in
  // light) still failed in dark, because WCAG relative luminance compresses
  // harder at the dark tail of the neutral ramp than the light head does for
  // the same rung-count gap. "deltaY" (not "deltaL") names the scale
  // explicitly: this is WCAG relative luminance, not the OKLCH lightness
  // ("L") the shadcn citations in reference.ts are measured in.
  {
    id: 'skeleton.deltaY.light',
    species: 'floor',
    tier: 'measured',
    assert: 'min',
    bound: 0.08,
    witness: 'see reference.ts',
  },
  {
    id: 'skeleton.deltaY.dark',
    species: 'floor',
    tier: 'measured',
    assert: 'min',
    bound: 0.05,
    witness: 'see reference.ts',
  },
  // Admitted on argument, not an observed defect: nobody had measured whether
  // Button/TextInput/Select's independently authored dimension records
  // actually agree. Measured at every size (ledger.browser.test.tsx) before
  // this row was written: they do, exactly, at 28/32/36/40/44px (xs..xl).
  // Pure regression protection, not a fix for a found bug.
  {
    id: 'controls.sharedHeight',
    species: 'invariant',
    tier: 'measured',
    assert: 'predicate',
    tolerance: 0.5,
  },
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
