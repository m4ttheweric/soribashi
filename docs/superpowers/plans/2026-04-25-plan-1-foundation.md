# Soribashi Plan 1 — Foundation (Workspace + Theme + Codegen)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the soribashi Bun workspace, ship `@soribashi/theme` (token authoring + intent resolver) and `@soribashi/codegen` (theme → CSS variables + Tailwind v3 config), and prove the token roundtrip end-to-end.

**Architecture:** Bun workspace monorepo. `@soribashi/theme` is pure runtime: types, normalization, default intent resolver, no I/O. `@soribashi/codegen` is the I/O layer: takes a theme object, emits `theme.css` and `tailwind.config.generated.js`. Codegen is a separate package because the theme must remain runtime-importable in browsers; codegen runs only in Node.

**Tech Stack:** Bun, TypeScript (strict), Vitest, `class-variance-authority` (downstream — install root), `clsx` + `tailwind-merge` (for `cn()` helper used later).

**Reference:** Spec at `/Users/matt/Documents/GitHub/soribashi/docs/superpowers/specs/2026-04-25-soribashi-design.md`. Hard Rule 13 requires validating against [Mantine source](https://github.com/mantinedev/mantine), specifically:
- `packages/@mantine/core/src/core/MantineProvider/create-theme/` for theme normalization
- `packages/@mantine/core/src/core/MantineProvider/color-functions/default-variant-colors-resolver/` for the resolver shape
- `packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/` for CSS emission patterns

---

## File Structure

### Created in this plan

```
soribashi/
  .gitignore
  package.json                              ← root, workspaces config
  bun.lock
  tsconfig.base.json                        ← base TS config
  vitest.workspace.ts                       ← Vitest workspaces
  biome.json                                ← linter/formatter
  README.md

  packages/theme/
    package.json                            ← @soribashi/theme
    tsconfig.json
    vitest.config.ts
    src/
      index.ts                              ← public exports
      types.ts                              ← all theme-related TS types
      create-theme.ts                       ← createTheme()
      default-intent-resolver.ts            ← default (intent, variant) → CSS values
      compose-theme.ts                      ← theme extends/merge logic
      tokens/
        index.ts                            ← token constants and helpers
        default-tokens.ts                   ← default color/radius/spacing scales
    test/
      create-theme.test.ts
      default-intent-resolver.test.ts
      compose-theme.test.ts

  packages/codegen/
    package.json                            ← @soribashi/codegen
    tsconfig.json
    vitest.config.ts
    bin/
      soribashi.ts                          ← CLI entrypoint
    src/
      index.ts                              ← public exports (programmatic API)
      load-config.ts                        ← reads soribashi.config.{ts,js}
      emit-css.ts                           ← theme → theme.css
      emit-tailwind-v3.ts                   ← theme → tailwind.config.generated.js
      emit-tailwind-v4.ts                   ← theme → theme.tailwind.css with @theme block
      watch.ts                              ← file watcher
      cli.ts                                ← CLI command parsing
      types.ts                              ← codegen-specific types (config shape)
    test/
      emit-css.test.ts
      emit-tailwind-v3.test.ts
      emit-tailwind-v4.test.ts
      load-config.test.ts
      roundtrip.test.ts                     ← token roundtrip integration test
    fixtures/
      themes/
        minimal.theme.ts                    ← test fixture: minimal theme
        full.theme.ts                       ← test fixture: full theme with all features
        custom-scope.theme.ts               ← test fixture: scoped theme (claim-view-islands style)
```

### Touched in this plan
None (this is greenfield).

---

## Task 1: Initialize Git Repository

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/.gitignore`
- Create: `/Users/matt/Documents/GitHub/soribashi/README.md`

- [ ] **Step 1: Initialize git**

```bash
cd /Users/matt/Documents/GitHub/soribashi
git init
```

Expected: `Initialized empty Git repository in /Users/matt/Documents/GitHub/soribashi/.git/`

- [ ] **Step 2: Write .gitignore**

Create `/Users/matt/Documents/GitHub/soribashi/.gitignore`:

```
# Dependencies
node_modules/
.bun/

# Build outputs
dist/
build/
*.tsbuildinfo

# Test coverage
coverage/
.nyc_output/

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.local

# Logs
*.log
npm-debug.log*
bun-debug.log*

# Generated artifacts (these ARE committed in consumer apps; ignore here in the repo root)
# (We do commit generated files in apps/playground/src/generated/ later — see Plan 5)
```

- [ ] **Step 3: Write README**

Create `/Users/matt/Documents/GitHub/soribashi/README.md`:

```markdown
# Soribashi

A component-authoring framework for React, derived from Mantine's open-source patterns. See [`docs/superpowers/specs/2026-04-25-soribashi-design.md`](docs/superpowers/specs/2026-04-25-soribashi-design.md) for the full design.

## Status

Pre-v1. Active implementation.

## Packages

- `@soribashi/factory` — `defineComponent`, `useProps`, `useStyles` (Plan 2+)
- `@soribashi/theme` — `createTheme`, intent resolver
- `@soribashi/codegen` — theme → CSS variables + Tailwind config
- `@soribashi/blocks` — layout primitives (Plan 4)
- `@soribashi/core` — public barrel (Plan 5)

## Local development

```bash
bun install
bun test
```
```

- [ ] **Step 4: Initial commit**

```bash
git add .gitignore README.md docs/
git commit -m "chore: initialize repository with docs and gitignore"
```

---

## Task 2: Bun Workspace Setup

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/package.json`

- [ ] **Step 1: Create root package.json**

Create `/Users/matt/Documents/GitHub/soribashi/package.json`:

```json
{
  "name": "soribashi",
  "version": "0.0.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --build",
    "lint": "biome check .",
    "format": "biome format . --write",
    "build": "echo 'No-op for now; per-package builds added in later plans'"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@types/node": "^22.10.0",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  },
  "engines": {
    "bun": ">=1.1.0"
  }
}
```

- [ ] **Step 2: Run install to verify Bun parses workspaces**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun install
```

Expected: Creates `bun.lock`, installs devDependencies, no errors. Workspace packages list will be empty until Task 4.

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add Bun workspace root with vitest, biome, typescript"
```

---

## Task 3: Base TypeScript and Tooling Config

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/tsconfig.base.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/biome.json`

- [ ] **Step 1: Write tsconfig.base.json**

Create `/Users/matt/Documents/GitHub/soribashi/tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false,

    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,

    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    "composite": false
  },
  "exclude": ["node_modules", "dist", "build"]
}
```

- [ ] **Step 2: Write biome.json**

Create `/Users/matt/Documents/GitHub/soribashi/biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "off"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  },
  "files": {
    "ignore": ["dist/**", "build/**", "node_modules/**", "**/*.generated.*"]
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add tsconfig.base.json biome.json
git commit -m "chore: add base TypeScript and biome configs"
```

---

## Task 4: Create @soribashi/theme Package Skeleton

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/theme/package.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/theme/tsconfig.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/theme/vitest.config.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/index.ts`

- [ ] **Step 1: Create package.json**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/package.json`:

```json
{
  "name": "@soribashi/theme",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create empty src/index.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/index.ts`:

```ts
// @soribashi/theme — public API
// Implementation added in subsequent tasks.
export {};
```

- [ ] **Step 5: Re-run install to register the workspace**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun install
```

Expected: `bun.lock` updates; no errors. `@soribashi/theme` is now resolvable across the workspace.

- [ ] **Step 6: Commit**

```bash
git add packages/theme/ bun.lock
git commit -m "chore(theme): create @soribashi/theme package skeleton"
```

---

## Task 5: Theme Types — Tokens

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/types.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/test/types.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { ThemeTokens, ColorScale, ThemeDefinition } from '../src/types.ts';

describe('theme types', () => {
  it('ColorScale accepts arbitrary keyed scales', () => {
    const scale: ColorScale = {
      '0': 'hsl(0 0% 100%)',
      '50': 'hsl(0 0% 98%)',
      '500': 'hsl(0 0% 50%)',
      '950': 'hsl(0 0% 5%)',
    };
    expect(scale['500']).toBe('hsl(0 0% 50%)');
  });

  it('ThemeTokens has colors, radius, spacing, fontSize fields', () => {
    const tokens: ThemeTokens = {
      colors: {
        primary: { '50': '#fff', '500': '#000' },
      },
      radius: { sm: '0.25rem', md: '0.5rem' },
      spacing: { xs: '0.25rem', sm: '0.5rem' },
      fontSize: { sm: '0.875rem', md: '1rem' },
    };
    expect(tokens.colors.primary['50']).toBe('#fff');
  });

  it('ThemeDefinition allows optional dark token overrides', () => {
    const def: ThemeDefinition = {
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      dark: {
        colors: { primary: { '500': '#fff' } },
      },
    };
    expect(def.dark?.colors?.primary?.['500']).toBe('#fff');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/theme
bun test
```

Expected: Test FAILS with errors about `types.ts` not exporting the symbols.

- [ ] **Step 3: Write src/types.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/types.ts`:

```ts
// Token-level types

/**
 * A color scale is an object keyed by shade name (`50`, `100`, `500`, `950`, etc.)
 * mapping to CSS color values. Unlike Mantine, soribashi does NOT enforce a fixed
 * 10-element tuple; teams may use any keys including `0`, `25`, `950`, etc.
 *
 * Reference: this addresses a Mantine workaround documented in
 * console-archive/packages/ui/design-system/colors.ts where the team had to
 * truncate 12-shade palettes to fit Mantine's MantineColorsTuple constraint.
 */
export type ColorScale = Record<string, string>;

/**
 * The full set of theme tokens. This is the structural source of truth for what
 * tokens exist; codegen reads this to emit CSS variables.
 */
export interface ThemeTokens {
  colors: Record<string, ColorScale>;
  radius: Record<string, string>;
  spacing: Record<string, string>;
  fontSize: Record<string, string>;
  fontFamily?: Record<string, string>;
  shadow?: Record<string, string>;
  breakpoint?: Record<string, string>;
  zIndex?: Record<string, string | number>;
}

/**
 * Partial tokens for dark-mode overrides. Any token omitted falls back to its
 * light-mode value.
 */
export type PartialThemeTokens = {
  colors?: Record<string, Partial<ColorScale>>;
  radius?: Partial<Record<string, string>>;
  spacing?: Partial<Record<string, string>>;
  fontSize?: Partial<Record<string, string>>;
  fontFamily?: Partial<Record<string, string>>;
  shadow?: Partial<Record<string, string>>;
  breakpoint?: Partial<Record<string, string>>;
  zIndex?: Partial<Record<string, string | number>>;
};

// Semantic-level types

/**
 * A semantic alias maps a logical name (e.g. `text.muted`) to a token reference
 * (e.g. `colors.neutral.500`). The reference is a dot-path string into `tokens`.
 *
 * This indirection is what lets a designer say "muted text" once in the theme
 * and have every component honor it without referencing raw color shades.
 */
export type SemanticReference = string;

export interface SemanticTokens {
  /** Available intent values; constrains components' `intent` prop */
  intent: readonly string[];
  /** Available variant values; constrains components' `variant` prop */
  variant: readonly string[];
  text: Record<string, SemanticReference>;
  /** Layered surface elevation. Default suggested layers: canvas, default, raised, sunken, overlay. */
  surface: Record<string, SemanticReference>;
  border: Record<string, SemanticReference>;
}

// Intent resolver types

export interface IntentResolverInput {
  intent: string;
  variant: string;
  theme: ResolvedTheme;
}

export interface IntentResolverResult {
  background: string;
  color: string;
  border: string;
  hover?: string;
  active?: string;
  hoverColor?: string;
}

export type IntentResolver = (input: IntentResolverInput) => IntentResolverResult;

// Component theme override types

export interface ComponentThemeConfig {
  defaultProps?: Record<string, unknown>;
  classNames?: Record<string, string> | ((theme: ResolvedTheme, props: Record<string, unknown>) => Record<string, string>);
  styles?: Record<string, Record<string, string | number>> | ((theme: ResolvedTheme, props: Record<string, unknown>) => Record<string, Record<string, string | number>>);
  vars?: (theme: ResolvedTheme, props: Record<string, unknown>) => Record<string, Record<string, string>>;
  attributes?: Record<string, Record<string, unknown>>;
}

// Top-level theme types

export interface ThemeDefinition {
  tokens: ThemeTokens;
  dark?: PartialThemeTokens;
  semantic?: Partial<SemanticTokens>;
  intentResolver?: IntentResolver;
  components?: Record<string, ComponentThemeConfig>;
  /** CSS selector for light scope. Defaults to `:root`. */
  scope?: string;
  /** CSS selector(s) for dark mode. Defaults to `.dark`. */
  darkMode?: { selector: string };
  /** Theme to extend; this theme's fields override base. */
  extends?: ThemeDefinition;
  /** Display name for debugging */
  name?: string;
}

/**
 * The fully-resolved, normalized theme. This is what `createTheme()` returns
 * and what the runtime sees. All optional fields are filled in with defaults.
 */
export interface ResolvedTheme {
  tokens: ThemeTokens;
  dark: PartialThemeTokens;
  semantic: SemanticTokens;
  intentResolver: IntentResolver;
  components: Record<string, ComponentThemeConfig>;
  scope: string;
  darkMode: { selector: string };
  name: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/theme
bun test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/theme/src/types.ts packages/theme/test/types.test.ts
git commit -m "feat(theme): add token, semantic, and theme definition types"
```

---

## Task 6: Default Tokens

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/tokens/default-tokens.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/tokens/index.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/test/default-tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { defaultTokens, defaultDarkTokens } from '../src/tokens/index.ts';

describe('defaultTokens', () => {
  it('includes a primary color scale with 50–900 shades', () => {
    expect(defaultTokens.colors.primary).toBeDefined();
    expect(defaultTokens.colors.primary?.['50']).toBeDefined();
    expect(defaultTokens.colors.primary?.['500']).toBeDefined();
    expect(defaultTokens.colors.primary?.['900']).toBeDefined();
  });

  it('includes radius scale with sm, md, lg', () => {
    expect(defaultTokens.radius.sm).toBeDefined();
    expect(defaultTokens.radius.md).toBeDefined();
    expect(defaultTokens.radius.lg).toBeDefined();
  });

  it('includes spacing scale with xs through xl', () => {
    expect(defaultTokens.spacing.xs).toBeDefined();
    expect(defaultTokens.spacing.sm).toBeDefined();
    expect(defaultTokens.spacing.md).toBeDefined();
    expect(defaultTokens.spacing.lg).toBeDefined();
    expect(defaultTokens.spacing.xl).toBeDefined();
  });

  it('includes font size scale with sm through xl', () => {
    expect(defaultTokens.fontSize.sm).toBeDefined();
    expect(defaultTokens.fontSize.md).toBeDefined();
    expect(defaultTokens.fontSize.lg).toBeDefined();
    expect(defaultTokens.fontSize.xl).toBeDefined();
  });

  it('includes neutral, success, danger, warning, info color families', () => {
    expect(defaultTokens.colors.neutral).toBeDefined();
    expect(defaultTokens.colors.success).toBeDefined();
    expect(defaultTokens.colors.danger).toBeDefined();
    expect(defaultTokens.colors.warning).toBeDefined();
    expect(defaultTokens.colors.info).toBeDefined();
  });

  it('defaultDarkTokens overrides primary and neutral colors', () => {
    expect(defaultDarkTokens.colors?.primary).toBeDefined();
    expect(defaultDarkTokens.colors?.neutral).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/theme
bun test
```

Expected: FAIL — `defaultTokens` not exported.

- [ ] **Step 3: Write default-tokens.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/tokens/default-tokens.ts`:

```ts
import type { ThemeTokens, PartialThemeTokens } from '../types.ts';

/**
 * Default light-mode tokens. A reasonable starting palette that teams will
 * typically override entirely. Values are in HSL space for easy alpha
 * compositing via Tailwind's `<alpha-value>` pattern.
 *
 * These defaults intentionally go beyond Mantine's built-ins by including
 * a layered neutral scale (50–950 with 11 stops) suitable for surface
 * elevation hierarchies.
 */
export const defaultTokens: ThemeTokens = {
  colors: {
    primary: {
      '50': 'hsl(214 100% 97%)',
      '100': 'hsl(214 95% 93%)',
      '200': 'hsl(213 97% 87%)',
      '300': 'hsl(212 96% 78%)',
      '400': 'hsl(213 94% 68%)',
      '500': 'hsl(217 91% 60%)',
      '600': 'hsl(221 83% 53%)',
      '700': 'hsl(224 76% 48%)',
      '800': 'hsl(226 71% 40%)',
      '900': 'hsl(224 64% 33%)',
      '950': 'hsl(226 57% 21%)',
    },
    neutral: {
      '0': 'hsl(0 0% 100%)',
      '50': 'hsl(210 40% 98%)',
      '100': 'hsl(210 40% 96%)',
      '200': 'hsl(214 32% 91%)',
      '300': 'hsl(213 27% 84%)',
      '400': 'hsl(215 20% 65%)',
      '500': 'hsl(215 16% 47%)',
      '600': 'hsl(215 19% 35%)',
      '700': 'hsl(215 25% 27%)',
      '800': 'hsl(217 33% 17%)',
      '900': 'hsl(222 47% 11%)',
      '950': 'hsl(229 84% 5%)',
    },
    success: {
      '50': 'hsl(138 76% 97%)',
      '100': 'hsl(141 84% 93%)',
      '200': 'hsl(141 79% 85%)',
      '300': 'hsl(142 77% 73%)',
      '400': 'hsl(142 71% 45%)',
      '500': 'hsl(142 76% 36%)',
      '600': 'hsl(142 72% 29%)',
      '700': 'hsl(142 64% 24%)',
      '800': 'hsl(143 62% 20%)',
      '900': 'hsl(144 61% 20%)',
      '950': 'hsl(145 80% 10%)',
    },
    danger: {
      '50': 'hsl(0 93% 94%)',
      '100': 'hsl(0 96% 89%)',
      '200': 'hsl(0 97% 85%)',
      '300': 'hsl(0 94% 82%)',
      '400': 'hsl(0 91% 71%)',
      '500': 'hsl(0 84% 60%)',
      '600': 'hsl(0 72% 51%)',
      '700': 'hsl(0 74% 42%)',
      '800': 'hsl(0 70% 35%)',
      '900': 'hsl(0 63% 31%)',
      '950': 'hsl(0 75% 15%)',
    },
    warning: {
      '50': 'hsl(48 96% 89%)',
      '100': 'hsl(48 96% 77%)',
      '200': 'hsl(48 97% 63%)',
      '300': 'hsl(49 98% 48%)',
      '400': 'hsl(49 96% 47%)',
      '500': 'hsl(38 92% 50%)',
      '600': 'hsl(32 95% 44%)',
      '700': 'hsl(26 90% 37%)',
      '800': 'hsl(23 83% 31%)',
      '900': 'hsl(22 78% 26%)',
      '950': 'hsl(26 83% 14%)',
    },
    info: {
      '50': 'hsl(183 100% 96%)',
      '100': 'hsl(185 96% 90%)',
      '200': 'hsl(186 94% 81%)',
      '300': 'hsl(187 92% 69%)',
      '400': 'hsl(188 86% 53%)',
      '500': 'hsl(199 89% 48%)',
      '600': 'hsl(200 98% 39%)',
      '700': 'hsl(201 96% 32%)',
      '800': 'hsl(201 90% 27%)',
      '900': 'hsl(202 80% 24%)',
      '950': 'hsl(204 80% 16%)',
    },
  },
  radius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  fontFamily: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  breakpoint: {
    xs: '24rem',
    sm: '40rem',
    md: '48rem',
    lg: '64rem',
    xl: '80rem',
    '2xl': '96rem',
    '3xl': '120rem',
  },
};

/**
 * Default dark-mode token overrides. Inverts the neutral scale and brightens
 * the primary scale for dark backgrounds.
 */
export const defaultDarkTokens: PartialThemeTokens = {
  colors: {
    primary: {
      '50': 'hsl(217 91% 15%)',
      '100': 'hsl(217 91% 20%)',
      '500': 'hsl(217 91% 60%)',
      '900': 'hsl(214 100% 97%)',
    },
    neutral: {
      '0': 'hsl(229 84% 5%)',
      '50': 'hsl(222 47% 11%)',
      '100': 'hsl(217 33% 17%)',
      '500': 'hsl(215 20% 65%)',
      '900': 'hsl(210 40% 98%)',
      '950': 'hsl(0 0% 100%)',
    },
  },
};
```

- [ ] **Step 4: Write the tokens index**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/tokens/index.ts`:

```ts
export { defaultTokens, defaultDarkTokens } from './default-tokens.ts';
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/theme
bun test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/theme/src/tokens/ packages/theme/test/default-tokens.test.ts
git commit -m "feat(theme): add default light and dark token scales"
```

---

## Task 7: Default Intent Resolver

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/default-intent-resolver.ts`

**Reference:** Mantine's `defaultVariantColorsResolver` at [`packages/@mantine/core/src/core/MantineProvider/color-functions/default-variant-colors-resolver/default-variant-colors-resolver.ts`](https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/core/src/core/MantineProvider/color-functions/default-variant-colors-resolver/default-variant-colors-resolver.ts). The shape (background, hover, color, border, hoverColor) and the `filled | light | outline | subtle | transparent | white | gradient | default` switch statement are the proven model. We adapt to soribashi's variant set (`filled | outline | subtle | ghost | link`) and use `var(--color-{intent}-{shade})` references because soribashi's color scale is keyed by string, not a fixed tuple position.

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/test/default-intent-resolver.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { defaultIntentResolver } from '../src/default-intent-resolver.ts';
import type { ResolvedTheme } from '../src/types.ts';

const theme = {
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
  dark: {},
  semantic: {
    intent: ['primary', 'danger'],
    variant: ['filled', 'outline', 'subtle', 'ghost', 'link'],
    text: {},
    surface: {},
    border: {},
  },
  intentResolver: defaultIntentResolver,
  components: {},
  scope: ':root',
  darkMode: { selector: '.dark' },
  name: 'test',
} as unknown as ResolvedTheme;

describe('defaultIntentResolver', () => {
  describe('filled variant', () => {
    it('returns intent-500 background and inverted text', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'filled', theme });
      expect(result.background).toBe('var(--color-primary-500)');
      expect(result.color).toBe('var(--color-primary-foreground)');
      expect(result.border).toBe('transparent');
    });

    it('produces hover at intent-600', () => {
      const result = defaultIntentResolver({ intent: 'danger', variant: 'filled', theme });
      expect(result.hover).toBe('var(--color-danger-600)');
    });
  });

  describe('outline variant', () => {
    it('transparent background with intent-500 border', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'outline', theme });
      expect(result.background).toBe('transparent');
      expect(result.color).toBe('var(--color-primary-700)');
      expect(result.border).toBe('var(--color-primary-500)');
    });
  });

  describe('subtle variant', () => {
    it('uses intent-100 background', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'subtle', theme });
      expect(result.background).toBe('var(--color-primary-100)');
      expect(result.color).toBe('var(--color-primary-700)');
    });
  });

  describe('ghost variant', () => {
    it('transparent until hover, then intent-50 background', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'ghost', theme });
      expect(result.background).toBe('transparent');
      expect(result.hover).toBe('var(--color-primary-50)');
    });
  });

  describe('link variant', () => {
    it('uses intent-600 color, no background or border', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'link', theme });
      expect(result.background).toBe('transparent');
      expect(result.border).toBe('transparent');
      expect(result.color).toBe('var(--color-primary-600)');
    });
  });

  describe('unknown variant', () => {
    it('returns transparent neutral fallback', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'invalid', theme });
      expect(result.background).toBe('transparent');
      expect(result.color).toBe('inherit');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/theme
bun test
```

Expected: FAIL — `defaultIntentResolver` not exported.

- [ ] **Step 3: Implement the resolver**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/default-intent-resolver.ts`:

```ts
import type { IntentResolver, IntentResolverResult } from './types.ts';

/**
 * Default intent resolver. Maps `(intent, variant)` to CSS values referencing
 * the theme's CSS variables. Components consume this through the framework;
 * never directly.
 *
 * Reference: based on Mantine's `defaultVariantColorsResolver`. The variant
 * set is adapted to soribashi's `filled | outline | subtle | ghost | link`.
 *
 * The returned values are CSS variable references, NOT raw colors. This means
 * the resolver doesn't need to know the actual hex values — it just needs to
 * know that a token like `--color-primary-500` exists. Codegen ensures it does.
 *
 * For `filled`, the foreground color is `var(--color-{intent}-foreground)`,
 * a semantic alias the theme provides (computed via auto-contrast or set
 * explicitly). If the alias isn't defined, browsers gracefully fall back to
 * `inherit`.
 */
export const defaultIntentResolver: IntentResolver = ({ intent, variant }) => {
  const v = (shade: string) => `var(--color-${intent}-${shade})`;

  if (variant === 'filled') {
    return {
      background: v('500'),
      color: `var(--color-${intent}-foreground)`,
      border: 'transparent',
      hover: v('600'),
      active: v('700'),
    };
  }

  if (variant === 'outline') {
    return {
      background: 'transparent',
      color: v('700'),
      border: v('500'),
      hover: v('50'),
      hoverColor: v('800'),
    };
  }

  if (variant === 'subtle') {
    return {
      background: v('100'),
      color: v('700'),
      border: 'transparent',
      hover: v('200'),
    };
  }

  if (variant === 'ghost') {
    return {
      background: 'transparent',
      color: v('700'),
      border: 'transparent',
      hover: v('50'),
    };
  }

  if (variant === 'link') {
    return {
      background: 'transparent',
      color: v('600'),
      border: 'transparent',
      hover: 'transparent',
      hoverColor: v('800'),
    };
  }

  // Fallback: unknown variant. Return safe neutral.
  return {
    background: 'transparent',
    color: 'inherit',
    border: 'none',
  } satisfies IntentResolverResult;
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/theme
bun test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/theme/src/default-intent-resolver.ts packages/theme/test/default-intent-resolver.test.ts
git commit -m "feat(theme): add default intent resolver for filled/outline/subtle/ghost/link"
```

---

## Task 8: createTheme — Normalization

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/create-theme.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/test/create-theme.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';
import { defaultIntentResolver } from '../src/default-intent-resolver.ts';

describe('createTheme', () => {
  it('returns a normalized theme with required fields populated', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    expect(theme.scope).toBe(':root');
    expect(theme.darkMode).toEqual({ selector: '.dark' });
    expect(theme.intentResolver).toBe(defaultIntentResolver);
    expect(theme.components).toEqual({});
    expect(theme.dark).toEqual({});
    expect(theme.name).toBe('default');
  });

  it('respects custom scope and darkMode', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      scope: '.claim-view-islands',
      darkMode: { selector: '.dark .claim-view-islands' },
    });

    expect(theme.scope).toBe('.claim-view-islands');
    expect(theme.darkMode.selector).toBe('.dark .claim-view-islands');
  });

  it('applies default semantic intent and variant if not provided', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    expect(theme.semantic.intent).toEqual([
      'primary',
      'neutral',
      'danger',
      'success',
      'warning',
      'info',
    ]);
    expect(theme.semantic.variant).toEqual(['filled', 'outline', 'subtle', 'ghost', 'link']);
  });

  it('respects user-provided semantic intent and variant lists', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' }, brand: { '500': '#fff' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      semantic: {
        intent: ['primary', 'brand'] as const,
        variant: ['filled', 'outline'] as const,
      },
    });

    expect(theme.semantic.intent).toEqual(['primary', 'brand']);
    expect(theme.semantic.variant).toEqual(['filled', 'outline']);
  });

  it('uses custom intent resolver when provided', () => {
    const customResolver = () => ({
      background: 'red',
      color: 'white',
      border: 'transparent',
    });

    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      intentResolver: customResolver,
    });

    expect(theme.intentResolver).toBe(customResolver);
  });

  it('preserves the provided name', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      name: 'my-app',
    });

    expect(theme.name).toBe('my-app');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/theme
