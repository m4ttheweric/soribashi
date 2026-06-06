# Vocabulary Rails — Theme-Declared, Zod-Validated, No Soribashi Opinions

> **Status:** Design (2026-05-12). **Sizing:** L (one cross-cutting architectural change touching `@soribashi/theme`, `@soribashi/factory`, the pilot app's recipes, and codegen). **Supersedes:** the vocabulary side of `docs/superpowers/specs/2026-05-12-library-authoring-hygiene-design.md` (the CSS-modules side of that spec stays valid).
>
> **Premise:** soribashi the library has NO opinion on size / intent / variant values. Developers declare their own vocabulary; soribashi provides rails to declare it once, enforce it at compile time, validate it at runtime, and override it per-component when needed. Defaults exist for ergonomics but flow through the same tool — never as bare-importable types.

## 1. Problem

Across three pilot waves (Button, Tooltip, Tabs) every recipe redeclares its own `Variant` / `Intent` / `Size` unions inline. There's no enforced shared vocabulary across recipes — `Button.size: 'sm' | 'md' | 'lg'` and a future `Badge.size: 'small' | 'medium' | 'large'` would silently diverge.

A first attempt at fixing this (the prior spec, `2026-05-12-library-authoring-hygiene-design.md`) added bare-importable `Size` / `Intent` types to `@soribashi/factory`. That solved one problem (no more local redeclarations) but broke a more important one: **soribashi shouldn't ship the canon for what a Size is.** That's the consumer's decision. The consumer's app defines its own vocabulary; soribashi enforces uniformity within it.

This spec replaces that approach with vocabulary rails: a small, opinionated API for declaring, enforcing, and overriding vocabulary — with zero baked-in soribashi opinions on the values.

## 2. Goals

1. **No bare opinions in soribashi.** No `export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'` anywhere in `@soribashi/factory` or `@soribashi/core`. Defaults exist but are reachable only through the tool that declares them.
2. **One declaration site per axis.** The consumer declares each vocabulary (size, intent, variant) once per theme.
3. **Recipes inherit by default.** Authoring `defineComponent` or `defineCompound` automatically picks up the theme's vocabulary — no per-recipe redeclaration, no manual threading.
4. **Per-component overrides are deliberate.** When Tooltip needs `variant: 'default' | 'subtle'` instead of the global variant list, it's declared on the recipe's extension in the theme, not invented inline.
5. **Compile-time enforcement.** Passing an invalid value is a TypeScript error.
6. **Runtime enforcement.** Casting past TypeScript still fails at render time (dev), with a clear error pointing at the declaration site.
7. **No escape hatches.** No `unsafeSize` per-call props. The only way to use a value outside the global vocab is to extend the recipe's vocabulary in the theme — a deliberate, reviewable change.

## 3. Non-goals

- **Theme-derived intent resolver behavior.** This spec is about vocabulary (which values are allowed), not styling resolution (how `intent='warn'` maps to colors). The existing `intentResolver` continues to work; this spec just constrains which `intent` values can reach it.
- **Multiple themes per app.** A single theme per app is the assumed model. Multiple themes (e.g., a marketing surface and a dashboard surface in one monorepo) can be supported by calling `createSoribashiBuilders` twice with different themes — but that's not the optimized-for path.
- **Runtime vocabulary mutation.** Vocabularies are declared at theme construction time and frozen. No `theme.vocabulary.size.add('jumbo')` at runtime.
- **Backward compatibility with `withDefaults`.** Pre-1.0, breaking changes are fine. `withDefaults` is removed; `extend()` replaces it.
- **The CSS-modules migration.** Already designed and partially shipped in the prior spec — that work is orthogonal and continues independently.

## 4. The model — overview

Four moving parts:

1. **`defineVocabulary(values)`** — the only sanctioned way to declare a vocabulary. Returns `{ schema, values, type }` where `schema` is a Zod enum and `type` is a phantom inferable type.
2. **`createTheme({ vocabulary, semanticTokens, components })`** — the theme declares its global vocabularies and applies per-component extensions via `Recipe.extend({ vocabulary: ... })`.
3. **`createSoribashiBuilders(theme)`** — the consumer's app produces typed `defineComponent` / `definePolymorphicComponent` / `defineCompound` builders from their theme. Recipes import from this local module, not from `@soribashi/core`.
4. **Builders inject vocabulary-typed props automatically.** Recipes declare `vocabularyAxes: ['size', 'intent', 'variant']`; the builder injects `size?: <theme's size>`, etc., and validates them at render time via the Zod schemas registered with the theme.

End-to-end flow:

```
defineVocabulary(['compact', 'standard', 'comfortable'])
        ↓
createTheme({ vocabulary: { size: <that> } })
        ↓
createSoribashiBuilders(theme)     ← consumer's app sets up its own typed builders
        ↓
definePolymorphicComponent({       ← recipes import from local builders.ts
  name: 'Button',
  vocabularyAxes: ['size'],        ← opt in to which axes this recipe uses
  ...
})
        ↓
<Button size="standard" />         ← typechecked + runtime-validated
```

Per-component override:

```
Button.extend({                                ← .extend() returns a ThemeComponentEntry
  vocabulary: {
    size: (current) => defineVocabulary([
      ...current.values, 'jumbo',              ← function form: extend the default
    ]),
  },
  defaultProps: { size: 'standard' },
})
        ↓
createTheme({ components: [Button.extend(...)] })   ← entry is registered with the theme
```

## 5. `defineVocabulary` — the tool

```ts
// packages/theme/src/define-vocabulary.ts
import { z } from 'zod';

export interface Vocabulary<T extends string = string> {
  readonly __vocab: true;
  readonly schema: z.ZodEnum<[T, ...T[]]>;
  readonly values: readonly T[];
  /** Phantom type — never set at runtime, only reachable via `typeof v['type']`. */
  readonly type?: T;
}

export function defineVocabulary<const T extends string>(
  values: readonly [T, ...T[]],
): Vocabulary<T> {
  return {
    __vocab: true,
    schema: z.enum(values as unknown as [T, ...T[]]),
    values,
  };
}
```

The `const` modifier on the generic ensures literal types are preserved when consumers call `defineVocabulary(['compact', 'standard'])` without writing `as const`. The function is the only public way to construct a `Vocabulary`. The `__vocab` brand prevents arbitrary objects from being mistaken for vocabularies.

**Defaults.** Soribashi ships internal default vocabularies (used only when the consumer omits the axis from `createTheme`):

```ts
// packages/theme/src/defaults.ts — NOT exported from any public barrel
const DEFAULT_SIZE = defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl']);
const DEFAULT_INTENT = defineVocabulary([
  'primary', 'neutral', 'success', 'warning', 'danger', 'info',
]);
const DEFAULT_VARIANT = defineVocabulary([
  'filled', 'outline', 'subtle', 'ghost', 'link',
]);

export const DEFAULTS = {
  size: DEFAULT_SIZE,
  intent: DEFAULT_INTENT,
  variant: DEFAULT_VARIANT,
} as const;
```

Defaults are only accessible inside the theme module. They are NEVER re-exported as bare types or values. The consumer reaches them only through `createTheme()` (when they omit an axis) or through `extend()`'s function form (which passes the resolved default as `current`).

## 6. Theme structure — `semantic` split into `vocabulary` + `semanticTokens`

The existing `semantic` field conflated two distinct concepts:
- **Enums** — `intent` / `variant` (vocabularies)
- **Aliases** — `text` / `surface` / `border` / `accent` (role-name → token-path mappings emitted as CSS custom properties)

These get split:

```ts
// packages/theme/src/types.ts (proposed shape)

export interface ThemeDefinition {
  tokens: ThemeTokens;
  dark?: PartialThemeTokens;

  /** Declared vocabularies. Each axis is optional; omitting falls back to DEFAULTS. */
  vocabulary?: {
    size?: Vocabulary;
    intent?: Vocabulary;
    variant?: Vocabulary;
  };

  /** Role-name aliases. Emitted as CSS custom properties at codegen time. */
  semanticTokens?: {
    text?: Record<string, SemanticReference>;
    surface?: Record<string, SemanticSurfaceValue>;
    border?: Record<string, SemanticReference>;
    accent?: Record<string, SemanticReference>;
  };

  intentResolver?: IntentResolver;

  /**
   * Array of ThemeComponentEntry values produced by `Recipe.extend(...)`.
   * The legacy `Record<string, ComponentThemeConfig>` shape is removed.
   */
  components?: readonly ThemeComponentEntry[];

  scope?: string;
  darkMode?: { selector: string };
  extends?: ThemeDefinition;
  name?: string;
}

export interface ResolvedTheme {
  tokens: ThemeTokens;
  dark: PartialThemeTokens;
  vocabulary: { size: Vocabulary; intent: Vocabulary; variant: Vocabulary };  // fully resolved
  semanticTokens: { text: ...; surface: ...; border: ...; accent?: ... };
  intentResolver: IntentResolver;
  components: readonly ThemeComponentEntry[];
  scope: string;
  darkMode: { selector: string };
  name: string;
}
```

`createTheme()` fills in missing vocabularies from `DEFAULTS`. It also resolves each component entry's `vocabulary` field — calling function-form overrides with the resolved global vocab for that axis, freezing the result.

`semanticTokens` is structurally identical to today's `semantic.text/surface/border/accent` — only the field name changes. Codegen reads from `theme.semanticTokens` instead of `theme.semantic`.

## 7. `Recipe.extend()` — replaces `withDefaults()`

Every recipe gets a static `extend()` method that returns a `ThemeComponentEntry`. The entry carries: per-component vocabulary overrides, default props, slot classNames/styles/vars/attributes.

```ts
// Sketch — packages/factory/src/types/component-extend.ts

export type VocabularyOverride<V extends Vocabulary = Vocabulary> =
  | V
  | ((current: V) => V);

export interface ComponentExtendConfig<TOwnProps, TAxes extends readonly string[]> {
  vocabulary?: Partial<{
    [K in TAxes[number]]: VocabularyOverride;
  }>;
  defaultProps?: Partial<TOwnProps>;
  classNames?: Record<string, string> | ((theme, props) => Record<string, string>);
  styles?: Record<string, CSSObject> | ((theme, props) => Record<string, CSSObject>);
  vars?: (theme, props) => Record<string, Record<string, string>>;
  attributes?: Record<string, Record<string, unknown>>;
}

// Attached to every recipe by the builder:
(Button as any).extend = (config: ComponentExtendConfig<...>): ThemeComponentEntry => ({
  __soribashiThemeEntry: true,
  name: 'Button',
  config,
});
```

**Two override modes via shape dispatch:**

```ts
Button.extend({
  vocabulary: {
    // Mode 1 — replace: pass a Vocabulary value directly.
    intent: defineVocabulary(['cta', 'subtle']),

    // Mode 2 — extend: pass a function. `current` is the global vocabulary for
    // this axis at the time createTheme() resolves the entry. Function is
    // invoked once during theme construction; the result is the new vocabulary.
    size: (current) => defineVocabulary([...current.values, 'jumbo']),

    // Omitted axes inherit unchanged from the global theme vocabulary.
  },
  defaultProps: { intent: 'cta', size: 'jumbo' },
  classNames: { root: 'my-button-extras' },
});
```

**`withDefaults` is removed.** The migration is:

```ts
// Before
Button.withDefaults({ size: 'lg' })

// After
Button.extend({ defaultProps: { size: 'lg' } })
```

Per-recipe, identical surface; just nested under `defaultProps`. Existing pilot uses of `withDefaults` need migration (small — search results in this repo show ~5 call sites total).

## 8. `createSoribashiBuilders(theme)` — the type bridge

Soribashi's `@soribashi/core` does not export the daily-use builders directly anymore. Instead it exports a factory:

```ts
// packages/factory/src/create-builders.ts (sketch)

import type { ResolvedTheme } from '@soribashi/theme';

export function createSoribashiBuilders<TTheme extends ResolvedTheme>(theme: TTheme) {
  // Register every component entry's vocabulary schemas with a runtime registry
  // so the builders' useProps can validate against them.
  registerVocabularies(theme);

  return {
    defineComponent: makeDefineComponent<TTheme>(theme),
    definePolymorphicComponent: makeDefinePolymorphicComponent<TTheme>(theme),
    defineCompound: makeDefineCompound<TTheme>(theme),
  };
}
```

Consumer setup:

```ts
// apps/my-app/src/builders.ts
import { createSoribashiBuilders } from '@soribashi/core';
import { theme } from './theme';

export const {
  defineComponent,
  definePolymorphicComponent,
  defineCompound,
} = createSoribashiBuilders(theme);

export type { ButtonOwnProps, TooltipOwnProps, ... } from './recipes';
```

Recipes then import from `'../builders'` instead of `'@soribashi/core'`. The builders are pre-typed against the theme.

**Why a factory and not module augmentation:** explicit beats implicit. The consumer's recipes physically link back to their theme through the builders module, so renaming the theme file or restructuring the app surfaces import errors immediately rather than silently breaking type inference deep inside soribashi.

## 9. Recipe authoring — `vocabularyAxes` opt-in

Recipes declare which vocabulary axes they use. The builder injects typed props for those axes.

```ts
// apps/my-app/src/recipes/Button/Button.tsx

import { definePolymorphicComponent } from '../../builders';
import type { ReactNode } from 'react';

export interface ButtonOwnProps {
  // Recipe-local props only — no size/intent/variant declared here.
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

export const Button = definePolymorphicComponent<ButtonOwnProps, 'button'>({
  name: 'Button',
  vocabularyAxes: ['size', 'intent', 'variant'] as const,  // ← which axes apply
  defaults: {
    // Typechecked against the active theme + Button's extension.
    // If theme has `Button.extend({ vocabulary: { size: (cur) => ... } })`,
    // those values are valid here.
    size: 'standard',
    intent: 'safe',
    variant: 'solid',
    loading: false,
    fullWidth: false,
  },
  selectors: ['root', 'inner', 'label', 'icon', 'spinner'] as const,
  render: ({ Element, props, getStyles, ref }) => {
    // props is the union of:
    //   ButtonOwnProps
    //   + builder-injected { size?: ResolvedSize, intent?: ResolvedIntent, variant?: ResolvedVariant }
    //   + the standard HTML attribute / styles-API keys
    return (
      <Element
        ref={ref}
        {...getStyles('root')}
        data-size={props.size}
        data-intent={props.intent}
        data-variant={props.variant}
      >
        {props.children}
      </Element>
    );
  },
});
```

For recipes that don't use a particular axis (Tabs doesn't need `intent`; Tooltip doesn't need `size`), simply omit it from `vocabularyAxes`. The builder doesn't inject those props, and the recipe has nothing to default.

```ts
export const Tooltip = defineCompound({
  name: 'Tooltip',
  vocabularyAxes: ['variant'] as const,
  defaults: { variant: 'default', side: 'top' },
  parts: { /* ... */ },
});
```

## 10. Runtime validation

Every render of a vocabulary-aware recipe validates its declared axes against the registered Zod schemas. Dev-only (skipped in production builds via `process.env.NODE_ENV` check), with a clear error message.

```ts
// Inside the builder's useProps (sketch)
if (process.env.NODE_ENV !== 'production') {
  for (const axis of config.vocabularyAxes ?? []) {
    const value = merged[axis];
    if (value === undefined) continue;
    const vocab = resolveVocabForComponent(theme, config.name, axis);
    const result = vocab.schema.safeParse(value);
    if (!result.success) {
      console.error(
        `[soribashi] <${config.name} ${axis}="${String(value)}"> — value is not in the declared vocabulary.\n` +
        `  Allowed: ${vocab.values.join(', ')}\n` +
        `  Declared at: theme.components.${config.name}.${axis} ` +
        `or theme.vocabulary.${axis}.\n` +
        `  To allow this value, extend the component's vocabulary:\n` +
        `    ${config.name}.extend({ vocabulary: { ${axis}: (cur) => defineVocabulary([...cur.values, '${String(value)}']) } })`,
      );
    }
  }
}
```

Resolution hierarchy at runtime:

```ts
function resolveVocabForComponent(theme, componentName, axis) {
  // 1. per-component extension override
  const entry = theme.components.find((c) => c.name === componentName);
  if (entry?.config.vocabulary?.[axis]) return entry.config.vocabulary[axis];

  // 2. global theme vocabulary
  if (theme.vocabulary[axis]) return theme.vocabulary[axis];

  // 3. soribashi internal default
  return DEFAULTS[axis];
}
```

## 11. CSS / codegen interaction

In this PR, codegen does NOT yet read `theme.vocabulary` for any emission — the size-scale CSS vars (`--font-size-xs/sm/md/lg/xl`) continue to come from `tokens.fontSize` exactly as before.

The eventual design (deferred to a future codegen pass):
- **Size scale CSS vars** — `--size-<name>-height`, `--size-<name>-padding`, `--size-<name>-font-size`, etc. would be emitted from `theme.vocabulary.size.values`.
- **Data-attribute selectors aren't generated** — they're hand-written in each recipe's `.module.css` and match the vocabulary names. If the vocabulary changes, the CSS file changes too. This is intentional: the CSS expresses how each named size *looks*, and that's recipe-specific styling, not codegen output.

**Defer**: a future codegen pass could emit a `// generated: known size values: 'compact', 'standard', 'comfortable'` doc-comment header in each `.module.css` to remind authors of the valid attribute selectors. Not in this spec.

