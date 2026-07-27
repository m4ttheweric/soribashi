export interface FloorWitness {
  bound: number | readonly [number, number];
  witness: string;
}

/**
 * Floor bounds. The witness records where a bound came from; it does not fix
 * the bound, which is soribashi's own decision. Read from real shadcn source
 * at authoring time, never recalled: shadcn/ui (npm package `shadcn`) v4.16.0,
 * repo shadcn-ui/ui @ commit 2a2deaac417cb33720bcdfd0452d7585c3aa417f (main,
 * read 2026-07-27). skeleton.tsx and dialog.tsx were both last touched by
 * commit f31ed81983653919dd4fe77aee4b4859f610f1dc (2026-03-02, "style: run
 * format on all components"); the "neutral" base-color theme they render
 * against (registry/themes.ts, the CLI's default) was last touched by commit
 * 4101ec98af37e2d812f859e3f540bceafbbc5200 (2026-03-31, "fix: colors"). Both
 * predate and are unchanged as of the pinned HEAD above.
 */
export const REFERENCE: Record<string, FloorWitness> = {
  'skeleton.deltaL': {
    bound: 0.08,
    witness:
      'shadcn/ui @ 2a2deaac417cb33720bcdfd0452d7585c3aa417f, registry/new-york-v4/ui/skeleton.tsx ' +
      '"bg-accent" against the page\'s "bg-background", both resolved via registry/themes.ts\'s ' +
      '"neutral" base colour (the CLI default): light accent oklch(0.97 0 0) vs background ' +
      'oklch(1 0 0) is only a 0.03 OKLCH-lightness gap; dark accent oklch(0.269 0 0) vs background ' +
      'oklch(0.145 0 0) is a wider 0.124 gap. Both are OKLCH-L deltas, a different scale from this ' +
      "row's own runtime assertion (WCAG relative luminance over the actual rendered rgb()), so " +
      'they are corroborating evidence that shadcn itself ships a subtle, sometimes barely-there ' +
      'skeleton fill, not a unit-matched proof. The placeholder guess of 0.04 this row started ' +
      'from turned out to sit ON THE WRONG SIDE of our own current bug once actually measured: ' +
      "soribashi's own neutral-50 canvas vs neutral-100 fill (the pre-fix, one-ramp-step case " +
      'this row exists to catch) measures 0.0451 in relative luminance, which is HIGHER than ' +
      "0.04 -- a WCAG-luminance delta is not perceptually linear the way OKLCH's L channel is, and " +
      'compresses far less near white, so the same one-ramp-step gap that looks tiny in OKLCH-L ' +
      '(0.0162) reads as a larger relative-luminance delta. Keeping 0.04 would have let the exact ' +
      'regression this row was written for pass silently. Recomputed empirically instead (measured ' +
      'live via the browser test, see ledger.browser.test.tsx): neutral-50 vs neutral-100 = 0.0451 ' +
      '(the bug), neutral-50 vs neutral-200 = 0.1596 (the fix). 0.08 is our own choice, sitting ' +
      'with real margin above the failing case and real margin below the fixed case, rather than a ' +
      'value picked to sit exactly between two shadcn numbers.',
  },
  'dialog.scrim.effectiveDarkness': {
    bound: [0.4, 0.7],
    witness:
      'shadcn/ui @ 2a2deaac417cb33720bcdfd0452d7585c3aa417f, registry/new-york-v4/ui/dialog.tsx ' +
      'DialogOverlay className "bg-black/50" is the literal Tailwind colour black at 50% alpha ' +
      '(not a theme token, so it is identical in light and dark): rgb(0 0 0 / 0.5). Effective ' +
      'darkness = alpha * (1 - L) = 0.5 * (1 - 0) = 0.5 exactly. The [0.4, 0.7] band is our own ' +
      "choice, not shadcn's: centred loosely around that 0.5 reference point but wide enough to " +
      "cover our own overlay's non-zero chroma (oklch(0.2064 0.0388 265.55 / 0.6), a token colour " +
      'rather than pure black) and future retuning, while still catching a scrim so faint it barely ' +
      'darkens the canvas (below 0.4) or one so opaque it hides the dialog stack entirely (above 0.7).',
  },
};
