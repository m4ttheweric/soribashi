# Soribashi

Soribashi is not a UI library. It is the tool you use to build one.

Most teams pick between two bad trades: own your components and lose the governing layer (three components spell "size" three different ways, colour decisions leak into feature code), or adopt someone else's component library and lose control (you're stuck with their opinions, their release cycle, their component set). Soribashi gives you the authoring rails that make a framework like Mantine pleasant to work in, defineComponent, useProps, useStyles, an intent resolver, `.extend()`, without shipping you Mantine's components. You bring the components. Soribashi makes them cohere.

But we also made one. A small one, `@soribashi/ui`, built with soribashi, verified the way we think a component should be verified before anyone vendors it into their own codebase. We think you'll like it, and more importantly, we think the way it was built is worth copying.

- **Vocabulary is declared, not assumed**: typed, Zod-backed `defineVocabulary()` axes, never hardcoded by the framework itself.
- **Four builders, one per component shape**: `defineComponent`, `definePolymorphicComponent`, `defineCompound`, `defineGenericComponent`.
- **`Recipe.extend()` customizes without forking**: first-class public API, never bypassed anywhere in this repo.
- **A CI-verified, shadcn-schema-compatible registry**: `bunx shadcn@latest add ./registry/button.json` is exercised end to end by the real `shadcn` CLI in CI, not simulated.