## 12. Migration plan for the pilot app

The pilot (`apps/core-radix-pilot`) is the only consumer. Migration:

1. Add `defineVocabulary` to `@soribashi/theme`.
2. Split `semantic` → `vocabulary` + `semanticTokens` in theme types + `createTheme`.
3. Replace `withDefaults` with `extend()` on all four builders (factory, polymorphic, generic, compound).
4. Add `createSoribashiBuilders(theme)` to `@soribashi/factory` / `@soribashi/core`.
5. Update pilot's `theme.ts` to use `vocabulary` (with the default values for now — `xs/sm/md/lg/xl`, the six intents, the five variants) and `semanticTokens` for text/surface/border.
6. Create `apps/core-radix-pilot/src/builders.ts` calling `createSoribashiBuilders(theme)`.
7. Migrate Button: switch imports to `'../builders'`, drop local `Intent`/`Variant`/`Size` declarations, add `vocabularyAxes: ['size', 'intent', 'variant']`.
8. Migrate Tooltip: imports → `'../builders'`, drop local `Variant`, add `vocabularyAxes: ['variant']`. Add `Tooltip.extend({ vocabulary: { variant: defineVocabulary(['default', 'subtle']) } })` to the theme's `components` array.
9. Migrate Tabs: same shape — `vocabularyAxes: ['variant']`, `Tabs.extend({ vocabulary: { variant: defineVocabulary(['default', 'outline', 'pills']) } })`.
10. Run all tests; expect 461 + 244 + 47 unchanged.
11. Run pilot dev server; manually verify visual parity.

