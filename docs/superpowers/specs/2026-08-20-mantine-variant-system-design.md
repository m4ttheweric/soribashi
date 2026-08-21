# Mantine Variant System Unification Design

**Date:** 2026-08-20
**Repos:** `~/Documents/GitHub/soribashi` (core + ui), `~/Documents/GitHub/tui-kit`, `~/Documents/GitHub/local-apps` (deck, adoption tail)
**Status:** approved design, pending plan

## 1. Overview and motivation

Three variant-color dialects exist across the stack today, and the collisions
are live hazards:

| Concept | Mantine | soribashi core/ui | tui-kit (2026-08-20) |
|---|---|---|---|
| intent-colored fill | filled | filled | — (not rendered) |
| tinted fill, colored text | light | **subtle** | **subtle** (neutral card, not tinted) |
| transparent, colored border+text | outline | outline | outline |
| transparent, tint on hover | subtle | **ghost** | **ghost** |
| surface bg + border (the everyday button) | default | — | **solid** |
| transparent, no hover fill | transparent | ~link | — |

The same words mean different things in different repos. Meanwhile the design
intelligence that computes correct variant colors exists in
`packages/core/src/theme/default-intent-resolver.ts` (explicitly modeled on
Mantine's `defaultVariantColorsResolver`, with empirically tuned oklab washes
and a 300-cell WCAG contrast-matrix regression harness in `packages/ui`) —
but tui-kit bypassed it with a custom resolver plus hand-written variant CSS,
which is precisely how the deck cycle's invisible-hover / washed-text defects
happened.

