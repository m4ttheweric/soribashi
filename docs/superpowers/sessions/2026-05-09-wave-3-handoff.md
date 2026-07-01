# Wave 3 Kickoff — Tabs Pilot (Persistent Navigational Compound)

> **For the next agent session.** Paste this entire file as the first message in a fresh session. Working directory: `/Users/matt/Documents/GitHub/soribashi/`. Read this whole handoff before any tool calls.

## Where things stand

Wave 2 (Tooltip pilot, transient overlay compound) shipped via PR #7, merged on 2026-05-09 after a long review process. The `defineCompound` factory, supporting types, and the playbook entry for transient overlays are in `main`. Wave 3's job is the next category: **persistent navigational compound**, with Tabs as the vehicle.

The playbook's framing for Wave 3 (`docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md` § 5):

> Wave 3 — Tabs (persistent navigational compound). Tests slot story at higher part-count (Root / List / Trigger / Content) and with controlled state passthrough. Pre-work: Wave 2 lands the compound primitive; Wave 3 stresses it. Sizing: M.

## What Wave 3 inherits from Wave 2

Read these to understand the surface area before brainstorming:

- `packages/factory/src/define-compound.tsx` — the compound factory. Public API: `defineCompound`, `PartRenderCtx<TProps, TCtxExtra, TVariants, TSlotKeys>`, `PolymorphicPartRenderCtx`, `PartConfig`, `StandardPartConfig`, `PolymorphicPartConfig`, `DefineCompoundConfig`. Polymorphic parts are genuinely typed over `<As>` (mirror of `definePolymorphicComponent`).
- `packages/factory/src/hooks/use-styles.ts` — the merge engine for styles-API props. Resolves three independent layers (Root, instance, per-call). When extending compound styling behavior, change `useStyles`, NOT a closure in `define-compound.tsx`.
- `packages/factory/src/slot.tsx` — substrate-agnostic asChild merge. `Slot` rejects Fragment children explicitly.
- `packages/factory/src/{merge-props,merge-refs,create-safe-context}.ts` — internal substrates. `mergeRefs` propagates R19 cleanup callbacks.
- `packages/theme/src/types.ts` — `SemanticSurfaceValue` supports the `{ value, foreground? }` object form. `surface.floating` is the Wave 2 example.
- `apps/pilot/src/recipes/Tooltip/` — the canonical compound recipe to model Tabs after.
- `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md` § 2.2 — the transient-overlay playbook entry. § 2.3 is the Wave 3 placeholder waiting for content.
- `docs/superpowers/specs/2026-05-04-wave-2-tooltip-pilot-design.md` — Wave 2 spec, including all 10 OQs and their resolutions/deferrals.

## Architectural patterns to apply (don't re-derive these)

1. **Transcribe Mantine, don't reason from first principles.** Wave 2 burned 3 review rounds patching the styles-API merge per-prop before transcribing Mantine's `useStyles` resolver wholesale. The fix should have been the first move. For Tabs, the canonical Mantine reference is `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/components/Tabs/` — read `Tabs.tsx`, `TabsList.tsx`, `TabsTab.tsx`, `TabsPanel.tsx`, and `Tabs.context.ts` BEFORE writing any factory or recipe code.
2. **`Tabs.Tab` is polymorphic.** It's a `polymorphicFactory<{ compound: true; defaultRef: HTMLButtonElement; defaultComponent: 'button'; ... }>` in Mantine. Our `defineCompound` already supports polymorphic parts with full `<As>` typing — use it.
3. **Tabs has controlled-state passthrough.** Root accepts `value` / `onChange` / `defaultValue`. The active-tab state is part of the safe-context, consumed by Triggers (to set `data-active`) and Panels (to mount/hide). The compound `context()` callback (which can call hooks) is where this lives.
4. **The styles-API merge is solved.** When wiring per-part styles in the Tabs recipe, parts forward their styles-API props verbatim into `ctx.getStyles(slot, options)` — no recipe-level merging. `useStyles` handles it.

