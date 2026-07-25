# Soribashi

Soribashi is not a UI library. It is the tool you use to build one.

Most teams pick between two bad trades: own your components and lose the governing layer (three components spell "size" three different ways, colour decisions leak into feature code), or adopt someone else's component library and lose control (you're stuck with their opinions, their release cycle, their component set). Soribashi gives you the authoring rails that make a framework like Mantine pleasant to work in, defineComponent, useProps, useStyles, an intent resolver, `.extend()`, without shipping you Mantine's components. You bring the components. Soribashi makes them cohere.

But we also made one. A small one, `@soribashi/ui`, built with soribashi, verified the way we think a component should be verified before anyone vendors it into their own codebase. We think you'll like it, and more importantly, we think the way it was built is worth copying.

## The rails

**Vocabulary is declared, not assumed.** Soribashi itself has no opinion on what `size`, `intent`, or `variant` mean. You declare them once with `defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl'])`, a typed tuple backed by Zod, and every component that opts into that axis gets compile-time narrowing and a runtime check for free. The framework packages never hardcode a vocabulary; only a consumer (like `@soribashi/ui`, in its own `theme.ts`) does.

**Four builders for four shapes of component.**

| Builder | Shape | Example |
|---|---|---|
| `defineComponent` | Standard component, style slots, no need to render as anything else | Card, Badge |
| `definePolymorphicComponent` | Renders as any element (`as="a"`) | Button |
| `defineCompound` | Multi-part, shared context, usually wrapping a Base UI primitive | Popover, Tabs |
| `defineGenericComponent` | Data-driven, needs a real generic type parameter | Select |

Pick the one that matches the component's shape, one declarative config object instead of a pile of type aliases, and the builder wires up prop merging, class resolution, and CSS variables for you.

**`Recipe.extend()` is how you customize without forking.** Every recipe returned by a builder carries `.extend({ defaultProps, vocabulary, classNames, styles, vars, attributes })`. Override a default, inject a class, register a new vocabulary axis, all at the theme layer, without touching the component's source. It is first-class public API, not an escape hatch, and it is never bypassed anywhere in this repo.

**Codegen closes the loop.** `soribashi build` reads your theme and emits a CSS stylesheet: colours as `oklch()`, dark overrides as `light-dark()` pairs that resolve at the point of use (no `:root` selector games, no manual dark-mode plumbing), everything scoped inside `@layer soribashi.tokens` / `@layer soribashi.recipes` so your own app styles always win a specificity fight, and non-colour tokens (radius, spacing, font-size) registered with `@property` so they're typed and animatable. Colour tokens are deliberately never registered with `@property`, because registration freezes `light-dark()` to whichever element declared it, which would quietly break scoped, multi-tenant dark mode. The workshop's Tenants page demos exactly that: two brand themes rendered on the same page, each scoped to its own class selector, one of them with an extra `.dark` wrapper flipping only that subtree, no provider swap, no remount.

Every token the theme declares is emitted exactly once by codegen; recipes are scanned so no literal colour or length can hide in a stylesheet instead of referencing a real token; and the token references each recipe actually uses are listed per recipe in the derived manifest below. This is not reference-existence checking: nothing today catches a recipe referencing a token codegen never emitted. `--accent-primary`, read by Button's focus ring via a var fallback, is a live counterexample (see STATUS.md).

## `@soribashi/ui` and the workshop

`@soribashi/ui` is the library we built with the rails above: currently `Button` (a category-1 styled primitive) and `Popover` (a category-2 overlay compound over Base UI). Every recipe lives at `packages/ui/src/recipes/<Name>/` as exactly four files, the component, its stylesheet, a browser-tier test, a visual-tier test, and every one of them is required to be fully re-themeable: change the theme, not the recipe, and the component's whole look changes with it.

`bun run dev:workshop` starts a small React app (`apps/workshop`) that renders both recipes across their full intent x variant x size surface, in light and dark, plus a token reference page and the multi-tenant demo described above. It's the fastest way to actually look at what the theme produces.

## Vendoring it

`@soribashi/ui` isn't distributed as an npm dependency you import. It's distributed the way shadcn/ui distributes components: as source you copy into your own repo and own from that point forward. `packages/ui/registry/` holds a shadcn-schema-compatible registry (`registry.json` plus one `registry:ui` item per recipe) generated straight from the recipes, and the real `shadcn` CLI can vendor from it:

```bash
bunx shadcn@latest add ./registry/button.json
```

