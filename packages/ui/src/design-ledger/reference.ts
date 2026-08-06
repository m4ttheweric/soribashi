export interface FloorWitness {
  bound: number | readonly [number, number];
  witness: string;
}

export interface RampProvenance {
  source: string;
  version: string;
  commit: string;
  /** True when every VALUE in the ramp is the source's, character for character
   * (keys may still be relabeled or subsetted; `notes` records exactly how). */
  adoptedVerbatim: boolean;
  notes: string;
}

/**
 * Provenance of the non-colour ramps. Recorded 2026-08-06 (part 2, step 1).
 * The radius / spacing / shadow / breakpoint ramps in
 * packages/theme/src/tokens/default-tokens.ts are Tailwind CSS's default
 * scale values, adopted at v1 foundation time with no value-level adaptation
 * (each entry below records the exact key mapping, which is the only place
 * anything was adapted). Verified against real published source on
 * 2026-08-06, never recalled: tailwindcss v4.1.14, repo
 * tailwindlabs/tailwindcss @ b67cbcf6ccaa58097cb6d8d7e0eb1fca1091ccca
 * (packages/tailwindcss/theme.css), with two values traced to v3.4.17's
 * stubs/config.full.js where v4 dropped or renamed them. KEEPING these
 * values is now a recorded decision, not an accident: they are good,
 * widely-tested defaults, and consumers re-skin via createTheme anyway. Any
 * future divergence from Tailwind's values must update this record and the
 * identity rows in ledger.ts rather than drifting silently. The spec named
 * "identity values silently re-converging on shadcn" (which ships these
 * same Tailwind ramps) as its one unsolved risk; this record is what makes
 * the convergence explicit instead of silent.
 */
export const PROVENANCE: Record<string, RampProvenance> = {
  radius: {
    source: 'tailwindcss packages/tailwindcss/theme.css --radius-*',
    version: 'v4.1.14',
    commit: 'b67cbcf6ccaa58097cb6d8d7e0eb1fca1091ccca',
    adoptedVerbatim: true,
    notes:
      'sm/md/lg/xl/2xl (0.25/0.375/0.5/0.75/1rem) match v4.1.14 key-for-key and ' +
      "value-for-value. `full: 9999px` is v3.4.17's borderRadius.full " +
      '(stubs/config.full.js; v4 dropped the variable in favour of ' +
      "calc(infinity * 1px)). v4's xs/3xl/4xl steps were not adopted.",
  },
  spacing: {
    source: 'tailwindcss packages/tailwindcss/theme.css --spacing (0.25rem base scale)',
    version: 'v4.1.14',
    commit: 'b67cbcf6ccaa58097cb6d8d7e0eb1fca1091ccca',
    adoptedVerbatim: true,
    notes:
      'Values are Tailwind spacing-scale steps 1/2/3/4/6/8/12 (N * 0.25rem = ' +
      '0.25/0.5/0.75/1/1.5/2/3rem), relabeled onto t-shirt keys xs..3xl. The ' +
      'arithmetic is Tailwind; the key names are ours.',
  },
  shadow: {
    source: 'tailwindcss packages/tailwindcss/theme.css --shadow-*',
    version: 'v4.1.14',
    commit: 'b67cbcf6ccaa58097cb6d8d7e0eb1fca1091ccca',
    adoptedVerbatim: true,
    notes:
      'md/lg/xl match v4.1.14 --shadow-md/lg/xl character-for-character. Our ' +
      "`sm` holds v4.1.14's --shadow-XS value (0 1px 2px 0 rgb(0 0 0 / 0.05)), " +
      "which is v3.4.17's shadow-sm: under v3 naming all four keys match " +
      'key-for-key (verified against both tags).',
  },
  breakpoint: {
    source: 'tailwindcss packages/tailwindcss/theme.css --breakpoint-*',
    version: 'v4.1.14',
    commit: 'b67cbcf6ccaa58097cb6d8d7e0eb1fca1091ccca',
    adoptedVerbatim: false,
    notes:
      'sm/md/lg/xl/2xl (40/48/64/80/96rem) match v4.1.14 --breakpoint-* ' +
      'verbatim. `xs: 24rem` is NOT a Tailwind breakpoint (numerically it ' +
      "coincides with v4's --container-sm) and `3xl: 120rem` exists in no " +
      'Tailwind scale: both are soribashi extensions, so this ramp as a whole ' +
      'is adapted, not verbatim.',
  },
};

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