Run it locally: see [Getting started](#getting-started). For how the rails work, keep reading.

## The rails

**Vocabulary is declared, not assumed.** Soribashi itself has no opinion on what `size`, `intent`, or `variant` mean. You declare them once with `defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl'])`, a typed tuple backed by Zod, and every component that opts into that axis gets compile-time narrowing and a runtime check for free. The framework never hardcodes a vocabulary; only a consumer (like `@soribashi/ui`, in its own `theme.ts`) does.

**Four builders for four shapes of component.**

| Builder | Shape | Example |
|---|---|---|
| `defineComponent` | Standard component, style slots, no need to render as anything else | Alert, Checkbox |
| `definePolymorphicComponent` | Renders as any element (`as="a"`) | Button, Badge |
| `defineCompound` | Multi-part, shared context, usually wrapping a Base UI primitive | Popover, Tabs |
| `defineGenericComponent` | Data-driven, needs a real generic type parameter | Select |

Pick the one that matches the component's shape, one declarative config object instead of a pile of type aliases, and the builder wires up prop merging, class resolution, and CSS variables for you.

**`Recipe.extend()` is how you customize without forking.** Every recipe returned by a builder carries `.extend({ defaultProps, vocabulary, classNames, styles, vars, attributes })`. Override a default, inject a class, register a new vocabulary axis, all at the theme layer, without touching the component's source. It is first-class public API, not an escape hatch, and it is never bypassed anywhere in this repo.

**Codegen closes the loop.** `soribashi build` reads your theme and emits a CSS stylesheet: colours as `oklch()`, dark overrides as `light-dark()` pairs that resolve at the point of use (no `:root` selector games, no manual dark-mode plumbing), everything scoped inside `@layer soribashi.tokens` / `@layer soribashi.recipes` so your own app styles always win a specificity fight, and non-colour tokens (radius, spacing, font-size) registered with `@property` so they're typed and animatable. Colour tokens are deliberately never registered with `@property`, because registration freezes `light-dark()` to whichever element declared it, which would quietly break scoped, multi-tenant dark mode. The workshop's Tenants page demos exactly that: two brand themes rendered on the same page, each scoped to its own class selector, one of them with an extra `.dark` wrapper flipping only that subtree, no provider swap, no remount.

Every token the theme declares is emitted exactly once by codegen; recipes are scanned so no literal colour or length can hide in a stylesheet instead of referencing a real token; and the token references each recipe actually uses are listed per recipe in the derived manifest below. This is not reference-existence checking: nothing today catches a recipe referencing a token codegen never emitted. `--accent-primary`, read by Button's focus ring via a var fallback, is a live counterexample (see STATUS.md).

## `@soribashi/ui` and the workshop

`@soribashi/ui` is the library we built with the rails above: twenty-eight recipes today, `Accordion`, `Alert`, `AspectRatio`, `Avatar`, `Badge`, `Box`, `Button`, `Center`, `Checkbox`, `Container`, `Dialog`, `Divider`, `Field`, `Grid`, `Group`, `Paper`, `Popover`, `RadioGroup`, `Select`, `Skeleton`, `Stack`, `Switch`, `Tabs`, `Text`, `Textarea`, `TextInput`, `Title`, and `Tooltip`, spanning all four authoring categories: sixteen category-1 styled primitives, three category-2 transient overlay compounds (`Dialog`, `Popover`, `Tooltip`), two category-3 persistent compounds (`Accordion`, `Tabs`), and seven category-4 form controls (`Checkbox`, `Field`, `RadioGroup`, `Select`, `Switch`, `Textarea`, `TextInput`), all over Base UI. Ten of the twenty-eight are the original layout recipes (`Box`, `Stack`, `Group`, `Center`, `AspectRatio`, `Grid`, `Container`, `Paper`, `Text`, `Title`): `Box`'s own style-prop surface (`m`/`p`/`bg`/`fz`/`fw`/...) and the four visibility props (`hiddenFrom`/`visibleFrom`/`lightHidden`/`darkHidden`) arrive on every recipe for free, resolved by the builders themselves, not hand-wired per recipe. `@soribashi/core`, the public barrel, exports only the framework, the four builders, the theme contract, the style-prop and visibility machinery, never a component; every component lives downstream, in `@soribashi/ui`. Every recipe lives at `packages/ui/src/recipes/<Name>/` as, at minimum, four files, the component, its stylesheet, a browser-tier test, a visual-tier test (`Select` also carries a small helper module and its own unit test alongside those four, for logic substantial enough to warrant its own non-browser test tier), and every one of them is required to be fully re-themeable: change the theme, not the recipe, and the component's whole look changes with it.

`bun run dev:workshop` starts a small React app (`apps/workshop`) that renders every recipe across its full intent x variant x size surface, in light and dark, plus a token reference page and the multi-tenant demo described above. It's the fastest way to actually look at what the theme produces.

## Vendoring it

`@soribashi/ui` isn't distributed as an npm dependency you import. It's distributed the way shadcn/ui distributes components: as source you copy into your own repo and own from that point forward. `packages/ui/registry/` holds a shadcn-schema-compatible registry (`registry.json` plus one `registry:ui` item per recipe) generated straight from the recipes, and the real `shadcn` CLI can vendor from it:

```bash
bunx shadcn@latest add ./registry/button.json
```

That exact command, against that exact file, is what `bun run smoke:registry` runs end-to-end in CI: scaffold a throwaway Vite + React project, vendor four registry items into it with the real CLI (`button`, one leaf primitive; `stack`, a layout recipe; `checkbox`, a Base UI-backed form control with an external npm dependency to resolve; `textinput`, the first recipe whose own `registryDependencies` pulls in a sibling recipe, `field`, transitively), install, build, and assert each of the four's own `--sb-<name>-*` custom-property marker actually made it into both the built CSS and the built JS bundle. There's no hosted registry URL yet, and `@soribashi/core` isn't published to npm, so today's smoke check vendors against a local, in-repo copy of the package rather than a real `bun add @soribashi/core`. That gap closes when we publish; it's called out plainly here instead of glossed over.

## The verification story

A recipe that claims "fully re-themeable" earns that claim with tests, not a comment. Every recipe runs through three tiers:

1. **Tier 1, logic (Node, `vitest`).** Conformance scanners and manifest checks that don't need a browser.
2. **Tier 2, browser (real Chromium via `@vitest/browser-playwright`).** Render, interaction, and accessibility assertions, plus the WCAG AA contrast matrix and the theme-only re-skin guard described below. `vitest-browser-react` drives real DOM, not jsdom.
3. **Tier 3, visual (`bun run test:visual`).** Screenshot baselines per recipe, geometry, borders, radii, typography, focus rings, checked pixel-for-pixel against a committed reference image.

Two conformance gates back the "re-themeable" claim mechanically, not just by test count:

- **No hardcoded values.** Every recipe's stylesheet is scanned for any colour or length literal that didn't come from a `var(...)` reference (a short allowlist covers `0`/`1px`/`2px`/`100%` and unitless/time values). A recipe can't quietly reach for a raw hex value and still claim to be theme-driven.
- **Theme-only re-skin.** Every recipe is rendered twice, once under its real theme, once under a second, deliberately garish theme scoped to a wrapper class, with zero changes to the recipe's source in between. The test asserts the computed background, foreground, or radius actually changed. This is what makes "fully re-skinnable through the theme alone" a checked fact about this repo rather than a claim about the design.

Layered on top: a WCAG AA contrast matrix (>= 4.5:1) checked across every intent x variant x size combination, in both light and dark scheme, for Button's, Alert's, and Badge's full grids plus a smaller rendered-cell coverage for every other colour-bearing recipe (Accordion, Avatar, Checkbox, Dialog, Paper, Popover, RadioGroup, Select, Switch, Tabs, Text, Textarea, TextInput, Title, Tooltip); every recipe, colour-bearing or not, is classified `'covered'` or `{ exempt: '<reason>' }` in a guard the authoring skill requires every new recipe to join, so a recipe can't quietly ship with no contrast story either way. And a visual oracle whose baselines are generated exclusively by CI (a `workflow_dispatch` job, or the pinned Docker command it documents), never committed from a local machine, because Vitest suffixes baseline filenames by platform and a darwin screenshot is not the same file as the Linux one CI actually compares against.

## Agentic artifacts

Two things exist specifically so an agent (or a developer moving fast) doesn't have to re-derive facts about this library by reading source:

- **A derived manifest.** `bun run generate:ui` walks every recipe's frozen metadata and its own source, and writes `packages/ui/manifest.json`: name, authoring category, builder, slots, vocabulary axes, variants, defaults, the four file paths, and every theme token the recipe's CSS actually depends on. For compounds, `slots` now reports real stylable slot keys, not part names: each compound declares a `const SLOT_KEYS = [...] as const` array and passes it to `defineCompound` (see Popover's and Tabs' `slotKeys`), because a part-name/CSS-class union can't reconstruct the real set (Popover's `positioner` is a styled slot with no part; its `content` part is not itself a style slot). Nothing in the manifest is hand-authored; a drift test rebuilds it the same way and fails on any difference from what's committed.
- **In-repo skills.** `.claude/skills/authoring-a-recipe/` is the checklist for adding or changing a recipe: the four-file layout, builder selection, the CSS rules, what each test tier needs, and the traps that have already bitten someone once (async `render`, `light-dark()` being colour-only, a recipe's `vars` replacing rather than layering on `autoVars`, and more).

## Installing from npm

There is one package. It is [`@soribashi/core`](./packages/core), published as a built artifact:

```bash
bun add @soribashi/core react react-dom
```

That is the whole install. The builders, the theme model, the style-prop machinery, the codegen API, and the `soribashi` CLI all ship in it. `react` and `react-dom` (18 or 19) are peer dependencies.

| Import | What you get |
| --- | --- |
| `@soribashi/core` | The framework: `defineComponent`, `defineCompound`, the polymorphic and generic builders, `createTheme`, `composeTheme`, `defineVocabulary`, `SoribashiProvider`, `registerTheme`, style props, visibility props. Never a component. |
| `@soribashi/core/codegen` | The codegen API — `build`, `emitCss`, `emitTailwindV4`, `loadConfig`, `watch` — for driving it programmatically instead of through the CLI. |
| `soribashi` (the bin) | The CLI: theme -> CSS. Ships with the package; there is nothing else to install. |

**Why one package, and why it still has a scope.** This was four packages once — `core`, `factory`, `theme`, `codegen` — which was four npm identities for one indivisible thing. Nobody installs the factory without the theme model, and the barrel existed only to spare you from wiring three of them together. Four packages bought four changelogs, four lockstep version bumps, and three `workspace:*` interdependencies that npm cannot publish. They bought an adopter nothing.

The scope stays because the org is the product, not the package. `@soribashi/core` is the mandatory surface and is meant to stay the only thing you *must* install. Anything genuinely optional that shows up later — an adapter, a preset, a devtool — joins the `@soribashi` org beside core rather than being folded into it. The test for a new package is "would an adopter reasonably not want this?", not "is this a separate concern internally". Internal concerns are directories.

```tsx
import { createTheme, defineComponent, defineVocabulary, SoribashiProvider } from '@soribashi/core';

const theme = createTheme({
  name: 'app',
  vocabulary: { size: defineVocabulary(['sm', 'md', 'lg'] as const) },
});
```

Then point the CLI at a config and generate the stylesheet:

```ts
// soribashi.config.ts
export default { theme, output: { css: './src/generated/theme.css' } };
```

```bash
bunx soribashi build     # or: bunx soribashi watch
```

**The package ships compiled JavaScript and `.d.ts` declarations in `dist/`, and its `exports` map points there.** Your `tsc` never compiles Soribashi's source, so you don't inherit its `tsconfig` requirements: no `@types/node` or `bun-types` entries you didn't ask for, and no `TS2578` from suppressions inside our source being re-checked against your ambient types. (`src/` rides along in the tarball only so declaration maps resolve for go-to-definition; it is not an entry point.)

This is verified, not asserted: `bun run pack:check` packs the real tarball and proves every entry point resolves under `dist/`, and a throwaway consumer project installs that tarball and type-checks it with `skipLibCheck: false` and `types: ["bun"]` — the harshest settings available — with `--traceResolution` confirming every one of the resolutions lands in `dist/` and none in `src/`.

The `soribashi` CLI needs [Bun](https://bun.sh) on `PATH` — its shebang is `#!/usr/bin/env bun`, because a `soribashi.config.ts` is imported directly and Bun's native TypeScript loader is what makes that work with no build step. The library packages themselves are plain ESM and run under Node, Bun, or any bundler.

`@soribashi/ui` is deliberately **not** on npm. It's distributed shadcn-style, as source you vendor and own — see [Vendoring it](#vendoring-it) above.

## Getting started

Requires [Bun](https://bun.sh).

```bash
bun install
bun run test            # vitest across all packages
bun run typecheck
bun run lint             # biome
bun run build            # compile packages/core to dist/
bun run pack:check       # pack the tarball and assert it is publishable
bun run codegen          # theme -> CSS
bun run dev:workshop     # recipe showcase + multi-tenant demo
```

### How this repo consumes its own packages

The published package's `exports` map points at `dist/`, which is what consumers get. Each entry also lists a `"soribashi-source"` condition **first**, pointing back at `src/`:

```jsonc
"exports": {
  ".": {
    "soribashi-source": "./src/index.ts",  // this workspace only
    "types": "./dist/src/index.d.ts",      // everyone else
    "default": "./dist/src/index.js"
  },
  "./codegen": {
    "soribashi-source": "./src/codegen/index.ts",
    "types": "./dist/src/codegen/index.d.ts",
    "default": "./dist/src/codegen/index.js"
  }
}
```

Only this repo opts into that condition, so the workspace keeps running against TypeScript source with no build step — a change in `packages/core/src/theme` is seen immediately by `packages/ui`, and go-to-definition lands on real source. Each tool opts in its own way:

- **tsc** — `customConditions` in [`tsconfig.base.json`](./tsconfig.base.json)
- **Vite / Vitest** — `resolve.conditions`, shared from [`scripts/source-conditions.ts`](./scripts/source-conditions.ts)
- **Bun** — `--conditions=soribashi-source` in the root `package.json` scripts

No consumer sets the condition, so no consumer ever resolves our source. If you add a tool that resolves `@soribashi/*` inside this repo, opt it in the same way, or it will silently read a possibly-stale `dist/`.

### Publishing

One package, one command, run from its directory:

```bash
cd packages/core && bun publish --access public --otp CODE
```

Before that, always:

```bash
bun run build && bun run pack:check
```

`bun run pack:check` packs the real tarball with `bun pm pack` and asserts four invariants: no `workspace:` range survives into the manifest, no published entry point escapes `dist/`, every entry point actually exists inside the archive, and no shipped `.d.ts` carries a relative `.ts`/`.tsx` specifier (the `TS5097` failure mode).

**Why still Bun and not npm.** The original reason was hard: `bun publish` rewrites each `workspace:*` interdependency to a concrete version and `npm publish` does not, so npm would push a manifest containing the literal string `workspace:*` — not a valid registry range, so every install fails. **That reason is gone.** Merging the four packages left exactly zero soribashi interdependencies, so there is no longer a `workspace:` range for anything to mangle, and `pack:check`'s first invariant is now deliberately vacuous — it stays as the assertion that this is still true.

`bun publish` remains the documented path anyway, for consistency with the rest of the workspace's tooling and because the second npm gap is still real: npm ignores `publishConfig` field overrides such as `exports` (a pnpm/yarn feature), which is why the `exports` map points at `dist/` directly rather than relying on a publish-time swap. Nothing would now silently break under `npm publish`, but there is no reason to find out.

### Development-mode appendix: consuming from a checkout

Before the packages were published, adopters consumed them from a sibling checkout via `file:` dependencies plus `overrides`. That path still works for local development against unreleased changes, but **installing from npm is now the supported path**, and the checkout recipe is a debugging tool rather than a setup step.

One thing changed for existing `file:` consumers: because `exports` now points at `dist/`, and `dist/` is generated (and gitignored), **a `file:` dependency resolves to nothing until this checkout has been built.** Run `bun run build` here once after pulling, and again after any change you want the consumer to see. That staleness window is the reason `file:` is no longer the recommended path.

The old graph-flattening friction is gone with the merge: there was one `@soribashi/*` package to depend on and no interdependencies for Bun's top-level-only `overrides` to fail to reach. What remains is that `file:`-delivered packages don't install their own runtime dependencies, so `clsx`, `tailwind-merge`, and `zod` still have to be re-declared at the consumer root. See [SORI-4](https://linear.app/mattstack/issue/SORI-4) for the full history.

`packages/{theme,factory,codegen}` still exist in this repo as **private, unpublished shims** that re-export `@soribashi/core`. They exist for exactly one consumer — a sibling `tui-kit` checkout that depends on all four by `file:` path — and are deleted the moment it moves to `@soribashi/core`. They are not published and are not a supported import path.

To develop against a local checkout today, prefer linking over `file:`:

```bash
cd ~/path/to/soribashi && bun run build
cd packages/core && bun link
cd ~/path/to/your-app && bun link @soribashi/core
```

`bun link` resolves the package through its normal `exports` map, so you get the built `dist/` — re-run `bun run build` in the soribashi checkout after each change.

## Status

Pre-v1, actively built in public slices. The foundation (factory, theme, codegen, vocabulary rails) is stable and framework-only: `@soribashi/core` exports no components. `@soribashi/ui` has twenty-eight recipes across all four authoring categories, ten of them native layout recipes carrying universal style props, with the full three-tier verification story described above wired into CI. See [STATUS.md](./STATUS.md) for the detailed record and what's deliberately still ahead. The framework ships as the single `@soribashi/core` at `0.1.0`, prepared for its first npm release — built artifacts, declarations, and `dist`-first `exports` are in place, proved end to end against a real tarball; see [Installing from npm](#installing-from-npm).

## Manifesto

For the full story, what was imagined, what was built, and why, see [MANIFESTO.md](./MANIFESTO.md).

## Attribution

Soribashi adapts patterns from [Mantine](https://mantine.dev) (MIT). The factory's style-props machinery (extraction, parsing, per-property resolvers) is derived from Mantine's open-source code. Every adapted source file carries a header comment pointing to the original. See [THIRD-PARTY-LICENSES.md](./THIRD-PARTY-LICENSES.md).

## License

MIT
