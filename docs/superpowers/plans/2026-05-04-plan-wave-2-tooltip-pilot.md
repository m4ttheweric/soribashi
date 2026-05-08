# Wave 2 — Tooltip Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `defineCompound` factory primitive (plus supporting `Slot`, `withDefaults`, surface-foreground formalization) to soribashi, and prove the API by authoring a Tooltip compound in the `core-radix-pilot` library on top of `@radix-ui/react-tooltip`.

**Architecture:** Three layers land in order. (1) `packages/theme/` extends `SemanticSurfaceValue` to support an optional formalized `foreground` and accepts an array form for `components`. (2) `packages/codegen/` emits paired `--surface-{name}-foreground` CSS vars when the object form is used. (3) `packages/factory/` ships `Slot` (substrate-agnostic asChild merge), `Component.withDefaults` (reference-keyed theme registration), and `defineCompound` (multi-part component factory generating a safe-context Provider). The pilot library then authors `Tooltip` against `@radix-ui/react-tooltip` using all of the above, mounted via a single `<Tooltip.Provider>` at the pilot's app root.

**Tech Stack:** TypeScript 5.7, React 18, Vitest 2, Playwright 1.59, `@soribashi/{core,theme,codegen,factory}` (workspace), `@radix-ui/react-tooltip` 1.x (NEW dep, pilot only), bun (package manager + script runner).

**Spec reference:** `docs/superpowers/specs/2026-05-04-wave-2-tooltip-pilot-design.md` (commit `72e69e4`).

**External references this plan reads from (READ-ONLY — do not modify):**
- `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/utils/create-safe-context/create-safe-context.tsx` — substrate primitive (11 lines, vendored verbatim)
- `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/components/Popover/` — canonical compound exemplar
- `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/components/Tabs/` — simpler 4-part compound
- `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/MantineProvider/use-props/use-props.ts` — `useProps` reference
- `/Users/matt/Documents/GitHub/assured/assured-primary/apps/adjuster/src/components/ClaimViewIslands/` ("CVI") — for ScreenReplica integration only

---

## File Map

### Created files

```
packages/factory/src/
├── create-safe-context.ts                     # vendored from Mantine, 11 lines
├── slot.tsx                                   # Slot primitive
├── slot.test.tsx
├── define-compound.tsx                        # the new factory
├── define-compound.test.tsx
└── theme-component-entry.ts                   # withDefaults return-type interface

apps/core-radix-pilot/src/recipes/Tooltip/
├── Tooltip.tsx                                # the recipe
├── Tooltip.css
└── Tooltip.test.tsx

apps/core-radix-pilot/src/pages/
└── TooltipMatrix.tsx                          # variant × side matrix

tests/browser-parity/
└── tooltip-computed-styles.spec.ts            # Playwright parity test

packages/codegen/test/
└── emit-css-surface-foreground.test.ts        # codegen unit tests

packages/theme/test/
├── semantic-surface-foreground.test.ts        # type + runtime
└── create-theme-components-array.test.ts      # array-form normalization

docs/superpowers/pilots/
└── 2026-05-04-tooltip-pilot.md                # Wave 2 journal
```

### Modified files

```
packages/theme/src/types.ts                    # SemanticSurfaceValue + ThemeDefinition.components widening
packages/theme/src/create-theme.ts             # normalize components array form
packages/codegen/src/emit-css.ts               # emit paired foreground vars
packages/factory/src/index.ts                  # export new public API
packages/factory/src/define-component.tsx      # add withDefaults method
packages/factory/src/define-polymorphic-component.tsx  # add withDefaults method
apps/core-radix-pilot/package.json             # add @radix-ui/react-tooltip dep
apps/core-radix-pilot/src/theme/index.ts       # add surface.floating
apps/core-radix-pilot/src/App.tsx              # mount <Tooltip.Provider> at root
apps/core-radix-pilot/src/main.tsx             # register TooltipMatrix route
apps/core-radix-pilot/src/pages/ScreenReplica.tsx  # add Tooltip integrations
docs/superpowers/specs/2026-04-26-core-radix-conversion-playbook.md  # § 2.2 transient overlay compound
```

### Untouched (explicit exclusion)

- Anything in `/Users/matt/Documents/GitHub/assured/assured-primary/`. Read-only reference for ScreenReplica fidelity. Wave 2 never writes there.
- `apps/playground/`. The pilot is standalone.
- `packages/blocks/`. No compound primitives needed; blocks stay pure-styled.
- Wave-1 surface tokens (`canvas`/`default`/`raised`/`sunken`/`scrim`). Stay as string-form `SemanticReference`.

---

# Phase 0 — Setup

### Task 0.1: Verify branch + clean tree

**Files:** none (verification only)

- [ ] **Step 1: Confirm current branch**

Run: `git branch --show-current`
Expected: `wave-2-tooltip-pilot`

- [ ] **Step 2: Confirm clean tree**

Run: `git status --short`
Expected: empty output

- [ ] **Step 3: Confirm spec is committed**

Run: `git log --oneline | head -5`
Expected: top commit is `72e69e4 docs(spec): Wave 2 — record OQ-8 (auto-mount Providers, rejected)` or later.

### Task 0.2: Install Radix Tooltip in pilot package

**Files:**
- Modify: `apps/core-radix-pilot/package.json`

- [ ] **Step 1: Add `@radix-ui/react-tooltip` to pilot dependencies**

Run: `bun add @radix-ui/react-tooltip --cwd apps/core-radix-pilot`
Expected: `package.json` has `"@radix-ui/react-tooltip": "^1.1.0"` (or latest 1.x) in `dependencies`. `bun.lock` updated.

- [ ] **Step 2: Verify pilot still builds**

Run: `bun run --filter @soribashi/core-radix-pilot build`
Expected: build succeeds (Tooltip not used yet, just the new dep installed).

- [ ] **Step 3: Commit**

```bash
git add apps/core-radix-pilot/package.json bun.lock
git commit -m "chore(pilot): add @radix-ui/react-tooltip dependency"
```

---

# Phase 1 — Theme types: surface foreground formalization

### Task 1.1: Extend `SemanticSurfaceValue` to support object form

**Files:**
- Modify: `packages/theme/src/types.ts`
- Test: `packages/theme/test/semantic-surface-foreground.test.ts`

- [ ] **Step 1: Write failing test for type-level acceptance**

Create `packages/theme/test/semantic-surface-foreground.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';

describe('SemanticSurfaceValue', () => {
  it('accepts string form (existing behavior)', () => {
    const theme = createTheme({
      tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)', '900': 'hsl(0 0% 10%)' } } },
      semantic: { surface: { default: 'neutral.0' } },
    });
    expect(theme.semantic.surface.default).toBe('neutral.0');
  });

  it('accepts object form with foreground', () => {
    const theme = createTheme({
      tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)', '900': 'hsl(0 0% 10%)' } } },
      semantic: { surface: { floating: { value: 'neutral.900', foreground: 'neutral.0' } } },
    });
    expect(theme.semantic.surface.floating).toEqual({ value: 'neutral.900', foreground: 'neutral.0' });
  });

  it('accepts object form without foreground (forward-compat opt-in)', () => {
    const theme = createTheme({
      tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
      semantic: { surface: { floating: { value: 'neutral.0' } } },
    });
    expect(theme.semantic.surface.floating).toEqual({ value: 'neutral.0' });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/theme test -- semantic-surface-foreground`
Expected: type errors on `floating` ("not assignable to `SemanticReference`") OR runtime failure if types are loose. Either is the failure case to address.

- [ ] **Step 3: Extend the type**

In `packages/theme/src/types.ts`, find the existing `SemanticSurfaces` interface (search for `surface?:` or `interface SemanticSurfaces`). Replace the surface value type so each surface slot accepts both forms. Add at top of the file (after existing imports):

```ts
export type SemanticSurfaceValue =
  | SemanticReference
  | { value: SemanticReference; foreground?: SemanticReference };
```

Then update the `SemanticSurfaces` interface (existing field types):

```ts
export interface SemanticSurfaces {
  canvas?:   SemanticSurfaceValue;
  default?:  SemanticSurfaceValue;
  raised?:   SemanticSurfaceValue;
  sunken?:   SemanticSurfaceValue;
  scrim?:    SemanticSurfaceValue;
  floating?: SemanticSurfaceValue;
}
```

(If the existing interface uses a different shape — e.g., a `Record<string, SemanticReference>` — change it to `Record<string, SemanticSurfaceValue>` and keep `floating` named explicitly for documentation.)

- [ ] **Step 4: Run test to verify passes**

Run: `bun run --filter @soribashi/theme test -- semantic-surface-foreground`
Expected: all 3 tests pass.

- [ ] **Step 5: Run full theme test suite**

Run: `bun run --filter @soribashi/theme test`
Expected: all tests pass (no regressions in existing surface tests).

- [ ] **Step 6: Commit**

```bash
git add packages/theme/src/types.ts packages/theme/test/semantic-surface-foreground.test.ts
git commit -m "feat(theme): SemanticSurfaceValue accepts {value, foreground?} object form"
```

### Task 1.2: Add `surface.floating` slot to `SemanticSurfaces`

**Files:** already done in Task 1.1 (the `floating?: SemanticSurfaceValue` line). This task is a sanity-check that the slot is reachable via `createTheme`.

- [ ] **Step 1: Verify `floating` slot resolved end-to-end**

Add a test to `packages/theme/test/semantic-surface-foreground.test.ts`:

```ts
it('resolves surface.floating through ResolvedTheme.semantic', () => {
  const theme = createTheme({
    tokens: {
      colors: {
        neutral: {
          '0': 'hsl(0 0% 100%)',
          '900': 'hsl(0 0% 10%)',
        },
      },
    },
    semantic: {
      surface: {
        default: 'neutral.0',
        floating: { value: 'neutral.900', foreground: 'neutral.0' },
      },
    },
  });

  expect(theme.semantic.surface).toEqual({
    default: 'neutral.0',
    floating: { value: 'neutral.900', foreground: 'neutral.0' },
  });
});
```

Run: `bun run --filter @soribashi/theme test -- semantic-surface-foreground`
Expected: 4 tests pass.

- [ ] **Step 2: Commit**

```bash
git add packages/theme/test/semantic-surface-foreground.test.ts
git commit -m "test(theme): cover surface.floating end-to-end through ResolvedTheme"
```

---

# Phase 2 — Theme: createTheme components array form

### Task 2.1: Define `ThemeComponentEntry` interface

**Files:**
- Create: `packages/factory/src/theme-component-entry.ts`

- [ ] **Step 1: Create the interface file**

```ts
// packages/factory/src/theme-component-entry.ts

/**
 * Tagged record returned by `Component.withDefaults({...})`. Consumers pass
 * an array of these to `createTheme({ components: [...] })`. The factory's
 * normalization step (in @soribashi/theme's createTheme) builds the legacy
 * `Record<string, ComponentThemeConfig>` shape from these entries internally.
 *
 * The `__soribashiThemeEntry` brand prevents accidental confusion with
 * adjacent record-form values.
 */
export interface ThemeComponentEntry<P = Record<string, unknown>> {
  readonly __soribashiThemeEntry: true;
  readonly name: string;
  readonly defaultProps: Partial<P>;
}

/** Type guard for runtime detection. */
export function isThemeComponentEntry(value: unknown): value is ThemeComponentEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { __soribashiThemeEntry?: unknown }).__soribashiThemeEntry === true
  );
}
```

- [ ] **Step 2: Export from `packages/factory/src/index.ts`**

Add to `packages/factory/src/index.ts`:

```ts
// Theme integration
export type { ThemeComponentEntry } from './theme-component-entry.ts';
export { isThemeComponentEntry } from './theme-component-entry.ts';
```

- [ ] **Step 3: Typecheck**

Run: `bun run --filter @soribashi/factory typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add packages/factory/src/theme-component-entry.ts packages/factory/src/index.ts
git commit -m "feat(factory): add ThemeComponentEntry interface + isThemeComponentEntry guard"
```

### Task 2.2: Widen `ThemeDefinition.components` to accept array form

**Files:**
- Modify: `packages/theme/src/types.ts`
- Modify: `packages/theme/src/create-theme.ts`
- Test: `packages/theme/test/create-theme-components-array.test.ts`

- [ ] **Step 1: Write failing test for array-form acceptance**

