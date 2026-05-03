# Token Consolidation + Button Pilot — Design Spec

**Status:** Draft
**Date:** 2026-04-26
**Audience:** Implementation engineers
**Target host (read-only reference):** `/Users/matt/Documents/GitHub/assured/assured-primary/apps/adjuster/src/components/ClaimViewIslands` ("CVI")
**Wave:** 1 of N (Wave 2+ extends the playbook to additional component categories — see § 11)

---

## 1. Why This Exists

CVI consumes a local UI layer in `ClaimViewIslands/core-radix/` — 28 component groups built on Radix primitives + Tailwind, imported by 115 files across CVI. The framework story underneath that layer is fragmented:

- **Three parallel color-token systems coexist** in `claimview-islands.css`:
  1. **shad-* shadcn convention** — `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`. Confirmed by the project owner as a hack that does not need to be carried forward.
  2. **Figma scale tokens** — `--color-{primary,neutral,success,warning,error,info}-{50..950}` plus a `DEFAULT` anchor.
  3. **Direct semantic** — `--color-text-{primary,secondary,tertiary,disabled}`, `--color-background{,-secondary,-tertiary}`, `--color-border-islands`, `--color-accent-feedback`.
- **The same value lives under multiple names.** Example: `--primary`, `--color-primary`, and `--color-primary-500` all hold `221.2 83.2% 53.3%`.
- **Scale ramps drift.** `--color-primary-500` is `221 83% 53%` (blue) but `--color-primary-50..400` are hand-typed at hue `240` (purple-blue) — the lighter shades are not a coherent ramp from the 500 anchor.
- **Cross-system shadowing.** `--destructive` shadows `--color-error-500`; `--background` shadows `--color-background`.

Soribashi was built to be the authoring framework for libraries like core-radix. Its job is **not** to ship components — it's to provide the consistency layer (`defineComponent`, `useProps`/`useStyles`, theme + intent resolver, codegen, polymorphism) that turns a fragmented collection of one-off Radix wrappers into a coherent library.

Wave 1's job is to use soribashi to **consolidate CVI's tokens into one focused vocabulary** and prove the result by authoring **Button** against the consolidated theme. The output is a partial playbook covering the token methodology + the pure-styled-primitive authoring pattern. Future waves extend the playbook to overlay compounds (Tooltip), navigational compounds (Tabs), and form controls (Select).

---

## 2. Scope

### In scope

- Token consolidation pass: inventory + classification of every token in CVI's `tailwind.config.js` and `claimview-islands.css`; expression of the kept tokens as a soribashi theme; deprecation list with rationale; open design questions surfaced for human design review.
- A pilot host app: `apps/core-radix-pilot/` — a new Vite + React + TS app inside soribashi alongside `apps/playground`, with its own `tailwind.config.js`, theme, and a representative-CVI-screen replica for visual review.
- Button conversion: `apps/core-radix-pilot/src/recipes/Button/` — base Button only, authored with `defineComponent`, consuming the consolidated theme. Full variant × intent × size × state matrix. Polymorphism (`as="a"`).
- Per-pilot conversion journals: `docs/superpowers/pilots/2026-04-26-token-consolidation.md` and `docs/superpowers/pilots/2026-04-26-button-conversion.md`.
- Wave 1 partial playbook: `docs/superpowers/specs/2026-04-26-core-radix-conversion-playbook.md`.

### Out of scope (explicit)

- Touching `assured-dev` in any way. No code changes there. No package installs there.
- Editing CVI's existing `core-radix/` in place.
- Pilots for Tooltip, Tabs, Select — explicitly Wave 2+, sized but not designed in this spec.
- The other 24 core-radix component groups.
- `IconButton` and `ButtonDropdown` — deferred to a future wave; the Button recipe shape must be sketched as extending cleanly to them in the journal, but neither is built.
- Migrating CVI's existing 115 importers from fragmented tokens to the consolidated vocabulary — that is the eventual integration project, scoped (not designed) by the playbook.
- Chart colors (`--chart-1..5`) and other ad-hoc tokens — classified as deferred, not consolidated in Wave 1.
- Domain wrappers (Maps, Icons) — out of scope for the framework story entirely.

---

## 3. Integration model