Codegen migrates in lockstep — every internal call site of `theme.semantic.*` is rewritten to read `theme.semanticTokens.*` (text/surface/border/accent) or `theme.vocabulary.*.values` (intent/variant). No back-compat shim; pre-1.0 hard cutover. **Size scale CSS-var emission stays where it is today** — codegen continues to read `tokens.fontSize` to emit `--font-size-xs/sm/md/lg/xl`. Section 11 describes the eventual goal of having codegen also emit `--size-<name>-*` from `theme.vocabulary.size`, but that's deferred to a future pass and is NOT in this PR.

## 13. PR rollout — handling the in-flight PR #9

PR #9 contains:
- **(KEEP)** CSS-modules migration for Tooltip/Tabs/Button (7 of the 9 commits)
- **(KEEP)** `vite-env.d.ts` for typed CSS module imports
- **(KEEP)** Button.css xs/xl size cells — these express the pilot's vocabulary, which is fine
- **(REVERT)** soribashi-side `Size`/`SizeValue`/`SizeValueWithNumber`/`Intent` exports
- **(REVERT)** Button.tsx import of `Intent`/`Size` from `@soribashi/core`
- **(REVISE)** Playbook "Shared vocabulary" subsection — drop the bare-types framing, replace with "see the vocabulary-rails spec for the new model"