bun test
```

Expected: FAIL.

- [ ] **Step 3: Implement createTheme**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/create-theme.ts`:

```ts
import { defaultIntentResolver } from './default-intent-resolver.ts';
import type {
  ResolvedTheme,
  SemanticTokens,
  ThemeDefinition,
} from './types.ts';
import { composeTheme } from './compose-theme.ts';

const DEFAULT_INTENTS = ['primary', 'neutral', 'danger', 'success', 'warning', 'info'] as const;
const DEFAULT_VARIANTS = ['filled', 'outline', 'subtle', 'ghost', 'link'] as const;

const DEFAULT_TEXT: Record<string, string> = {
  default: 'colors.neutral.900',
  muted: 'colors.neutral.500',
  disabled: 'colors.neutral.400',
};

const DEFAULT_SURFACE: Record<string, string> = {
  canvas: 'colors.neutral.50',
  default: 'colors.neutral.0',
  raised: 'colors.neutral.100',
  sunken: 'colors.neutral.50',
  overlay: 'colors.neutral.900',
};

const DEFAULT_BORDER: Record<string, string> = {
  default: 'colors.neutral.200',
  strong: 'colors.neutral.400',
  muted: 'colors.neutral.100',
};

/**
 * Builds a normalized theme from a (potentially partial) `ThemeDefinition`.
 *
 * Resolution order:
 * 1. If `definition.extends` is provided, recursively resolve and merge.
 * 2. Apply user fields, falling back to defaults for any omitted field.
 *
 * The returned `ResolvedTheme` has every field populated. Codegen, the
 * provider, and `useStyles` all assume a fully-resolved theme.
 */
export function createTheme(definition: ThemeDefinition): ResolvedTheme {
  const base: ResolvedTheme | null = definition.extends
    ? createTheme(definition.extends)
    : null;

  const merged: ThemeDefinition = base ? composeTheme(base, definition) : definition;

  const semantic: SemanticTokens = {
    intent: merged.semantic?.intent ?? DEFAULT_INTENTS,
    variant: merged.semantic?.variant ?? DEFAULT_VARIANTS,
    text: merged.semantic?.text ?? DEFAULT_TEXT,
    surface: merged.semantic?.surface ?? DEFAULT_SURFACE,
    border: merged.semantic?.border ?? DEFAULT_BORDER,
  };

  return {
    tokens: merged.tokens,
    dark: merged.dark ?? {},
    semantic,
    intentResolver: merged.intentResolver ?? defaultIntentResolver,
    components: merged.components ?? {},
    scope: merged.scope ?? ':root',
    darkMode: merged.darkMode ?? { selector: '.dark' },
    name: merged.name ?? 'default',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/theme
bun test
```