## Likely open design questions (carry-forwards from Wave 2)

These were deferred to "the wave that exercises them" — Tabs may force decisions:

- **OQ-7 (eject-per-part).** Tabs has `Tabs.Tab`, which Mantine's MenuItem-style polymorphic compound part demonstrates. If `Tabs.Tab` needs behavior the standard `defineCompound` part config can't accommodate (per-item active state, hover handlers tied to keyboard navigation, etc.), this is the wave that adds eject-per-part — a backward-compatible widening of the part-value type. Watch for "the part config is fighting the requirement."
- **Per-item context.** Mantine's Accordion has BOTH `Accordion.context.ts` AND `AccordionItem.context.ts` — a second context per item. Tabs might not need this (Tabs is item-flat where Accordion is item-nested), but if `Tabs.Trigger` needs to read its own active-state from a parent-injected per-tab context separate from the Tabs-level context, this is when `createSafeContext` gets promoted to public export. Currently it's internal.
- **Variants on Tabs.Root.** Mantine has `default | outline | pills`. Different visual treatment per variant requires per-variant styling driving from Root's `variant` prop through the part renders. The `vars` resolver covers this; `ctx.variant` is typed as `TVariants[number] | undefined` in the per-part context.

## Process lessons from Wave 2 (apply to Wave 3 reviews)

1. **Run BOTH Copilot and CodeRabbit early.** They find different things — Copilot caught architecture-level type holes; CodeRabbit caught CSS deprecations, doc drift, R19 forward-compat, lint conventions. One reviewer's gaps are the other's wins.
2. **Stop reviewing after 2-3 rounds with the same reviewer.** Knock-on rate climbs to 25-66% by round 3-4; the marginal real-bug-caught rate drops below the diff-noise cost. Bundle several reviewer rounds' fixes into one careful pass rather than iterating.
3. **When fixing a flagged issue, look for the broader class.** Wave 2's review history shows 6 rounds catching cells of the same merge matrix one at a time. Mapping out the full surface (props × sources × scopes) and addressing it in one pass would have saved 4 rounds.

## Recommended start sequence

1. Invoke `superpowers:brainstorming` against "Wave 3 Tabs pilot — what does it look like?" Reference playbook § 5 for sizing and the Wave 2 pattern.
2. Frame the brainstorm around: anatomy (which parts ship, with `Provider`-equivalent for shared state?), state model (controlled vs uncontrolled active value, keyboard navigation), surface tokens (does Tabs introduce a new surface? probably not — `Tabs.List` is on `surface.default` typically).
3. Read `Tabs.tsx`, `TabsList.tsx`, `TabsTab.tsx`, `TabsPanel.tsx`, `Tabs.context.ts` from Mantine before brainstorming — they answer half the design questions before they're asked.
4. Wave 2's spec lives at `docs/superpowers/specs/2026-05-04-wave-2-tooltip-pilot-design.md`. Wave 3's spec goes alongside it as `docs/superpowers/specs/YYYY-MM-DD-wave-3-tabs-pilot-design.md`.

## Reference paths (READ-ONLY)

- Mantine: `/Users/matt/Documents/GitHub/mantine/`
- the host library host (target consumer): `<host-library-path>/`

## Sanity check the inheritance

Before writing any new code, run:

```bash
bun run typecheck
bun run --filter '@soribashi/*' test
cd apps/pilot && bunx vitest run --reporter=basic
```

Expected: clean typecheck, all package tests pass, 24/24 pilot pass. If anything's red, you're starting from a broken state — fix that before brainstorming.

## Auto-memory

This conversation has not been saved as a session memory; the relevant context lives in the spec/playbook/journal files in `docs/superpowers/`. Trust those over any half-recalled detail. Wave 1's handoff at `docs/superpowers/sessions/2026-04-28-handoff.md` describes the broader engagement framing.