Create `packages/theme/test/create-theme-components-array.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';
import type { ThemeComponentEntry } from '@soribashi/factory';

function makeEntry<P>(name: string, defaultProps: Partial<P>): ThemeComponentEntry<P> {
  return { __soribashiThemeEntry: true as const, name, defaultProps };
}

describe('createTheme components array-form normalization', () => {
  it('accepts components as record (legacy form)', () => {
    const theme = createTheme({
      tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
      components: {
        Button: { defaultProps: { variant: 'filled' } },
      },
    });
    expect(theme.components.Button).toEqual({ defaultProps: { variant: 'filled' } });
  });

  it('accepts components as array of ThemeComponentEntry (new form)', () => {
    const theme = createTheme({
      tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
      components: [
        makeEntry('Button', { variant: 'filled' }),
        makeEntry('TooltipProvider', { delayDuration: 500 }),
      ],
    });
    expect(theme.components.Button).toEqual({ defaultProps: { variant: 'filled' } });
    expect(theme.components.TooltipProvider).toEqual({ defaultProps: { delayDuration: 500 } });
  });

  it('handles empty array', () => {
    const theme = createTheme({
      tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
      components: [],
    });
    expect(theme.components).toEqual({});
  });

  it('handles missing components field (defaults to empty record)', () => {
    const theme = createTheme({
      tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
    });
    expect(theme.components).toEqual({});
  });

  it('last-write-wins when two entries share a name', () => {
    const theme = createTheme({
      tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
      components: [
        makeEntry('Button', { variant: 'filled' }),
        makeEntry('Button', { variant: 'outline' }), // overrides above
      ],
    });
    expect(theme.components.Button).toEqual({ defaultProps: { variant: 'outline' } });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/theme test -- create-theme-components-array`
Expected: type errors on the array form ("not assignable to Record<string, ComponentThemeConfig>"). Last-write-wins test fails because record form can't express it.

- [ ] **Step 3: Widen `ThemeDefinition.components` type**

In `packages/theme/src/types.ts`, find the `ThemeDefinition` interface (search for `components?:`). Replace:

```ts
// Before:
components?: Record<string, ComponentThemeConfig>;

// After:
components?: Record<string, ComponentThemeConfig> | readonly ThemeComponentEntry[];
```

Add the import at the top of `packages/theme/src/types.ts`:

```ts
import type { ThemeComponentEntry } from '@soribashi/factory';
```

(If circular-dep risk exists, define `ThemeComponentEntry` inline in the theme package and re-export from factory. But factory→theme is a one-way dep today, so this should work — verify with typecheck.)

- [ ] **Step 4: Implement normalization in `createTheme`**

In `packages/theme/src/create-theme.ts`, find where `components` is read (search for `merged.components`). Replace the `components: merged.components ?? {}` line with a normalization call:

```ts
function normalizeComponents(
  input: ThemeDefinition['components'] | undefined,
): Record<string, ComponentThemeConfig> {
  if (input === undefined) return {};
  if (Array.isArray(input)) {
    const out: Record<string, ComponentThemeConfig> = {};
    for (const entry of input) {
      // Last-write-wins: later entries override earlier ones with the same name.
      out[entry.name] = { defaultProps: entry.defaultProps };
    }
    return out;
  }
  return input;
}

// Then in the resolved-theme assembly:
components: normalizeComponents(merged.components),
```

(Place `normalizeComponents` as a top-level helper near the top of `create-theme.ts`. Import `ComponentThemeConfig` from `./types.ts`.)

- [ ] **Step 5: Run test to verify passes**

Run: `bun run --filter @soribashi/theme test -- create-theme-components-array`
Expected: all 5 tests pass.

- [ ] **Step 6: Run full theme test suite (no regressions)**

Run: `bun run --filter @soribashi/theme test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/theme/src/types.ts packages/theme/src/create-theme.ts packages/theme/test/create-theme-components-array.test.ts
git commit -m "feat(theme): createTheme accepts components as array of ThemeComponentEntry

Normalizes both legacy record form and new array form into the
same internal Record<string, ComponentThemeConfig>. Last-write-wins
when two entries share a name. Empty array and undefined both
produce an empty resolved record."
```

---

# Phase 3 — Codegen: surface foreground emit

### Task 3.1: Detect object-form surface values in emit-css

**Files:**
- Modify: `packages/codegen/src/emit-css.ts`
- Test: `packages/codegen/test/emit-css-surface-foreground.test.ts`

- [ ] **Step 1: Write failing test for object-form emission**

Create `packages/codegen/test/emit-css-surface-foreground.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { emitCss } from '../src/emit-css.ts';

function makeFloatingTheme() {
  return createTheme({
    tokens: {
      colors: {
        neutral: {
          '0': 'hsl(0 0% 100%)',
          '900': 'hsl(0 0% 10%)',
        },
      },
    },
    semantic: {
      surface: {
        default: 'neutral.0',                                       // string form
        floating: { value: 'neutral.900', foreground: 'neutral.0' }, // object form
      },
    },
  });
}

describe('emitCss surface foreground', () => {
  it('emits string-form surface as a single var', () => {
    const css = emitCss(makeFloatingTheme());
    expect(css).toMatch(/--surface-default:\s*hsl\(0 0% 100%\)/);
  });

  it('emits object-form surface as paired vars (value + foreground)', () => {
    const css = emitCss(makeFloatingTheme());
    expect(css).toMatch(/--surface-floating:\s*hsl\(0 0% 10%\)/);
    expect(css).toMatch(/--surface-floating-foreground:\s*hsl\(0 0% 100%\)/);
  });

  it('emits object-form without foreground as value-only', () => {
    const theme = createTheme({
      tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
      semantic: { surface: { floating: { value: 'neutral.0' } } },
    });
    const css = emitCss(theme);
    expect(css).toMatch(/--surface-floating:\s*hsl\(0 0% 100%\)/);
    expect(css).not.toMatch(/--surface-floating-foreground/);
  });

  it('emits foreground pair under dark-mode selector', () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral: { '0': 'hsl(0 0% 100%)', '900': 'hsl(0 0% 10%)' } },
      },
      dark: {
        colors: { neutral: { '0': 'hsl(0 0% 5%)', '900': 'hsl(0 0% 95%)' } },
      },
      semantic: {
        surface: { floating: { value: 'neutral.900', foreground: 'neutral.0' } },
      },
      darkMode: { selector: '.dark' },
    });
    const css = emitCss(theme);
    // dark block contains both pair vars
    expect(css).toMatch(/\.dark[^{]*\{[^}]*--surface-floating:\s*hsl\(0 0% 95%\)/);
    expect(css).toMatch(/\.dark[^{]*\{[^}]*--surface-floating-foreground:\s*hsl\(0 0% 5%\)/);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/codegen test -- emit-css-surface-foreground`
Expected: tests fail because object form isn't recognized — `--surface-floating` isn't emitted at all (or is emitted as `[object Object]`).

- [ ] **Step 3: Locate the surface-emission code path**

Open `packages/codegen/src/emit-css.ts`. Search for `semantic` + `surface` to find where surface tokens are emitted. The relevant function (likely `emitSemanticLines` or similar) iterates `theme.semantic.surface` and emits one CSS line per slot.

- [ ] **Step 4: Add a helper that resolves a surface value to (varValue, foregroundValue?)**

Near the existing surface-emission helpers, add:

```ts
import type { SemanticSurfaceValue, ResolvedTheme } from '@soribashi/theme';

interface SurfacePair {
  /** CSS-resolved value for `--surface-{name}`. */
  value: string;
  /** CSS-resolved value for `--surface-{name}-foreground`, if formalized. */
  foreground?: string;
}

function resolveSurfaceValue(
  raw: SemanticSurfaceValue,
  theme: ResolvedTheme,
  resolveReference: (ref: string) => string,  // existing helper, find by usage
): SurfacePair {
  if (typeof raw === 'string') {
    return { value: resolveReference(raw) };
  }
  return {
    value: resolveReference(raw.value),
    foreground: raw.foreground ? resolveReference(raw.foreground) : undefined,
  };
}
```

(`resolveReference` is whatever helper turns `'neutral.0'` into `'hsl(0 0% 100%)'`. Locate it in the existing code by searching for how the string-form surfaces resolve today; reuse it.)

- [ ] **Step 5: Update the surface-emission loop to emit paired vars**

Find the loop that emits surface lines. Today it likely does something like:

```ts
for (const [name, ref] of Object.entries(theme.semantic.surface ?? {})) {
  lines.push(`  --surface-${name}: ${resolveReference(ref)};`);
}
```

Replace with:

```ts
for (const [name, raw] of Object.entries(theme.semantic.surface ?? {})) {
  const pair = resolveSurfaceValue(raw, theme, resolveReference);
  lines.push(`  --surface-${name}: ${pair.value};`);
  if (pair.foreground !== undefined) {
    lines.push(`  --surface-${name}-foreground: ${pair.foreground};`);
  }
}
```

Repeat the same change in the dark-mode emission block (search for `darkMode.selector` or `.dark` in the file). The dark block iterates the same surface map but resolves against `theme.dark` overrides.

- [ ] **Step 6: Run test to verify passes**

Run: `bun run --filter @soribashi/codegen test -- emit-css-surface-foreground`
Expected: all 4 tests pass.

- [ ] **Step 7: Run full codegen test suite**

Run: `bun run --filter @soribashi/codegen test`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add packages/codegen/src/emit-css.ts packages/codegen/test/emit-css-surface-foreground.test.ts
git commit -m "feat(codegen): emit paired --surface-{name}-foreground for object-form surfaces