That exact command, against that exact file, is what `bun run smoke:registry` runs end-to-end in CI: scaffold a throwaway Vite + React project, vendor Button into it with the real CLI, install, build, and assert the recipe's own CSS-module class actually made it into the built bundle. There's no hosted registry URL yet; `@soribashi/core` and its workspace dependencies aren't published to npm, so today's smoke check vendors against a local, in-repo copy of the packages rather than a real `bun add @soribashi/core`. That gap closes when we publish; it's called out plainly here instead of glossed over.

## The verification story

A recipe that claims "fully re-themeable" earns that claim with tests, not a comment. Every recipe runs through three tiers:

1. **Tier 1, logic (Node, `vitest`).** Conformance scanners and manifest checks that don't need a browser.
2. **Tier 2, browser (real Chromium via `@vitest/browser-playwright`).** Render, interaction, and accessibility assertions, plus the WCAG AA contrast matrix and the theme-only re-skin guard described below. `vitest-browser-react` drives real DOM, not jsdom.
3. **Tier 3, visual (`bun run test:visual`).** Screenshot baselines per recipe, geometry, borders, radii, typography, focus rings, checked pixel-for-pixel against a committed reference image.

Two conformance gates back the "re-themeable" claim mechanically, not just by test count:

- **No hardcoded values.** Every recipe's stylesheet is scanned for any colour or length literal that didn't come from a `var(...)` reference (a short allowlist covers `0`/`1px`/`2px`/`100%` and unitless/time values). A recipe can't quietly reach for a raw hex value and still claim to be theme-driven.
- **Theme-only re-skin.** Every recipe is rendered twice, once under its real theme, once under a second, deliberately garish theme scoped to a wrapper class, with zero changes to the recipe's source in between. The test asserts the computed background, foreground, or radius actually changed. This is what makes "fully re-skinnable through the theme alone" a checked fact about this repo rather than a claim about the design.

Layered on top: a WCAG AA contrast matrix (>= 4.5:1) checked across every intent x variant x size combination, in both light and dark scheme, for Button today (150 combinations; the authoring skill requires the same matrix membership of every future colour-bearing recipe, so Popover picks it up when that coverage is written); and a visual oracle whose baselines are generated exclusively by CI (a `workflow_dispatch` job, or the pinned Docker command it documents), never committed from a local machine, because Vitest suffixes baseline filenames by platform and a darwin screenshot is not the same file as the Linux one CI actually compares against.

## Agentic artifacts

Two things exist specifically so an agent (or a developer moving fast) doesn't have to re-derive facts about this library by reading source:

- **A derived manifest.** `bun run generate:ui` walks every recipe's frozen metadata and its own source, and writes `packages/ui/manifest.json`: name, authoring category, builder, slots, vocabulary axes, variants, defaults, the four file paths, and every theme token the recipe's CSS actually depends on. For compounds, `slots` lists PART names, not style-slot keys; the stylable slot keys a compound recipe exposes are a superset defined by its own `classes`/`getStyles` usage and aren't captured here yet. Nothing in it is hand-authored; a drift test rebuilds it the same way and fails on any difference from what's committed.
- **In-repo skills.** `.claude/skills/authoring-a-recipe/` is the checklist for adding or changing a recipe: the four-file layout, builder selection, the CSS rules, what each test tier needs, and the traps that have already bitten someone once (async `render`, `light-dark()` being colour-only, a recipe's `vars` replacing rather than layering on `autoVars`, and more).

## Getting started

Requires [Bun](https://bun.sh).

```bash
bun install
bun run test            # vitest across all packages
bun run typecheck
bun run lint             # biome
bun run codegen          # theme -> CSS
bun run dev:workshop     # recipe showcase + multi-tenant demo
```

## Status

Pre-v1, actively built in public slices. The foundation (factory, theme, codegen, 14 adapted layout blocks, vocabulary rails) is stable. `@soribashi/ui` has two recipes across two of the four authoring categories, with the full three-tier verification story described above wired into CI. See [STATUS.md](./STATUS.md) for the detailed record and what's deliberately still ahead (more recipes, npm publishing). Packages are versioned at `0.0.0` and not yet published.

## Manifesto

For the full story, what was imagined, what was built, and why, see [MANIFESTO.md](./MANIFESTO.md).

## Attribution

Soribashi adapts patterns from [Mantine](https://mantine.dev) (MIT). Factory, blocks, and style-props machinery are derived from Mantine's open-source code. Every adapted source file carries a header comment pointing to the original. See [THIRD-PARTY-LICENSES.md](./THIRD-PARTY-LICENSES.md).

## License

MIT
