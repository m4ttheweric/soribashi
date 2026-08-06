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
  /**
   * Recipes this row actually checks, when the id's first dot-segment does
   * not already name exactly one recipe directory. Declared, not inferred:
   * which recipes a cross-cutting row like focus.ring.uniform touches is a
   * fact only the row's author knows, not something coverageReport's prefix
   * heuristic can recover (it previously missed radio.dot.centered covering
   * RadioGroup, since the id's prefix is "radio" not "radiogroup", and gave
   * no credit at all to focus.ring.uniform or controls.sharedHeight for the
   * many recipes they genuinely mount and check).
   */
  covers?: readonly string[];
}

export const LEDGER: readonly LedgerRow[] = [
  { id: 'switch.thumb.centered', species: 'invariant', tier: 'measured', assert: 'predicate' },
  // switch.thumb.centered (above) asserts symmetry and whole-pixel gaps, and
  // both genuinely held at xs even before the 2026-07-27 fix: the defect it
  // did not catch was a fractional TRACK WIDTH (1.75 * 14px = 24.5px), a
  // property neither symmetry nor gap-wholeness implies. Deliberately not a
  // constant-ratio row: this recipe's thumb/track ratio is not constant
  // across sizes by design (0.875/0.8/0.833/0.857 for sm..xl), so asserting
  // one fixed ratio would fail correctly-built sizes forever.
  {
    id: 'switch.trackWidth.wholePixel',
    species: 'invariant',
    tier: 'measured',
    assert: 'predicate',
    covers: ['Switch'],
  },
  {
    id: 'radio.dot.centered',
    species: 'invariant',
    tier: 'measured',
    assert: 'predicate',
    // The id's prefix is "radio", not the recipe directory "RadioGroup", so
    // coverageReport's prefix inference alone would silently mark RadioGroup
    // uncovered despite this row measuring it directly (fix round 1 finding).
    covers: ['RadioGroup'],
  },
  { id: 'tabs.indicator.withinList', species: 'invariant', tier: 'measured', assert: 'predicate' },
  { id: 'select.popup.clearsTrigger', species: 'invariant', tier: 'measured', assert: 'predicate' },
  {
    id: 'focus.ring.uniform',
    species: 'invariant',
    tier: 'measured',
    assert: 'predicate',
    // Every recipe whose declared focus ring this row measures: the browser
    // test iterates exactly this list, mounts each entry's fixture, drives a
    // real keyboard Tab, and reads the computed outline off the focused
    // control. ledger-guard.test.ts keeps the list honest from both sides:
    // any recipe referencing --accent-primary must appear here, and the
    // browser test itself fails any entry lacking a mount fixture.
    covers: [
      'Accordion',
      'Alert',
      'Button',
      'Checkbox',
      'RadioGroup',
      'Select',
      'Switch',
      'Tabs',
      'TextInput',
      'Textarea',
    ],
  },
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
  {
    id: 'accordion.panel.animates',
    species: 'invariant',
    tier: 'measured',
    assert: 'predicate',
    // The 2026-08-03 defect: keepMounted/keyframes/panelContent all required
    // together (STATUS.md design-ledger record) before the panel animated at
    // all. coverageReport credited Accordion without this row ever existing,
    // so a regression of its one known defect would have been invisible to
    // the ledger. This row pins the observable outcome: an opening panel has
    // a real, running animation with a nonzero duration.
    covers: ['Accordion'],
  },
  // The first identity rows (part 2, step 1). An identity row records
  // soribashi's OWN decision, with no external witness: the value asserted is
  // what the shipped uiTheme actually renders, measured before being written
  // down (an identity row records reality, it does not aspirate). Provenance
  // for where these ramp values originally came from (Tailwind, verbatim) is
  // recorded in reference.ts's PROVENANCE, which is what makes keeping them
  // an explicit choice rather than silent convergence.
  {
    id: 'radius.md.rendered',
    species: 'identity',
    tier: 'measured',
    assert: 'equals',
    bound: 6, // px; --radius-md (0.375rem), Button's default corner radius
    covers: ['Button'],
  },
  {
    id: 'spacing.md.rendered',
    species: 'identity',
    tier: 'measured',
    assert: 'equals',
    bound: 12, // px; --spacing-md (0.75rem) as consumed by Group's default gap
    covers: ['Group'],
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
    // The id's prefix "controls" names no recipe at all, so without this the
    // three recipes this row actually measures would get zero coverage
    // credit even though each is exercised at every size.
    covers: ['Button', 'TextInput', 'Select'],
  },
];

/**
 * The declared tolerance of a row, for assertions to read: a row's tolerance
 * is only real if the assertion that measures the row compares through it
 * (ledger-guard.test.ts enforces the linkage by scanning for
 * `toleranceOf('<id>')`). A row that declares none tolerates nothing: 0.
 * Assertions must compare INCLUSIVELY (`<= tolerance`): tolerating nothing
 * means requiring exact equality, and a strict `<` against the default 0
 * would fail even measurements that agree exactly.
 */
export function toleranceOf(id: string): number {
  const row = LEDGER.find((r) => r.id === id);
  if (!row) throw new Error(`no ledger row '${id}'`);
  return row.tolerance ?? 0;
}

// A pass/fail count alone reads as "done"; naming what the ledger did NOT
// look at keeps a green run honest about the difference between "no known
// defect" and "swept". This is read on every run, not filed away in a spec
// where a limitation only gets read once.
export function coverageReport(rows: readonly LedgerRow[], allRecipes: readonly string[]): string {
  const covered = new Set<string>();
  for (const row of rows) {
    // `covers` is the ground truth when a row declares it: only the row's
    // author knows which recipes a cross-cutting check like
    // focus.ring.uniform actually touches. The id-prefix guess is a fallback
    // for the common case where the first dot-segment already names exactly
    // one recipe (e.g. "switch.thumb.centered" -> "Switch"), kept so every
    // existing row does not need a redundant `covers` entry.
    const names = row.covers ?? [row.id.split('.')[0]].filter((p): p is string => p !== undefined);
    for (const name of names) covered.add(name.toLowerCase());
  }
  const hit = allRecipes.filter((name) => covered.has(name.toLowerCase()));
  const missed = allRecipes.filter((name) => !covered.has(name.toLowerCase())).sort();

  return [
    `design ledger: ${rows.length}/${rows.length} rows declared`,
    `covering ${hit.length} of ${allRecipes.length} recipes`,
    `uncovered: ${missed.join(', ')}`,
  ].join('\n');
}

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