**Proposed split into three PRs (sequential):**

| PR | Scope | Status |
|----|-------|--------|
| **PR #9 (revised)** | CSS modules only — revert vocabulary side, ship hygiene wins | Convert to draft, rebase, push narrowed scope |
| **PR (new) — vocabulary rails core** | `defineVocabulary`, theme rename, `extend()` replacing `withDefaults`, `createSoribashiBuilders` | New branch off main |
| **PR (new) — pilot migration** | Apply the new builders + extensions to the pilot's three recipes | Stacked on top of vocabulary rails PR |

The cleanest order to land is PR #9 narrow first (hygiene, no architectural change), then the vocabulary-rails core, then the pilot migration. Each is independently reviewable.

## 14. Risks

1. **Builder factory adds friction** — every recipe imports from a local `builders.ts` instead of `@soribashi/core`. Onboarding docs need to call this out clearly. Pilot has only 3 recipes, so the cost is small; for a larger consumer it's still one-time setup.

2. **`extend()` function form needs careful typing** — `(current: Vocabulary) => Vocabulary` looks simple but the type system needs to thread the consumer's global vocab type into `current` and back out into the consumer's extended type. Likely requires `infer` chains in the `ComponentExtendConfig` generic. Prototype this BEFORE the implementation PR and confirm types resolve in IDE.