This cycle: **make Mantine's variant menu and names canonical in soribashi's
default resolver, formalize the single-shade-palette branch tui-kit derived
from Mantine source, adopt the resolver in both consumers, and ship the
contrast gate as a reusable soribashi export.** The learning becomes code
(resolver), enforcement (gate), and a short skill note ("don't bypass the
resolver") — in that order of authority.

### Goals

- One canonical variant vocabulary across soribashi, tui-kit, and future
  adopters: Mantine's names.
- `defaultIntentResolver` is the single source of variant color values, with
  two branches: ramp palettes (existing, extended) and single-shade palettes
  (new, encoding tui-kit's Mantine-extracted constants).
- tui-kit's Button consumes resolver-computed vars; its hand-written variant
  color CSS is deleted. Pixel parity by construction (§5).
- The contrast-matrix harness becomes a shared export any adopter can run;
  tui-kit gains its own matrix test.
- `@soribashi/core@0.2.0` published (breaking vocabulary rename).

### Non-goals

- No `gradient` or `white` variants (no consumer; the resolver structure
  admits them later).
- No resolver-computed `focus`/`disabled` states — those remain CSS-side
  (opacity + outline), matching current core behavior.
- No variant exposure on packages/ui's Checkbox/RadioGroup/Switch (they keep
  their hardcoded `filled`).
- No changes to intent vocabularies — intents stay theme-owned
  (ui: primary/neutral/success/warning/danger/info; tui-kit:
  accent/ok/warn/bad/cyan/purple/muted).
- tui-kit recipes with deliberate recipe-local tone maps and no variant axis
  (Badge, Alert, StatusDot, Spinner) are untouched — the resolver governs
  variant-driven color only.

## 2. Canonical vocabulary

`DEFAULT_VOCABULARIES.variant` in core becomes:

```
filled | light | outline | subtle | default | transparent | link
```

Mantine's six plus soribashi's existing `link` (kept: it has a real recipe
and consumer story). Renames in core/ui: `subtle` → `light`, `ghost` →
`subtle`. Additions: `default`, `transparent`. Recipes continue narrowing to
their own `*_VARIANTS` tuples exactly as today.

tui-kit's theme vocabulary becomes `["default", "light", "outline",
"subtle"]` (subset — Tokyo renders no filled intent-colored control, no
transparent-no-hover, no link). Renames at tui-kit call sites and tests:
`solid` → `default`, `ghost` → `subtle`, `subtle` → `light`.

The rename is breaking for `@soribashi/core`. Both consumers are in-house;
this is the last cheap moment to do it. Version 0.2.0.

## 3. Default resolver

Signature unchanged (`IntentResolverInput { intent, variant, theme }` →
`IntentResolverResult { background, color, border, hover?, active?,
hoverColor? }`) — the contract already threads variant.

### 3.1 Ramp branch (existing, extended)

Applies when the intent's palette resolves a ramp (the current
`deriveState`/`wash` oklab helpers stay the primitives). Per-variant recipes,
Mantine-mapped:

| variant | background | color | border | hover | notes |
|---|---|---|---|---|---|
| filled | intent-500 | intent-foreground | transparent | deriveState(bg, 90%) | existing |
| light | wash(intent, 15%) | intent-700 | transparent | deriveState(bg, 94%) | existing `subtle`, renamed |
| outline | transparent | intent-700 | intent-500 | wash(intent, 12%) | existing; hoverColor intent-800 |
| subtle | transparent | intent-700 | transparent | wash(intent, 12%) | existing `ghost`, renamed |
| default | surface-panel | text-primary | border-default | one surface step (wash(neutral, 8%) or the theme's next surface token — resolved against theme semantics, not a hue) | NEW |
| transparent | transparent | intent-700 | transparent | — (no hover fill) | NEW |
| link | transparent | intent-600 | transparent | — ; hoverColor intent-800 | existing |

The empirically tuned constants (12%/15% washes anchored on
`--surface-canvas`, hover 90/94%, active 80/88%) are retained verbatim —
they carry measured WCAG margins (see commit 59b2814 and
`packages/ui/src/design-ledger/reference.ts`).

### 3.2 Single-shade branch (NEW)

Applies when the intent's palette has one shade (Tokyo's model; Mantine's
raw-color fallback is the analog). Encodes exactly the values tui-kit shipped
on 2026-08-20 (extracted from Mantine's `defaultVariantColorsResolver`
raw-color branch and tuned against Tokyo surfaces) so tui-kit's adoption is
pixel-identical by construction:

| variant | background | color | border | hover |
|---|---|---|---|---|
| filled | intent | intent-contrast-foreground (theme-provided; white default) | transparent | mix(bg 90%, black) |
| light | mix(intent 15%, surface-canvas) | intent | transparent | mix(bg 94%, black) |
| outline | transparent | intent | intent | mix(intent 5%, surface-canvas) |
| subtle | transparent | intent | transparent | mix(intent 12%, surface-canvas) |
| default | surface-panel | text-primary | border-default | the theme's surface step (tui-kit: the tuned value Button ships today) |
| transparent | transparent | intent | transparent | — |
| link | transparent | intent | transparent | — ; hoverColor intent |

Branch selection: the resolver inspects the resolved palette for the intent
— if the intent's color family exposes ramp keys beyond a single canonical
shade, the ramp branch applies; otherwise the single-shade branch. Detection
is pure palette-shape inspection (no theme flag), unit-tested against both
palette models; if core's palette representation makes this ambiguous for
some family, the plan may add an explicit `rampless: true` marker on the
family as the tiebreaker, defaulting to inspection.

Hover-changes-background-only is a structural rule in both branches: no
variant's `hover` recipe alters `color` except via the explicit `hoverColor`
channel (outline/link).

### 3.3 Theme override contract

Themes may still supply `intentResolver`. The docs and authoring skill gain
the rule: a custom resolver is for palette *values*, not for re-deriving
state math — extend `defaultIntentResolver` (call it and override fields)
rather than replacing the formulas. tui-kit's `tuiIntentResolver` becomes
exactly that: palette mapping in, default state math out.

## 4. Shared contrast gate

- `packages/ui/src/a11y/` (contrast utils, matrix harness, classification
  map pattern) moves to core, exported at **`@soribashi/core/testing`**
  (new subpath; browser-tier utilities). packages/ui re-exports or imports
  from it; its existing 300-cell Button matrix and SMALL_COVERAGE cells keep
  running unchanged.
- The harness asserts, per (intent × variant × scheme) cell: text/background
  contrast ≥ 4.5 (compositing translucent backgrounds over the canvas), and
  hover ≠ rest background by a perceivable delta for every variant that
  declares a hover fill.
- tui-kit adds a matrix test over its Button (its four variants × seven
  intents × two schemes) using the shared harness, with a classification map
  naming every other recipe covered-elsewhere or exempt-with-reason.
- The design-ledger pattern (numeric floors + witnesses) is recommended and
  documented but stays per-repo, not framework-mandated.

## 5. Adoption

### packages/ui
Button/Badge/Alert remap their `*_VARIANTS` tuples to the new names
(`subtle`→`light`, `ghost`→`subtle`). Button adopts the full seven-variant
menu (Mantine ships its whole menu on Button; ui's Button is the reference
rendering). Badge and Alert keep their current three-slot shape under the
new names: `filled`/`light`/`outline`.
Matrix cells and visual baselines update with the renames. Fixed-`filled`
consumers (Checkbox/RadioGroup/Switch) are untouched.

### tui-kit
- Theme vocabulary renamed per §2; `tuiIntentResolver` reduced to palette
  mapping over the default resolver (§3.3).
- Button.module.css's variant color blocks are replaced by consumption of
  `--button-bg/-color/-border/-hover` (+`--button-hover-color` where used);
  structural CSS (padding, radius, `translateY(1px)` active, focus ring,
  disabled opacity) stays.
- Pixel parity: the single-shade branch's constants are defined as tui-kit's
  shipped values (including its `in srgb` mix space — the branch uses srgb,
  not the ramp branch's oklab, precisely for this parity), so Button's
  rendered chrome is unchanged. Proof mechanism: a computed-style parity
  test asserting resolved background/color/border/hover per variant × intent
  equal the pre-migration values. Visual baselines MAY be regenerated only
  where fixture label text changes (labels render into the PNGs); the
  reviewer confirms every baseline delta is text-only.
- Chip's variant tuple renames with the vocabulary (`subtle`→`light`;
  `outline` unchanged) — its CSS selectors and call sites follow.
- Workshop Buttons page renames its labels; matrix test added (§4).
- `@soribashi/core` dep bumped to 0.2.0.

### deck (local-apps)
Call-site rename sweep only (`variant="ghost"` → `variant="subtle"`; default
usages already omit the prop), `bun run build:board`, and the existing
15-capture `capture:compare` must pass at zero diff — same
parity-by-construction argument. No new tests.

### mr-board
Also a tui-kit consumer (file:../tui-kit): sweep any Chip/kit variant call
sites for the renames, rebuild, and its existing 20-capture harness must
pass at zero diff. If no call site passes a renamed variant value, the sweep
is a verified no-op.

## 6. Publishing and sequencing

1. Core: vocabulary + resolver branches + `./testing` subpath + unit tests
   (full matrix snapshot per branch).
2. packages/ui adoption + matrix/baseline updates.
3. Publish `@soribashi/core@0.2.0` (same `bun publish` + OTP flow as 0.1.0;
   pack:check gate).
4. tui-kit adoption (dep bump, rename, resolver consumption, matrix test,
   zero-diff baseline proof).
5. deck sweep + zero-diff capture proof.
6. Authoring-skill update: "variant colors come from the resolver; never
   hand-roll variant color CSS; override = extend the default; run the
   matrix gate." Cross-link from tui-kit README.

## 7. Testing summary

- Core: resolver unit tests snapshotting the full variant × branch matrix;
  vocabulary rename covered by existing vocab validation tests (updated).
- ui: contrast matrix (existing, renamed cells + new-variant cells), visual
  baselines for renamed variants.
- tui-kit: full gates + new matrix test + UNCHANGED Button baselines as the
  parity proof.
- deck: `bun run test`, `test:dom`, `capture:compare` 15/15 zero-diff.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Rename churn breaks a missed call site | vocabulary validation fails loudly at runtime in dev (existing autoVars warning + vocab rejection); grep sweeps per repo in the plan |
| Single-shade branch drifts from tui-kit's shipped pixels | branch constants defined AS the shipped values; Button baselines must pass unregenerated |
| Branch detection (ramp vs single-shade) misfires | deterministic palette-shape inspection with unit tests per palette model; plan settles the mechanism |
| `default` variant's "one surface step" is theme-dependent | resolved via theme semantic tokens with a documented fallback; contrast gate catches an invisible step |
| 0.2.0 breaks an unknown consumer | both consumers are in-house; npm deprecation note on 0.1.x not needed |
