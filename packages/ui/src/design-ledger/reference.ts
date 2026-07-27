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
  'skeleton.deltaY.light': {
    bound: 0.08,
    witness:
      // "Y" throughout both skeleton.deltaY.* witnesses means WCAG relative
      // luminance (the same 0-1 scale ledger.browser.test.tsx's own
      // relLuminance computes over real rendered rgb() channels), NOT OKLCH's
      // "L" lightness channel, which is what the shadcn citation numbers
      // below are measured in. The two scales are cited side by side on
      // purpose (they disagree about how big this gap looks), never
      // conflated.
      'shadcn/ui @ 2a2deaac417cb33720bcdfd0452d7585c3aa417f, apps/v4/registry/new-york-v4/ui/skeleton.tsx ' +
      '"bg-accent" against the page\'s "bg-background", both resolved via registry/themes.ts\'s ' +
      '"neutral" base colour (the CLI default): light accent oklch(0.97 0 0) vs background ' +
      'oklch(1 0 0) is only a 0.03 OKLCH-lightness gap; dark accent oklch(0.269 0 0) vs background ' +
      'oklch(0.145 0 0) is a wider 0.124 gap. Both are OKLCH-L deltas, a different scale from this ' +
      "row's own runtime assertion (WCAG relative luminance, Y, over the actual rendered rgb()), so " +
      'they are corroborating evidence that shadcn itself ships a subtle, sometimes barely-there ' +
      'skeleton fill, not a unit-matched proof. The placeholder guess of 0.04 this row started ' +
      'from turned out to sit ON THE WRONG SIDE of our own current bug once actually measured: ' +
      "soribashi's own neutral-50 canvas vs neutral-100 fill (the pre-fix, one-ramp-step case " +
      'this row exists to catch) measures Y-delta 0.0451, which is HIGHER than 0.04 -- WCAG Y is ' +
      "not perceptually linear the way OKLCH's L channel is, and compresses far less near white, so " +
      'the same one-ramp-step gap that looks tiny in OKLCH-L (0.0162) reads as a larger Y-delta. ' +
      'Keeping 0.04 would have let the exact regression this row was written for pass silently. ' +
      'This bound gates TWO live-measured quantities in light mode, both against the same 0.08: ' +
      'the resting fill (surface.placeholder, which resolves to neutral-200 in light, vs neutral-50 ' +
      'canvas, Y-delta 0.1596) and the fill composited over canvas at the pulse\'s live "to" ' +
      'keyframe opacity (0.6), Y-delta 0.0960. ' +
      'Reverting that opacity to its pre-fix 0.4 lands the composited delta at 0.0679, below 0.08: ' +
      'the floor was chosen to sit inside that gap (0.0679 < 0.08 < 0.0960) so a trough regression ' +
      "goes red without touching the resting check's own, wider margin.",
  },
  'skeleton.deltaY.dark': {
    bound: 0.05,
    witness:
      'Same neutral-scale mechanism as skeleton.deltaY.light, but WCAG Y compresses harder at the ' +
      "DARK tail of the ramp than the light head does for the same rung-count gap (fix round 1's " +
      'finding): the SAME ramp index in both schemes (neutral-200 against a dark-mode ' +
      '--surface-canvas) only reaches Y-delta 0.0442, almost exactly where the light-mode bug above ' +
      'sat (0.0451), i.e. dark shipped as faint as the bug this row exists to catch. Fix round 1 ' +
      'closed this with a recipe-authored `:global(.dark) .root` CSS override; fix round 2 replaced ' +
      "that with a framework capability instead (packages/theme's SemanticSurfaceValue gained an " +
      'optional `dark` reference, resolved by codegen through the same light-dark() pairing ' +
      "tokens.colors' own dark overrides use): packages/ui/src/theme.ts now declares " +
      "surface.placeholder as `{ value: 'colors.neutral.200', dark: 'colors.neutral.400' }`, a " +
      'CONSUMER taking that position, not the framework (CLAUDE.md invariant 2); ' +
      'Skeleton.module.css reads a single, scheme-agnostic `var(--surface-placeholder)` and stays ' +
      'fully re-skinnable through createTheme plus .extend() alone, no file edits. Numerically ' +
      "unchanged from fix round 1: dark's resting delta is still 0.1648; composited at the same " +
      'live "to" keyframe opacity (0.6) it is still ' +
      '0.0683; reverted to the pre-fix 0.4 it is 0.0370. 0.05 sits inside that gap (0.0370 < 0.05 < ' +
      '0.0683), so a trough regression goes red in dark mode too, on its own honestly-smaller margin ' +
      '(the dark end of the ramp has less room to work with than the light end does, at this ' +
      'rung-count; a wider dark margin would need an even stronger, visually heavier dark fill than ' +
      "this row asks for). Not shadcn-derived: shadcn's own dark accent/background gap (OKLCH-L " +
      "0.124, see skeleton.deltaY.light's witness) is a different scale and a different fill " +
      'mechanism (a single "bg-accent" utility, no per-scheme override), so it is not directly ' +
      "comparable evidence here; this bound is soribashi's own, chosen from soribashi's own " +
      'live-measured numbers.',
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