Soribashi codegen emits a `theme.extend` partial. The host's `tailwind.config.js` spreads the generated extend and layers host-policy concerns (preflight setting, plugin set, content globs, dark-mode selector). This is the same compose pattern `apps/playground` already uses.

**Why this is the canonical model, not a workaround:**

1. **Soribashi is substrate-agnostic.** § 3.2 of the foundational soribashi-design spec positions soribashi's primary output as CSS custom properties, with Tailwind config "an optional second output that enables utility classes referencing those vars." CSS Modules consumers don't use a Tailwind config at all. Forcing soribashi to own the full Tailwind config conflicts with that principle.

2. **Composition seams are correct.** Content globs are intrinsically host-specific (only the host knows its file structure). Plugins are often host-specific (analytics, animations, custom utilities). Preflight is a host-policy choice that depends on what other CSS systems coexist. These belong to the host; soribashi shouldn't strong-arm them through a generated config.

3. **The aesthetic single-line consumer config has no functional value.** Hiding host-policy declarations under a soribashi indirection doesn't reduce what the host owns; it just moves declarations between files. Composition is more honest about who owns what.

**Wave 1 history:** an earlier draft of this spec framed Option A (soribashi owns the entire Tailwind config) as the north star and Option C (composition) as a working state. That framing was decided in a single 33-minute exchange on 2026-04-26 with thin justification — the argument for A reduced to "soribashi authoring core-radix as a library implies soribashi can own the Tailwind layer," which is tautological rather than substantive. After the Wave 1 pilot landed without surfacing any friction with composition, the decision was revisited on 2026-05-02 and reversed: **Option C is the integration model, period.** No "C → A bridge" — just C.

**What still applies from the original Wave-1 framing:**