Expected: tests pass for everything except `composeTheme` (next task).

- [ ] **Step 5: Commit**

```bash
git add packages/theme/src/create-theme.ts packages/theme/test/create-theme.test.ts
git commit -m "feat(theme): add createTheme with field defaults and normalization"
```

---

## Task 9: composeTheme — Theme Extension Logic

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/compose-theme.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/test/compose-theme.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';

describe('theme composition (extends)', () => {
  it('extending a theme inherits base tokens', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      name: 'base',
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: { brand: { '500': '#fff' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
      name: 'child',
    });

    // Child has both inherited and new colors
    expect(child.tokens.colors.primary?.['500']).toBe('#aaa');
    expect(child.tokens.colors.brand?.['500']).toBe('#fff');
    // Child name overrides base
    expect(child.name).toBe('child');
  });

  it('child tokens override base tokens by key', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: { primary: { '500': '#bbb' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    expect(child.tokens.colors.primary?.['500']).toBe('#bbb');
  });

  it('child semantic overrides base semantic per-key', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      semantic: {
        text: { muted: 'colors.primary.500' },
      },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
      semantic: {
        text: { default: 'colors.primary.500' },
      },
    });

    // Both inherited muted AND new default exist
    expect(child.semantic.text.muted).toBe('colors.primary.500');
    expect(child.semantic.text.default).toBe('colors.primary.500');
  });

  it('child scope and darkMode override base', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      scope: ':root',
      darkMode: { selector: '.dark' },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
      scope: '.tenant-foo',
      darkMode: { selector: '.dark .tenant-foo' },
    });

    expect(child.scope).toBe('.tenant-foo');
    expect(child.darkMode.selector).toBe('.dark .tenant-foo');
  });

  it('child component config replaces base component config (no deep merge of components)', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      components: {
        Button: { defaultProps: { size: 'md' } },
      },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
      components: {
        Button: { defaultProps: { size: 'lg' } },
      },
    });

    expect(child.components.Button?.defaultProps).toEqual({ size: 'lg' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/theme
bun test
```

Expected: FAIL — `composeTheme` not implemented.

- [ ] **Step 3: Implement composeTheme**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/compose-theme.ts`:

```ts
import type { ResolvedTheme, ThemeDefinition, ThemeTokens } from './types.ts';

/**
 * Merges a child theme definition on top of a resolved base theme.
 *
 * Strategy:
 * - `tokens`: deep-merged per-token-family. Adding a new color family preserves base; overriding a shade overrides only that shade.
 * - `dark`: same as tokens.
 * - `semantic`: merged shallowly per category (text, surface, border are merged key-by-key; intent/variant are replaced if specified).
 * - `components`: merged shallowly. Each component name in child REPLACES the base entry for that name (no deep merge of component configs to avoid surprising classNames behaviors).
 * - `scope`, `darkMode`, `name`: child overrides if present.
 * - `intentResolver`: child overrides if present.
 */
export function composeTheme(base: ResolvedTheme, child: ThemeDefinition): ThemeDefinition {
  return {
    tokens: mergeTokens(base.tokens, child.tokens),
    dark: mergeTokens(
      base.dark as ThemeTokens,
      (child.dark ?? {}) as ThemeTokens
    ) as ThemeDefinition['dark'],
    semantic: {
      intent: child.semantic?.intent ?? base.semantic.intent,
      variant: child.semantic?.variant ?? base.semantic.variant,
      text: { ...base.semantic.text, ...(child.semantic?.text ?? {}) },
      surface: { ...base.semantic.surface, ...(child.semantic?.surface ?? {}) },
      border: { ...base.semantic.border, ...(child.semantic?.border ?? {}) },
    },
    intentResolver: child.intentResolver ?? base.intentResolver,
    components: { ...base.components, ...(child.components ?? {}) },
    scope: child.scope ?? base.scope,
    darkMode: child.darkMode ?? base.darkMode,
    name: child.name ?? base.name,
  };
}

function mergeTokens(base: ThemeTokens, child: ThemeTokens): ThemeTokens {
  return {
    colors: mergeNamedScales(base.colors, child.colors),
    radius: { ...base.radius, ...child.radius },
    spacing: { ...base.spacing, ...child.spacing },
    fontSize: { ...base.fontSize, ...child.fontSize },
    fontFamily: { ...(base.fontFamily ?? {}), ...(child.fontFamily ?? {}) },
    shadow: { ...(base.shadow ?? {}), ...(child.shadow ?? {}) },
    breakpoint: { ...(base.breakpoint ?? {}), ...(child.breakpoint ?? {}) },
    zIndex: { ...(base.zIndex ?? {}), ...(child.zIndex ?? {}) },
  };
}

function mergeNamedScales(
  base: ThemeTokens['colors'],
  child: ThemeTokens['colors']
): ThemeTokens['colors'] {
  const result: ThemeTokens['colors'] = { ...base };
  for (const [name, scale] of Object.entries(child)) {
    result[name] = { ...(base[name] ?? {}), ...scale };
  }
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/theme
bun test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/theme/src/compose-theme.ts packages/theme/test/compose-theme.test.ts
git commit -m "feat(theme): add composeTheme for extends-based theme composition"
```

---

## Task 10: Theme Package Public API

**Files:**
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/theme/test/index.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  createTheme,
  defaultIntentResolver,
  defaultTokens,
  defaultDarkTokens,
  type ThemeDefinition,
  type ResolvedTheme,
  type IntentResolver,
} from '../src/index.ts';

describe('@soribashi/theme public API', () => {
  it('exports createTheme as a function', () => {
    expect(typeof createTheme).toBe('function');
  });

  it('exports defaultIntentResolver as a function', () => {
    expect(typeof defaultIntentResolver).toBe('function');
  });

  it('exports defaultTokens with colors', () => {
    expect(defaultTokens.colors.primary).toBeDefined();
  });

  it('exports defaultDarkTokens', () => {
    expect(defaultDarkTokens.colors).toBeDefined();
  });

  it('types compile and ResolvedTheme matches createTheme return', () => {
    const def: ThemeDefinition = {
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    };
    const theme: ResolvedTheme = createTheme(def);
    const resolver: IntentResolver = theme.intentResolver;
    expect(typeof resolver).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/theme
bun test
```

Expected: FAIL.

- [ ] **Step 3: Update src/index.ts**

Replace contents of `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/index.ts`:

```ts
// @soribashi/theme — public API

export { createTheme } from './create-theme.ts';
export { defaultIntentResolver } from './default-intent-resolver.ts';
export { defaultTokens, defaultDarkTokens } from './tokens/index.ts';
export { composeTheme } from './compose-theme.ts';

export type {
  ThemeDefinition,
  ResolvedTheme,
  ThemeTokens,
  PartialThemeTokens,
  ColorScale,
  SemanticTokens,
  SemanticReference,
  IntentResolver,
  IntentResolverInput,
  IntentResolverResult,
  ComponentThemeConfig,
} from './types.ts';
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/theme
bun test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/theme/src/index.ts packages/theme/test/index.test.ts
git commit -m "feat(theme): finalize @soribashi/theme public API surface"
```

---

## Task 11: Create @soribashi/codegen Package Skeleton

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/package.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/tsconfig.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/vitest.config.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/index.ts`

- [ ] **Step 1: Create package.json**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/package.json`:

```json
{
  "name": "@soribashi/codegen",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "bin": {
    "soribashi": "./bin/soribashi.ts"
  },
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@soribashi/theme": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "vitest": "^2.1.8",
    "@types/node": "^22.10.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*", "test/**/*", "bin/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create empty src/index.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/index.ts`:

```ts
// @soribashi/codegen — public API
// Implementation added in subsequent tasks.
export {};
```

- [ ] **Step 5: Re-install to register the workspace**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun install
```

Expected: `bun.lock` updates.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/ bun.lock
git commit -m "chore(codegen): create @soribashi/codegen package skeleton"
```

---

## Task 12: Codegen — Emit CSS Variables

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/emit-css.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/test/emit-css.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { emitCss } from '../src/emit-css.ts';

describe('emitCss', () => {
  it('emits :root with all color shade variables', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '50': 'hsl(0 0% 95%)', '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitCss(theme);

    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary-50: hsl(0 0% 95%);');
    expect(css).toContain('--color-primary-500: hsl(0 0% 50%);');
  });

  it('emits radius, spacing, and fontSize tokens', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: { sm: '0.25rem', md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--radius-sm: 0.25rem;');
    expect(css).toContain('--radius-md: 0.5rem;');
    expect(css).toContain('--spacing-md: 0.5rem;');
    expect(css).toContain('--font-size-md: 1rem;');
  });

  it('emits dark-mode block when dark tokens are provided', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      dark: {
        colors: { primary: { '500': 'hsl(0 0% 80%)' } },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('.dark {');
    expect(css).toContain('--color-primary-500: hsl(0 0% 80%);');
  });

  it('respects custom scope and darkMode selector', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      dark: {
        colors: { primary: { '500': 'hsl(0 0% 80%)' } },
      },
      scope: '.claim-view-islands',
      darkMode: { selector: '.dark .claim-view-islands' },
    });

    const css = emitCss(theme);
    expect(css).toContain('.claim-view-islands {');
    expect(css).toContain('.dark .claim-view-islands {');
    expect(css).not.toContain(':root {');
  });

  it('emits semantic surface vars referencing color tokens', () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral: { '0': '#fff', '100': '#eee' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      semantic: {
        surface: { default: 'colors.neutral.0', raised: 'colors.neutral.100' },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--surface-default: var(--color-neutral-0);');
    expect(css).toContain('--surface-raised: var(--color-neutral-100);');
  });

  it('output is deterministic — same theme produces identical output', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    expect(emitCss(theme)).toBe(emitCss(theme));
  });

  it('begins with auto-generated header comment', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const css = emitCss(theme);
    expect(css.split('\n')[0]).toMatch(/auto-generated/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: FAIL.

- [ ] **Step 3: Implement emit-css.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/emit-css.ts`:

```ts
import type { ResolvedTheme, ThemeTokens, PartialThemeTokens } from '@soribashi/theme';

const HEADER = `/* auto-generated by @soribashi/codegen — do not edit manually */`;

/**
 * Emits the soribashi theme as a CSS file with custom properties for the
 * configured scope and dark mode selectors.
 *
 * Output structure:
 *   1. Header comment
 *   2. Scope block (e.g. `:root` or `.claim-view-islands`) with all light tokens + semantic vars
 *   3. Dark mode block (e.g. `.dark`) with overridden tokens + semantic vars
 *
 * Token variables follow this naming convention:
 *   --color-{family}-{shade}     e.g. --color-primary-500
 *   --radius-{key}               e.g. --radius-md
 *   --spacing-{key}              e.g. --spacing-lg
 *   --font-size-{key}            e.g. --font-size-md
 *   --shadow-{key}               e.g. --shadow-sm
 *   --font-family-{key}          e.g. --font-family-sans
 *
 * Semantic variables:
 *   --text-{key}                 e.g. --text-muted
 *   --surface-{key}              e.g. --surface-raised
 *   --border-{key}               e.g. --border-default
 */
export function emitCss(theme: ResolvedTheme): string {
  const lines: string[] = [HEADER, ''];

  lines.push(`${theme.scope} {`);
  emitTokenLines(lines, theme.tokens);
  emitSemanticLines(lines, theme);
  lines.push('}');

  if (Object.keys(theme.dark).length > 0) {
    lines.push('');
    lines.push(`${theme.darkMode.selector} {`);
    emitDarkTokenLines(lines, theme.dark);
    lines.push('}');
  }

  return `${lines.join('\n')}\n`;
}

function emitTokenLines(lines: string[], tokens: ThemeTokens): void {
  for (const [family, scale] of Object.entries(tokens.colors).sort(byKey)) {
    for (const [shade, value] of Object.entries(scale).sort(byKey)) {
      lines.push(`  --color-${family}-${shade}: ${value};`);
    }
  }

  for (const [key, value] of Object.entries(tokens.radius).sort(byKey)) {
    lines.push(`  --radius-${key}: ${value};`);
  }

  for (const [key, value] of Object.entries(tokens.spacing).sort(byKey)) {
    lines.push(`  --spacing-${key}: ${value};`);
  }

  for (const [key, value] of Object.entries(tokens.fontSize).sort(byKey)) {
    lines.push(`  --font-size-${key}: ${value};`);
  }

  if (tokens.fontFamily) {
    for (const [key, value] of Object.entries(tokens.fontFamily).sort(byKey)) {
      lines.push(`  --font-family-${key}: ${value};`);
    }
  }

  if (tokens.shadow) {
    for (const [key, value] of Object.entries(tokens.shadow).sort(byKey)) {
      lines.push(`  --shadow-${key}: ${value};`);
    }
  }
}

function emitDarkTokenLines(lines: string[], dark: PartialThemeTokens): void {
  if (dark.colors) {
    for (const [family, scale] of Object.entries(dark.colors).sort(byKey)) {
      for (const [shade, value] of Object.entries(scale ?? {}).sort(byKey)) {
        if (value !== undefined) {
          lines.push(`  --color-${family}-${shade}: ${value};`);
        }
      }
    }
  }

  if (dark.radius) {
    for (const [key, value] of Object.entries(dark.radius).sort(byKey)) {
      if (value !== undefined) lines.push(`  --radius-${key}: ${value};`);
    }
  }

  if (dark.spacing) {
    for (const [key, value] of Object.entries(dark.spacing).sort(byKey)) {
      if (value !== undefined) lines.push(`  --spacing-${key}: ${value};`);
    }
  }

  if (dark.fontSize) {
    for (const [key, value] of Object.entries(dark.fontSize).sort(byKey)) {
      if (value !== undefined) lines.push(`  --font-size-${key}: ${value};`);
    }
  }

  if (dark.shadow) {
    for (const [key, value] of Object.entries(dark.shadow).sort(byKey)) {
      if (value !== undefined) lines.push(`  --shadow-${key}: ${value};`);
    }
  }
}

function emitSemanticLines(lines: string[], theme: ResolvedTheme): void {
  for (const [key, ref] of Object.entries(theme.semantic.text).sort(byKey)) {
    lines.push(`  --text-${key}: ${semanticToVar(ref)};`);
  }

  for (const [key, ref] of Object.entries(theme.semantic.surface).sort(byKey)) {
    lines.push(`  --surface-${key}: ${semanticToVar(ref)};`);
  }

  for (const [key, ref] of Object.entries(theme.semantic.border).sort(byKey)) {
    lines.push(`  --border-${key}: ${semanticToVar(ref)};`);
  }
}

function semanticToVar(ref: string): string {
  // 'colors.neutral.500' -> 'var(--color-neutral-500)'
  // 'radius.md' -> 'var(--radius-md)'
  const parts = ref.split('.');
  if (parts[0] === 'colors' && parts.length === 3) {
    return `var(--color-${parts[1]}-${parts[2]})`;
  }
  if (parts[0] === 'radius' && parts.length === 2) {
    return `var(--radius-${parts[1]})`;
  }
  if (parts[0] === 'spacing' && parts.length === 2) {
    return `var(--spacing-${parts[1]})`;
  }
  if (parts[0] === 'fontSize' && parts.length === 2) {
    return `var(--font-size-${parts[1]})`;
  }
  // Fallback: assume it's already a literal CSS value
  return ref;
}

function byKey([a]: [string, unknown], [b]: [string, unknown]): number {
  return a.localeCompare(b);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emit-css.ts packages/codegen/test/emit-css.test.ts
git commit -m "feat(codegen): emit theme.css with light/dark CSS custom properties"
```

---

## Task 13: Codegen — Emit Tailwind v3 Config

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/emit-tailwind-v3.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/test/emit-tailwind-v3.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { emitTailwindV3 } from '../src/emit-tailwind-v3.ts';

describe('emitTailwindV3', () => {
  it('emits a CommonJS module exporting a theme config', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const config = emitTailwindV3(theme);

    expect(config).toContain('module.exports');
    expect(config).toContain('theme: {');
  });

  it('maps color families to var() references with alpha-value pattern', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(217 91% 60%)' }, brand: { '500': 'hsl(0 100% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const config = emitTailwindV3(theme);
    expect(config).toContain("primary: {");
    expect(config).toContain("'500': 'hsl(var(--color-primary-500) / <alpha-value>)'");
    expect(config).toContain("brand: {");
    expect(config).toContain("'500': 'hsl(var(--color-brand-500) / <alpha-value>)'");
  });

  it('maps radius and spacing to var references (without alpha pattern)', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: { sm: '0.25rem', md: '0.5rem' },
        spacing: { lg: '1rem' },
        fontSize: { md: '1rem' },
      },
    });

    const config = emitTailwindV3(theme);
    expect(config).toContain("borderRadius: {");
    expect(config).toContain("sm: 'var(--radius-sm)'");
    expect(config).toContain("md: 'var(--radius-md)'");
    expect(config).toContain("spacing: {");
    expect(config).toContain("lg: 'var(--spacing-lg)'");
  });

  it('maps fontSize to var references', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: { sm: '0.875rem', md: '1rem' },
      },
    });

    const config = emitTailwindV3(theme);
    expect(config).toContain("fontSize: {");
    expect(config).toContain("sm: 'var(--font-size-sm)'");
    expect(config).toContain("md: 'var(--font-size-md)'");
  });

  it('output is deterministic', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    expect(emitTailwindV3(theme)).toBe(emitTailwindV3(theme));
  });

  it('begins with auto-generated header', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
    });
    const config = emitTailwindV3(theme);
    expect(config.split('\n')[0]).toMatch(/auto-generated/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: FAIL.

- [ ] **Step 3: Implement emit-tailwind-v3.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/emit-tailwind-v3.ts`:

```ts
import type { ResolvedTheme } from '@soribashi/theme';

const HEADER = `/* auto-generated by @soribashi/codegen — do not edit manually */`;

/**
 * Emits a Tailwind v3 config snippet that maps token names to CSS variables.
 *
 * The output is a CommonJS module exporting `{ theme: { colors, borderRadius, spacing, fontSize, ... } }`.
 * Consumers spread it into their own `tailwind.config.js`:
 *
 *   const generated = require('./tailwind.config.generated.js');
 *   module.exports = { ...generated, content: [...], plugins: [...] };
 *
 * Color families use the `<alpha-value>` pattern so utility classes like
 * `bg-primary-500/50` work correctly. This matches the production pattern
 * already in use at apps/adjuster/src/components/ClaimViewIslands/tailwind.config.js.
 */
export function emitTailwindV3(theme: ResolvedTheme): string {
  const lines: string[] = [HEADER, ''];
  lines.push('module.exports = {');
  lines.push('  theme: {');

  // colors
  if (Object.keys(theme.tokens.colors).length > 0) {
    lines.push('    colors: {');
    const families = Object.entries(theme.tokens.colors).sort(byKey);
    for (const [family, scale] of families) {
      lines.push(`      ${family}: {`);
      const shades = Object.entries(scale).sort(byKey);
      for (const [shade, _] of shades) {
        lines.push(
          `        '${shade}': 'hsl(var(--color-${family}-${shade}) / <alpha-value>)',`
        );
      }
      lines.push('      },');
    }
    lines.push('    },');
  }

  // borderRadius
  emitVarMap(lines, theme.tokens.radius, 'borderRadius', 'radius', 4);

  // spacing
  emitVarMap(lines, theme.tokens.spacing, 'spacing', 'spacing', 4);

  // fontSize
  emitVarMap(lines, theme.tokens.fontSize, 'fontSize', 'font-size', 4);

  // fontFamily
  if (theme.tokens.fontFamily) {
    emitVarMap(lines, theme.tokens.fontFamily, 'fontFamily', 'font-family', 4);
  }

  // shadow
  if (theme.tokens.shadow) {
    emitVarMap(lines, theme.tokens.shadow, 'boxShadow', 'shadow', 4);
  }

  // breakpoints / screens
  if (theme.tokens.breakpoint) {
    lines.push('    screens: {');
    const entries = Object.entries(theme.tokens.breakpoint).sort(byKey);
    for (const [key, value] of entries) {
      lines.push(`      ${key}: '${value}',`);
    }
    lines.push('    },');
  }

  lines.push('  },');
  lines.push('};');

  return `${lines.join('\n')}\n`;
}

function emitVarMap(
  lines: string[],
  source: Record<string, string>,
  configKey: string,
  varPrefix: string,
  indent: number
): void {
  if (Object.keys(source).length === 0) return;
  const pad = ' '.repeat(indent);
  lines.push(`${pad}${configKey}: {`);
  const entries = Object.entries(source).sort(byKey);
  for (const [key, _] of entries) {
    lines.push(`${pad}  ${quoteIfNeeded(key)}: 'var(--${varPrefix}-${key})',`);
  }
  lines.push(`${pad}},`);
}

function quoteIfNeeded(key: string): string {
  // Quote if key starts with digit or contains anything besides identifier chars.
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return key;
  return `'${key}'`;
}

function byKey([a]: [string, unknown], [b]: [string, unknown]): number {
  return a.localeCompare(b);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emit-tailwind-v3.ts packages/codegen/test/emit-tailwind-v3.test.ts
git commit -m "feat(codegen): emit Tailwind v3 config from theme with var() refs"
```

---

## Task 14: Codegen — Emit Tailwind v4 @theme block

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/emit-tailwind-v4.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/test/emit-tailwind-v4.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { emitTailwindV4 } from '../src/emit-tailwind-v4.ts';

describe('emitTailwindV4', () => {
  it('wraps tokens in @theme block', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitTailwindV4(theme);
    expect(css).toContain('@theme {');
    expect(css).toContain('}');
  });

  it('emits color tokens directly (no alpha pattern)', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(217 91% 60%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitTailwindV4(theme);
    expect(css).toContain('--color-primary-500: hsl(217 91% 60%);');
  });

  it('emits radius, spacing, fontSize tokens', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: { md: '0.5rem' },
        spacing: { lg: '1rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitTailwindV4(theme);
    expect(css).toContain('--radius-md: 0.5rem;');
    expect(css).toContain('--spacing-lg: 1rem;');
    expect(css).toContain('--font-size-md: 1rem;');
  });

  it('output is deterministic', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    expect(emitTailwindV4(theme)).toBe(emitTailwindV4(theme));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: FAIL.

- [ ] **Step 3: Implement emit-tailwind-v4.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/emit-tailwind-v4.ts`:

```ts
import type { ResolvedTheme } from '@soribashi/theme';

const HEADER = `/* auto-generated by @soribashi/codegen — do not edit manually */`;

/**
 * Emits a Tailwind v4 `@theme` block from the soribashi theme.
 *
 * In Tailwind v4, CSS is the source of truth for tokens — utility classes
 * are generated automatically from `@theme { --color-xxx: ...; }` blocks.
 *
 * Consumer imports the output:
 *   @import 'tailwindcss';
 *   @import './generated/theme.tailwind.css';
 */
export function emitTailwindV4(theme: ResolvedTheme): string {
  const lines: string[] = [HEADER, ''];
  lines.push('@theme {');

  for (const [family, scale] of Object.entries(theme.tokens.colors).sort(byKey)) {
    for (const [shade, value] of Object.entries(scale).sort(byKey)) {
      lines.push(`  --color-${family}-${shade}: ${value};`);
    }
  }

  for (const [key, value] of Object.entries(theme.tokens.radius).sort(byKey)) {
    lines.push(`  --radius-${key}: ${value};`);
  }

  for (const [key, value] of Object.entries(theme.tokens.spacing).sort(byKey)) {
    lines.push(`  --spacing-${key}: ${value};`);
  }

  for (const [key, value] of Object.entries(theme.tokens.fontSize).sort(byKey)) {
    lines.push(`  --font-size-${key}: ${value};`);
  }

  if (theme.tokens.fontFamily) {
    for (const [key, value] of Object.entries(theme.tokens.fontFamily).sort(byKey)) {
      lines.push(`  --font-family-${key}: ${value};`);
    }
  }

  if (theme.tokens.shadow) {
    for (const [key, value] of Object.entries(theme.tokens.shadow).sort(byKey)) {
      lines.push(`  --shadow-${key}: ${value};`);
    }
  }

  if (theme.tokens.breakpoint) {
    for (const [key, value] of Object.entries(theme.tokens.breakpoint).sort(byKey)) {
      lines.push(`  --breakpoint-${key}: ${value};`);
    }
  }

  lines.push('}');

  return `${lines.join('\n')}\n`;
}

function byKey([a]: [string, unknown], [b]: [string, unknown]): number {
  return a.localeCompare(b);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emit-tailwind-v4.ts packages/codegen/test/emit-tailwind-v4.test.ts
git commit -m "feat(codegen): emit Tailwind v4 @theme block from theme"
```

---

## Task 15: Codegen — Config Loader

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/types.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/load-config.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/test/load-config.test.ts`:

```ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../src/load-config.ts';

describe('loadConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'soribashi-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads a config from soribashi.config.ts', async () => {
    const themePath = join(tempDir, 'theme.ts');
    const configPath = join(tempDir, 'soribashi.config.ts');

    writeFileSync(
      themePath,
      `import { createTheme } from '@soribashi/theme';
       export const theme = createTheme({
         tokens: { colors: { primary: { '500': '#000' } }, radius: {}, spacing: {}, fontSize: {} },
       });`
    );

    writeFileSync(
      configPath,
      `import { theme } from './theme.ts';
       export default {
         theme,
         output: {
           css: './generated/theme.css',
           tailwind: { mode: 'v3', configPath: './generated/tailwind.config.generated.js' },
         },
       };`
    );

    const config = await loadConfig(configPath);
    expect(config.theme.tokens.colors.primary?.['500']).toBe('#000');
    expect(config.output.css).toBe('./generated/theme.css');
    expect(config.output.tailwind?.mode).toBe('v3');
  });

  it('throws a clear error if the config has no default export', async () => {
    const configPath = join(tempDir, 'soribashi.config.ts');
    writeFileSync(configPath, `export const x = 1;`);

    await expect(loadConfig(configPath)).rejects.toThrow(/default export/);
  });

  it('throws a clear error if the config has no theme field', async () => {
    const configPath = join(tempDir, 'soribashi.config.ts');
    writeFileSync(
      configPath,
      `export default { output: { css: './out.css' } };`
    );

    await expect(loadConfig(configPath)).rejects.toThrow(/theme/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: FAIL.

- [ ] **Step 3: Implement types.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/types.ts`:

```ts
import type { ResolvedTheme } from '@soribashi/theme';

export interface CodegenOutput {
  /** Path (relative to project root) where theme.css will be written */
  css: string;
  /** Optional Tailwind output config */
  tailwind?: TailwindOutput;
}

export type TailwindOutput =
  | { mode: 'v3'; configPath: string }
  | { mode: 'v4'; themeCssPath: string }
  | { mode: 'both'; configPath: string; themeCssPath: string };

export interface CodegenConfig {
  theme: ResolvedTheme;
  output: CodegenOutput;
  /** Glob patterns to watch in dev mode */
  watch?: string[];
}
```

- [ ] **Step 4: Implement load-config.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/load-config.ts`:

```ts
import { pathToFileURL } from 'node:url';
import type { CodegenConfig } from './types.ts';

/**
 * Loads a soribashi config from a TypeScript or JavaScript file.
 *
 * The config file must:
 *   - export a default object
 *   - that object must have a `theme` field (a ResolvedTheme from createTheme)
 *   - that object must have an `output.css` path
 *
 * Bun's native TS loader handles the import.
 */
export async function loadConfig(absolutePath: string): Promise<CodegenConfig> {
  const url = pathToFileURL(absolutePath).toString();
  const mod = await import(url);

  if (!mod.default) {
    throw new Error(
      `[soribashi] Config at ${absolutePath} must have a default export. Found: ${Object.keys(
        mod
      ).join(', ')}`
    );
  }

  const config = mod.default as Partial<CodegenConfig>;

  if (!config.theme) {
    throw new Error(
      `[soribashi] Config at ${absolutePath} must have a "theme" field (use createTheme() from @soribashi/theme).`
    );
  }

  if (!config.output?.css) {
    throw new Error(
      `[soribashi] Config at ${absolutePath} must have "output.css" set to the output path for theme.css.`
    );
  }

  return config as CodegenConfig;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/types.ts packages/codegen/src/load-config.ts packages/codegen/test/load-config.test.ts
git commit -m "feat(codegen): add config loader with default-export and field validation"
```

---

## Task 16: Codegen — Build Function (Combines Emitters)

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/build.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/test/build.test.ts`:

```ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTheme } from '@soribashi/theme';
import { build } from '../src/build.ts';

describe('build', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'soribashi-build-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes theme.css to output.css path', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    await build({
      theme,
      output: { css: cssPath },
    });

    expect(existsSync(cssPath)).toBe(true);
    const content = readFileSync(cssPath, 'utf-8');
    expect(content).toContain('--color-primary-500');
  });

  it('writes Tailwind v3 config when mode=v3', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: {},
        fontSize: {},
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    const configPath = join(tempDir, 'tailwind.config.generated.js');
    await build({
      theme,
      output: {
        css: cssPath,
        tailwind: { mode: 'v3', configPath },
      },
    });

    expect(existsSync(configPath)).toBe(true);
    const content = readFileSync(configPath, 'utf-8');
    expect(content).toContain('module.exports');
    expect(content).toContain('hsl(var(--color-primary-500)');
  });

  it('writes Tailwind v4 css when mode=v4', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    const themeCssPath = join(tempDir, 'theme.tailwind.css');
    await build({
      theme,
      output: {
        css: cssPath,
        tailwind: { mode: 'v4', themeCssPath },
      },
    });

    expect(existsSync(themeCssPath)).toBe(true);
    const content = readFileSync(themeCssPath, 'utf-8');
    expect(content).toContain('@theme {');
  });

  it('writes both v3 and v4 outputs when mode=both', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    const configPath = join(tempDir, 'tailwind.config.generated.js');
    const themeCssPath = join(tempDir, 'theme.tailwind.css');
    await build({
      theme,
      output: {
        css: cssPath,
        tailwind: { mode: 'both', configPath, themeCssPath },
      },
    });

    expect(existsSync(configPath)).toBe(true);
    expect(existsSync(themeCssPath)).toBe(true);
  });

  it('creates parent directories as needed', async () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
    });
    const cssPath = join(tempDir, 'nested/dir/theme.css');
    await build({
      theme,
      output: { css: cssPath },
    });
    expect(existsSync(cssPath)).toBe(true);
  });

  it('returns a result describing what was written', async () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
    });
    const cssPath = join(tempDir, 'theme.css');
    const result = await build({
      theme,
      output: { css: cssPath },
    });

    expect(result.written).toContain(cssPath);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: FAIL.

- [ ] **Step 3: Implement build.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/build.ts`:

```ts
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { CodegenConfig } from './types.ts';
import { emitCss } from './emit-css.ts';
import { emitTailwindV3 } from './emit-tailwind-v3.ts';
import { emitTailwindV4 } from './emit-tailwind-v4.ts';

export interface BuildResult {
  written: string[];
}

/**
 * Runs all configured emitters and writes outputs to disk.
 * Creates parent directories as needed. Returns the list of written paths.
 */
export async function build(config: CodegenConfig): Promise<BuildResult> {
  const written: string[] = [];

  // Always emit theme.css
  await writeFileEnsureDir(config.output.css, emitCss(config.theme));
  written.push(config.output.css);

  if (config.output.tailwind) {
    const tw = config.output.tailwind;
    if (tw.mode === 'v3') {
      await writeFileEnsureDir(tw.configPath, emitTailwindV3(config.theme));
      written.push(tw.configPath);
    } else if (tw.mode === 'v4') {
      await writeFileEnsureDir(tw.themeCssPath, emitTailwindV4(config.theme));
      written.push(tw.themeCssPath);
    } else if (tw.mode === 'both') {
      await writeFileEnsureDir(tw.configPath, emitTailwindV3(config.theme));
      written.push(tw.configPath);
      await writeFileEnsureDir(tw.themeCssPath, emitTailwindV4(config.theme));
      written.push(tw.themeCssPath);
    }
  }

  return { written };
}

async function writeFileEnsureDir(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, 'utf-8');
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/build.ts packages/codegen/test/build.test.ts
git commit -m "feat(codegen): add build() that runs all emitters and writes to disk"
```

---

## Task 17: Codegen — File Watcher

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/watch.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/test/watch.test.ts`:

```ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTheme } from '@soribashi/theme';
import { watch } from '../src/watch.ts';
import type { CodegenConfig } from '../src/types.ts';

describe('watch', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'soribashi-watch-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('runs an initial build immediately and returns a stop function', async () => {
    const theme = createTheme({
      tokens: { colors: { primary: { '500': '#000' } }, radius: {}, spacing: {}, fontSize: {} },
    });
    const cssPath = join(tempDir, 'theme.css');
    const config: CodegenConfig = {
      theme,
      output: { css: cssPath },
      watch: [join(tempDir, 'src/**')],
    };

    const handle = await watch(config, { silent: true });
    try {
      expect(existsSync(cssPath)).toBe(true);
      const initialContent = readFileSync(cssPath, 'utf-8');
      expect(initialContent).toContain('--color-primary-500');
      expect(typeof handle.stop).toBe('function');
    } finally {
      await handle.stop();
    }
  });

  it('rebuilds when a watched file changes', async () => {
    // This test uses a manual trigger pattern to keep test deterministic.
    // Real watcher integration uses fs.watch which is platform-dependent.
    const theme = createTheme({
      tokens: { colors: { primary: { '500': '#000' } }, radius: {}, spacing: {}, fontSize: {} },
    });
    const cssPath = join(tempDir, 'theme.css');
    const config: CodegenConfig = {
      theme,
      output: { css: cssPath },
      watch: [join(tempDir, 'trigger.txt')],
    };

    const handle = await watch(config, { silent: true });
    try {
      const before = readFileSync(cssPath, 'utf-8');
      // Manually trigger rebuild
      await handle.rebuild();
      const after = readFileSync(cssPath, 'utf-8');
      expect(after).toBe(before); // Same theme = same output
    } finally {
      await handle.stop();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: FAIL.

- [ ] **Step 3: Implement watch.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/watch.ts`:

```ts
import { watch as fsWatch } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { CodegenConfig } from './types.ts';
import { build } from './build.ts';

export interface WatchHandle {
  /** Stop watching. */
  stop: () => Promise<void>;
  /** Manually trigger a rebuild (used for tests; ordinary use relies on fs events). */
  rebuild: () => Promise<void>;
}

export interface WatchOptions {
  /** Suppress console.log output. */
  silent?: boolean;
}

/**
 * Runs an initial build, then watches the configured paths for changes and
 * re-runs the build on each change.
 *
 * Note: this watcher uses node's `fs.watch` which has platform-dependent
 * behavior. For production use with complex glob patterns, consider replacing
 * with a more robust watcher in v1.1.
 */
export async function watch(
  config: CodegenConfig,
  options: WatchOptions = {}
): Promise<WatchHandle> {
  let isRunning = false;
  const log = options.silent ? () => {} : console.log;

  const runBuild = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const start = Date.now();
      const result = await build(config);
      log(`[soribashi] built in ${Date.now() - start}ms (${result.written.length} files)`);
    } catch (error) {
      console.error('[soribashi] build failed:', error);
    } finally {
      isRunning = false;
    }
  };

  // Initial build
  await runBuild();

  // Set up watchers (one per directory, since fs.watch on a glob isn't standard)
  const watchers = (config.watch ?? []).map((pattern) => {
    const dir = patternToDir(pattern);
    return fsWatch(dir, { recursive: true }, () => {
      runBuild().catch(() => {});
    });
  });

  return {
    stop: async () => {
      for (const w of watchers) w.close();
    },
    rebuild: runBuild,
  };
}

/**
 * Crude glob-to-directory: takes everything before the first `*` or `?`.
 * Intentionally simple. v1.1 can swap in a real glob walker.
 */
function patternToDir(pattern: string): string {
  const idx = pattern.search(/[*?[]/);
  const dirPart = idx === -1 ? pattern : pattern.slice(0, idx);
  return resolve(dirname(dirPart));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/watch.ts packages/codegen/test/watch.test.ts
git commit -m "feat(codegen): add watch() with initial build and re-run on file changes"
```

---

## Task 18: Codegen — CLI Binary

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/cli.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/bin/soribashi.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/test/cli.test.ts`:

```ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runCli } from '../src/cli.ts';

describe('runCli', () => {
  let tempDir: string;
  let oldCwd: string;

  beforeEach(() => {
    oldCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'soribashi-cli-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(oldCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('build subcommand reads soribashi.config.ts and writes outputs', async () => {
    writeFileSync(
      join(tempDir, 'theme.ts'),
      `import { createTheme } from '@soribashi/theme';
       export const theme = createTheme({
         tokens: { colors: { primary: { '500': '#000' } }, radius: {}, spacing: {}, fontSize: {} },
       });`
    );

    writeFileSync(
      join(tempDir, 'soribashi.config.ts'),
      `import { theme } from './theme.ts';
       export default {
         theme,
         output: { css: './theme.css' },
       };`
    );

    const exitCode = await runCli(['build'], { cwd: tempDir, silent: true });
    expect(exitCode).toBe(0);
    expect(existsSync(join(tempDir, 'theme.css'))).toBe(true);
  });

  it('exits with code 1 if no config found', async () => {
    const exitCode = await runCli(['build'], { cwd: tempDir, silent: true });
    expect(exitCode).toBe(1);
  });

  it('exits with code 1 on unknown command', async () => {
    const exitCode = await runCli(['frobnicate'], { cwd: tempDir, silent: true });
    expect(exitCode).toBe(1);
  });

  it('--config flag overrides default lookup', async () => {
    writeFileSync(
      join(tempDir, 'theme.ts'),
      `import { createTheme } from '@soribashi/theme';
       export const theme = createTheme({
         tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
       });`
    );

    writeFileSync(
      join(tempDir, 'my-config.ts'),
      `import { theme } from './theme.ts';
       export default { theme, output: { css: './out.css' } };`
    );

    const exitCode = await runCli(
      ['build', '--config', './my-config.ts'],
      { cwd: tempDir, silent: true }
    );
    expect(exitCode).toBe(0);
    expect(existsSync(join(tempDir, 'out.css'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: FAIL.

- [ ] **Step 3: Implement cli.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/cli.ts`:

```ts
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';
import { loadConfig } from './load-config.ts';
import { build } from './build.ts';
import { watch } from './watch.ts';

export interface CliOptions {
  cwd?: string;
  silent?: boolean;
}

const DEFAULT_CONFIG_NAMES = [
  'soribashi.config.ts',
  'soribashi.config.js',
  'soribashi.config.mjs',
];

export async function runCli(argv: string[], options: CliOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const log = options.silent ? () => {} : console.log;
  const error = options.silent ? () => {} : console.error;

  const command = argv[0];

  if (!command || (command !== 'build' && command !== 'watch')) {
    error(`Usage: soribashi <build|watch> [--config <path>]`);
    error(`Unknown command: ${command ?? '(none)'}`);
    return 1;
  }

  const configFlag = parseConfigFlag(argv);
  const configPath = configFlag
    ? resolve(cwd, configFlag)
    : findConfig(cwd);

  if (!configPath) {
    error(`[soribashi] No config found. Looked for: ${DEFAULT_CONFIG_NAMES.join(', ')} in ${cwd}`);
    return 1;
  }

  if (!existsSync(configPath)) {
    error(`[soribashi] Config file does not exist: ${configPath}`);
    return 1;
  }

  try {
    const config = await loadConfig(configPath);

    if (command === 'build') {
      const result = await build(config);
      log(`[soribashi] wrote ${result.written.length} file(s):`);
      for (const path of result.written) log(`  ${path}`);
      return 0;
    }

    if (command === 'watch') {
      const handle = await watch(config, { silent: options.silent });
      log(`[soribashi] watching for changes... (Ctrl+C to stop)`);
      // Block on a never-resolving promise so the process stays alive.
      // Tests don't reach this branch.
      await new Promise(() => {});
      // Unreachable, but TS appeasement:
      await handle.stop();
      return 0;
    }

    return 1;
  } catch (err) {
    error(`[soribashi] error: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
}

function parseConfigFlag(argv: string[]): string | null {
  const idx = argv.indexOf('--config');
  if (idx === -1 || idx === argv.length - 1) return null;
  return argv[idx + 1] ?? null;
}

function findConfig(cwd: string): string | null {
  for (const name of DEFAULT_CONFIG_NAMES) {
    const path = join(cwd, name);
    if (existsSync(path)) return path;
  }
  return null;
}
```

- [ ] **Step 4: Implement bin/soribashi.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/bin/soribashi.ts`:

```ts
#!/usr/bin/env bun
import { runCli } from '../src/cli.ts';

const exitCode = await runCli(process.argv.slice(2));
process.exit(exitCode);
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/cli.ts packages/codegen/bin/ packages/codegen/test/cli.test.ts
git commit -m "feat(codegen): add CLI with build/watch commands and --config flag"
```

---

## Task 19: Codegen Package Public API

**Files:**
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/index.ts`

- [ ] **Step 1: Update src/index.ts**

Replace `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/index.ts`:

```ts
// @soribashi/codegen — public API

export { build } from './build.ts';
export { watch } from './watch.ts';
export { loadConfig } from './load-config.ts';
export { emitCss } from './emit-css.ts';
export { emitTailwindV3 } from './emit-tailwind-v3.ts';
export { emitTailwindV4 } from './emit-tailwind-v4.ts';
export { runCli } from './cli.ts';

export type { CodegenConfig, CodegenOutput, TailwindOutput } from './types.ts';
export type { BuildResult } from './build.ts';
export type { WatchHandle, WatchOptions } from './watch.ts';
export type { CliOptions } from './cli.ts';
```

- [ ] **Step 2: Add a smoke test for the public API**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/test/index.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import * as codegen from '../src/index.ts';

describe('@soribashi/codegen public API', () => {
  it('exports all expected functions', () => {
    expect(typeof codegen.build).toBe('function');
    expect(typeof codegen.watch).toBe('function');
    expect(typeof codegen.loadConfig).toBe('function');
    expect(typeof codegen.emitCss).toBe('function');
    expect(typeof codegen.emitTailwindV3).toBe('function');
    expect(typeof codegen.emitTailwindV4).toBe('function');
    expect(typeof codegen.runCli).toBe('function');
  });
});
```

- [ ] **Step 3: Run test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/src/index.ts packages/codegen/test/index.test.ts
git commit -m "feat(codegen): finalize @soribashi/codegen public API"
```

---

## Task 20: Token Roundtrip Integration Test

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/test/roundtrip.test.ts`

This is the **key proof** from § 12.2 of the spec: a token added to the theme survives all the way through codegen and produces the right CSS variable.

- [ ] **Step 1: Write the integration test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/codegen/test/roundtrip.test.ts`:

```ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTheme } from '@soribashi/theme';
import { build } from '../src/build.ts';

describe('token roundtrip integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'soribashi-roundtrip-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('a new color family added to the theme appears in both theme.css and tailwind config', async () => {
    // 1. Add a new color family to the theme
    const theme = createTheme({
      tokens: {
        colors: {
          primary: { '500': 'hsl(217 91% 60%)' },
          // NEW: brand color family added by the team
          brand: {
            '50': 'hsl(160 100% 95%)',
            '500': 'hsl(160 84% 39%)',
            '900': 'hsl(160 84% 12%)',
          },
        },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    // 2. Run codegen
    const cssPath = join(tempDir, 'theme.css');
    const tailwindPath = join(tempDir, 'tailwind.config.generated.js');
    await build({
      theme,
      output: {
        css: cssPath,
        tailwind: { mode: 'v3', configPath: tailwindPath },
      },
    });

    // 3. Verify theme.css contains the new variable
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('--color-brand-50: hsl(160 100% 95%);');
    expect(css).toContain('--color-brand-500: hsl(160 84% 39%);');
    expect(css).toContain('--color-brand-900: hsl(160 84% 12%);');

    // 4. Verify Tailwind config exposes the new family
    const tw = readFileSync(tailwindPath, 'utf-8');
    expect(tw).toContain('brand:');
    expect(tw).toContain("'500': 'hsl(var(--color-brand-500) / <alpha-value>)'");
  });

  it('a removed color family disappears from outputs', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    await build({
      theme,
      output: { css: cssPath },
    });

    const css = readFileSync(cssPath, 'utf-8');
    expect(css).not.toContain('--color-brand');
    expect(css).not.toContain('--color-secondary');
  });

  it('extending a base theme produces inherited + new tokens', async () => {
    const baseTheme = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: {},
        fontSize: {},
      },
      name: 'base',
    });

    const tenantTheme = createTheme({
      extends: baseTheme,
      tokens: {
        colors: { brand: { '500': '#ff0' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
      name: 'tenant',
    });

    const cssPath = join(tempDir, 'theme.css');
    await build({
      theme: tenantTheme,
      output: { css: cssPath },
    });

    const css = readFileSync(cssPath, 'utf-8');
    // Inherited
    expect(css).toContain('--color-primary-500: #aaa;');
    expect(css).toContain('--radius-md: 0.5rem;');
    // New
    expect(css).toContain('--color-brand-500: #ff0;');
  });

  it('custom scope and dark mode propagate through codegen end-to-end', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(217 91% 60%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
      dark: {
        colors: { primary: { '500': 'hsl(217 91% 80%)' } },
      },
      scope: '.claim-view-islands',
      darkMode: { selector: '.dark .claim-view-islands' },
    });

    const cssPath = join(tempDir, 'theme.css');
    await build({
      theme,
      output: { css: cssPath },
    });

    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('.claim-view-islands {');
    expect(css).toContain('.dark .claim-view-islands {');
    expect(css).not.toContain(':root {');
  });

  it('semantic surface tokens reach the emitted CSS', async () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral: { '0': '#fff', '50': '#fafafa', '100': '#f4f4f5' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
      semantic: {
        surface: {
          canvas: 'colors.neutral.50',
          default: 'colors.neutral.0',
          raised: 'colors.neutral.100',
        },
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    await build({
      theme,
      output: { css: cssPath },
    });

    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('--surface-canvas: var(--color-neutral-50);');
    expect(css).toContain('--surface-default: var(--color-neutral-0);');
    expect(css).toContain('--surface-raised: var(--color-neutral-100);');
  });

  it('byte-identical output across runs (determinism)', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' }, brand: { '500': '#fff' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const cssPath1 = join(tempDir, 'theme1.css');
    const cssPath2 = join(tempDir, 'theme2.css');
    await build({ theme, output: { css: cssPath1 } });
    await build({ theme, output: { css: cssPath2 } });

    const a = readFileSync(cssPath1, 'utf-8');
    const b = readFileSync(cssPath2, 'utf-8');
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: Run the integration test**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/codegen
bun test test/roundtrip.test.ts
```

Expected: PASS — every test green.

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/test/roundtrip.test.ts
git commit -m "test(codegen): add token roundtrip integration tests proving theme→CSS→Tailwind flow"
```

---

## Task 21: Vitest Workspace Configuration

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/vitest.workspace.ts`

- [ ] **Step 1: Write workspace config**

Create `/Users/matt/Documents/GitHub/soribashi/vitest.workspace.ts`:

```ts
export default [
  './packages/theme/vitest.config.ts',
  './packages/codegen/vitest.config.ts',
];
```

- [ ] **Step 2: Run all workspace tests from root**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun test
```

Expected: All theme + codegen tests pass.

- [ ] **Step 3: Commit**

```bash
git add vitest.workspace.ts
git commit -m "chore: add vitest workspace config to run all package tests from root"
```

---

## Task 22: Root TypeScript Project References

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/tsconfig.json`

- [ ] **Step 1: Create root tsconfig.json**

Create `/Users/matt/Documents/GitHub/soribashi/tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/theme" },
    { "path": "./packages/codegen" }
  ]
}
```

- [ ] **Step 2: Update each package tsconfig with composite mode**

Edit `/Users/matt/Documents/GitHub/soribashi/packages/theme/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

Edit `/Users/matt/Documents/GitHub/soribashi/packages/codegen/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../theme" }
  ],
  "include": ["src/**/*", "test/**/*", "bin/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Verify the workspace typechecks**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun run typecheck
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json packages/theme/tsconfig.json packages/codegen/tsconfig.json
git commit -m "chore: add TypeScript project references for incremental builds"
```

---

## Task 23: Final Smoke Test — Run Everything from Root

- [ ] **Step 1: Verify all tests pass from root**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun test
```

Expected: All tests pass across both packages. Output should show ~50+ tests passing.

- [ ] **Step 2: Verify typecheck passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun run typecheck
```

Expected: No errors.

- [ ] **Step 3: Verify biome is happy**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun run lint
```

Expected: No errors. (Warnings about `noExplicitAny` are acceptable; they were configured as warnings.)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit --allow-empty -m "chore: Plan 1 (foundation) complete — workspace, theme, codegen, roundtrip tests passing"
```

---

## Acceptance Criteria

Plan 1 is complete when:

1. `bun install` works at the workspace root.
2. `bun test` from the root runs every test in `packages/theme` and `packages/codegen` and they all pass.
3. `bun run typecheck` succeeds with zero errors.
4. The token roundtrip integration test (`packages/codegen/test/roundtrip.test.ts`) passes — adding/removing/extending tokens flows through to emitted CSS and Tailwind config correctly.
5. The CLI works: `bun run packages/codegen/bin/soribashi.ts build` from a directory with a valid `soribashi.config.ts` produces the expected outputs.
6. `git log --oneline` shows ~25 atomic commits, one per logical step.

## What's NOT in this plan (deferred)

- `@soribashi/factory` — Plan 2
- `defineComponent`, `useProps`, `useStyles` — Plan 2
- `defineGenericComponent`, `definePolymorphicComponent` — Plan 3
- `@soribashi/blocks` — Plan 4
- Playground app — Plan 5
- `tailwindPassthrough` for Tremor escape — likely Plan 5 (defer until needed)
- Token override audit/lint — post-v1