3. **Zod adds a runtime dependency** — Zod ships ~12 KB minified. Pilot's bundle is small; this is a notable add. Mitigations: Zod tree-shakes well (only `z.enum` and `safeParse` are used here); validation is dev-only so the production bundle skips the schemas if the build tool can statically eliminate the `process.env.NODE_ENV` branch. Document this expectation.

4. **`createSoribashiBuilders` returns three values; loses individual import flexibility** — consumers can't do `import { defineComponent } from '@soribashi/core'` anymore. They have to thread through `builders.ts`. The factory return type needs to preserve TypeScript's ability to refactor individual symbols. Tested.

5. **Vocabulary registration is a side effect of `createSoribashiBuilders`** — the function registers Zod schemas with a module-level registry. If two themes are constructed in the same process (e.g., during SSR with multiple tenants), the registry needs to be either keyed by theme or per-builders-instance. Single-theme apps are unaffected; multi-theme apps need design work that's out of scope here.

6. **Backward incompatibility for the prior PR's playbook subsection** — anyone reading the playbook between when it landed and when this redesign ships will see stale "Shared vocabulary" guidance. Mitigation: ship the playbook revision as part of PR #9's narrowing.

## 15. References

- Prior spec (vocabulary side now wrong, CSS-modules side still valid): `docs/superpowers/specs/2026-05-12-library-authoring-hygiene-design.md`
- soribashi theme: `packages/theme/src/{create-theme.ts,types.ts}`
- Existing `withDefaults` pattern (to be replaced): `packages/factory/src/{define-component.tsx,define-polymorphic-component.tsx,define-compound.tsx,define-generic-component.tsx}`
- Existing `ThemeComponentEntry`: `packages/theme/src/theme-component-entry.ts`, `packages/factory/src/theme-component-entry.ts`
- Mantine reference for `extend()` pattern: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/components/Button/Button.tsx` (look for `.extend = factory({ ... })`)
- Mantine reference for `MantineThemeSizesOverride` (the augmentation pattern we're explicitly NOT using): `theme.types.ts:174-181`
- Zod: https://zod.dev — `z.enum`, `safeParse`, `z.infer`

## 16. Open questions for implementation phase

1. Does `vocabularyAxes` belong on the recipe config or implicit from `defaults`? Spec proposes explicit; alternative is implicit detection from whichever axes appear in `defaults`. Decide during implementation if the explicit form feels redundant.
2. Should `extend()` accept a callback shape `(theme) => ComponentExtendConfig` for theme-derived extensions, or always a literal config? Spec proposes literal config; revisit if a real use case appears.
3. Codegen integration — when does CSS-var emission for sizes happen? Today, the `--font-size-xs/sm/md/lg/xl` vars come from `tokens.fontSize`. After this spec, `theme.vocabulary.size` and `tokens.fontSize` may diverge (consumer declares `size: ['compact', 'standard']` but `tokens.fontSize: { xs, sm, md, lg, xl }`). Either codegen reads vocabulary keys, or the consumer keeps them aligned manually. Default to "manual alignment" for now; design auto-emission separately.

## 17. PR #11 implementation decisions (2026-05-28)

The pilot migration (PR #11) wired all three recipes to the rails. It settled two open forks and surfaced one architectural finding. The recipe-wiring portion changed only `apps/core-radix-pilot`; the type-threading folded in afterward (§18) also touched `@soribashi/theme` and `@soribashi/factory`. Package test counts held throughout at 82 / 137 / 472 / 244; the pilot grew 47 → 51 (one runtime-validation test per recipe, plus one compile-time narrowing test for Button).

1. **Variant is per-recipe (option B).** The global theme vocabulary holds only `size` + `intent`. Button, Tooltip, and Tabs each declare their own `variant` vocabulary. This is the honest expression of the "variant stays local" principle (§3); the earlier §12 framing of `variant` as a global axis that Button "owns" is superseded. Each recipe also types its `variant` prop locally from a hoisted `const variants = [...] as const` (`type Variant = (typeof variants)[number]`), which doubles as the `variants` config field — one source of truth per recipe.

2. **Type-threading — initially deferred, then folded into this PR (see §18).** The first cut of PR #11 left injected `size`/`intent` props `string`-typed and deferred compile-time narrowing to a follow-up, on the reasoning that the literal vocab types are erased at `createTheme`'s return. After review the threading was pulled into this PR instead, because string-typed `size`/`intent` is a meaningful DX gap (no autocomplete, no compile-time rejection). §18 documents the implementation. `variant` keeps compile-time narrowing throughout via its recipe-local `const variants`, independent of the threading work.

3. **Finding (now resolved, see §18) — `.extend()` vs the module cycle.** A consumer's `builders.ts` importing the theme *value* (to call `createSoribashiBuilders(theme)`), combined with the theme importing recipes to call `Recipe.extend(...)`, forms a fatal `theme → recipe → builders → theme` cycle (`builders.ts` reads `theme` at module-eval). The first cut of PR #11 dodged this with the **Record form** of `ThemeDefinition['components']`. That was wrong to treat as acceptable: `.extend()` is a required part of the authoring API. §18 resolves it properly — `builders.ts` imports the theme as a **type only** (via `makeBuilders<typeof baseTheme>()`), so no theme value is imported and the theme is free to use `Recipe.extend(...)` in its `components` array. §12 steps 8-9 are now followed as written.

## 18. Vocabulary type-threading + cycle-free `.extend()` (implemented in PR #11)

Compile-time narrowing for the global axes (`size`, `intent`) is delivered while keeping `Recipe.extend(...)` fully usable in the theme. A prototype proved the full chain narrows `<Button size="md">` to the theme's literal union and rejects out-of-vocabulary values before any package was edited.

**The bootstrap constraint.** A *single* theme object can't both be passed to the builder factory AND contain `Button.extend(...)` in its `components`, because `Button` comes from the builders, which come from the theme — a circular value dependency. So the builders thread from a **component-free** theme type, and the `.extend()` entries are composed onto the full theme separately.

**Mechanics:**

1. **`@soribashi/theme` — generic `createTheme`.** `createTheme<const V extends PartialThemeVocabulary>(def): ResolvedTheme<ResolveVocab<V>>`. `ResolveVocab<V>` fills omitted axes from the defaults at the type level while preserving declared axes' literal unions. `ResolvedTheme<V extends ThemeVocabulary = ThemeVocabulary>` gains a **default type parameter**, so all ~93 existing `(theme: ResolvedTheme)` references compile unchanged — a narrowed `ResolvedTheme<…>` is assignable to the default because each `Vocabulary<'literal'>` is assignable to `Vocabulary<string>` (the same assignment `createTheme` already performs when filling defaults).

2. **`@soribashi/factory` — `makeBuilders` + `registerTheme`, type-only theme import.** `makeBuilders<TTheme extends ResolvedTheme>()` returns the four builders typed against `TTheme` supplied as a **type argument** (no theme value). `definePolymorphicComponent` is cast to `ThemedDefinePolymorphicComponent<TTheme['vocabulary']>`, whose produced component folds `ThemedVocabularyProps<TVocab, TVocabAxes>` into its **public** props (and into the `.extend({ defaultProps })` config — Gap B). `ThemedVocabularyProps` injects only the **global** axes (`GlobalVocabularyAxis = 'size' | 'intent'`); `variant` is excluded because it is per-recipe (a global-vocab variant would intersect to `never` against Tooltip's `default|subtle`). `registerTheme(theme)` performs the runtime registry side-effect separately. Because `builders.ts` imports the theme as a **type only** (`import type { baseTheme }`), there is no theme-value import and therefore no module cycle — the theme may import recipes and use `Recipe.extend(...)` freely. `createSoribashiBuilders(theme)` remains as the combined convenience (`registerTheme` + `makeBuilders`) for setups without in-theme `.extend()`.

3. **Pilot wiring (the consumer pattern).**
   - `theme/index.ts` exports `baseTheme = createTheme(definition)` (no `components`) and `theme = createTheme({ ...definition, components: [buttonTheme, tooltipTheme, tabsTheme] })`, then calls `registerTheme(theme)`.
   - `builders.ts`: `import type { baseTheme } from './theme'; export const { ... } = makeBuilders<typeof baseTheme>()`. Threading from `baseTheme` (component-free) is what avoids the **type** cycle that `typeof theme` would create (theme → recipes → builders → theme, which collapses every dependent type to `any`).
   - Each recipe exports its `.extend()` entry (`export const buttonTheme = Button.extend({ vocabulary: { variant: defineVocabulary(variants) } })`), deriving the variant vocab from the same `variants` const that types its `variant` prop — one source of truth.
   - `Button` drops `size`/`intent` from `ButtonOwnProps` (now injected, narrowed); `variant` stays local. Compile-time tests in `Button.test.tsx` (enforced by `bun run typecheck`) assert `size`/`intent`/`variant` reject out-of-vocab values, and that `Button.extend({ defaultProps: { size } })` accepts narrowed values and rejects bad ones.

4. **Build config.** `tsconfig.base.json` sets `declaration: false`. Nothing in this repo emits `.d.ts` (every package's `types` field points at `src/index.ts`; all `tsc` runs are `--noEmit`), so `declaration: true` produced no output and only triggered spurious `TS2742` "inferred type cannot be named" errors on the new generic `createTheme` return at consumer `export const theme = …` sites.

**Scope note:** threading covers the global axes through `definePolymorphicComponent` only. Compounds (Tooltip/Tabs) use `variant` exclusively, which is already narrowed recipe-locally, so they need no threading — but they DO declare their variant vocab via `Recipe.extend(...)` for runtime validation.