When a semantic surface is declared as { value, foreground }, codegen
emits both --surface-{name} and --surface-{name}-foreground. Light
and dark blocks both emit the pair. String-form surfaces continue
to emit only --surface-{name} (backward compat). Object form with
foreground absent emits value only."
```

### Task 3.2: Tailwind dual-emit for foreground vars

**Files:**
- Modify: `packages/codegen/src/emit-css.ts` (or wherever the `--__hsl-` companion is generated; from Wave 1 Gap 1)

- [ ] **Step 1: Write failing test for Tailwind alpha companion**

Add to `packages/codegen/test/emit-css-surface-foreground.test.ts`:

```ts
it('emits --__hsl- companion for both value and foreground vars', () => {
  const css = emitCss(makeFloatingTheme(), { emitCompanionHsl: true });
  // Companion vars (bare HSL components for Tailwind alpha utilities)
  expect(css).toMatch(/--__hsl-surface-floating:\s*0 0% 10%/);
  expect(css).toMatch(/--__hsl-surface-floating-foreground:\s*0 0% 100%/);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/codegen test -- emit-css-surface-foreground`
Expected: companion var for `-foreground` not emitted; one assertion fails.

- [ ] **Step 3: Locate the dual-emit path**

In `packages/codegen/src/emit-css.ts`, search for `--__hsl-` or `stripHslWrapper`. The companion emission lives in the same loop that emits canonical vars; it just emits a parallel `--__hsl-` line.

- [ ] **Step 4: Extend dual-emit to cover the foreground var**

In the surface-emission loop (modified in Task 3.1), add companion emission for the foreground when present:

```ts
for (const [name, raw] of Object.entries(theme.semantic.surface ?? {})) {
  const pair = resolveSurfaceValue(raw, theme, resolveReference);
  lines.push(`  --surface-${name}: ${pair.value};`);
  if (emitCompanionHsl(opts)) {
    lines.push(`  --__hsl-surface-${name}: ${stripHslWrapper(pair.value)};`);
  }
  if (pair.foreground !== undefined) {
    lines.push(`  --surface-${name}-foreground: ${pair.foreground};`);
    if (emitCompanionHsl(opts)) {
      lines.push(`  --__hsl-surface-${name}-foreground: ${stripHslWrapper(pair.foreground)};`);
    }
  }
}
```

(`emitCompanionHsl` and `stripHslWrapper` are existing helpers from Wave 1 Gap 1's dual-emit work; locate by usage and reuse.)

- [ ] **Step 5: Run test to verify passes**

Run: `bun run --filter @soribashi/codegen test -- emit-css-surface-foreground`
Expected: all 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/emit-css.ts packages/codegen/test/emit-css-surface-foreground.test.ts
git commit -m "feat(codegen): dual-emit --__hsl- companion for surface foreground vars

Extends Wave-1 Gap-1's Tailwind alpha companion to cover the new
--surface-{name}-foreground vars. bg-surface-floating/50 and
text-surface-floating-foreground/80 now resolve correctly."
```

---

# Phase 4 — Factory: `createSafeContext` substrate

### Task 4.1: Vendor `createSafeContext` from Mantine

**Files:**
- Create: `packages/factory/src/create-safe-context.ts`
- Test: `packages/factory/src/create-safe-context.test.tsx`

- [ ] **Step 1: Create the helper file**

```ts
// packages/factory/src/create-safe-context.ts

/**
 * Vendored from Mantine v7 — see
 * /Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/utils/create-safe-context/create-safe-context.tsx
 *
 * Internal use by `defineCompound`; not exported from `@soribashi/core`'s
 * public API in Wave 2 (see spec § 3.6 + OQ-6 — promotion to public is
 * backward-compatible when first concrete need appears).
 */
import { createContext, use } from 'react';

export function createSafeContext<ContextValue>(errorMessage: string) {
  const Context = createContext<ContextValue | null>(null);

  const useSafeContext = () => {
    const ctx = use(Context);
    if (ctx === null) {
      throw new Error(errorMessage);
    }
    return ctx;
  };

  return [Context, useSafeContext] as const;
}
```

- [ ] **Step 2: Write tests**

Create `packages/factory/src/create-safe-context.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createSafeContext } from './create-safe-context.ts';

describe('createSafeContext', () => {
  it('returns a tuple of [Context, useSafeContext]', () => {
    const [Ctx, useCtx] = createSafeContext<{ foo: number }>('test');
    expect(Ctx).toBeDefined();
    expect(typeof useCtx).toBe('function');
  });

  it('throws when consumed outside the provider', () => {
    const [, useCtx] = createSafeContext<{ foo: number }>('Foo must be inside <FooProvider>');

    function Consumer() {
      useCtx();
      return null;
    }

    expect(() => render(<Consumer />)).toThrow('Foo must be inside <FooProvider>');
  });

  it('returns the value when consumed inside the provider', () => {
    const [Ctx, useCtx] = createSafeContext<{ foo: number }>('test');
    let captured: { foo: number } | null = null;

    function Consumer() {
      captured = useCtx();
      return null;
    }

    render(
      <Ctx.Provider value={{ foo: 42 }}>
        <Consumer />
      </Ctx.Provider>,
    );

    expect(captured).toEqual({ foo: 42 });
  });
});
```

- [ ] **Step 3: Run tests to verify pass**

Run: `bun run --filter @soribashi/factory test -- create-safe-context`
Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/factory/src/create-safe-context.ts packages/factory/src/create-safe-context.test.tsx
git commit -m "feat(factory): vendor createSafeContext from Mantine

11-line helper, internal substrate for defineCompound (Wave 2).
Not exported from public API — promotion deferred until a concrete
need (per spec OQ-6)."
```

---

# Phase 5 — Factory: `Slot` primitive

### Task 5.1: Implement `mergeProps` helper

**Files:**
- Create: `packages/factory/src/merge-props.ts`
- Test: `packages/factory/src/merge-props.test.ts`

- [ ] **Step 1: Write failing tests for prop merging**

Create `packages/factory/src/merge-props.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { mergeProps } from './merge-props.ts';

describe('mergeProps', () => {
  it('composes className via clsx (slot first, child overrides)', () => {
    const merged = mergeProps(
      { className: 'slot-class' },
      { className: 'child-class' },
    );
    expect(merged.className).toBe('slot-class child-class');
  });

  it('shallow-merges style; child wins on key collisions', () => {
    const merged = mergeProps(
      { style: { color: 'red', padding: 4 } },
      { style: { color: 'blue', margin: 2 } },
    );
    expect(merged.style).toEqual({ color: 'blue', padding: 4, margin: 2 });
  });

  it('composes event handlers (slot first, child second; both called)', () => {
    const slotHandler = vi.fn();
    const childHandler = vi.fn();
    const merged = mergeProps(
      { onClick: slotHandler },
      { onClick: childHandler },
    );

    const event = { type: 'click' } as unknown as React.MouseEvent;
    (merged.onClick as (e: typeof event) => void)(event);

    expect(slotHandler).toHaveBeenCalledWith(event);
    expect(childHandler).toHaveBeenCalledWith(event);
    // Order: slot before child
    const slotCallOrder = slotHandler.mock.invocationCallOrder[0];
    const childCallOrder = childHandler.mock.invocationCallOrder[0];
    expect(slotCallOrder).toBeLessThan(childCallOrder);
  });

  it('child wins on non-handler, non-className, non-style props', () => {
    const merged = mergeProps(
      { 'data-slot': 'root', 'aria-label': 'slot-label' },
      { 'data-slot': 'override', 'data-extra': 'child' },
    );
    expect(merged['data-slot']).toBe('override');
    expect(merged['data-extra']).toBe('child');
    expect(merged['aria-label']).toBe('slot-label');
  });

  it('handles undefined sides gracefully', () => {
    expect(mergeProps({}, { foo: 1 })).toEqual({ foo: 1 });
    expect(mergeProps({ foo: 1 }, {})).toEqual({ foo: 1 });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/factory test -- merge-props`
Expected: module not found.

- [ ] **Step 3: Implement `mergeProps`**

Create `packages/factory/src/merge-props.ts`:

```ts
import clsx from 'clsx';
import type { CSSProperties } from 'react';

/** Merge two prop objects per Slot semantics: className composes, style merges
 * shallowly with child winning, event handlers compose (slot first), other
 * props let child win. */
export function mergeProps(
  slotProps: Record<string, unknown>,
  childProps: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...slotProps };

  for (const key in childProps) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];

    if (key === 'className') {
      out[key] = clsx(slotValue as string | undefined, childValue as string | undefined);
    } else if (key === 'style') {
      out[key] = { ...(slotValue as CSSProperties | undefined), ...(childValue as CSSProperties | undefined) };
    } else if (
      key.startsWith('on') &&
      typeof slotValue === 'function' &&
      typeof childValue === 'function'
    ) {
      out[key] = (...args: unknown[]) => {
        (slotValue as (...a: unknown[]) => unknown)(...args);
        (childValue as (...a: unknown[]) => unknown)(...args);
      };
    } else {
      out[key] = childValue;
    }
  }

  return out;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun run --filter @soribashi/factory test -- merge-props`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/merge-props.ts packages/factory/src/merge-props.test.ts
git commit -m "feat(factory): mergeProps helper for Slot prop composition

className via clsx, style shallow-merged (child wins on collision),
event handlers composed (slot first, child second; both called),
other props let child win. Pure function — no React semantics."
```

### Task 5.2: Implement `mergeRefs` helper

**Files:**
- Create: `packages/factory/src/merge-refs.ts`
- Test: `packages/factory/src/merge-refs.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// packages/factory/src/merge-refs.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import { mergeRefs } from './merge-refs.ts';

describe('mergeRefs', () => {
  it('forwards a node to multiple ref objects', () => {
    const refA = createRef<HTMLDivElement>();
    const refB = createRef<HTMLDivElement>();
    const merged = mergeRefs(refA, refB);

    render(<div ref={merged} data-testid="el" />);

    expect(refA.current).toBeInstanceOf(HTMLElement);
    expect(refB.current).toBeInstanceOf(HTMLElement);
    expect(refA.current).toBe(refB.current);
  });

  it('forwards a node to ref callbacks', () => {
    const cbA = vi.fn();
    const cbB = vi.fn();
    const merged = mergeRefs<HTMLDivElement>(cbA, cbB);

    render(<div ref={merged} />);

    expect(cbA).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(cbB).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

  it('handles a mix of ref objects and ref callbacks', () => {
    const refObj = createRef<HTMLDivElement>();
    const refCb = vi.fn();
    const merged = mergeRefs<HTMLDivElement>(refObj, refCb);

    render(<div ref={merged} />);

    expect(refObj.current).toBeInstanceOf(HTMLElement);
    expect(refCb).toHaveBeenCalledWith(refObj.current);
  });

  it('skips null / undefined refs', () => {
    const refObj = createRef<HTMLDivElement>();
    const merged = mergeRefs<HTMLDivElement>(refObj, null, undefined);

    render(<div ref={merged} />);
    expect(refObj.current).toBeInstanceOf(HTMLElement);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/factory test -- merge-refs`
Expected: module not found.

- [ ] **Step 3: Implement `mergeRefs`**

```ts
// packages/factory/src/merge-refs.ts
import type { Ref, RefCallback } from 'react';

export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined | null>
): RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (ref === null || ref === undefined) continue;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun run --filter @soribashi/factory test -- merge-refs`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/merge-refs.ts packages/factory/src/merge-refs.test.tsx
git commit -m "feat(factory): mergeRefs helper for Slot ref composition

Forwards a node to any combination of ref objects and ref callbacks;
silently skips null/undefined entries."
```

### Task 5.3: Implement `Slot` component

**Files:**
- Create: `packages/factory/src/slot.tsx`
- Create: `packages/factory/src/slot.test.tsx`
- Modify: `packages/factory/src/index.ts`

- [ ] **Step 1: Write failing tests**

```tsx
// packages/factory/src/slot.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Slot } from './slot.tsx';

describe('Slot', () => {
  it('renders the single child element', () => {
    const { getByText } = render(
      <Slot>
        <button>Click</button>
      </Slot>,
    );
    expect(getByText('Click').tagName).toBe('BUTTON');
  });

  it('throws when given multiple children', () => {
    expect(() =>
      render(
        <Slot>
          <button>One</button>
          <button>Two</button>
        </Slot>,
      ),
    ).toThrow();
  });

  it('returns null for non-element children', () => {
    const { container } = render(<Slot>plain text</Slot>);
    expect(container.firstChild).toBeNull();
  });

  it('merges className from slot onto child', () => {
    const { getByText } = render(
      <Slot className="from-slot">
        <button className="from-child">Click</button>
      </Slot>,
    );
    expect(getByText('Click').className).toBe('from-slot from-child');
  });

  it('composes event handlers (slot first, child second)', () => {
    const slotHandler = vi.fn();
    const childHandler = vi.fn();
    const { getByText } = render(
      <Slot onClick={slotHandler}>
        <button onClick={childHandler}>Click</button>
      </Slot>,
    );
    fireEvent.click(getByText('Click'));

    expect(slotHandler).toHaveBeenCalled();
    expect(childHandler).toHaveBeenCalled();
    expect(slotHandler.mock.invocationCallOrder[0]).toBeLessThan(childHandler.mock.invocationCallOrder[0]);
  });

  it('forwards both slot ref and child ref', () => {
    const slotRef = createRef<HTMLButtonElement>();
    const childRef = createRef<HTMLButtonElement>();
    render(
      <Slot ref={slotRef}>
        <button ref={childRef}>Click</button>
      </Slot>,
    );
    expect(slotRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(childRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(slotRef.current).toBe(childRef.current);
  });

  it('passes through DOM attributes (data-*, aria-*)', () => {
    const { getByText } = render(
      <Slot data-slot="trigger" aria-label="From slot">
        <button>Click</button>
      </Slot>,
    );
    const btn = getByText('Click');
    expect(btn.getAttribute('data-slot')).toBe('trigger');
    expect(btn.getAttribute('aria-label')).toBe('From slot');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/factory test -- slot.test`
Expected: module not found.

- [ ] **Step 3: Implement `Slot`**

```tsx
// packages/factory/src/slot.tsx
import { Children, cloneElement, forwardRef, isValidElement, type ReactElement, type ReactNode, type Ref } from 'react';
import { mergeProps } from './merge-props.ts';
import { mergeRefs } from './merge-refs.ts';

export interface SlotProps {
  children?: ReactNode;
  [key: string]: unknown;
}

/**
 * Substrate-agnostic asChild slot-merging helper. Renders its single child,
 * merging the slot's props onto it: className composes, style merges shallowly
 * (child wins on collisions), event handlers compose (slot first, child second),
 * refs compose, other props let child win.
 *
 * For Radix-wrapping consumers, prefer Radix's own Slot via `asChild` on the
 * Radix part (e.g., `<RadixTooltip.Trigger asChild>`); this Slot is for parts
 * that do NOT wrap a Radix component (e.g., Tabs Wave 3 / Select Wave 4 /
 * non-Radix consumer libraries).
 */
export const Slot = forwardRef<unknown, SlotProps>(function Slot(props, forwardedRef) {
  const { children, ...slotProps } = props;

  if (!isValidElement(children)) {
    return null;
  }

  const child = Children.only(children) as ReactElement<{ ref?: Ref<unknown> }>;
  const childRef = (child as { ref?: Ref<unknown> }).ref;

  const merged = mergeProps(slotProps, child.props as Record<string, unknown>);
  if (forwardedRef !== null && forwardedRef !== undefined) {
    (merged as { ref?: Ref<unknown> }).ref = mergeRefs(forwardedRef, childRef);
  } else if (childRef) {
    (merged as { ref?: Ref<unknown> }).ref = childRef;
  }

  return cloneElement(child, merged);
});
```

- [ ] **Step 4: Export `Slot` from public API**

Add to `packages/factory/src/index.ts`:

```ts
// asChild slot-merging primitive
export { Slot } from './slot.tsx';
export type { SlotProps } from './slot.tsx';
```

- [ ] **Step 5: Run test to verify pass**

Run: `bun run --filter @soribashi/factory test -- slot.test`
Expected: 7 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/factory/src/slot.tsx packages/factory/src/slot.test.tsx packages/factory/src/index.ts
git commit -m "feat(factory): Slot — substrate-agnostic asChild slot merging

Renders its single child, merging slot props onto it via mergeProps
+ mergeRefs. Substrate-agnostic — no Radix dep. The pilot Tooltip
relies on Radix's own Slot inside <RadixTooltip.Trigger asChild>;
soribashi's Slot is for parts that don't wrap a Radix primitive."
```

---

# Phase 6 — Factory: `Component.withDefaults` method

### Task 6.1: Add `withDefaults` to `defineComponent` output

**Files:**
- Modify: `packages/factory/src/define-component.tsx`
- Test: `packages/factory/test/define-component-with-defaults.test.tsx` (or extend existing test file if present)

- [ ] **Step 1: Write failing test**

Create `packages/factory/test/define-component-with-defaults.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { defineComponent, isThemeComponentEntry } from '../src/index.ts';

describe('defineComponent .withDefaults', () => {
  const Foo = defineComponent({
    name: 'Foo',
    selectors: ['root'] as const,
    render: ({ getStyles }) => <div {...getStyles('root')} />,
  });

  it('exists as a method on the component', () => {
    expect(typeof Foo.withDefaults).toBe('function');
  });

  it('returns a tagged ThemeComponentEntry', () => {
    const entry = Foo.withDefaults({ size: 'sm' } as never);
    expect(isThemeComponentEntry(entry)).toBe(true);
  });

  it('entry carries the component name and provided defaults', () => {
    const entry = Foo.withDefaults({ size: 'sm' } as never);
    expect(entry.name).toBe('Foo');
    expect(entry.defaultProps).toEqual({ size: 'sm' });
  });

  it('does not mutate the component', () => {
    Foo.withDefaults({ a: 1 } as never);
    Foo.withDefaults({ b: 2 } as never);
    // The Foo component itself doesn't store the defaults — withDefaults is pure.
    expect(typeof Foo).toBe('object'); // forwardRef component
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/factory test -- define-component-with-defaults`
Expected: `Foo.withDefaults is not a function`.

- [ ] **Step 3: Add `withDefaults` to the factory's component output**

In `packages/factory/src/define-component.tsx`, find where the returned component has properties attached (look for `(Component as any).extend = identity`). Add:

```ts
import type { ThemeComponentEntry } from './theme-component-entry.ts';

// ... after Component.extend = identity:
(Component as any).withDefaults = <P,>(defaults: Partial<P>): ThemeComponentEntry<P> => ({
  __soribashiThemeEntry: true as const,
  name: config.name,
  defaultProps: defaults,
});
```

Update the return type to include the new method:

```ts
return Component as unknown as React.ForwardRefExoticComponent<
  TOwnProps & StylesApiProps<any> & React.RefAttributes<HTMLElement>
> & {
  extend: (cfg: any) => any;
  withProps: (...) => any;
  withDefaults: <P>(defaults: Partial<P>) => ThemeComponentEntry<P>;
  classes?: Partial<Record<TSelectors[number], string>>;
  displayName?: string;
};
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun run --filter @soribashi/factory test -- define-component-with-defaults`
Expected: 4 tests pass.

- [ ] **Step 5: Run full factory test suite**

Run: `bun run --filter @soribashi/factory test`
Expected: all tests pass (no regressions in existing `define-component` tests).

- [ ] **Step 6: Commit**

```bash
git add packages/factory/src/define-component.tsx packages/factory/test/define-component-with-defaults.test.tsx
git commit -m "feat(factory): add Component.withDefaults method on defineComponent output

Returns a ThemeComponentEntry tagged record carrying the component
name and provided defaults. Consumed by createTheme's array-form
normalization (Phase 2) — gives consumers a reference-keyed API
for theme-level component-default overrides."
```

### Task 6.2: Add `withDefaults` to `definePolymorphicComponent` output

**Files:**
- Modify: `packages/factory/src/define-polymorphic-component.tsx`
- Test: extend `packages/factory/test/define-component-with-defaults.test.tsx`

- [ ] **Step 1: Add a parallel test for the polymorphic factory**

Append to `packages/factory/test/define-component-with-defaults.test.tsx`:

```tsx
import { definePolymorphicComponent } from '../src/index.ts';

describe('definePolymorphicComponent .withDefaults', () => {
  const Bar = definePolymorphicComponent<{ tone?: 'a' | 'b' }, 'div'>({
    name: 'Bar',
    defaultElement: 'div',
    selectors: ['root'] as const,
    render: ({ Element, getStyles }) => <Element {...getStyles('root')} />,
  });

  it('exists as a method on the polymorphic component', () => {
    expect(typeof Bar.withDefaults).toBe('function');
  });

  it('returns a tagged entry with name "Bar"', () => {
    const entry = Bar.withDefaults({ tone: 'a' });
    expect(entry.name).toBe('Bar');
    expect(entry.defaultProps).toEqual({ tone: 'a' });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/factory test -- define-component-with-defaults`
Expected: `Bar.withDefaults is not a function`.

- [ ] **Step 3: Mirror the `withDefaults` attachment in the polymorphic factory**

In `packages/factory/src/define-polymorphic-component.tsx`, find the analogous spot where `extend` is attached. Add `withDefaults` with the same shape as in Task 6.1.

- [ ] **Step 4: Run test to verify pass**

Run: `bun run --filter @soribashi/factory test -- define-component-with-defaults`
Expected: 6 tests pass (4 from Task 6.1 + 2 new).

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/define-polymorphic-component.tsx packages/factory/test/define-component-with-defaults.test.tsx
git commit -m "feat(factory): add Component.withDefaults to definePolymorphicComponent output"
```

### Task 6.3: End-to-end test — `withDefaults` flows through `createTheme` → `useProps`

**Files:**
- Test: `packages/factory/test/with-defaults-e2e.test.tsx`

- [ ] **Step 1: Write the integration test**

```tsx
// packages/factory/test/with-defaults-e2e.test.tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { defineComponent, SoribashiProvider } from '../src/index.ts';

describe('withDefaults end-to-end through createTheme + useProps', () => {
  interface FooProps {
    label?: string;
    [key: string]: unknown;
  }

  const Foo = defineComponent<FooProps, readonly ['root'], readonly []>({
    name: 'Foo',
    selectors: ['root'] as const,
    defaults: { label: 'recipe-default' },
    render: ({ props, getStyles }) => <div {...getStyles('root')} data-label={(props as FooProps).label} />,
  });

  it('theme-set defaults override recipe defaults', () => {
    const theme = createTheme({
      tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
      components: [Foo.withDefaults({ label: 'theme-default' })],
    });

    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Foo />
      </SoribashiProvider>,
    );

    const el = container.querySelector('[data-label]') as HTMLElement;
    expect(el.dataset.label).toBe('theme-default');
  });

  it('instance props override theme defaults', () => {
    const theme = createTheme({
      tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
      components: [Foo.withDefaults({ label: 'theme-default' })],
    });

    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Foo label="instance-prop" />
      </SoribashiProvider>,
    );

    const el = container.querySelector('[data-label]') as HTMLElement;
    expect(el.dataset.label).toBe('instance-prop');
  });

  it('falls back to recipe defaults when theme has no override', () => {
    const theme = createTheme({
      tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
    });

    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Foo />
      </SoribashiProvider>,
    );

    const el = container.querySelector('[data-label]') as HTMLElement;
    expect(el.dataset.label).toBe('recipe-default');
  });
});
```

- [ ] **Step 2: Run test to verify pass**

Run: `bun run --filter @soribashi/factory test -- with-defaults-e2e`
Expected: 3 tests pass. (No new implementation needed — this test confirms the wiring from Phase 2 + Phase 6 already work end-to-end.)

- [ ] **Step 3: Commit**

```bash
git add packages/factory/test/with-defaults-e2e.test.tsx
git commit -m "test(factory): cover withDefaults → createTheme → useProps round-trip

Confirms recipe-default → theme-default → instance-prop precedence
flows correctly when withDefaults entries are passed to
createTheme's array form."
```

---

# Phase 7 — Factory: `defineCompound`

### Task 7.1: `defineCompound` — config + return shape (root only)

**Files:**
- Create: `packages/factory/src/define-compound.tsx`
- Create: `packages/factory/src/define-compound.test.tsx`
- Modify: `packages/factory/src/index.ts`

- [ ] **Step 1: Write failing test for the simplest case (root only, no parts)**

```tsx
// packages/factory/src/define-compound.test.tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { defineCompound, SoribashiProvider } from './index.ts';

const minimalTheme = createTheme({
  tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
});

describe('defineCompound — basic shape', () => {
  it('returns a Root component when only root part is declared', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root' },
      parts: {
        root: {
          render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div>,
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>hi</Foo>
      </SoribashiProvider>,
    );

    const el = container.querySelector('.foo-root');
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe('hi');
  });

  it('Root has displayName equal to config.name', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root' },
      parts: {
        root: { render: ({ getStyles }) => <div {...getStyles()} /> },
      },
    });
    expect(Foo.displayName).toBe('Foo');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: module not found.

- [ ] **Step 3: Implement minimum viable `defineCompound`**

Create `packages/factory/src/define-compound.tsx`:

```tsx
import { forwardRef, type ReactNode, type Ref } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { createSafeContext } from './create-safe-context.ts';
import type { ThemeComponentEntry } from './theme-component-entry.ts';
import type { GetStylesFn } from './types/render-context.ts';

interface PartRenderCtx<TProps, TSlots extends string, TCtxExtra> {
  props: TProps;
  getStyles: (opts?: { part?: TSlots }) => { className: string; style?: React.CSSProperties };
  ctx: TCtxExtra & { variant: string | undefined };
  children?: ReactNode;
  ref: Ref<unknown>;
}

interface StandardPartConfig<TProps, TSlots extends string, TCtxExtra> {
  render: (ctx: PartRenderCtx<TProps, TSlots, TCtxExtra>) => ReactNode;
  defaults?: Partial<TProps>;
}

interface PolymorphicPartConfig<TProps, TSlots extends string, TCtxExtra>
  extends StandardPartConfig<TProps, TSlots, TCtxExtra> {
  polymorphic: true;
  defaultElement: keyof JSX.IntrinsicElements;
}

type PartConfig<TProps, TSlots extends string, TCtxExtra> =
  | StandardPartConfig<TProps, TSlots, TCtxExtra>
  | PolymorphicPartConfig<TProps, TSlots, TCtxExtra>;

export interface DefineCompoundConfig<
  TRootProps extends Record<string, unknown>,
  TParts extends Record<string, PartConfig<any, any, any>>,
  TVariants extends readonly string[],
  TCtxExtra extends Record<string, unknown> = {},
> {
  name: string;
  variants?: TVariants;
  classes?: Partial<Record<string, string>>;
  defaults?: Partial<TRootProps>;
  vars?: (theme: ResolvedTheme, props: TRootProps) =>
    Partial<Record<string, Record<string, string>>>;
  context?: (rootProps: TRootProps) => TCtxExtra;
  parts: TParts & { root: PartConfig<TRootProps, string, TCtxExtra> };
}

interface CompoundContextValue<TCtxExtra> {
  variant: string | undefined;
  getStyles: GetStylesFn<any>;
  ctxExtras: TCtxExtra;
}

export function defineCompound<
  TRootProps extends Record<string, unknown>,
  TParts extends Record<string, PartConfig<any, any, any>>,
  const TVariants extends readonly string[] = readonly [],
  TCtxExtra extends Record<string, unknown> = {},
>(config: DefineCompoundConfig<TRootProps, TParts, TVariants, TCtxExtra>) {
  if (!config.parts.root) {
    throw new Error(`defineCompound("${config.name}") requires parts.root`);
  }

  // Disallow polymorphic root (per spec § 3.6).
  if ((config.parts.root as PolymorphicPartConfig<any, any, any>).polymorphic) {
    throw new Error(
      `defineCompound("${config.name}") root part cannot be polymorphic; declare polymorphism on a child part instead.`,
    );
  }

  const [ContextProvider, useCompoundContext] = createSafeContext<CompoundContextValue<TCtxExtra>>(
    `${config.name} parts must be inside <${config.name}>`,
  );

  // Build the Root component.
  const Root = forwardRef<unknown, TRootProps>(function CompoundRoot(rawProps, ref) {
    const merged = useProps<TRootProps>(
      config.name,
      (config.defaults ?? null) as Partial<TRootProps> | null,
      rawProps as TRootProps,
    );

    const getStyles = useStyles<{ props: TRootProps; stylesNames: string }>({
      name: config.name,
      classes: config.classes as Record<string, string> | undefined,
      className: (merged as { className?: string }).className,
      style: (merged as { style?: React.CSSProperties }).style,
      classNames: (merged as { classNames?: unknown }).classNames as never,
      styles: (merged as { styles?: unknown }).styles as never,
      attributes: (merged as { attributes?: unknown }).attributes as never,
      unstyled: (merged as { unstyled?: unknown }).unstyled as never,
      props: merged,
      varsResolver: config.vars
        ? ((theme, props) => config.vars!(theme, props as TRootProps) as never)
        : (() => ({}) as never),
    });

    const variant = (merged as { variant?: string }).variant;
    const ctxExtras = config.context ? config.context(merged) : ({} as TCtxExtra);
    const ctxValue: CompoundContextValue<TCtxExtra> = {
      variant,
      getStyles: getStyles as GetStylesFn<any>,
      ctxExtras,
    };

    const partGetStyles = (opts?: { part?: string }) =>
      (getStyles as (slot: string, _opts?: unknown) => { className: string }) (
        opts?.part ?? 'root',
      );

    return (
      <ContextProvider value={ctxValue}>
        {(config.parts.root.render as PartRenderCtx<TRootProps, string, TCtxExtra>['ctx'] extends infer _ ? (c: PartRenderCtx<TRootProps, string, TCtxExtra>) => ReactNode : never)({
          props: merged,
          getStyles: partGetStyles as never,
          ctx: { variant, ...ctxExtras } as TCtxExtra & { variant: string | undefined },
          children: (merged as { children?: ReactNode }).children,
          ref,
        })}
      </ContextProvider>
    );
  });

  Root.displayName = config.name;

  // Attach withDefaults
  (Root as any).withDefaults = <P,>(defaults: Partial<P>): ThemeComponentEntry<P> => ({
    __soribashiThemeEntry: true as const,
    name: config.name,
    defaultProps: defaults,
  });

  // Build non-root parts (Task 7.2 onwards). For now Root only.
  // Static-property assignment of parts comes in Task 7.2.

  return Root as unknown as typeof Root & {
    withDefaults: <P>(defaults: Partial<P>) => ThemeComponentEntry<P>;
  };
}
```

- [ ] **Step 4: Export `defineCompound`**

Add to `packages/factory/src/index.ts`:

```ts
export { defineCompound } from './define-compound.tsx';
export type { DefineCompoundConfig } from './define-compound.tsx';
```

- [ ] **Step 5: Run test to verify pass**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/factory/src/define-compound.tsx packages/factory/src/define-compound.test.tsx packages/factory/src/index.ts
git commit -m "feat(factory): defineCompound — root-only minimum viable shape

Generates a safe-context Provider via createSafeContext, wraps
the Root part's render in it, and binds getStyles to the part's
slot. Non-root parts come in subsequent tasks. Root cannot be
polymorphic — runtime check, since the polymorphic flag conflates
with context creation."
```

### Task 7.2: `defineCompound` — non-root parts

**Files:**
- Modify: `packages/factory/src/define-compound.tsx`
- Modify: `packages/factory/src/define-compound.test.tsx`

- [ ] **Step 1: Add tests for parts attached as static properties**

Append to `packages/factory/src/define-compound.test.tsx`:

```tsx
describe('defineCompound — multi-part', () => {
  const Foo = defineCompound({
    name: 'Foo',
    classes: { root: 'foo-root', label: 'foo-label' },
    parts: {
      root: {
        render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div>,
      },
      label: {
        render: ({ getStyles, children }) => <span {...getStyles()}>{children}</span>,
      },
    },
  });

  it('attaches non-root parts as static properties', () => {
    expect(Foo.Label).toBeDefined();
  });

  it('renders parts inside Root reading from the safe-context', () => {
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Label>hi</Foo.Label>
        </Foo>
      </SoribashiProvider>,
    );

    const root = container.querySelector('.foo-root') as HTMLElement;
    const label = container.querySelector('.foo-label') as HTMLElement;
    expect(root).not.toBeNull();
    expect(label).not.toBeNull();
    expect(label.textContent).toBe('hi');
  });

  it('throws when a part is rendered outside Root', () => {
    expect(() =>
      render(
        <SoribashiProvider theme={minimalTheme}>
          <Foo.Label>oops</Foo.Label>
        </SoribashiProvider>,
      ),
    ).toThrow(/Foo parts must be inside <Foo>/);
  });

  it('part name on the namespace is capitalized from config key', () => {
    // parts.label → Foo.Label (capitalize first letter)
    expect((Foo as any).Label).toBeDefined();
    expect((Foo as any).label).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: `Foo.Label is not defined`.

- [ ] **Step 3: Implement non-root parts inside `defineCompound`**

In `packages/factory/src/define-compound.tsx`, after the `Root` definition (and before the return), add:

```ts
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const namespacedParts: Record<string, React.ForwardRefExoticComponent<any>> = {};

for (const [partKey, partConfig] of Object.entries(config.parts)) {
  if (partKey === 'root') continue;

  const partName = `${config.name}${capitalize(partKey)}`;

  const PartComponent = forwardRef<unknown, any>(function CompoundPart(rawProps, ref) {
    const compoundCtx = useCompoundContext();
    const merged = useProps<any>(
      partName,
      (partConfig.defaults ?? null) as Partial<any> | null,
      rawProps,
    );

    const partGetStyles = (opts?: { part?: string }) =>
      (compoundCtx.getStyles as (slot: string, _opts?: unknown) => { className: string }) (
        opts?.part ?? partKey,
      );

    return (partConfig.render as (c: PartRenderCtx<any, string, TCtxExtra>) => ReactNode)({
      props: merged,
      getStyles: partGetStyles as never,
      ctx: {
        variant: compoundCtx.variant,
        ...compoundCtx.ctxExtras,
      } as TCtxExtra & { variant: string | undefined },
      children: (merged as { children?: ReactNode }).children,
      ref,
    });
  });

  PartComponent.displayName = partName;

  // withDefaults on the part
  (PartComponent as any).withDefaults = <P,>(defaults: Partial<P>): ThemeComponentEntry<P> => ({
    __soribashiThemeEntry: true as const,
    name: partName,
    defaultProps: defaults,
  });

  namespacedParts[capitalize(partKey)] = PartComponent;
}

Object.assign(Root as object, namespacedParts);
```

Update the return type to include parts (use a generic-mapped type):

```ts
type PartsNamespace<TParts extends Record<string, unknown>> = {
  [K in Exclude<keyof TParts, 'root'> as Capitalize<K & string>]:
    React.ForwardRefExoticComponent<any> & {
      withDefaults: <P>(defaults: Partial<P>) => ThemeComponentEntry<P>;
    };
};

return Root as unknown as typeof Root & PartsNamespace<TParts> & {
  withDefaults: <P>(defaults: Partial<P>) => ThemeComponentEntry<P>;
};
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/define-compound.tsx packages/factory/src/define-compound.test.tsx
git commit -m "feat(factory): defineCompound — non-root parts as namespaced components

Each non-root part is built as a forwardRef component that reads
from the compound's safe-context (throws with named error if rendered
outside Root). Parts register internally under flat names like
TooltipProvider, TooltipContent (matches Mantine convention). Each
part also gets its own .withDefaults method for theme registration."
```

### Task 7.3: `defineCompound` — context() callback receives merged props and may call hooks

**Files:**
- Modify: `packages/factory/src/define-compound.test.tsx`

- [ ] **Step 1: Add tests for `context()`**

Append:

```tsx
describe('defineCompound — context()', () => {
  it('context() receives merged props (post-useProps)', () => {
    let captured: { side?: string } | null = null;

    const Foo = defineCompound({
      name: 'Foo',
      defaults: { side: 'top' },
      classes: { root: 'foo-root', child: 'foo-child' },
      context: (rootProps: any) => {
        captured = { side: rootProps.side };
        return { side: rootProps.side };
      },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        child: { render: ({ ctx }) => <span data-side={(ctx as any).side} /> },
      },
    });

    render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Child />
        </Foo>
      </SoribashiProvider>,
    );

    expect(captured).toEqual({ side: 'top' }); // recipe-default applied
  });

  it('context() output flows to part.ctx', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', child: 'foo-child' },
      context: () => ({ customField: 'from-context' }),
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        child: {
          render: ({ ctx }) => <span data-custom={(ctx as any).customField} />,
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Child />
        </Foo>
      </SoribashiProvider>,
    );

    const el = container.querySelector('[data-custom]') as HTMLElement;
    expect(el.dataset.custom).toBe('from-context');
  });

  it('context() can call React hooks (useId)', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', child: 'foo-child' },
      context: () => {
        // useId is a React hook — runs inside Root's render.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const id = (require('react') as typeof import('react')).useId();
        return { id };
      },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        child: { render: ({ ctx }) => <span data-id={(ctx as any).id} /> },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Child />
        </Foo>
      </SoribashiProvider>,
    );

    const el = container.querySelector('[data-id]') as HTMLElement;
    expect(el.dataset.id).toMatch(/^:r/); // useId-style identifier
  });
});
```

- [ ] **Step 2: Run test to verify pass**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: 9 tests pass. The hook test passes if `context()` is invoked inside Root's forwardRef render (it already is, per Task 7.1's implementation).

- [ ] **Step 3: Commit**

```bash
git add packages/factory/src/define-compound.test.tsx
git commit -m "test(factory): cover context() merged-props + hook-callable behavior"
```

### Task 7.4: `defineCompound` — `vars` resolver lands as inline custom properties

**Files:**
- Modify: `packages/factory/src/define-compound.test.tsx`

- [ ] **Step 1: Add test for `vars`**

Append:

```tsx
describe('defineCompound — vars resolver', () => {
  it('vars output lands as inline CSS custom properties on the right slot', () => {
    const Foo = defineCompound({
      name: 'Foo',
      variants: ['default', 'inverted'] as const,
      classes: { root: 'foo-root', child: 'foo-child' },
      defaults: { variant: 'default' },
      vars: (_theme, props: any) => ({
        child: {
          '--foo-bg': props.variant === 'inverted' ? 'black' : 'white',
        },
      }),
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        child: { render: ({ getStyles }) => <span {...getStyles()} /> },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo variant="inverted">
          <Foo.Child />
        </Foo>
      </SoribashiProvider>,
    );

    const child = container.querySelector('.foo-child') as HTMLElement;
    expect(child.style.getPropertyValue('--foo-bg')).toBe('black');
  });
});
```

- [ ] **Step 2: Run test**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: 10 tests pass.

If failing — the `useStyles` machinery's vars resolution is reaching Root but not propagating the per-slot inline style to `getStyles('child')`. Fix in `define-compound.tsx`: ensure `partGetStyles` reads the same `getStyles` reference (which has access to the full `vars()` resolution) — the part-name binding only changes the className lookup, not the style lookup.

- [ ] **Step 3: Commit**

```bash
git add packages/factory/src/define-compound.test.tsx
git commit -m "test(factory): vars resolver output lands on the correct part slot"
```

### Task 7.5: `defineCompound` — sibling-slot getStyles

**Files:**
- Modify: `packages/factory/src/define-compound.test.tsx`

- [ ] **Step 1: Add test**

Append:

```tsx
it('getStyles({ part: "sibling" }) resolves to sibling slot class', () => {
  const Foo = defineCompound({
    name: 'Foo',
    classes: { root: 'foo-root', main: 'foo-main', arrow: 'foo-arrow' },
    parts: {
      root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
      main: {
        render: ({ getStyles }) => (
          <div {...getStyles()}>
            <span {...getStyles({ part: 'arrow' })} data-testid="arrow-inside-main" />
          </div>
        ),
      },
    },
  });

  const { container } = render(
    <SoribashiProvider theme={minimalTheme}>
      <Foo>
        <Foo.Main />
      </Foo>
    </SoribashiProvider>,
  );

  const arrow = container.querySelector('[data-testid="arrow-inside-main"]') as HTMLElement;
  expect(arrow.className).toBe('foo-arrow');
});
```

- [ ] **Step 2: Run test**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: 11 tests pass. (Already supported by Task 7.2's `partGetStyles` using `opts?.part ?? partKey`.)

- [ ] **Step 3: Commit**

```bash
git add packages/factory/src/define-compound.test.tsx
git commit -m "test(factory): getStyles({part}) targets sibling slots correctly"
```

### Task 7.6: `defineCompound` — passthrough part with no ctx consumption

**Files:**
- Modify: `packages/factory/src/define-compound.test.tsx`

- [ ] **Step 1: Add test for class-3 (passthrough) part**

Append:

```tsx
describe('defineCompound — passthrough parts', () => {
  it('a part that does NOT consume ctx renders fine outside Root', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        provider: {
          render: ({ children }) => <section data-provider>{children}</section>,
        },
      },
    });

    // Render Foo.Provider OUTSIDE any Foo Root — should not throw because
    // its render doesn't touch ctx.
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo.Provider>content</Foo.Provider>
      </SoribashiProvider>,
    );

    expect(container.querySelector('[data-provider]')?.textContent).toBe('content');
  });
});
```

- [ ] **Step 2: Run test**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: 12 tests pass. The passthrough behavior comes for free: the `ctx` parameter is computed but not consumed by the render callback.

Wait — actually the issue: in Task 7.2's implementation, every part calls `useCompoundContext()` (which throws when outside Root). Even a passthrough part would throw because the factory always reads from context.

We need to fix this. Options:
- (a) Wrap the `useCompoundContext()` call in a `try / catch` and pass `null` ctx if outside Root.
- (b) Use a non-throwing context read (raw `useContext`) and conditionally throw only if the render reads `ctx.getStyles`.
- (c) Detect at config time which parts use `ctx` and only wire safe-context for those.

Option (b) is the cleanest. Update the part component to use the raw context (not safe-context):

```ts
import { use } from 'react';
// ... in PartComponent's body, replace useCompoundContext() with:
const compoundCtx = use(CompoundContext); // null if outside Root, doesn't throw
```

But then if a context-consuming part is rendered outside Root, `compoundCtx` is `null`, and `compoundCtx.getStyles` throws an unhelpful TypeError. We want the named error.

Better: throw on access to `compoundCtx.getStyles` etc. — wrap the value in a Proxy that throws on any property read when null.

Simplest: use the safe-context's hook for context-consuming parts, raw for passthrough. But that requires knowing in advance.

Cleanest practical: use raw `useContext(CompoundContext)` in parts; if `ctx` is null AND the render tries to call `getStyles`, surface the safe-context error message there. `partGetStyles` becomes:

```ts
const partGetStyles = (opts?: { part?: string }) => {
  if (compoundCtx === null) {
    throw new Error(`${config.name}.${capitalize(partKey)} must be inside <${config.name}>`);
  }
  return (compoundCtx.getStyles as (slot: string) => { className: string })(
    opts?.part ?? partKey,
  );
};
```

`ctx` itself becomes `null` when outside Root. Render callbacks that don't read `ctx` (passthrough parts) work fine; render callbacks that DO read ctx will hit a null-deref runtime error (less friendly than the safe-context throw, but only for misuse).

To keep the named error, we can wrap `ctx` in a Proxy when null:

```ts
function makeNullCtxProxy(name: string, partKey: string): unknown {
  return new Proxy({}, {
    get() {
      throw new Error(`<${name}.${capitalize(partKey)}> must be inside <${name}>`);
    },
  });
}

// In the part render:
const ctxToPass = compoundCtx === null
  ? makeNullCtxProxy(config.name, partKey)
  : { variant: compoundCtx.variant, ...compoundCtx.ctxExtras };
```

This keeps passthrough parts working (they don't access ctx) and surfaces the correct error for context-consumers.

- [ ] **Step 3: Update `define-compound.tsx` to support passthrough**

In `packages/factory/src/define-compound.tsx`:

1. Capture the raw `Context` from `createSafeContext` (the first tuple element); use `useContext` on it directly inside parts:

```ts
import { useContext } from 'react';

// when destructuring:
const [ContextProvider, useCompoundContext] = createSafeContext<...>(...);

// Note: createSafeContext's first element is actually the Context itself
// (not a separate Provider component). We use it as Provider AND read raw via useContext.
const CompoundContext = ContextProvider; // alias for clarity

// In each part:
const rawCtx = useContext(CompoundContext);
```

2. Replace `useCompoundContext()` in part bodies with `useContext(CompoundContext)`.

3. Add the proxy-based null handling for `ctx`:

```ts
function makeNullCtxProxy(compoundName: string, partKey: string) {
  return new Proxy({} as Record<string, unknown>, {
    get(_target, prop) {
      throw new Error(
        `<${compoundName}.${capitalize(partKey)}> must be inside <${compoundName}>`,
      );
    },
  });
}

// ... in the part component:
const ctxToPass = rawCtx === null
  ? makeNullCtxProxy(config.name, partKey)
  : { variant: rawCtx.variant, ...rawCtx.ctxExtras };

const partGetStyles = (opts?: { part?: string }) => {
  if (rawCtx === null) {
    throw new Error(`<${config.name}.${capitalize(partKey)}> must be inside <${config.name}>`);
  }
  return (rawCtx.getStyles as (slot: string) => { className: string })(
    opts?.part ?? partKey,
  );
};
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: 12 tests pass — passthrough works AND the existing throw-outside-Root test still passes (because the throw test uses `<Foo.Label>` whose render calls `getStyles()` → triggers the throw).

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/define-compound.tsx packages/factory/src/define-compound.test.tsx
git commit -m "feat(factory): defineCompound supports passthrough (class-3) parts

Parts whose render does NOT consume ctx render fine outside Root.
Parts that DO consume ctx throw with the named error from the
safe-context. Implementation: read context via raw useContext
(null when outside Root); wrap ctx in a Proxy that throws on
property access when null, so the named error surfaces only
for actual context consumption."
```

### Task 7.7: `defineCompound` — polymorphic parts

**Files:**
- Modify: `packages/factory/src/define-compound.tsx`
- Modify: `packages/factory/src/define-compound.test.tsx`

- [ ] **Step 1: Add tests for polymorphic parts**

Append:

```tsx
describe('defineCompound — polymorphic parts', () => {
  const Foo = defineCompound({
    name: 'Foo',
    classes: { root: 'foo-root', trigger: 'foo-trigger' },
    parts: {
      root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
      trigger: {
        polymorphic: true,
        defaultElement: 'button',
        render: ({ Element, getStyles, props, ref }: any) => (
          <Element {...getStyles()} {...props} ref={ref} />
        ),
      },
    },
  });

  it('renders the default element when `as` is not provided', () => {
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Trigger>click</Foo.Trigger>
        </Foo>
      </SoribashiProvider>,
    );
    const trigger = container.querySelector('.foo-trigger');
    expect(trigger?.tagName).toBe('BUTTON');
  });

  it('renders the polymorphic element when `as` is provided', () => {
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Trigger as="a" href="/x">link</Foo.Trigger>
        </Foo>
      </SoribashiProvider>,
    );
    const trigger = container.querySelector('.foo-trigger');
    expect(trigger?.tagName).toBe('A');
    expect(trigger?.getAttribute('href')).toBe('/x');
  });

  it('forwards refs through polymorphic parts', () => {
    const ref = (() => { const r = (require('react') as typeof import('react')).createRef<HTMLButtonElement>(); return r; })();
    render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Trigger ref={ref}>click</Foo.Trigger>
        </Foo>
      </SoribashiProvider>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: tests fail because the part doesn't yet receive `Element` or honor `as`.

- [ ] **Step 3: Update part-component generation to handle polymorphic config**

In `packages/factory/src/define-compound.tsx`, where parts are built (the loop after Task 7.2), branch based on `partConfig.polymorphic`:

```ts
const isPolymorphic = (partConfig as PolymorphicPartConfig<any, any, any>).polymorphic === true;

if (isPolymorphic) {
  const PartComponent = forwardRef<unknown, any>(function PolymorphicCompoundPart(rawProps, ref) {
    const rawCtx = useContext(CompoundContext);
    const merged = useProps<any>(partName, partConfig.defaults ?? null, rawProps);

    const { as: asProp, ...rest } = merged as { as?: keyof JSX.IntrinsicElements; [key: string]: unknown };
    const Element = (asProp ?? (partConfig as PolymorphicPartConfig<any, any, any>).defaultElement) as keyof JSX.IntrinsicElements;

    // ...same partGetStyles + ctxToPass setup as standard parts...
    const partGetStyles = (opts?: { part?: string }) => {
      if (rawCtx === null) throw new Error(/* ... */);
      return (rawCtx.getStyles as (slot: string) => { className: string })(opts?.part ?? partKey);
    };
    const ctxToPass = rawCtx === null
      ? makeNullCtxProxy(config.name, partKey)
      : { variant: rawCtx.variant, ...rawCtx.ctxExtras };

    return (partConfig.render as (c: any) => ReactNode)({
      Element,
      props: rest,
      getStyles: partGetStyles,
      ctx: ctxToPass,
      children: (rest as { children?: ReactNode }).children,
      ref,
    });
  });

  PartComponent.displayName = partName;
  (PartComponent as any).withDefaults = /* same as before */;
  namespacedParts[capitalize(partKey)] = PartComponent;
  continue;
}
// (else: existing standard-part path)
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: 15 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/define-compound.tsx packages/factory/src/define-compound.test.tsx
git commit -m "feat(factory): defineCompound supports polymorphic parts

Parts marked { polymorphic: true, defaultElement } receive Element
in their render context. The 'as' prop overrides the default element.
Refs forward through. Implementation mirrors definePolymorphicComponent
but without going through that function (parts have their own
context-reading machinery)."
```

### Task 7.8: `defineCompound` — `withDefaults` on parts

**Files:**
- Modify: `packages/factory/src/define-compound.test.tsx`

- [ ] **Step 1: Add test that part-level withDefaults uses the flat name**

Append:

```tsx
it('part .withDefaults uses the flat name (e.g., FooLabel)', () => {
  const Foo = defineCompound({
    name: 'Foo',
    classes: { root: 'foo-root', label: 'foo-label' },
    parts: {
      root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
      label: { render: ({ getStyles }) => <span {...getStyles()} /> },
    },
  });

  const entry = (Foo as any).Label.withDefaults({ truncate: true });
  expect(entry.__soribashiThemeEntry).toBe(true);
  expect(entry.name).toBe('FooLabel');
  expect(entry.defaultProps).toEqual({ truncate: true });
});

it('part-level withDefaults flows through createTheme + useProps', () => {
  let captured: { truncate?: boolean } | null = null;

  const Foo = defineCompound({
    name: 'Foo',
    classes: { root: 'foo-root', label: 'foo-label' },
    parts: {
      root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
      label: {
        render: ({ getStyles, props }: any) => {
          captured = { truncate: props.truncate };
          return <span {...getStyles()} />;
        },
      },
    },
  });

  const theme = createTheme({
    tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
    components: [(Foo as any).Label.withDefaults({ truncate: true })],
  });

  render(
    <SoribashiProvider theme={theme}>
      <Foo>
        <Foo.Label />
      </Foo>
    </SoribashiProvider>,
  );

  expect(captured).toEqual({ truncate: true });
});
```

- [ ] **Step 2: Run test**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: 17 tests pass. (Already wired by Task 7.2's part-component generation.)

- [ ] **Step 3: Commit**

```bash
git add packages/factory/src/define-compound.test.tsx
git commit -m "test(factory): part-level withDefaults round-trips through createTheme"
```

### Task 7.9: `defineCompound` — guard against polymorphic root + missing root

**Files:**
- Modify: `packages/factory/src/define-compound.test.tsx`

- [ ] **Step 1: Add tests for guards**

Append:

```tsx
describe('defineCompound — config guards', () => {
  it('throws when parts.root is missing', () => {
    expect(() =>
      defineCompound({
        name: 'NoRoot',
        classes: {},
        parts: { foo: { render: () => null } } as any,
      }),
    ).toThrow(/requires parts.root/);
  });

  it('throws when parts.root is polymorphic', () => {
    expect(() =>
      defineCompound({
        name: 'PolyRoot',
        classes: { root: 'poly' },
        parts: {
          root: {
            polymorphic: true,
            defaultElement: 'div',
            render: () => null,
          },
        } as any,
      }),
    ).toThrow(/root part cannot be polymorphic/);
  });
});
```

- [ ] **Step 2: Run test**

Run: `bun run --filter @soribashi/factory test -- define-compound`
Expected: 19 tests pass. (Already implemented in Task 7.1.)

- [ ] **Step 3: Commit**

```bash
git add packages/factory/src/define-compound.test.tsx
git commit -m "test(factory): defineCompound guards (missing root, polymorphic root)"
```

### Task 7.10: Run full factory + theme test suite

- [ ] **Step 1: Full test runs**

Run: `bun run --filter @soribashi/factory test && bun run --filter @soribashi/theme test && bun run --filter @soribashi/codegen test`
Expected: all green.

- [ ] **Step 2: Typecheck all packages**

Run: `bun run --filter '@soribashi/*' typecheck`
Expected: clean.

- [ ] **Step 3: No commit needed; checkpoint only.**

---

# Phase 8 — Pilot: Tooltip recipe

### Task 8.1: Add `surface.floating` to pilot theme

**Files:**
- Modify: `apps/core-radix-pilot/src/theme/index.ts`

- [ ] **Step 1: Locate `semantic.surface` in the pilot theme**

Open `apps/core-radix-pilot/src/theme/index.ts`. Find the `semantic.surface` block (search for `surface:`).

- [ ] **Step 2: Add `floating` slot**

Add `floating: { value: 'neutral.900', foreground: 'neutral.0' }` to the surface block:

```ts
semantic: {
  surface: {
    canvas: 'neutral.50',
    default: 'neutral.0',
    raised: 'neutral.0',
    sunken: 'neutral.100',
    scrim: 'neutral.950',
    floating: { value: 'neutral.900', foreground: 'neutral.0' }, // NEW — Wave 2 formalized pairing
  },
  // ...
}
```

(If the existing theme structure differs slightly, adapt — the key change is adding the new `floating` entry in object form.)

- [ ] **Step 3: Run codegen for the pilot**

Run: `bun run codegen:pilot`
Expected: `apps/core-radix-pilot/src/generated/theme.css` updated. Inspect to confirm both `--surface-floating` and `--surface-floating-foreground` are emitted (search for them in the file).

- [ ] **Step 4: Verify in browser**

Run: `bun run dev:pilot` (background)
Open `http://localhost:5174` and use DevTools to inspect computed styles on `:root` — confirm both vars are present.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add apps/core-radix-pilot/src/theme/index.ts apps/core-radix-pilot/src/generated/theme.css
git commit -m "feat(pilot): add surface.floating with formalized foreground pairing

Object form { value: 'neutral.900', foreground: 'neutral.0' }
exercises Wave 2's gradual formalization. Codegen emits both
--surface-floating and --surface-floating-foreground; CVI's
integration project may later override to a non-inverted value."
```

### Task 8.2: Tooltip recipe — initial structure (red)

**Files:**
- Create: `apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.tsx`
- Create: `apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.css`
- Create: `apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.test.tsx`

- [ ] **Step 1: Write a failing test for basic render**

Create `apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SoribashiProvider } from '@soribashi/core';
import { theme } from '../../theme/index.ts';
import { Tooltip } from './Tooltip.tsx';

function withProviders(node: React.ReactNode) {
  return (
    <SoribashiProvider theme={theme}>
      <Tooltip.Provider>
        {node}
      </Tooltip.Provider>
    </SoribashiProvider>
  );
}

describe('Tooltip recipe', () => {
  it('renders trigger; content is hidden until hover', () => {
    render(
      withProviders(
        <Tooltip>
          <Tooltip.Trigger asChild>
            <button>trigger</button>
          </Tooltip.Trigger>
          <Tooltip.Content>tooltip content</Tooltip.Content>
        </Tooltip>,
      ),
    );

    expect(screen.getByText('trigger')).toBeInTheDocument();
    expect(screen.queryByText('tooltip content')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run --filter @soribashi/core-radix-pilot test -- Tooltip`
Expected: module not found for `Tooltip.tsx`.

- [ ] **Step 3: Implement Tooltip recipe**

Create `apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.tsx`:

```tsx
import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { defineCompound } from '@soribashi/core';
import './Tooltip.css';

type Variant = 'default' | 'inverted';
type Side = 'top' | 'right' | 'bottom' | 'left';

interface TooltipRootProps {
  variant?: Variant;
  side?: Side;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

interface TooltipProviderProps {
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
  children?: ReactNode;
}

interface TooltipTriggerProps {
  asChild?: boolean;
  children?: ReactNode;
}

interface TooltipContentProps {
  withArrow?: boolean;
  sideOffset?: number;
  children?: ReactNode;
}

interface TooltipCtxExtras {
  side: Side;
  sideOffset: number;
}

export const Tooltip = defineCompound<
  TooltipRootProps,
  Record<string, unknown>,
  readonly ['default', 'inverted'],
  TooltipCtxExtras
>({
  name: 'Tooltip',
  variants: ['default', 'inverted'] as const,
  classes: {
    root: 'cr-Tooltip-root',
    trigger: 'cr-Tooltip-trigger',
    content: 'cr-Tooltip-content',
    arrow: 'cr-Tooltip-arrow',
  },
  defaults: { variant: 'default', side: 'top' } as Partial<TooltipRootProps>,
  vars: (_theme, props) => ({
    content: {
      '--cr-tooltip-bg':
        props.variant === 'inverted' ? 'var(--surface-floating)' : 'var(--surface-default)',
      '--cr-tooltip-color':
        props.variant === 'inverted' ? 'var(--surface-floating-foreground)' : 'var(--text-default)',
    },
  }),
  context: (rootProps) => ({
    side: rootProps.side ?? 'top',
    sideOffset: 4,
  }),
  parts: {
    provider: {
      render: ({ props, children }) => (
        <RadixTooltip.Provider
          delayDuration={(props as TooltipProviderProps).delayDuration}
          skipDelayDuration={(props as TooltipProviderProps).skipDelayDuration}
          disableHoverableContent={(props as TooltipProviderProps).disableHoverableContent}
        >
          {children}
        </RadixTooltip.Provider>
      ),
    },
    root: {
      render: ({ props, children }) => (
        <RadixTooltip.Root
          defaultOpen={(props as TooltipRootProps).defaultOpen}
          open={(props as TooltipRootProps).open}
          onOpenChange={(props as TooltipRootProps).onOpenChange}
        >
          {children}
        </RadixTooltip.Root>
      ),
    },
    trigger: {
      render: ({ getStyles, props }) => (
        <RadixTooltip.Trigger asChild={(props as TooltipTriggerProps).asChild} {...getStyles()}>
          {(props as TooltipTriggerProps).children}
        </RadixTooltip.Trigger>
      ),
    },
    content: {
      render: ({ getStyles, props, ctx, children }) => (
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={ctx.side}
            sideOffset={(props as TooltipContentProps).sideOffset ?? ctx.sideOffset}
            {...getStyles()}
          >
            {children}
            {(props as TooltipContentProps).withArrow !== false && (
              <RadixTooltip.Arrow {...getStyles({ part: 'arrow' })} />
            )}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      ),
    },
  },
});
```

Create `apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.css`:

```css
.cr-Tooltip-content {
  background: var(--cr-tooltip-bg);
  color: var(--cr-tooltip-color);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md, 6px);
  font-size: var(--font-size-sm, 0.875rem);
  line-height: 1.4;
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  animation: cr-Tooltip-fadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 50;
  max-width: 18rem;
}

.cr-Tooltip-arrow {
  fill: var(--cr-tooltip-bg);
}

@keyframes cr-Tooltip-fadeIn {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun run --filter @soribashi/core-radix-pilot test -- Tooltip`
Expected: test passes.

- [ ] **Step 5: Commit**

```bash
git add apps/core-radix-pilot/src/recipes/Tooltip/
git commit -m "feat(pilot): Tooltip recipe wraps @radix-ui/react-tooltip via defineCompound

Four parts: Provider (passthrough), Root (creates safe-context),
Trigger (asChild forwards to Radix), Content (Portal + Content +
optional Arrow). variant=inverted uses surface.floating's
formalized foreground for guaranteed contrast."
```

### Task 8.3: Tooltip — open lifecycle test

**Files:**
- Modify: `apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.test.tsx`

- [ ] **Step 1: Add hover-open + escape-close test**

Append to `Tooltip.test.tsx`:

```tsx
import { userEvent } from '@testing-library/user-event';

it('opens on hover and closes on escape', async () => {
  const user = userEvent.setup();
  render(
    withProviders(
      <Tooltip delayDuration={0}>
        <Tooltip.Trigger asChild>
          <button>trigger</button>
        </Tooltip.Trigger>
        <Tooltip.Content>tooltip content</Tooltip.Content>
      </Tooltip>,
    ),
  );

  await user.hover(screen.getByText('trigger'));
  expect(await screen.findByText('tooltip content')).toBeInTheDocument();

  await user.keyboard('{Escape}');
  expect(screen.queryByText('tooltip content')).not.toBeInTheDocument();
});
```

NOTE: `delayDuration` is on the Provider in our recipe. Adjust the test to set it via the provider:

```tsx
function withProvidersFastDelay(node: React.ReactNode) {
  return (
    <SoribashiProvider theme={theme}>
      <Tooltip.Provider delayDuration={0}>
        {node}
      </Tooltip.Provider>
    </SoribashiProvider>
  );
}
```

Use `withProvidersFastDelay` in the new test.

- [ ] **Step 2: Run test**

Run: `bun run --filter @soribashi/core-radix-pilot test -- Tooltip`
Expected: tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.test.tsx
git commit -m "test(pilot): Tooltip open-on-hover + escape-close lifecycle"
```

### Task 8.4: Tooltip — variant + asChild + portal tests

**Files:**
- Modify: `apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.test.tsx`

- [ ] **Step 1: Add tests**

Append:

```tsx
it('asChild forwards trigger styling onto the child element', async () => {
  const user = userEvent.setup();
  render(
    withProvidersFastDelay(
      <Tooltip>
        <Tooltip.Trigger asChild>
          <button data-testid="custom-btn">trigger</button>
        </Tooltip.Trigger>
        <Tooltip.Content>tip</Tooltip.Content>
      </Tooltip>,
    ),
  );

  const btn = screen.getByTestId('custom-btn');
  expect(btn.className).toContain('cr-Tooltip-trigger');
});

it('renders content inside a portal (not inside the test container)', async () => {
  const user = userEvent.setup();
  const { container } = render(
    withProvidersFastDelay(
      <Tooltip>
        <Tooltip.Trigger asChild>
          <button>t</button>
        </Tooltip.Trigger>
        <Tooltip.Content>portal-content</Tooltip.Content>
      </Tooltip>,
    ),
  );

  await user.hover(screen.getByText('t'));
  await screen.findByText('portal-content');

  // Content is in document.body, NOT inside the test container.
  expect(container.querySelector(':scope >> .cr-Tooltip-content')).toBeNull();
  expect(document.body.querySelector('.cr-Tooltip-content')).not.toBeNull();
});

it('variant="inverted" applies the formalized foreground vars to content', async () => {
  const user = userEvent.setup();
  render(
    withProvidersFastDelay(
      <Tooltip variant="inverted">
        <Tooltip.Trigger asChild>
          <button>t</button>
        </Tooltip.Trigger>
        <Tooltip.Content>tip</Tooltip.Content>
      </Tooltip>,
    ),
  );

  await user.hover(screen.getByText('t'));
  const content = await screen.findByText('tip');

  // The vars resolver placed inline custom properties on the slot:
  expect(content.style.getPropertyValue('--cr-tooltip-bg')).toBe('var(--surface-floating)');
  expect(content.style.getPropertyValue('--cr-tooltip-color')).toBe('var(--surface-floating-foreground)');
});

it('throws when Tooltip.Trigger is rendered outside Tooltip', () => {
  expect(() =>
    render(
      <SoribashiProvider theme={theme}>
        <Tooltip.Provider>
          <Tooltip.Trigger asChild>
            <button>x</button>
          </Tooltip.Trigger>
        </Tooltip.Provider>
      </SoribashiProvider>,
    ),
  ).toThrow(/Tooltip parts must be inside <Tooltip>/);
});
```

- [ ] **Step 2: Run tests**

Run: `bun run --filter @soribashi/core-radix-pilot test -- Tooltip`
Expected: tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.test.tsx
git commit -m "test(pilot): Tooltip asChild + portal + inverted-variant + safe-context throw"
```

### Task 8.5: Mount `<Tooltip.Provider>` in `App.tsx`

**Files:**
- Modify: `apps/core-radix-pilot/src/App.tsx`

- [ ] **Step 1: Locate the App's existing root**

Read `apps/core-radix-pilot/src/App.tsx` to see the current structure. Find where the routes/pages render.

- [ ] **Step 2: Wrap the existing tree in `<Tooltip.Provider>`**

Add the import:

```tsx
import { Tooltip } from './recipes/Tooltip/Tooltip.tsx';
```

Wrap the rendered output:

```tsx
return (
  <Tooltip.Provider>
    {/* existing tree */}
  </Tooltip.Provider>
);
```

- [ ] **Step 3: Verify pilot still builds + dev server runs**

Run: `bun run --filter @soribashi/core-radix-pilot build`
Expected: clean build.

Run: `bun run dev:pilot` (background); open `http://localhost:5174`. Confirm existing pages still render.

Stop the server.

- [ ] **Step 4: Commit**

```bash
git add apps/core-radix-pilot/src/App.tsx
git commit -m "feat(pilot): mount <Tooltip.Provider> at app root

Single Provider wraps the entire app shell so multiple <Tooltip>
instances share the warmup-delay state machine. Per-instance
defaults remain configurable via Tooltip.Provider.withDefaults
in the theme."
```

---

# Phase 9 — Pilot: TooltipMatrix page + ScreenReplica

### Task 9.1: TooltipMatrix page

**Files:**
- Create: `apps/core-radix-pilot/src/pages/TooltipMatrix.tsx`
- Modify: `apps/core-radix-pilot/src/main.tsx` (or wherever routes are registered) — register the page

- [ ] **Step 1: Create the page**

```tsx
// apps/core-radix-pilot/src/pages/TooltipMatrix.tsx
import { Tooltip } from '../recipes/Tooltip/Tooltip.tsx';

const VARIANTS = ['default', 'inverted'] as const;
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

export function TooltipMatrix() {
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <h2>Tooltip — variant × side matrix</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        {VARIANTS.map((variant) =>
          SIDES.map((side) => (
            <Tooltip key={`${variant}-${side}`} variant={variant} side={side}>
              <Tooltip.Trigger asChild>
                <button style={{ padding: '8px 16px' }}>
                  {variant} / {side}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content>
                {variant} variant on {side}
              </Tooltip.Content>
            </Tooltip>
          )),
        )}
      </div>

      <h2>Special cases</h2>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <button>long content</button>
          </Tooltip.Trigger>
          <Tooltip.Content>
            A really long tooltip content that should wrap nicely within the max-width constraint
            and not overflow the viewport on any side. Lorem ipsum dolor sit amet.
          </Tooltip.Content>
        </Tooltip>

        <Tooltip>
          <Tooltip.Trigger asChild>
            <button>no arrow</button>
          </Tooltip.Trigger>
          <Tooltip.Content withArrow={false}>No arrow on this one.</Tooltip.Content>
        </Tooltip>

        <ControlledTooltip />
      </div>
    </div>
  );
}

function ControlledTooltip() {
  const [open, setOpen] = (require('react') as typeof import('react')).useState(false);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <button>controlled</button>
        </Tooltip.Trigger>
        <Tooltip.Content>open is {String(open)}</Tooltip.Content>
      </Tooltip>
      <button onClick={() => setOpen((v) => !v)}>toggle</button>
    </div>
  );
}
```

- [ ] **Step 2: Register the route**

In `apps/core-radix-pilot/src/App.tsx` (or wherever pages are routed), add a link/route entry for `/tooltip-matrix` pointing at `<TooltipMatrix />`.

(Match the existing routing pattern used for `TokenReview`, `ScreenReplica`, `ButtonMatrix`.)

- [ ] **Step 3: Run dev server, verify page renders**

Run: `bun run dev:pilot` (background); navigate to the new page. Confirm:
- 8-cell variant × side grid renders
- Hovering each trigger opens tooltip on the correct side
- Inverted-variant tooltips use dark background + light text
- Long content wraps within max-width
- No-arrow case works
- Controlled tooltip toggles open/closed via the toggle button

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add apps/core-radix-pilot/src/pages/TooltipMatrix.tsx apps/core-radix-pilot/src/App.tsx
git commit -m "feat(pilot): TooltipMatrix page exercising variant × side + special cases"
```

### Task 9.2: ScreenReplica integration

**Files:**
- Modify: `apps/core-radix-pilot/src/pages/ScreenReplica.tsx`

- [ ] **Step 1: Read existing ScreenReplica to find tooltip-applicable spots**

Open `apps/core-radix-pilot/src/pages/ScreenReplica.tsx`. Identify:
- Icon-only buttons (toolbar / filter row / action menu)
- Truncated text with ellipses
- Status indicators

- [ ] **Step 2: Add Tooltip wrappers**

For each icon-only button, wrap the button in a Tooltip:

```tsx
<Tooltip>
  <Tooltip.Trigger asChild>
    <IconButton aria-label="Filter" /* ... */ />
  </Tooltip.Trigger>
  <Tooltip.Content>Filter results</Tooltip.Content>
</Tooltip>
```

For truncated text, conditionally render Tooltip when text is truncated (or always — design owner can decide later).

- [ ] **Step 3: Run dev server; verify**

Run: `bun run dev:pilot`; visit ScreenReplica. Hover icon buttons → tooltips appear with reasonable content.

Stop server.

- [ ] **Step 4: Commit**

```bash
git add apps/core-radix-pilot/src/pages/ScreenReplica.tsx
git commit -m "feat(pilot): integrate Tooltip into ScreenReplica at icon-only buttons + truncations"
```

---

# Phase 10 — Browser parity tests

### Task 10.1: Tooltip computed-styles Playwright test

**Files:**
- Create: `tests/browser-parity/tooltip-computed-styles.spec.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/browser-parity/tooltip-computed-styles.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Tooltip — computed styles per variant × side', () => {
  test('default variant on top — content uses surface.default + text.default', async ({ page }) => {
    await page.goto('/tooltip-matrix');

    const trigger = page.locator('button', { hasText: 'default / top' });
    await trigger.hover();

    const content = page.locator('.cr-Tooltip-content').first();
    await expect(content).toBeVisible();

    // Computed bg should resolve to var(--surface-default), which is white in light mode
    const bg = await content.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/rgb\(255,\s*255,\s*255\)|rgba\(255,\s*255,\s*255,\s*\d/);
  });

  test('inverted variant — content uses formalized foreground pairing', async ({ page }) => {
    await page.goto('/tooltip-matrix');

    const trigger = page.locator('button', { hasText: 'inverted / top' });
    await trigger.hover();

    const content = page.locator('.cr-Tooltip-content').first();
    await expect(content).toBeVisible();

    // surface.floating = neutral.900 = hsl(222 47% 11%) ≈ rgb(20-30, 25-35, 50-60)
    const bg = await content.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Generic "dark" assertion: each channel < 80
    const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(match).not.toBeNull();
    const [, r, g, b] = match!;
    expect(Number(r)).toBeLessThan(80);
    expect(Number(g)).toBeLessThan(80);
    expect(Number(b)).toBeLessThan(80);

    // foreground: white-ish
    const color = await content.evaluate((el) => getComputedStyle(el).color);
    const cMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(cMatch).not.toBeNull();
    expect(Number(cMatch![1])).toBeGreaterThan(200);
  });

  test('arrow inherits the same bg as the content', async ({ page }) => {
    await page.goto('/tooltip-matrix');
    const trigger = page.locator('button', { hasText: 'inverted / top' });
    await trigger.hover();

    const arrow = page.locator('.cr-Tooltip-arrow').first();
    await expect(arrow).toBeVisible();

    const arrowFill = await arrow.evaluate((el) => getComputedStyle(el).fill);
    const contentBg = await page.locator('.cr-Tooltip-content').first().evaluate((el) => getComputedStyle(el).backgroundColor);

    // Same color (both reference --cr-tooltip-bg)
    expect(arrowFill).toBe(contentBg);
  });

  test('dark mode flips foreground pairing correctly', async ({ page }) => {
    await page.goto('/tooltip-matrix');
    // Toggle dark mode (use the existing dark-mode toggle pattern from the pilot)
    await page.evaluate(() => document.documentElement.classList.add('dark'));

    const trigger = page.locator('button', { hasText: 'inverted / top' });
    await trigger.hover();

    const content = page.locator('.cr-Tooltip-content').first();
    const bg = await content.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Dark mode: surface.floating is light, foreground is dark
    const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThan(200);
  });
});
```

- [ ] **Step 2: Update `playwright.config.ts` if route registration differs**

If the test fails with 404, update routing in the pilot to register `/tooltip-matrix` (Task 9.1 step 2).

- [ ] **Step 3: Run the Playwright test**

Run: `bunx playwright test tests/browser-parity/tooltip-computed-styles.spec.ts`
Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/browser-parity/tooltip-computed-styles.spec.ts
git commit -m "test(parity): Tooltip computed styles — variants, arrow color, dark mode"
```

### Task 10.2: Visual review screenshots (manual, journaled)

**Files:**
- Create: `docs/superpowers/pilots/2026-05-04-tooltip-pilot.md`

- [ ] **Step 1: Run dev server + capture screenshots**

Run: `bun run dev:pilot`; navigate to `/tooltip-matrix`. Take screenshots of:
- 8-cell matrix in light mode (one screenshot)
- 8-cell matrix in dark mode (toggle via existing pilot mechanism)
- Long-content tooltip (open)
- No-arrow tooltip (open)
- ScreenReplica with Tooltips integrated (light + dark)

Save under `docs/superpowers/pilots/screenshots/tooltip-pilot/` (create directory).

- [ ] **Step 2: Write the journal**

```markdown
# Wave 2 — Tooltip Pilot Journal

**Date started:** 2026-05-04
**Spec:** docs/superpowers/specs/2026-05-04-wave-2-tooltip-pilot-design.md
**Plan:** docs/superpowers/plans/2026-05-04-plan-wave-2-tooltip-pilot.md

## Phase summary

Brief phase-by-phase log: what landed, surprises, decisions made
during implementation that diverged from the plan.

## Visual review

[Embed or link screenshots from Step 1]

### Variant × side matrix — light mode
![tooltip matrix light](./screenshots/tooltip-pilot/matrix-light.png)

### Variant × side matrix — dark mode
![tooltip matrix dark](./screenshots/tooltip-pilot/matrix-dark.png)

### ScreenReplica integration — light mode
![screen replica light](./screenshots/tooltip-pilot/screenreplica-light.png)

### ScreenReplica integration — dark mode
![screen replica dark](./screenshots/tooltip-pilot/screenreplica-dark.png)

## Gaps surfaced

[Wave 1 had 7 gaps. Wave 2 may surface its own. Catalog here.]

- (none yet — fill as gaps appear during implementation)

## Open design questions resolved during pilot

[Any of the spec's OQ-1..OQ-8 that got concrete answers during the build.]

## Authoring DX observations

[Notes on what felt clean / awkward in the defineCompound API as
authored — feeds into Wave 3 / Wave 4 sequencing decisions.]

## Consumer DX observations

[Notes on the consumer-facing API — withDefaults, theme array form,
Tooltip composition. Feeds into the playbook entry.]
```

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/pilots/2026-05-04-tooltip-pilot.md docs/superpowers/pilots/screenshots/tooltip-pilot/
git commit -m "docs(pilot): Wave 2 Tooltip pilot journal + visual-review screenshots"
```

---

# Phase 11 — Playbook updates

### Task 11.1: Populate playbook § 2.2 — transient overlay compound

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-core-radix-conversion-playbook.md`

- [ ] **Step 1: Locate the placeholder**

Open the playbook. Find line `### 2.2 Transient overlay compound (Wave 2 — Tooltip)` and the line `_To be populated by Wave 2._`.

- [ ] **Step 2: Replace the placeholder with the Wave 2 entry**

Mirror the structure of § 2.1 (pure styled primitive). Sections to include:

- **Recipe shape** — `defineCompound` config layout, parts taxonomy (root + Provider + context-consuming siblings).
- **Style approach** — slots vs parts, per-slot CSS classes, vars resolver, `getStyles({ part })` for sub-element slots like arrow.
- **State handling** — Radix owns open/close lifecycle, `data-state` attributes flow through automatically.
- **Token consumption** — surface.floating + formalized foreground pairing; how the recipe references `var(--surface-floating)` and `var(--surface-floating-foreground)`.
- **Three classes of part** — root, context-consuming, passthrough Provider; explain when each is appropriate.
- **Render body destructure** — same convention as § 2.1 (recipes destructure framework keys explicitly).
- **Tests** — vitest at the recipe level (open lifecycle, asChild, portal, variant computed styles), browser parity at the page level, visual review at the integration level.
- **Recipe code snippet** — full Tooltip recipe inlined (copy from `apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.tsx`).

- [ ] **Step 3: Add a § 4 / § 5 entry for the gradual-formalization convention**

Add an entry to the playbook documenting the Wave 2 surface-token decision:

```markdown
### Gradual surface↔foreground formalization (Wave 2)

**Convention:** when introducing a semantic surface whose lightness diverges
meaningfully from `surface.default`, declare it as `{ value, foreground }`.
Codegen emits both `--surface-{name}` and `--surface-{name}-foreground`.
Consumers pair the two — guaranteed-correct contrast.

When introducing a surface that lives in the page's normal contrast band
(canvas / default / raised / sunken), keep the string form and pair informally
with `text.default`.

**Existing Wave-1 surfaces are not retroactively formalized.** The migration
cost (rename every `text.default` reference to `surface.X-foreground`) is
not justified by Wave 2's needs and does not need to be paid retroactively.
Future surfaces are formalized at introduction time.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-04-26-core-radix-conversion-playbook.md
git commit -m "docs(playbook): § 2.2 transient overlay compound + gradual formalization convention"
```

---

# Phase 12 — Final verification

### Task 12.1: Full quality gate

- [ ] **Step 1: Full test suite**

Run: `bun run test`
Expected: all tests pass — vitest workspaces (factory, theme, codegen, blocks, pilot) + Playwright (browser parity).

- [ ] **Step 2: Typecheck all packages**

Run: `bun run typecheck`
Expected: clean.

- [ ] **Step 3: Lint**

Run: `bun run lint`
Expected: clean (or only previously-tolerated warnings).

- [ ] **Step 4: Pilot build**

Run: `bun run --filter @soribashi/core-radix-pilot build`
Expected: clean build, no errors.

- [ ] **Step 5: Status snapshot**

Run: `git log --oneline | head -30`
Expected: all Wave 2 commits visible; clean tree.

Run: `git status --short`
Expected: empty.

### Task 12.2: Open PR

- [ ] **Step 1: Push branch**

Run: `git push -u origin wave-2-tooltip-pilot`

- [ ] **Step 2: Open PR**

Use `compound-engineering:ce-pr-description` or `gh pr create` to draft a PR description summarizing:
- The two architectural deliverables (`defineCompound` + Q11 surface formalization)
- The pilot Tooltip recipe as proof
- The reference-keyed component registration via `withDefaults`
- The 12 tasks completed
- Reference the spec + plan documents

Title: `Wave 2 — Tooltip pilot (transient overlay compound + surface.floating + withDefaults)`

- [ ] **Step 3: Hand off to design owner for visual review**

Link the PR + the journal doc + screenshots. Capture any feedback into a Wave-2 follow-up commit.

---

## Self-Review

(Run after writing the plan against the spec.)

**Spec coverage check:**
- § 1 (why) → context for plan, no implementation needed ✓
- § 2 (scope) → all rows mapped to phases ✓
- § 3.1 (defineCompound config) → Phase 7 ✓
- § 3.2 (per-part config) → Phase 7 (Tasks 7.1-7.5) ✓
- § 3.3 (factory internals) → Phase 7 (implementation in Tasks 7.1, 7.2, 7.6) ✓
- § 3.4 (three classes of part) → Phase 7 Task 7.6 (passthrough), 7.7 (polymorphic), 7.1-7.5 (root + context-consuming) ✓
- § 3.5 (theme defaults / withDefaults) → Phases 2 + 6 ✓
- § 3.6 (not supported) → guards in Phase 7 Task 7.9 ✓
- § 4 (Slot) → Phase 5 ✓
- § 5 (surface model) → Phase 1 (theme types), Phase 3 (codegen), Phase 8.1 (pilot consumption) ✓
- § 6 (pilot Tooltip) → Phases 8 + 9 ✓
- § 7 (failure modes) → covered by tests in Phases 5-7, especially Task 7.6 (passthrough), 7.9 (guards), 8.4 (safe-context throw) ✓
- § 8 (testing strategy) → tests live alongside each implementation task ✓
- § 9 (sequencing) → matches phase ordering ✓
- § 10 (cross-references) → linked in plan header ✓
- § 11 (open questions) → not implementation work; tracked for design-owner review ✓
- § 12 (glossary) → not implementation work ✓

**Placeholder scan:** no "TBD", "TODO", "implement later" in steps. Some "fill in" language appears in journal templates (Phase 10.2) — appropriate there because the journal is filled at execution time per actual findings.

**Type consistency:** `ThemeComponentEntry` (Task 2.1) used identically in Tasks 2.2, 6.1, 6.2, 7.2, 7.8. `withDefaults` signature matches across all uses. `defineCompound` config shape consistent between Task 7.1 (root only) and Task 7.2 (parts added) — no field renames mid-plan.

Plan is comprehensive and self-contained.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-04-plan-wave-2-tooltip-pilot.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — execute tasks in this session via `superpowers:executing-plans`, batch checkpoints

Which approach?