- **Configurable dark-mode selector** — was originally listed as an Option-A feature. **Already implemented and tested** (verified 2026-05-02 — the original "codegen hardcodes `.dark`" framing was incorrect; the configurability has been wired in since well before Wave 1). `ThemeDefinition.darkMode.selector` defaults to `.dark` and flows through `createTheme` → `emitCss`; consumers like CVI can pass `darkMode: { selector: '.dark .claim-view-islands' }` directly to `createTheme`. See `packages/codegen/src/emit-css.ts:36,59` for the emit + two existing tests at `packages/codegen/test/emit-css.test.ts:120` (CVI's exact `.dark .claim-view-islands` selector) and `packages/codegen/test/emit-css-emitter-logic.test.ts:324` (`[data-theme="dark"]`). No codegen change needed for the integration project.
- **Bare-HSL alpha companion vars** — already shipped as Wave 1 Gap 1's dual-emit fix (canonical wrapped var + `--__hsl-` companion). Was originally framed as a Option-A blocker; in fact it's an alpha-utility correctness fix that applies under either integration model.
- ~~**Config-level pass-through for `corePlugins.preflight`, plugins, content globs**~~ — **dropped.** These are host-policy concerns under Option C; consumers compose them in their own `tailwind.config.js` and that's the right seam.

---

## 4. Architecture

### 4.1 Pilot host app

`apps/core-radix-pilot/` — new Vite + React + TS app inside the soribashi monorepo, alongside `apps/playground`. Standalone — does not consume `apps/playground`.

Layout:

```
apps/core-radix-pilot/
├── index.html
├── package.json
├── tailwind.config.js          # composes the soribashi-generated extend + host concerns
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles.css              # @tailwind directives + imports generated theme.css
│   ├── theme/
│   │   └── index.ts            # consolidated soribashi theme (the Wave 1 deliverable)
│   ├── generated/
│   │   ├── theme.css           # codegen output (CSS vars)
│   │   └── tailwind.config.generated.js   # codegen output (Tailwind partial)
│   ├── reference/
│   │   └── core-radix-button/  # vendored snapshot of CVI's current Button (for side-by-side visual review only — see § 7.1 step 3)
│   ├── recipes/
│   │   └── Button/
│   │       ├── Button.tsx
│   │       ├── Button.test.tsx
│   │       └── Button.stories.tsx       # demo content for the pilot app
│   └── pages/
│       ├── TokenReview.tsx     # full token swatch grid, light + dark
│       ├── ScreenReplica.tsx   # representative CVI screen replica for visual review
│       └── ButtonMatrix.tsx    # full Button variant × intent × size × state matrix
└── tests/                      # Playwright parity tests (computed-style assertions per matrix cell)
```

### 4.2 Tailwind composition (Option C, concrete)

`tailwind.config.js` in the pilot app:

```js
const generated = require('./src/generated/tailwind.config.generated.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...generated,
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class', // Wave 1 default; A's configurable selector deferred
  corePlugins: {
    preflight: false, // mirrors CVI's setting so utility specificity matches
  },
  plugins: [
    ...(generated.plugins ?? []),
    require('tailwindcss-animate'),
  ],
  theme: {
    ...generated.theme,
    extend: {
      ...(generated.theme?.extend ?? {}),
      // host-only extras (none expected for Wave 1; document any added)
    },
  },
};
```

If the codegen does not yet emit a partial-friendly shape, the work to produce one lives inside Phase 0 (§ 6.1 step 4).

### 4.3 What soribashi provides vs what's local

- **From soribashi:** `defineComponent`, `useProps`, `useStyles`, `cn`, `extend`, `withProps`, polymorphic helpers, theme + intent resolver, codegen, blocks (`Box`, `Stack`, `Group` for composition).
- **Local to the pilot:** the consolidated theme definition, the recipe code, the demo pages.

When a pilot needs a soribashi capability that does not exist (e.g., a richer intent-resolver shape, codegen partial-emit), the gap is logged in the relevant journal and we choose per-gap:
- **(a) Add to soribashi inside this pilot** — when the gap is small, well-shaped, and clearly the right addition.
- **(b) Work around locally and flag for the playbook** — when the right shape isn't yet clear or the addition would expand the engagement.
- **(c) Stop and re-design** — when continuing would commit soribashi to a wrong shape.

---

## 5. Phases

Wave 1 has three phases, sequential. Phase 0 is the bulk of the work. Phase 1 is the proof-of-concept on top. Phase 2 is the writeup.

```
Phase 0 — Token consolidation pass
   ↓
Phase 1 — Button conversion
   ↓
Phase 2 — Wave 1 playbook
```

---

## 6. Phase 0 — Token Consolidation Pass

### 6.1 Method

1. **Inventory.** Read `apps/adjuster/src/components/ClaimViewIslands/tailwind.config.js` and `claimview-islands.css` (full file, not just the snippet visible above). Produce a markdown table listing every token: its name, its current value (light + dark if both exist), where it's defined, where it's used (a quick `grep` count is fine), and which of the three flavors it belongs to (shad-*, Figma scale, direct semantic).
2. **Classify** each row as:
   - **(a) signal** — real design intent, kept in the consolidated theme.
   - **(b) hack** — shad-* layer; dropped.
   - **(c) duplication** — same value as another token under a different name; collapsed to one canonical name in the consolidated theme.
   - **(d) deferred** — chart colors, ad-hoc one-offs; classified out of Wave 1.
3. **Express the signal as a soribashi theme** in `apps/core-radix-pilot/src/theme/index.ts`:
   - **Brand/intent scales:** primary, neutral, success, warning, danger, info — each as a properly-generated 50..950 ramp anchored on the current `-500` value. **Replace hand-typed scale values where they don't ramp coherently from the anchor** (the current `--color-primary-50..400` drift hue from the 500 anchor — those get regenerated, not preserved).
   - **Semantic tokens via the intent resolver:** background, surface (decision needed: collapse card+popover or split — see § 6.3), foreground, border, ring. These reference scale anchors, not parallel hand-set values. The intent resolver is the canonical home for "semantic name → scale lookup."
   - **Dark variants** for everything emittable in soribashi's dark-token model. Wave 1 default selector is `.dark`; CVI's scoped `.dark .claim-view-islands` is a North-star-A item, not a Wave 1 problem.
4. **Run codegen** → produce `theme.css` and `tailwind.config.generated.js` partial. If soribashi's current emit format is incompatible with Option C composition (e.g., emits a full config but not a `theme.extend`-friendly partial), extend the codegen as part of this phase. Logged as a gap regardless.
5. **Wire into the pilot app.** `styles.css` imports the generated CSS. `tailwind.config.js` composes per § 4.2.
6. **Render the screen replica.** `pages/ScreenReplica.tsx` is a static markup-only replica of one representative CVI screen (suggested: an Auto Statements Overview section — pick one with cards, headings, body text, badges-ish chips, divider lines). Uses Tailwind classes consuming the consolidated tokens. **No live core-radix or recipe components yet** — this page exists to validate that the consolidated tokens reach the DOM correctly.
7. **Visual review.** Compare the replica side-by-side with a screenshot of the same CVI screen. **Intent parity, not pixel parity.** Expected drift wherever consolidation deliberately changed something (the new primary ramp, dropped duplicates resolved against the canonical name, etc.). Drift that is *not* expected goes in the journal as a finding.

### 6.2 Deliverables

- `apps/core-radix-pilot/` host app skeleton — buildable, dev server runs.
- `apps/core-radix-pilot/src/theme/index.ts` — the consolidated soribashi theme.
- Generated `theme.css` and `tailwind.config.generated.js` checked in (matching playground pattern).
- `pages/TokenReview.tsx` — every consolidated token rendered as a labeled swatch, in both light and dark.
- `pages/ScreenReplica.tsx` — the visual-review screen.
- `docs/superpowers/pilots/2026-04-26-token-consolidation.md` containing:
  - Full inventory + classification table.
  - Side-by-side: current token name → consolidated token name (the rename map).
  - **Deprecation list** — every dropped token with one-line rationale.
  - **Open design questions** flagged for human design review (§ 6.3).
  - Codegen / theme-model gaps surfaced (input to Phase 2's playbook gap section).

### 6.3 Open design questions (placeholder list — extended during the work)

These do not block the pilot. The pilot picks a defensible default and the playbook escalates to the design owner.

- **Surfaces:** Collapse `card` + `popover` into a single `surface` token, or keep two? CVI currently has both with the same value; consolidating to one is cleaner; keeping two preserves the option to differentiate elevation later.
- **Primary ramp:** Is the current `--color-primary-50..400` hue drift (`240` → `221`) intentional or vestigial? Wave 1 default: regenerate the ramp coherently from the `500` anchor.
- **Foreground vs text:** Current setup has both `--foreground` (shad) and `--color-text-primary` (semantic). Consolidate to `foreground` with optional `foreground.muted` / `foreground.subtle` shades, or to `text.{primary,secondary,tertiary,disabled}`? Wave 1 default: prefer `foreground` + shades, since the four-level text taxonomy maps cleanly to scale lookups via the intent resolver.
- **Naming convention:** Is the consolidated set `--color-primary-500` (matches Figma scale current names) or `--primary-500` (drops the redundant `color-` prefix since these vars all hold colors)? Wave 1 default: keep `--color-` prefix to minimize cognitive distance for the eventual integration project.
- **Dark scoping:** Wave 1 emits dark vars under `.dark`. CVI's production scope is `.dark .claim-view-islands`. The integration project (not Wave 1) reconciles. Documented in the playbook.

### 6.4 Exit criteria

- Codegen produces vars + Tailwind extend without error.
- Pilot app dev server boots; screen replica renders in light and dark.
- Token consolidation journal exists, complete, committed.

---

## 7. Phase 1 — Button Conversion

### 7.1 Method

1. **Inventory the current Button surface.** Read `apps/adjuster/src/components/ClaimViewIslands/core-radix/Buttons/Button.tsx` (and `IconButton.tsx`, `ButtonDropdown.tsx` for context only — they are not built). Enumerate the variant, intent, size, and state shape currently exposed. Document any inconsistencies (e.g., a "danger" variant that's actually intent-shaped, or a variant that overlaps with an intent).
2. **Author the recipe.** `apps/core-radix-pilot/src/recipes/Button/Button.tsx`, using `defineComponent` from `@soribashi/factory`. Consume the consolidated theme directly — never reference the legacy fragmented tokens. Cover the full matrix:
   - **Variants** (visual style): filled, outline, subtle, ghost, link. The exact set is decided during inventory; document any consolidation (e.g., merging an existing "secondary" variant with "outline" if they're behaviorally identical) in the conversion journal.
   - **Intents** (semantic role): primary, neutral, success, warning, danger, info — driven by the intent resolver, not by ad-hoc per-variant color props.
   - **Sizes:** sm, md, lg.
   - **States:** loading (with spinner), disabled, fullWidth, leading icon, trailing icon.
   - **Polymorphism:** `as="a"` for link-as-button, with type narrowing.
3. **Demo page.** `pages/ButtonMatrix.tsx` renders the full matrix in both light and dark, side-by-side with a vendored snapshot of CVI's current `core-radix/Button` for visual reference. The reference snapshot is **copied** (not symlinked, not installed as a dep) into `src/reference/core-radix-button/` from the assured-dev path on a one-time basis as part of Phase 1 setup, with a comment header naming the source path and snapshot date. The vendored copy is read-only reference material — never edited, never imported by the recipe code, never shipped beyond the pilot app. It exists solely so the side-by-side review can happen inside one running app. Include a "consolidation notes" callout per variant where the new shape differs from the legacy shape.
4. **Tests.**
   - **Vitest behavior tests** in `Button.test.tsx`: rendering, click, loading state suppresses click, disabled state suppresses click, polymorphic `as="a"` renders an anchor with `href`, leading/trailing icon slots render in correct order.
   - **Playwright computed-style parity tests** in the pilot app's `tests/` folder — for each (variant, intent, size, state) cell, render the recipe and assert the computed background, color, border, and padding match the *consolidated* expected values (not the legacy values). Pattern matches the existing soribashi parity-test pattern from the Mantine work (see `packages/blocks/test/Box/wrapper-style-merge.test.tsx` and the `css-parity-audit.ts` script for prior art).
5. **Extension sketch.** In the conversion journal, sketch (in pseudo-code or a one-paragraph design note) what `IconButton` and `ButtonDropdown` would look like as recipes built on top of the same Button shape. Goal: confirm the recipe shape extends cleanly. If it doesn't, surface that as a design finding before declaring the pilot done.

### 7.2 Deliverables

- `apps/core-radix-pilot/src/recipes/Button/{Button.tsx, Button.test.tsx, Button.stories.tsx}`.
- `apps/core-radix-pilot/src/pages/ButtonMatrix.tsx` — demo page rendered in the pilot app.
- Playwright parity tests in `apps/core-radix-pilot/tests/`.
- `docs/superpowers/pilots/2026-04-26-button-conversion.md` containing:
  - Inventory of the legacy Button surface.
  - The consolidated Button shape (variants, intents, sizes, states).
  - What soribashi patterns were used; what was easy; what was hard.
  - Soribashi gaps surfaced (input to playbook).
  - IconButton + ButtonDropdown extension sketch.
  - Recommended playbook entries for the pure-styled-primitive category.

### 7.3 Exit criteria

- Button recipe builds, types clean, all tests pass.
- Demo page renders all matrix cells in light and dark.
- Conversion journal exists, complete, committed.

---

## 8. Phase 2 — Wave 1 Playbook

### 8.1 Method

Synthesize Phase 0 + Phase 1 outputs into a single forward-looking playbook document. The playbook is the actual point of the engagement — pilots are the evidence; the playbook is the deliverable that future waves and the eventual integration project consume.

### 8.2 Deliverable

`docs/superpowers/specs/2026-04-26-core-radix-conversion-playbook.md` containing:

1. **Token consolidation methodology.** Transferable to any fragmented design system, not specific to CVI. The inventory → classify → express → codegen → review → decide loop, with the rationale for each step. Half the value of the engagement.
2. **Pure styled primitive authoring pattern (Button category).** Recipe shape recipe, intent-resolver usage, polymorphism, state handling. Backed by Phase 1 evidence.
3. **Soribashi gaps surfaced.** Codegen and theme-model gaps with severity (blocking / important / nice-to-have) and proposed resolutions. Notes the integration-model reversal — Option C is the canonical model; see § 3 — and identifies which gaps are codegen correctness fixes that apply under C regardless.
4. **Legacy-token migration strategy stub.** What an integration project would need to do to migrate CVI's 115 importers from fragmented tokens to the consolidated vocabulary. Sized (S/M/L estimates per phase) but not designed. Becomes the input to the integration project's own brainstorm.
5. **Future waves outlined.** Wave 2 (overlay compound: Tooltip), Wave 3 (navigational compound: Tabs), Wave 4 (form control: Select). Each named, sized, and slotted into the playbook structure so they extend rather than re-design.

### 8.3 Exit criteria

- Playbook written, self-reviewed (placeholder scan, internal consistency, scope, ambiguity), committed.
- Every Phase 0 / Phase 1 finding has a home in the playbook (or a justified omission).

---

## 9. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Consolidation surfaces a hard design question that needs human design ownership. | High | Pilot picks a defensible default (documented per-question in § 6.3); playbook escalates. Doesn't block. |
| Soribashi's intent resolver isn't expressive enough for CVI's semantic surface tokens. | Medium | Logged as a gap; pilot extends the resolver inside the pilot work if the gap is small and well-shaped, otherwise documents the gap and uses a hand-written shim locally so Phase 1 continues. |
| Soribashi codegen can't emit a Tailwind partial cleanly. | Medium | Either extend codegen as part of Phase 0 step 4, or write a thin post-processing script in the pilot app that converts the full generated config into a partial. Either way, gap goes in the playbook. |
| Button conversion turns out to be trivial (because soribashi already ships a Button in playground) and surfaces nothing. | Low | Explicitly stress the variant × intent × state matrix against the *consolidated* tokens, not playground's defaults — the friction is in token plumbing and intent-resolver wiring, not in `defineComponent` mechanics. The legacy variant inventory + consolidation step is where real tension surfaces. |
| Scope creep into a second component "while we're in here." | Medium | Hard exclusion list in § 2. Tooltip, Tabs, Select, IconButton, ButtonDropdown all explicitly out. Anything beyond Button gets logged for a future wave, never built. |
| Pixel-parity expectation creeps in. | Medium | Restate intent-parity-not-pixel-parity in every visual review. Drift from legacy is expected and good wherever it reflects a deliberate consolidation choice. The screen replica is a sanity check, not an acceptance test. |

---

## 10. Done Means

- Token consolidation pass complete: consolidated theme committed, deprecation list complete, open design questions flagged.
- Button converted, demoed, tested (vitest + Playwright), with the matrix rendering in light and dark.
- Both per-pilot journals written and committed.
- Wave 1 playbook written, self-reviewed, committed.
- An evidence-backed answer to: *Can soribashi consolidate CVI's tokens, and is the authoring story real for at least the pure-primitive category?*

---

## 11. Future Waves (out of scope; sized for the playbook)

Each future wave reuses the consolidated theme from Wave 1. None redoes the token work.

- **Wave 2 — Tooltip (transient overlay compound).** Forces soribashi to answer "how do I author a Radix-anatomy compound": slot styling, portal handling, `data-state` driven styles, surface tokens (popover bg/border/shadow). Likely needs a soribashi compound-authoring helper — design-and-spec is part of Wave 2, not Wave 1.
- **Wave 3 — Tabs (persistent navigational compound).** Tests the slot story at higher part-count (Root/List/Trigger/Content) and with controlled-state passthrough.
- **Wave 4 — Select (form control).** The boss. Heaviest anatomy in core-radix; field composition (label/help/error slots); controlled state; keyboard a11y; trigger-vs-content surface tokens; option rendering.

Each wave produces its own pilot + journal + playbook extension. The playbook grows; it isn't rewritten.

---

## 12. References

- Target host: `/Users/matt/Documents/GitHub/assured/assured-primary/apps/adjuster/src/components/ClaimViewIslands/`
  - `tailwind.config.js` — current Tailwind config (mixed token taxonomies)
  - `claimview-islands.css` — current CSS var declarations (three parallel color systems)
  - `core-radix/Buttons/Button.tsx` — legacy Button surface to inventory
  - `CLAIMVIEW_ISLANDS_ARCHITECTURE.md` — CVI architecture doc
- Soribashi prior art:
  - `apps/playground/tailwind.config.js` — the compose pattern Wave 1 reuses
  - `apps/playground/src/generated/theme.css` — current codegen emit format
  - `packages/codegen/src/{emit-css.ts, emit-tailwind-v3.ts, emit-tailwind-v4.ts}` — codegen entry points
  - `packages/theme/` — `createTheme`, intent resolver, default tokens
  - `packages/factory/` — `defineComponent`, `useProps`, `useStyles`
  - `packages/blocks/test/Box/wrapper-style-merge.test.tsx` — Playwright parity test pattern to mirror
  - `docs/superpowers/divergences/mantine-master.md` — example of the journal-level documentation style used here
