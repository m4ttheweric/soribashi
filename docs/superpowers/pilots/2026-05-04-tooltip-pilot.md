# Wave 2 — Tooltip Pilot Journal

**Date started:** 2026-05-04
**Spec:** docs/superpowers/specs/2026-05-04-wave-2-tooltip-pilot-design.md
**Plan:** docs/superpowers/plans/2026-05-04-plan-wave-2-tooltip-pilot.md

## Phase summary

All phases (0–10) executed on branch `wave-2-tooltip-pilot`.

| Phase | Commits | Notes |
|-------|---------|-------|
| 0 | `88bd22f`, `2f21653` | Spec + plan authored; OQ-8 record added |
| 1 | `2c61aac` | `@radix-ui/react-tooltip` dep added to pilot |
| 2–3 | `2c61aac`–`5caf0c7` | `SemanticSurfaceValue` object form + `{value, foreground?}` support in codegen |
| 4 | `014cdfb`–`fc79ee6` | `createTheme` accepts component array; `ThemeComponentEntry` interface |
| 5 | `f902de0` | Codegen emits paired `--surface-{name}-foreground` var |
| 6 | `4a083ca` | `surface.floating` + `surface.floating-foreground` added to pilot theme |
| 7 | `3a98794`–`943c2eb` | Slot substrate, `mergeProps`, `mergeRefs` implemented in `@soribashi/factory` |
| 8 | `22086c4`–`602bd51` | `defineCompound` — root, parts, vars, context, passthrough, polymorphic, guards |
| 9 | `b4e2f44`–`bad7e40` | Tooltip recipe, lifecycle tests, TooltipMatrix page, ScreenReplica integration |
| 10 | this branch | Browser-parity Playwright tests (6 passing) + this journal |

Notable divergences from plan:

- **jsdom ResizeObserver polyfill required.** Radix popper components call `ResizeObserver`
  internally; vitest's jsdom environment doesn't ship it. A polyfill was added to the
  vitest setup file. Not a soribashi gap — purely a jsdom/Radix quirk.

- **`@testing-library/user-event` was not pre-installed.** The workspace had
  `@testing-library/react` but not `user-event`. Added as a dev dependency.

- **Radix Tooltip renders trigger text twice** (visible span + hidden screen-reader span
  via Radix's `VisuallyHidden`). Tests use `findByRole('tooltip', { name })` to
  target the actual tooltip content rather than the trigger label.

- **Playwright hover technique.** Radix Tooltip tracks `mouseenter`/`mouseleave`.
  Calling Playwright's `.hover()` after `scrollIntoViewIfNeeded()` can trigger a
  spurious `mouseleave` as the internal scroll-then-synthesize-move sequence briefly
  leaves the element boundary. Fixed by using `element.boundingBox()` +
  `page.mouse.move()` directly to element center. Documented in test file header.

- **Dark mode and portals.** The pilot app places the `.dark` class on an inner `<div>`,
  but Radix Tooltip renders content into `document.body` via a Portal — outside that
  wrapper. In the browser tests, dark mode is activated by adding `.dark` to
  `document.documentElement` instead, which propagates CSS custom properties to all
  portal descendants.

## Visual review

To capture screenshots:

1. `bun run dev:pilot` — start the pilot dev server (port 5174)
2. Navigate to `http://localhost:5174/` and click **Tooltip matrix**
3. Capture: 8-cell matrix (2 variants × 4 sides) in light mode
4. Click **Dark** in the header to toggle dark mode; capture again
5. Capture special cases (scroll down): long content tooltip (open), no-arrow (open), controlled toggle
6. Click **Screen replica** in the nav
7. Hover over icon-only action buttons and text-truncated product names to see integrated Tooltips
8. Capture light + dark
9. Save under `docs/superpowers/pilots/screenshots/tooltip-pilot/`

[Embed screenshots once captured.]

## Gaps surfaced

Wave 2 ran without introducing blocking soribashi gaps. The three jsdom/Radix quirks
documented in the Phase summary (ResizeObserver, user-event, screen-reader double render)
are environment issues, not API or token gaps.

One design-system observation worth tracking: the pilot app places `.dark` on an inner
wrapper div (not `<html>`), which means Portal-rendered components (tooltips, popovers,
modals) do not inherit the dark theme without explicitly bubbling the class up to a
document-level element. This is an integration concern for consumer apps, not a
soribashi gap per se — but worth a recommendation in the hand-off note.

## Open design questions resolved during pilot

Referring to spec § 11 (OQ-1..OQ-8):

| OQ | Question | Resolution |
|----|----------|-----------|
| OQ-1 | What value does `surface.floating` carry? | `neutral-900` (deliberately inverted in light mode, flips in dark) |
| OQ-3 | Does the `surface.floating` naming survive codegen? | Yes — `--surface-floating` emitted cleanly |
| OQ-4 | Where does the soribashi `Slot` live? | `packages/factory/src/slot.tsx` — confirmed working |
| OQ-5 | Root-level vars resolver keyed by slot name | Implemented as `vars: (theme, props) => ({ [slotName]: { '--var': value } })` — works as planned |
| OQ-6 | How does `defineCompound` surface the root variant to children? | Via `context()` callback on the root config — children call `ctx` in their `render` functions |
| OQ-7 | Passthrough parts (Provider) — do they throw outside context? | No — class-3 passthrough parts render without calling `getStyles`, so no context throw |
| OQ-8 | Auto-mount Providers at registration time? | Rejected; `Tooltip.Provider` mounts explicitly at app root — cleaner lifecycle control |

OQ-2 (exact codegen field shape for foreground pairing) was resolved by implementation:
`SemanticSurfaceValue` accepts `{ value: ColorScale; foreground?: ColorScale }`.

## Authoring DX observations

- **`Component.withDefaults({...})` is clean.** Reference-keyed defaults feel natural
  and make per-consumer customisation legible at the call site.

- **`defineCompound` config shape is approachable.** The `{ name, variants, classes,
  defaults, vars, context, parts }` structure mirrors how a developer naturally thinks
  about a compound component.

- **Radix `asChild` forwarding is seamless.** No soribashi `Slot` needed inside the
  Tooltip recipe — `RadixTooltip.Trigger` ships its own `Slot` implementation.

- **The "three classes of part" (root / context-consuming / passthrough) materialised
  as advertised.** Provider = class 3, Root = class 1, Trigger/Content = class 2.
  Distinguishing them in code is natural because only class-2 parts call `getStyles`.

- **`getStyles({ part: 'arrow' })` cross-slot targeting worked first-try.** The arrow's
  CSS class and inline vars are pulled from the content slot's vars context without any
  special wiring.

## Consumer DX observations

- **`Tooltip.Provider` mounting once at app root is the right default.** It manages the
  hover-delay state machine across all Tooltip instances; remounting per-instance would
  reset delay timers on every unmount.

- **`variant + side` as Root props is intuitive.** The API mirrors how a designer
  describes a tooltip ("inverted, placed above").

- **`asChild` forwarding makes trigger integration trivial.** Any element — Button,
  anchor, icon — becomes a tooltip trigger with zero extra wrappers.

- **Per-instance overrides (`sideOffset`, `withArrow`) work as expected.** Passed
  directly to `Tooltip.Content`; no root-level config change needed.
