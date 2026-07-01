# Wave 1 — Token Consolidation + Button Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the host library's fragmented token system into one focused soribashi theme, prove it by authoring Button against the consolidated theme, and write the Wave 1 partial playbook synthesizing methodology + gaps + future-wave outline.

**Architecture:** New standalone Vite app `apps/pilot/` alongside `apps/playground`. The pilot owns its own consolidated `theme/index.ts` (Wave 1 deliverable), drives soribashi codegen via a per-app `soribashi.config.ts`, composes the generated Tailwind config via the host wrapper pattern (Option C from the spec — north star is Option A), and exposes one Button recipe authored with `defineComponent`. Two new docs (`docs/superpowers/pilots/{token-consolidation, button-conversion}.md`) capture findings; one playbook (`docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md`) synthesizes them.

**Tech Stack:** Vite 6, React 18, TypeScript 5.7, Tailwind CSS 3.4, `@soribashi/core` (workspace), Vitest 2, Playwright 1.59, bun (package manager + script runner).

**Spec reference:** `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md` (commit `6989d65`).

**External references this plan reads from (READ-ONLY — do not modify):**
- `<host-library-path>/tailwind.config.js`
- `<host-library-path>/host-styles.css`
- `<host-library-path>/Buttons/Button.tsx`
- `<host-library-path>/HOST_ARCHITECTURE.md`

---

## File Map

### Created files

```
apps/pilot/
├── index.html
├── package.json
├── postcss.config.js
├── soribashi.config.ts                  # per-app codegen config
├── tailwind.config.js                   # composes generated + host concerns
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── theme/
│   │   └── index.ts                     # CONSOLIDATED soribashi theme (Wave 1 deliverable)
│   ├── generated/
│   │   ├── theme.css                    # codegen output
│   │   └── tailwind.config.generated.js # codegen output
│   ├── reference/
│   │   └── original-button/           # vendored snapshot of the host library's Button (read-only)
│   ├── recipes/
│   │   └── Button/
│   │       ├── Button.tsx               # the recipe
│   │       ├── Button.css               # recipe styles, consolidated tokens only
│   │       └── Button.test.tsx          # vitest behavior tests
│   └── pages/
│       ├── TokenReview.tsx              # token swatch grid, light + dark
│       ├── ScreenReplica.tsx            # static host-screen replica
│       └── ButtonMatrix.tsx             # variant × intent × size × state matrix
└── tests/
    └── button-computed-styles.spec.ts   # Playwright parity tests

docs/superpowers/pilots/                  # new directory
├── 2026-04-26-token-consolidation.md
└── 2026-04-26-button-conversion.md

docs/superpowers/specs/
└── 2026-04-26-recipe-conversion-playbook.md
```

### Modified files

- `package.json` — add `dev:pilot`, `codegen:pilot`, `build:pilot` scripts.
- `playwright.config.ts` — add a second project + second webServer for the pilot.
- `vitest.workspace.ts` — add the pilot's vitest config.

### Untouched (explicit exclusion)

- Anything in `<host-monorepo-path>/`. Wave 1 never writes there.
- `apps/playground/` and any of its files. The pilot is standalone.
- `packages/*/` source. If a soribashi gap surfaces that requires a packages change, log it in the appropriate journal — do NOT modify packages in this plan unless explicitly authorized.

---

# Phase 0 — Token Consolidation Pass

The bulk of Wave 1. Phase 0 builds the pilot host app, inventories the host library's tokens, classifies them, expresses the kept set as a soribashi theme, runs codegen, wires it into Tailwind, and validates with a TokenReview swatch page + a static ScreenReplica. Phase 0 ends with the consolidation journal committed.

---

## Task 0.1: Scaffold the pilot app skeleton (no theme yet)

**Goal:** Get a buildable, runnable empty Vite app at `apps/pilot/` with a "Hello, pilot" page, before any soribashi wiring.

**Files:**
- Create: `apps/pilot/package.json`
- Create: `apps/pilot/tsconfig.json`
- Create: `apps/pilot/vite.config.ts`
- Create: `apps/pilot/index.html`
- Create: `apps/pilot/postcss.config.js`
- Create: `apps/pilot/src/main.tsx`
- Create: `apps/pilot/src/App.tsx`
- Create: `apps/pilot/src/styles.css`

- [ ] **Step 1: Create `apps/pilot/package.json`**

```json
{
  "name": "@soribashi/pilot",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@soribashi/codegen": "workspace:*",
    "@soribashi/core": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.0",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5.7.2",
    "vite": "^6.0.0"
  }
}
```

Note: `tailwindcss-animate` is a new dep — it's the one the host library uses, included so the pilot mirrors that surface.

- [ ] **Step 2: Create `apps/pilot/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Create `apps/pilot/vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
});
```

Port 5174 is intentional — playground holds 5173.

- [ ] **Step 4: Create `apps/pilot/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create `apps/pilot/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Soribashi · Recipe Pilot</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `apps/pilot/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 7: Create `apps/pilot/src/App.tsx` (placeholder for now)**

```tsx
export function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Recipe Pilot</h1>
      <p>Phase 0 scaffolding. Theme + pages added in subsequent tasks.</p>
    </div>
  );
}
```

- [ ] **Step 8: Create `apps/pilot/src/styles.css` (minimal — Tailwind directives added in Task 0.7)**

```css
body {
  margin: 0;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 9: Install workspace deps**

Run: `bun install`
Expected: pulls `tailwindcss-animate` and links `@soribashi/{codegen,core}` to the new app.

- [ ] **Step 10: Boot the dev server and verify**

Run: `bun run --filter @soribashi/pilot dev`
Expected: Vite logs "Local: http://localhost:5174/". In a browser the page shows "Recipe Pilot · Phase 0 scaffolding...".
Stop the server (Ctrl+C) before continuing.

- [ ] **Step 11: Commit**

```bash
git add apps/pilot/
git commit -m "$(cat <<'EOF'
feat(pilot): scaffold empty Vite app at port 5174

Wave 1 Phase 0 task 0.1. Empty React/Vite/TS scaffolding for the
pilot host app. No theme, no Tailwind, no soribashi wiring yet —
those come in subsequent tasks. Standalone from apps/playground.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 0.2: Inventory the host library's tokens

**Goal:** Produce the complete inventory table — every token defined in the host library's Tailwind + CSS — as the data input for classification.

**Files:**
- Create directory: `docs/superpowers/pilots/`
- Create: `docs/superpowers/pilots/2026-04-26-token-consolidation.md`

- [ ] **Step 1: Create the journal file with section scaffolding**

Write to `docs/superpowers/pilots/2026-04-26-token-consolidation.md`:

```markdown
# Token Consolidation Pilot — Journal

**Wave:** 1
**Date started:** 2026-04-26
**Spec:** `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md`

This journal captures inventory, classification, the consolidated theme decisions, the deprecation list, and open design questions surfaced during Wave 1 Phase 0.

## 1. Inventory (Task 0.2)

_Populated below._

## 2. Classification (Task 0.3)

_Populated below._

## 3. Consolidated theme decisions (Task 0.4)

_Populated below._

## 4. Deprecation list (Task 0.5)

_Populated below._

## 5. Open design questions

_Populated as encountered._

## 6. Codegen / theme-model gaps surfaced

_Populated as encountered. Promoted to the playbook in Phase 2._

## 7. Visual review findings (Task 0.10)

_Populated below._
```

- [ ] **Step 2: Read the source files**

Read:
- `<host-library-path>/tailwind.config.js`
- `<host-library-path>/host-styles.css`

- [ ] **Step 3: Write the inventory table into § 1 of the journal**

Replace the `_Populated below._` placeholder under § 1 with a markdown table with these columns:

```markdown
| Token name | Light value | Dark value | Where defined | Flavor |
|---|---|---|---|---|
| `--background` | `0 0% 100%` | (look up under `.dark` block) | `host-styles.css` | shad-* |
| `--color-primary-500` | `221.2 83.2% 53.3%` | (lookup) | `host-styles.css` | Figma scale |
... (continue for every token)
```

**Flavor values:** `shad-*` | `Figma scale` | `direct semantic` | `chart` | `other`.

For "Where defined": if the token is _only_ in `tailwind.config.js` (not in CSS), write `tailwind.config.js`. If _only_ in CSS, write `host-styles.css`. If in both, write `both`.

If a dark value isn't present (the token only has a light value), write `—`.

For tokens that appear in `tailwind.config.js` only as a mapping to a var defined in CSS (e.g., `shad-background → hsl(var(--background) / <alpha-value>)`), include them as separate entries pointing back to their underlying CSS var via a `↳ underlies: --background` note in a parenthetical or footnote.

Aim for completeness over brevity. The whole file can be 200+ rows. This is the source of truth for classification.

- [ ] **Step 4: Get a usage-count for each top-level CSS var**

For each unique CSS var referenced (e.g., `--color-primary-500`, `--background`, `--color-text-primary`), get a usage count across the host library:

Run, replacing `<VAR>` with each var name:
```bash
grep -r "var(--<VAR>)" <host-library-path> --include="*.tsx" --include="*.ts" --include="*.css" -l 2>/dev/null | wc -l
```

For Tailwind class usages of generated utility names (e.g., `bg-primary-500`, `text-shad-foreground`), use a similar grep for class fragments. Example for the Figma-scale colors:

```bash
grep -rh -oE "(bg|text|border)-(primary|neutral|success|warning|error|info)-(50|100|200|300|400|500|600|700|800|900|950)" <host-library-path> 2>/dev/null | sort | uniq -c | sort -rn | head -100
```

Add a "Usage" column to the table with the count, OR add a short summary table at the end of § 1 with counts per family — whichever is cleaner. Don't burn time getting an exact count for every cell; rough order-of-magnitude is sufficient (`<10`, `10-100`, `100+`).

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/pilots/2026-04-26-token-consolidation.md
git commit -m "$(cat <<'EOF'
docs(pilot): inventory the host library tokens (Wave 1 Phase 0 task 0.2)

Full inventory table of every token in the host library's tailwind.config.js
and host-styles.css, with usage counts. Input for the
classification pass in task 0.3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 0.3: Classify each token

**Goal:** Tag every inventoried row with one of (a) signal, (b) hack, (c) duplication, (d) deferred. Surface the open design questions.

**Files:**
- Modify: `docs/superpowers/pilots/2026-04-26-token-consolidation.md` (§ 2 + § 5)

- [ ] **Step 1: Add a "Class" column to the inventory table**

Edit the table from Task 0.2 to add a final column `Class`. For each row, set one of:

- `signal` — kept in the consolidated theme. Real design intent.
- `hack` — the entire shad-* layer (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius` if it duplicates a scale). User-confirmed deprecation. Drop entirely.
- `duplication` — same value as another token under a different name. Collapse into one canonical name. Note the canonical target in a `→` annotation. Examples:
  - `--primary` (`221.2 83.2% 53.3%`) → `--color-primary-500` (same value)
  - `--color-primary` (`221.2 83.2% 53.3%`) → `--color-primary-500` (same value)
  - `--destructive` → `--color-error-500` (also a hack, drop after collapse)
  - `--background` (shad) → `--color-background` (semantic)
- `deferred` — chart colors (`--chart-1..5`), one-offs not relevant to Wave 1. Documented but not consolidated. Future pass.

- [ ] **Step 2: Write § 2 prose**

Under § 2 in the journal, write 1-3 short paragraphs summarizing the classification: how many tokens in each class, the systemic patterns observed (e.g., "the shad-* layer is a complete shadow of the Figma scale and adds no information"), and any classification calls that were judgment calls (e.g., a token you weren't sure was signal vs hack).

- [ ] **Step 3: Surface the open design questions in § 5**

Under § 5 of the journal, write a numbered list of design questions encountered. Use this template per question:

```markdown
### Q1: Surface tokens — collapse `card` + `popover` or keep two?

**Status:** open
**Wave 1 default:** [pick one and state it]
**Rationale:** [1-2 sentences]
**For design review:** [what the human design owner is being asked to decide]
```

Start with the questions enumerated in spec § 6.3 (surfaces, primary ramp, foreground vs text, naming convention, dark scoping). Add any new questions discovered during inventory/classification.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/pilots/2026-04-26-token-consolidation.md
git commit -m "$(cat <<'EOF'
docs(pilot): classify the host library tokens + surface open questions (Wave 1 task 0.3)

Every inventoried token tagged signal/hack/duplication/deferred.
Open design questions for human design review captured per spec § 6.3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 0.4: Author the consolidated soribashi theme

**Goal:** Express every `signal`-classified token as a soribashi `createTheme()` call. The result is the Wave 1 design artifact.

**Files:**
- Create: `apps/pilot/src/theme/index.ts`

- [ ] **Step 1: Create `apps/pilot/src/theme/index.ts`**

Use this skeleton, then fill in values from the inventoried `signal` tokens. The shape mirrors `apps/playground/src/theme/index.ts` but with host-specific values.

```ts
import { createTheme } from '@soribashi/core';

/**
 * Wave 1 consolidated theme for the recipe pilot.
 *
 * Source of truth: docs/superpowers/pilots/2026-04-26-token-consolidation.md
 * Spec: docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md
 *
 * Consolidation choices vs the host library's current tokens:
 * - shad-* layer DROPPED in full. The Figma scale + semantic surface tokens
 *   are sufficient.
 * - Color scales regenerated coherently from each `-500` anchor where the
 *   current hand-typed lighter shades drift hue.
 * - Duplicates collapsed (e.g. --primary, --color-primary, --color-primary-500
 *   all referenced the same value — kept as --color-primary-500 only).
 * - Chart colors deferred (not in Wave 1).
 *
 * Open design questions live in the journal § 5.
 */
export const theme = createTheme({
  name: 'pilot',
  tokens: {
    colors: {
      primary: {
        '50': 'hsl(...)',
        '100': 'hsl(...)',
        // ... 200..950
        '500': 'hsl(221 83% 53%)',  // anchor preserved from the host library
        // 50..400 REGENERATED from the 500 anchor (note in journal — Q2)
      },
      neutral: { /* ... */ },
      success: { /* ... */ },
      warning: { /* ... */ },
      danger: { /* ... */ },   // formerly "error" in the host library; renamed for soribashi convention
      info: { /* ... */ },
    },
    radius: {
      // From the host library's borderRadius; collapse if the shad --radius duplicated a scale value
      sm: '0.25rem',
      DEFAULT: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
    },
    spacing: {
      // the host library's extras: 18, 88, 100, 112, 128 (rems already converted in their config)
      '18': '4.5rem',
      '88': '22rem',
      '100': '25rem',
      '112': '28rem',
      '128': '32rem',
    },
    fontSize: {
      // From the host library; line-heights folded in via the soribashi token model
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    lineHeight: {
      xs: '1rem',
      sm: '1.25rem',
      base: '1.5rem',
      lg: '1.75rem',
      xl: '1.75rem',
      '2xl': '2rem',
      '3xl': '2.25rem',
    },
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
    },
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      popover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
  },
  dark: {
    // Dark overrides for any token whose dark value differs from light.
    // Pull from host-styles.css's `.dark` block.
    colors: {
      // ...
    },
  },
  semantic: {
    intent: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
    variant: ['filled', 'outline', 'subtle', 'ghost', 'link'],
    text: {
      // Wave 1 default per spec § 6.3 Q3: prefer `foreground` + shades, NOT
      // `text.primary/secondary/tertiary/disabled` from the host library. The shade lookup
      // is via the intent resolver — these reference scale anchors, not raw
      // hand-set colors.
      default: 'colors.neutral.900',
      muted: 'colors.neutral.500',
      subtle: 'colors.neutral.400',
      disabled: 'colors.neutral.300',
    },
    surface: {
      // Wave 1 default per spec § 6.3 Q1: collapse card + popover into a
      // single `surface` (decision flagged for design review in journal § 5).
      canvas: 'colors.neutral.50',
      default: 'colors.neutral.0',
      raised: 'colors.neutral.100',
      sunken: 'colors.neutral.50',
      overlay: 'colors.neutral.900',
    },
    border: {
      default: 'colors.neutral.200',
      strong: 'colors.neutral.400',
      muted: 'colors.neutral.100',
    },
  },
});
```

**Important:**
- Replace every `'hsl(...)'` placeholder with the actual value from the inventory.
- For scales where the current the host library values drift hue (especially `--color-primary-50..400`), regenerate to a coherent ramp from the `-500` anchor. The accepted method: shift lightness while holding hue ± a few degrees. Document the regenerated scale in the journal § 3.
- Use `defaultTokens` / `defaultDarkTokens` as a *reference* for shape only — do NOT spread them. Wave 1's job is to consolidate the host library's tokens, not adopt soribashi defaults.

- [ ] **Step 2: Append § 3 of the journal with the consolidated decisions**

Under § 3 of `docs/superpowers/pilots/2026-04-26-token-consolidation.md`, document:
- The final color families (names + 500 anchors).
- Any scales that were regenerated (which shades changed, why).
- Semantic surface choices (collapsed surfaces vs split, etc.).
- The intent + variant lists (matches spec § 7.1 step 2 Variants and Intents).
- Any token in the inventory that had no clean home in the soribashi theme model — log as a gap in § 6.

- [ ] **Step 3: Type-check the theme file**

Run: `bun run typecheck`
Expected: no new errors. The theme call is fully typed by `createTheme`.

If errors surface (e.g., a token field not understood), this is a soribashi gap — log it in § 6 and either find a workable shape or surface it as blocking.

- [ ] **Step 4: Commit**

```bash
git add apps/pilot/src/theme/index.ts docs/superpowers/pilots/2026-04-26-token-consolidation.md
git commit -m "$(cat <<'EOF'
feat(pilot): author consolidated theme (Wave 1 task 0.4)

The Wave 1 design artifact: every signal-classified the host library token
expressed as a single soribashi createTheme() call. shad-* layer
dropped in full. Color scales regenerated coherently from each
-500 anchor. Duplicates collapsed. Decisions documented in the
consolidation journal § 3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 0.5: Add the deprecation list to the journal

**Goal:** Every dropped or collapsed token is documented with one-line rationale, so the future integration project has a complete map of "what the host library usage needs to migrate to what."

**Files:**
- Modify: `docs/superpowers/pilots/2026-04-26-token-consolidation.md` (§ 4)

- [ ] **Step 1: Write the deprecation list under § 4**

Use this format:

```markdown
| Dropped / collapsed token | Reason | Migrate the host library usages to |
|---|---|---|
| `--background` (shad) | shad-* layer deprecated | `--color-background` |
| `--foreground` (shad) | shad-* layer deprecated | `--color-text-default` (newly named) |
| `--primary` (shad) | shad-* layer deprecated; duplicates `--color-primary-500` | `--color-primary-500` |
| `--color-primary` (semantic alias) | duplicates `--color-primary-500` (same value); collapsed | `--color-primary-500` |
| `--color-error-*` (entire scale renamed) | "error" → "danger" for soribashi naming convention | `--color-danger-*` |
| `--chart-1..5` | deferred — out of Wave 1 scope | (none — chart tokens are a future pass) |
| ... | ... | ... |
```

**Coverage requirement:** every row in the inventory table classed `hack` or `duplication` MUST appear in this list. Rows classed `deferred` should also appear with `(none — deferred)` in the migrate column.

- [ ] **Step 2: Cross-check coverage**

Walk § 1 inventory rows; for each row whose Class is `hack`, `duplication`, or `deferred`, find the matching row in § 4. If any are missing, add them. If any § 4 row doesn't trace back to inventory, fix the mismatch.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/pilots/2026-04-26-token-consolidation.md
git commit -m "$(cat <<'EOF'
docs(pilot): deprecation list for dropped/collapsed the host library tokens (Wave 1 task 0.5)

Every dropped or collapsed token mapped to its consolidated target
(or marked deferred). Coverage check confirmed against inventory.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 0.6: Per-app codegen config + run codegen

**Goal:** Run soribashi codegen against the consolidated theme; produce `theme.css` and `tailwind.config.generated.js` in the pilot's `src/generated/`.

**Files:**
- Create: `apps/pilot/soribashi.config.ts`
- Modify: `package.json` (root) — add `codegen:pilot` script
- Generated by codegen (commit them): `apps/pilot/src/generated/theme.css` and `apps/pilot/src/generated/tailwind.config.generated.js`

- [ ] **Step 1: Create `apps/pilot/soribashi.config.ts`**

```ts
import { theme } from './src/theme/index.ts';

export default {
  theme,
  output: {
    css: './apps/pilot/src/generated/theme.css',
    tailwind: {
      mode: 'v3' as const,
      configPath: './apps/pilot/src/generated/tailwind.config.generated.js',
    },
  },
  watch: ['./apps/pilot/src/theme/**/*'],
};
```

Paths are relative to the **repo root** (where the codegen CLI is invoked from), matching the existing root `soribashi.config.ts` pattern.

- [ ] **Step 2: Add the `codegen:pilot` script to root `package.json`**

Open `package.json`. In the `scripts` block, add:

```json
"codegen:pilot": "bun run packages/codegen/bin/soribashi.ts build --config apps/pilot/soribashi.config.ts",
"dev:pilot": "bun run --filter @soribashi/pilot dev",
"build:pilot": "bun run --filter @soribashi/pilot build"
```

Place them adjacent to the existing `codegen`, `dev:playground`, `build:playground` scripts. Comma placement matters — keep valid JSON.

- [ ] **Step 3: Run codegen**

Run: `bun run codegen:pilot`
Expected output:
```
[soribashi] wrote 2 file(s):
  ./apps/pilot/src/generated/theme.css
  ./apps/pilot/src/generated/tailwind.config.generated.js
```

If it fails:
- "Config file does not exist" → check the path in `--config`.
- "must have a 'theme' field" → the theme/index.ts default export is missing or wrong.
- Type error in `createTheme` → fix the theme definition; this is the same gap surfaced in task 0.4 step 3.

- [ ] **Step 4: Inspect the generated files**

Read `apps/pilot/src/generated/theme.css` and confirm:
- `:root { ... }` block contains `--color-primary-500: hsl(...);` etc. for every consolidated token.
- `.dark { ... }` block contains dark overrides if any were defined.
- No leftover shad-* names.

Read `apps/pilot/src/generated/tailwind.config.generated.js` and confirm:
- `module.exports = { theme: { colors: {...}, borderRadius: {...}, ... } }`.
- Color scales emitted with `<alpha-value>` pattern (e.g., `'500': 'hsl(var(--color-primary-500) / <alpha-value>)'`).

If the emit shape doesn't match expectations, this is a codegen gap — log in journal § 6 and either work around in-pilot (e.g., add a small post-processing script) or stop and re-design.

- [ ] **Step 5: Commit**

```bash
git add apps/pilot/soribashi.config.ts apps/pilot/src/generated/ package.json
git commit -m "$(cat <<'EOF'
feat(pilot): wire codegen for consolidated theme (Wave 1 task 0.6)

Per-app soribashi.config.ts pointing codegen at the pilot's
consolidated theme. Root package.json gains codegen:pilot, dev:pilot,
build:pilot scripts. Generated theme.css + tailwind.config.generated.js
checked in (matches playground's pattern of committing generated outputs).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 0.7: Wire Tailwind composition into the pilot app

**Goal:** Connect the generated CSS vars + Tailwind config into the pilot's `styles.css` and `tailwind.config.js`. Get a working Tailwind utility (e.g., `bg-primary-500`) that paints from the consolidated theme.

**Files:**
- Create: `apps/pilot/tailwind.config.js`
- Modify: `apps/pilot/src/styles.css`

- [ ] **Step 1: Create `apps/pilot/tailwind.config.js`**

```js
const generated = require('./src/generated/tailwind.config.generated.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...generated,
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class', // Wave 1 default; the host library's `.dark .app-scope` deferred to north-star A
  corePlugins: {
    preflight: false, // mirror host: no global reset
  },
  plugins: [
    ...(generated.plugins ?? []),
    require('tailwindcss-animate'),
  ],
};
```

The spread `...generated` copies generated `theme` (with the full color/spacing/radius/etc. scales) at top-level. We do NOT use Tailwind's `theme.extend.colors` shape — we want the consolidated theme to *replace* Tailwind's defaults, not merge with them. (Same pattern as `apps/playground/tailwind.config.js`.)

- [ ] **Step 2: Update `apps/pilot/src/styles.css` with Tailwind directives + generated import**

Replace the entire contents of `apps/pilot/src/styles.css`:

```css
@import './generated/theme.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: var(--font-family-sans);
  background: var(--surface-default);
  color: var(--text-default);
}

* {
  box-sizing: border-box;
}
```

Note: `--surface-default`, `--text-default`, `--font-family-sans` come from soribashi's emitted CSS — these are emitted from the `semantic.surface.default`, `semantic.text.default`, and `tokens.fontFamily.sans` entries in the theme.

- [ ] **Step 3: Boot the pilot dev server**

Run: `bun run dev:pilot`
Expected: Vite logs port 5174, no PostCSS / Tailwind errors. Browser shows the placeholder page from Task 0.1, now with the consolidated body font/colors applied.

If Tailwind reports "unknown utility" errors, check that the generated config emit matches the pilot tailwind.config.js spread. If the generated file has `theme.colors` but the spread isn't reaching, double-check the require path.

Stop the server before continuing.

- [ ] **Step 4: Commit**

```bash
git add apps/pilot/tailwind.config.js apps/pilot/src/styles.css
git commit -m "$(cat <<'EOF'
feat(pilot): compose generated Tailwind + import theme.css (Wave 1 task 0.7)

Pilot tailwind.config.js spreads the soribashi-generated config and
layers preflight: false + tailwindcss-animate, mirroring the host library's
config-level concerns. styles.css imports generated CSS vars so body
text, font, and surface tokens render from the consolidated theme.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 0.8: Build the TokenReview swatch page

**Goal:** Render every consolidated token as a labeled swatch, in both light and dark, so we can visually verify codegen → DOM end-to-end.

**Files:**
- Create: `apps/pilot/src/pages/TokenReview.tsx`
- Modify: `apps/pilot/src/App.tsx` to route to it

- [ ] **Step 1: Create `apps/pilot/src/pages/TokenReview.tsx`**

```tsx
/**
 * TokenReview — every consolidated token rendered as a labeled swatch.
 * Used for visual confirmation that codegen → DOM is working end-to-end,
 * in both light and dark.
 */
import { theme } from '../theme/index.ts';

const COLOR_FAMILIES = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

export function TokenReview() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontFamily: 'var(--font-family-sans)' }}>Color scales</h2>
      {COLOR_FAMILIES.map((family) => (
        <div key={family} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: 'var(--font-size-sm)', textTransform: 'capitalize' }}>{family}</h3>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {SHADES.map((shade) => {
              const cssVar = `--color-${family}-${shade}`;
              return (
                <div
                  key={shade}
                  style={{
                    width: '64px',
                    height: '64px',
                    background: `hsl(var(${cssVar}))`,
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    fontSize: '10px',
                    color: '#000',
                    paddingBottom: '4px',
                  }}
                  title={cssVar}
                >
                  {shade}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <h2 style={{ fontFamily: 'var(--font-family-sans)', marginTop: '3rem' }}>Semantic tokens</h2>
      <table style={{ borderCollapse: 'collapse', fontFamily: 'var(--font-family-sans)' }}>
        <thead>
          <tr><th align="left">Token</th><th align="left">CSS var</th><th align="left">Swatch</th></tr>
        </thead>
        <tbody>
          {[
            ['surface.canvas', '--surface-canvas'],
            ['surface.default', '--surface-default'],
            ['surface.raised', '--surface-raised'],
            ['text.default', '--text-default'],
            ['text.muted', '--text-muted'],
            ['border.default', '--border-default'],
            ['border.strong', '--border-strong'],
          ].map(([name, cssVar]) => (
            <tr key={name}>
              <td style={{ paddingRight: '1rem' }}>{name}</td>
              <td style={{ paddingRight: '1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{cssVar}</td>
              <td><div style={{ width: '120px', height: '32px', background: `var(${cssVar})`, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

If your consolidated theme has a different set of semantic tokens (e.g., you kept `text.{primary,secondary,...}` instead of `text.{default,muted,...}`), match the table rows to the actual tokens.

- [ ] **Step 2: Update `apps/pilot/src/App.tsx` to render TokenReview behind a dark/light toggle**

```tsx
import { useState } from 'react';
import { SoribashiProvider } from '@soribashi/core';
import { theme } from './theme/index.ts';
import { TokenReview } from './pages/TokenReview.tsx';

type Page = 'tokens' | 'screen' | 'buttons';

export function App() {
  const [page, setPage] = useState<Page>('tokens');
  const [dark, setDark] = useState(false);

  return (
    <SoribashiProvider theme={theme}>
      <div className={dark ? 'dark' : ''}>
        <header
          style={{
            borderBottom: '1px solid var(--border-default)',
            padding: '0.75rem 1.5rem',
            background: 'var(--surface-default)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <strong style={{ fontFamily: 'var(--font-family-sans)' }}>recipe pilot</strong>
          <button onClick={() => setPage('tokens')} aria-current={page === 'tokens' ? 'page' : undefined}>
            Tokens
          </button>
          <button onClick={() => setPage('screen')} aria-current={page === 'screen' ? 'page' : undefined}>
            Screen replica
          </button>
          <button onClick={() => setPage('buttons')} aria-current={page === 'buttons' ? 'page' : undefined}>
            Button matrix
          </button>
          <span style={{ marginLeft: 'auto' }}>
            <button onClick={() => setDark(!dark)}>{dark ? '☀ Light' : '☾ Dark'}</button>
          </span>
        </header>

        <main>
          {page === 'tokens' && <TokenReview />}
          {page === 'screen' && <div style={{ padding: '2rem' }}>ScreenReplica added in task 0.9</div>}
          {page === 'buttons' && <div style={{ padding: '2rem' }}>ButtonMatrix added in task 1.7</div>}
        </main>
      </div>
    </SoribashiProvider>
  );
}
```

- [ ] **Step 3: Boot dev server and visually verify**

Run: `bun run dev:pilot`
Open `http://localhost:5174/`. Confirm:
- The "Tokens" page shows all 6 color families × 11 shades as colored squares.
- Toggling Dark/Light visibly shifts colors where dark overrides exist (background, text, etc.).
- No "undefined" CSS variable values render (those would show as transparent / browser-default).

Stop the server.

- [ ] **Step 4: Commit**

```bash
git add apps/pilot/src/pages/TokenReview.tsx apps/pilot/src/App.tsx
git commit -m "$(cat <<'EOF'
feat(pilot): TokenReview swatch page (Wave 1 task 0.8)

Renders every consolidated color scale + semantic surface/text/border
token as a labeled swatch in both light and dark. Visual confirmation
that codegen → CSS → DOM is working end-to-end. App shell wires page
routing + dark toggle.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 0.9: Build the ScreenReplica page

**Goal:** Render a representative the host library screen as static markup using consolidated tokens, so we can visually compare against a screenshot of the host library's current implementation. **No live components yet** — pure markup + Tailwind classes.

**Files:**
- Create: `apps/pilot/src/pages/ScreenReplica.tsx`
- Modify: `apps/pilot/src/App.tsx` (route)

- [ ] **Step 1: Pick a the host library screen to replicate**

Suggested: an Auto Statements Overview section with cards, headings, body text, badges-ish chips, and divider lines. Per the spec § 6.1 step 6.

The actual element you reproduce can be sketched — this is a static replica, not a pixel-perfect copy. The goal is to exercise the consolidated token surface in a representative composition.

- [ ] **Step 2: Create `apps/pilot/src/pages/ScreenReplica.tsx`**

```tsx
/**
 * ScreenReplica — static markup of a representative the host library screen using only
 * consolidated tokens via Tailwind utilities.
 *
 * Purpose: validate that the consolidated tokens reach the DOM correctly
 * in a realistic composition. NOT a pixel-perfect copy of the host library — intent
 * parity, not pixel parity. Drift from the original is expected wherever
 * consolidation deliberately changed something (see journal § 4 deprecation
 * list and § 5 open design questions).
 */
export function ScreenReplica() {
  return (
    <div className="bg-canvas min-h-screen p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-default mb-1">Auto · Statements Overview</h1>
        <p className="text-sm text-muted">Claim #2401-93821 · last updated 2 hours ago</p>
      </header>

      <section className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Open statements', value: '3', tone: 'primary' as const },
          { label: 'Pending review', value: '1', tone: 'warning' as const },
          { label: 'Resolved', value: '14', tone: 'success' as const },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-md p-4"
            style={{
              background: 'var(--surface-default)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="text-xs uppercase tracking-wide text-muted mb-1">{card.label}</div>
            <div className="text-3xl font-semibold text-default">{card.value}</div>
          </div>
        ))}
      </section>

      <section
        className="rounded-md p-6 mb-6"
        style={{
          background: 'var(--surface-default)',
          border: '1px solid var(--border-default)',
        }}
      >
        <h2 className="text-lg font-semibold text-default mb-4">Latest activity</h2>
        <ul className="space-y-3">
          {[
            { who: 'M. Goodwin', what: 'Reviewed FNOL statement', when: '2h ago' },
            { who: 'A. Patel', what: 'Added incident notes', when: '5h ago' },
            { who: 'System', what: 'Merged FC into incident', when: 'yesterday' },
          ].map((row, idx, all) => (
            <li
              key={row.who + row.when}
              className="pb-3"
              style={{
                borderBottom: idx < all.length - 1 ? '1px solid var(--border-muted, var(--border-default))' : 'none',
              }}
            >
              <div className="text-sm text-default font-medium">{row.who}</div>
              <div className="text-sm text-muted">{row.what} · {row.when}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex gap-2">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium"
          style={{ background: 'hsl(var(--color-success-100))', color: 'hsl(var(--color-success-800))' }}
        >
          Active
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium"
          style={{ background: 'hsl(var(--color-warning-100))', color: 'hsl(var(--color-warning-800))' }}
        >
          Review
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium"
          style={{ background: 'hsl(var(--color-danger-100))', color: 'hsl(var(--color-danger-800))' }}
        >
          Disputed
        </span>
      </section>
    </div>
  );
}
```

The Tailwind classes `bg-canvas`, `text-default`, `text-muted` reference utility names that will work IF the soribashi codegen emits semantic-shorthand utilities. If they don't (likely the case given the codegen emits scale-only), you'll see those utilities flagged as unknown when you boot. Fall back to inline `style={{ background: 'var(--surface-canvas)', color: 'var(--text-default)' }}` etc. — this is honest evidence of a codegen gap, log in journal § 6.

- [ ] **Step 3: Wire into App.tsx**

In `apps/pilot/src/App.tsx`, replace the `'screen'` page placeholder with `<ScreenReplica />`. Add the import.

- [ ] **Step 4: Boot dev server and visually verify**

Run: `bun run dev:pilot`
Open `http://localhost:5174/`, click "Screen replica". Confirm the page renders with consolidated token colors. Toggle dark mode and confirm the surface + text colors flip appropriately.

If utility classes like `text-default` don't resolve, fall back to inline `style={{ ... }}` props as noted in step 2 and log the gap.

Stop the server.

- [ ] **Step 5: Commit**

```bash
git add apps/pilot/src/pages/ScreenReplica.tsx apps/pilot/src/App.tsx
git commit -m "$(cat <<'EOF'
feat(pilot): ScreenReplica static page (Wave 1 task 0.9)

Static markup-only replica of a representative the host library screen using
consolidated tokens. Validates token reach into a realistic composition
(cards, lists, badge-style chips, divider lines). Not pixel-perfect —
intent parity for visual review only.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 0.10: Visual review against the original the host library screen + journal findings

**Goal:** Capture a screenshot of the corresponding the host library section, place it side-by-side with the pilot's ScreenReplica, document drift and findings in the journal.

**Files:**
- Modify: `docs/superpowers/pilots/2026-04-26-token-consolidation.md` (§ 7)

- [ ] **Step 1: Capture a screenshot of the host library's actual screen**

Open the the host monorepo app in a browser at the matching screen (Auto Statements Overview, or whichever you replicated). Take a screenshot. Save under `docs/superpowers/pilots/screenshots/2026-04-26-host-statements-overview.png` (create the directory if it doesn't exist).

If you can't access a running the host library instance, capture a screenshot from the host library's storybook / fixtures, or from documentation. Document the source in the journal so the comparison is honest.

- [ ] **Step 2: Capture a screenshot of the pilot's ScreenReplica**

Boot `bun run dev:pilot`. Open `http://localhost:5174/`, click "Screen replica". Screenshot in light mode. Save to `docs/superpowers/pilots/screenshots/2026-04-26-pilot-statements-replica-light.png`. Toggle dark, screenshot, save as `...replica-dark.png`. Stop the server.

- [ ] **Step 3: Write findings under § 7 of the journal**

Use this template:

```markdown
## 7. Visual review findings

**Host screen:** [link to screenshots/2026-04-26-host-statements-overview.png]
**Pilot replica (light):** [link to screenshots/2026-04-26-pilot-statements-replica-light.png]
**Pilot replica (dark):** [link to screenshots/2026-04-26-pilot-statements-replica-dark.png]

### Intent parity
[1-2 paragraphs on whether the consolidated theme delivers the same overall design intent as the host library — surface hierarchy, color tone, typographic rhythm, etc.]

### Expected drift (consolidation-driven)
- [bullet per piece of drift that's a deliberate consolidation choice — link back to the rename map in § 4 or the open question in § 5 that explains it]

### Unexpected drift (findings)
- [bullet per piece of drift that surprised you — what changed, what you expected, what to do about it. Promote anything blocking to journal § 6 (gaps).]

### Sign-off
**Phase 0 visual review:** [PASS / PASS WITH FINDINGS / BLOCKED]
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/pilots/screenshots/ docs/superpowers/pilots/2026-04-26-token-consolidation.md
git commit -m "$(cat <<'EOF'
docs(pilot): visual review findings + screenshots (Wave 1 task 0.10)

Side-by-side: the host library Statements Overview vs pilot ScreenReplica.
Expected drift documented (consolidation-driven). Unexpected drift
captured as findings or promoted to gaps.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 0 Exit Check

Before moving to Phase 1, confirm:
- [ ] `bun run codegen:pilot` runs cleanly and produces both files.
- [ ] `bun run dev:pilot` boots without console errors; TokenReview and ScreenReplica both render in light + dark.
- [ ] `bun run typecheck` is clean.
- [ ] `docs/superpowers/pilots/2026-04-26-token-consolidation.md` has all 7 sections populated.
- [ ] All commits in this phase prefixed with `(Wave 1 task 0.X)`.

If any of these fail, fix before continuing.

---

# Phase 1 — Button Conversion

Phase 1 builds one Button recipe authored with `defineComponent`, consuming the consolidated theme. TDD where it makes sense (the recipe behavior tests). Playwright parity for the visual matrix. Conversion journal captures everything.

---

## Task 1.1: Vendor-snapshot the host library's Button into the pilot

**Goal:** Copy the host library's current `Buttons/` source into `apps/pilot/src/reference/original-button/` for side-by-side reference. Read-only. Never imported by recipe code.

**Files:**
- Create: `apps/pilot/src/reference/original-button/` (copied from the host monorepo)
- Create: `apps/pilot/src/reference/original-button/README.md` — attribution + restrictions

- [ ] **Step 1: Make the directory**

Run: `mkdir -p apps/pilot/src/reference/original-button`

- [ ] **Step 2: Copy the host library's Button source**

Run:
```bash
cp -R <host-library-path>/Buttons/* apps/pilot/src/reference/original-button/
```

Verify:
```bash
ls apps/pilot/src/reference/original-button/
```
Expected: a list of files including `Button.tsx`, `IconButton.tsx`, `ButtonDropdown.tsx`, etc. Exact file list depends on what's in the host library today.

- [ ] **Step 3: Add an attribution README**

Create `apps/pilot/src/reference/original-button/README.md`:

```markdown
# host Button — vendored snapshot

**Source:** `<host-library-path>/Buttons/`
**Snapshot date:** 2026-04-26
**Purpose:** read-only reference for Wave 1 side-by-side visual review.

## Rules

- This directory is read-only reference material. Do NOT edit any file inside it.
- The recipe code at `apps/pilot/src/recipes/Button/` MUST NOT import from this directory at any point.
- The pilot's demo page (`pages/ButtonMatrix.tsx`) imports from here ONLY to render side-by-side reference output.
- The vendored copy is never shipped beyond this pilot app.
- If the upstream the host library Button changes meaningfully and you want to refresh the snapshot, run the same `cp -R` command and update the snapshot date above.

## Why vendor instead of installing?

The host library is in a separate monorepo (the host monorepo). Wave 1's spec scope explicitly forbids touching the host monorepo. Vendoring is the simplest way to render the host library's current Button alongside the recipe in one running app for visual diff.
```

- [ ] **Step 4: Verify the recipe directory has nothing in it yet**

Run: `ls apps/pilot/src/recipes/ 2>/dev/null`
Expected: empty or no such file (we create it in Task 1.3). If it has content, that's fine — just confirm Button isn't there yet.

- [ ] **Step 5: Confirm imports**

Read the vendored `Button.tsx` head and note its imports — they reference `@host/design-system`, `@radix-ui/react-slot`, `class-variance-authority`, `../lib/utils`, etc. Several of these aren't installed in the pilot. The vendored code WILL NOT compile as-is — that's expected. We are NOT trying to make the vendored code run in the pilot. It exists as a literal text reference and as a renderable subtree if and only if you make it run by:
- (a) Stubbing the missing imports with hand-written shims, OR
- (b) Rendering only a screenshot of the legacy Button (not the live component) in the matrix page.

Default: option (b) — screenshot only, simpler. If the visual review wants live interaction with the legacy Button, escalate as an extra task.

For now, exclude the reference directory from the pilot's TypeScript compile by adding it to `apps/pilot/tsconfig.json`'s `exclude` array:

Edit `apps/pilot/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "src/reference/**"]
}
```

Also exclude from Vite's processing by ensuring Tailwind's content glob doesn't pull from `src/reference/**`. Check `apps/pilot/tailwind.config.js`:

```js
content: [
  './index.html',
  './src/**/*.{ts,tsx}',
  '!./src/reference/**',  // <-- add
],
```

- [ ] **Step 6: Boot the dev server and confirm nothing broke**

Run: `bun run dev:pilot`
Expected: clean boot, no TS errors about reference/.
Stop the server.

- [ ] **Step 7: Commit**

```bash
git add apps/pilot/src/reference/ apps/pilot/tsconfig.json apps/pilot/tailwind.config.js
git commit -m "$(cat <<'EOF'
chore(pilot): vendor the host library Button as read-only reference (Wave 1 task 1.1)

Snapshot of the host library's current Buttons/ for side-by-side
visual review. Excluded from typecheck and Tailwind processing —
read-only reference material, never imported by recipe code.
Attribution + rules in src/reference/original-button/README.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1.2: Inventory the legacy Button surface + open the conversion journal

**Goal:** Document the host library's current Button shape — variants, intents, sizes, states, polymorphism — and use that to lock the consolidated Button shape.

**Files:**
- Create: `docs/superpowers/pilots/2026-04-26-button-conversion.md`

- [ ] **Step 1: Create the conversion journal**

Write to `docs/superpowers/pilots/2026-04-26-button-conversion.md`:

```markdown
# Button Conversion Pilot — Journal

**Wave:** 1
**Date started:** 2026-04-26
**Spec:** `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md`

## 1. Legacy Button surface inventory (Task 1.2)

_Populated below._

## 2. Consolidated Button shape (Task 1.3)

_Populated as recipe is authored._

## 3. What was easy / what was hard (Task 1.7)

_Populated as Phase 1 progresses._

## 4. Soribashi gaps surfaced

_Populated as encountered. Promoted to playbook in Phase 2._

## 5. IconButton + ButtonDropdown extension sketch (Task 1.10)

_Populated below._

## 6. Recommended playbook entries — pure-styled-primitive category (Task 1.10)

_Populated below._
```

- [ ] **Step 2: Read the host library's Button source**

Read:
- `apps/pilot/src/reference/original-button/Button.tsx`
- `apps/pilot/src/reference/original-button/IconButton.tsx` (context only)
- `apps/pilot/src/reference/original-button/ButtonDropdown.tsx` (context only)

Identify:
- The full prop API.
- The `cva` variant definition (variants, sizes, fullWidth).
- The icon handling (`leftIcon`, `rightIcon`, `IconKey` vs `ReactElement`).
- The `asChild` polymorphism via `@radix-ui/react-slot`.
- The loading state.
- The disabled handling.

- [ ] **Step 3: Write § 1 of the conversion journal**

Under § 1, document:

```markdown
### 1.1 Variants (visual style)

the host library's variant set: `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`.

**Inconsistency:** The variant prop in the host library's Button mixes visual style (`outline`, `ghost`) with semantic role (`primary`, `secondary`, `danger`, `success`) — three are visual, three are intent-shaped. This conflates two orthogonal axes.

**Wave 1 consolidation:** Split into:
- `variant` (visual): `filled`, `outline`, `subtle`, `ghost`, `link`
- `intent` (semantic role): `primary`, `neutral`, `success`, `warning`, `danger`, `info`

Rationale: matches the existing soribashi convention (see `apps/playground/src/components/Button/Button.tsx` and the playground theme). Lets one component express ALL the (variant × intent) cells without an explosion of one-off variants.

**Migration map for the host library's existing usages** (informational — actual migration is the integration project's work):
- `<Button variant="primary">` → `<Button intent="primary" variant="filled">`
- `<Button variant="secondary">` → `<Button intent="neutral" variant="filled">` (or `subtle` — see § 4)
- `<Button variant="outline">` → `<Button intent="neutral" variant="outline">`
- `<Button variant="ghost">` → `<Button intent="neutral" variant="ghost">`
- `<Button variant="danger">` → `<Button intent="danger" variant="filled">`
- `<Button variant="success">` → `<Button intent="success" variant="filled">`

### 1.2 Sizes

Host: `sm`, `md`, `lg`. Wave 1: same.

### 1.3 States

| the host library prop | the host library behavior | Wave 1 prop |
|---|---|---|
| `isLoading` | Shows spinner, suppresses click | `loading` (renamed) |
| `disabled` | HTMLButton disabled | `disabled` (passthrough) |
| `fullWidth` | `w-full` class | `fullWidth` (kept) |
| `leftIcon` | IconKey or ReactElement; rendered before children | `leftIcon` (kept; ReactNode only — IconKey wrapping is the integration project's concern) |
| `rightIcon` | (same) | `rightIcon` (kept) |
| `asChild` | Renders children as a slot via Radix Slot | Polymorphic `as` prop instead — see § 1.4 |

### 1.4 Polymorphism

The host library uses Radix Slot (`asChild` prop). Wave 1 uses soribashi's `definePolymorphicComponent` with an `as` prop. Why the change: `as` is more typesafe, the soribashi convention, and removes the `Slot` runtime dependency from the recipe. Migration map:
- `<Button asChild><a href="/x">Link</a></Button>` → `<Button as="a" href="/x">Link</Button>`

This is a meaningful API divergence — flag in the journal as a finding for design review.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/pilots/2026-04-26-button-conversion.md
git commit -m "$(cat <<'EOF'
docs(pilot): inventory legacy Button surface (Wave 1 task 1.2)

Documents the host library's current Button prop API, variant taxonomy
(conflates visual + semantic), state machinery, and polymorphism
via Radix Slot. Captures the consolidation choices: split variant
into variant × intent, rename isLoading → loading, asChild → as.
Migration maps for the integration project included.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1.3: Add vitest config + workspace entry for the pilot

**Goal:** Make `bun test` discover tests in `apps/pilot/`.

**Files:**
- Create: `apps/pilot/vitest.config.ts`
- Modify: `vitest.workspace.ts`

- [ ] **Step 1: Create `apps/pilot/vitest.config.ts`**

Look at an existing pilot config for the pattern. Read: `packages/blocks/vitest.config.ts` (or another existing one in `packages/*`).

Create:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

If `jsdom` is not yet in the pilot's devDependencies, add it:

```bash
bun add -D --filter @soribashi/pilot jsdom @testing-library/react @testing-library/jest-dom
```

(Adjust the `bun add` command if your bun version uses different syntax — alternatively, edit `apps/pilot/package.json` directly to add the deps and re-run `bun install`.)

- [ ] **Step 2: Add the pilot to `vitest.workspace.ts`**

Edit `vitest.workspace.ts` at repo root:

```ts
export default [
  './packages/theme/vitest.config.ts',
  './packages/codegen/vitest.config.ts',
  './packages/factory/vitest.config.ts',
  './packages/blocks/vitest.config.ts',
  './apps/pilot/vitest.config.ts',
];
```

- [ ] **Step 3: Verify vitest discovers the new config**

Run: `bun test --reporter=verbose 2>&1 | head -30`
Expected: vitest lists the pilot project among its workspaces. No tests yet — count is unchanged from before.

- [ ] **Step 4: Commit**

```bash
git add apps/pilot/vitest.config.ts apps/pilot/package.json vitest.workspace.ts
git commit -m "$(cat <<'EOF'
test(pilot): vitest config + workspace entry (Wave 1 task 1.3)

Pilot vitest config (jsdom env, @testing-library/react). Added to
vitest.workspace.ts so `bun test` discovers Button.test.tsx in the
next task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1.4: Write the failing Button behavior tests

**Goal:** TDD — write the unit tests first. They will fail (Button doesn't exist yet). Implementation happens in Task 1.5.

**Files:**
- Create: `apps/pilot/src/recipes/Button/Button.test.tsx`

- [ ] **Step 1: Create the test file with all behavior tests**

```tsx
/**
 * Button recipe — behavior tests.
 *
 * Implementation comes in Task 1.5 (TDD: tests first, watch fail, implement).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoribashiProvider } from '@soribashi/core';
import { theme } from '../../theme/index.ts';
import { Button } from './Button.tsx';

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('Button — rendering', () => {
  it('renders children inside a <button>', () => {
    wrap(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn.tagName).toBe('BUTTON');
  });

  it('applies default intent (primary) and variant (filled) data attributes', () => {
    wrap(<Button>x</Button>);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('data-intent')).toBe('primary');
    expect(btn.getAttribute('data-variant')).toBe('filled');
  });

  it('honors the size prop via data-size', () => {
    wrap(<Button size="lg">x</Button>);
    expect(screen.getByRole('button').getAttribute('data-size')).toBe('lg');
  });

  it('renders leftIcon before label and rightIcon after', () => {
    wrap(
      <Button leftIcon={<span data-testid="left">L</span>} rightIcon={<span data-testid="right">R</span>}>
        label
      </Button>,
    );
    const btn = screen.getByRole('button');
    const children = Array.from(btn.children);
    const leftIdx = children.findIndex((c) => c.querySelector('[data-testid="left"]') !== null);
    const labelIdx = children.findIndex((c) => c.textContent === 'label');
    const rightIdx = children.findIndex((c) => c.querySelector('[data-testid="right"]') !== null);
    expect(leftIdx).toBeGreaterThanOrEqual(0);
    expect(labelIdx).toBeGreaterThan(leftIdx);
    expect(rightIdx).toBeGreaterThan(labelIdx);
  });
});

describe('Button — interactivity', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    wrap(<Button onClick={onClick}>x</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    wrap(<Button disabled onClick={onClick}>x</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const onClick = vi.fn();
    wrap(<Button loading onClick={onClick}>x</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders the spinner when loading', () => {
    wrap(<Button loading>x</Button>);
    const btn = screen.getByRole('button');
    expect(btn.querySelector('[data-part="spinner"]')).not.toBeNull();
  });

  it('marks the button disabled in DOM when loading', () => {
    wrap(<Button loading>x</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('Button — fullWidth', () => {
  it('sets data-full-width="true" when fullWidth is true', () => {
    wrap(<Button fullWidth>x</Button>);
    expect(screen.getByRole('button').getAttribute('data-full-width')).toBe('true');
  });
});

describe('Button — polymorphism', () => {
  it('renders an <a> with href when as="a"', () => {
    wrap(
      <Button as="a" href="/somewhere">
        link
      </Button>,
    );
    const a = screen.getByRole('link', { name: /link/i });
    expect(a.tagName).toBe('A');
    expect(a.getAttribute('href')).toBe('/somewhere');
  });
});
```

- [ ] **Step 2: Run the tests, confirm they fail**

Run: `bun test apps/pilot 2>&1 | tail -30`
Expected: fails with "Cannot find module '../recipes/Button/Button.tsx'" or similar — Button.tsx doesn't exist yet. This is correct: red phase of TDD.

- [ ] **Step 3: Commit (RED)**

```bash
git add apps/pilot/src/recipes/Button/Button.test.tsx
git commit -m "$(cat <<'EOF'
test(pilot): failing Button recipe tests (Wave 1 task 1.4 RED)

TDD red phase. Tests cover rendering, default intent/variant,
icon ordering, click handling, disabled + loading suppression,
spinner render, fullWidth, polymorphic as=a. Implementation
in next task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1.5: Implement the Button recipe (GREEN)

**Goal:** Make all the Task 1.4 tests pass. Author the recipe with `defineComponent` (or `definePolymorphicComponent` for the `as` prop), consuming the consolidated theme.

**Files:**
- Create: `apps/pilot/src/recipes/Button/Button.tsx`
- Create: `apps/pilot/src/recipes/Button/Button.css`

- [ ] **Step 1: Create `apps/pilot/src/recipes/Button/Button.css`**

Recipe styles using ONLY consolidated tokens (no shad-* vars, no hand-set hex). The `cr-` prefix is the recipe's class namespace — short for "recipe."

```css
.cr-Button-root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-family-sans);
  font-weight: 500;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
  border: 1px solid transparent;

  /* intent + variant resolve via data-intent / data-variant rules below */
  background: var(--cr-button-bg);
  color: var(--cr-button-color);
  border-color: var(--cr-button-border);
}

.cr-Button-root:hover {
  background: var(--cr-button-hover-bg, var(--cr-button-bg));
}

.cr-Button-root:active {
  background: var(--cr-button-active-bg, var(--cr-button-bg));
}

.cr-Button-root:focus-visible {
  outline: 2px solid var(--cr-button-bg);
  outline-offset: 2px;
}

.cr-Button-root:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.cr-Button-root[data-size='sm'] {
  height: 2rem;
  padding: 0 0.75rem;
  font-size: var(--font-size-sm);
}

.cr-Button-root[data-size='md'] {
  height: 2.5rem;
  padding: 0 1rem;
  font-size: var(--font-size-base);
}

.cr-Button-root[data-size='lg'] {
  height: 3rem;
  padding: 0 1.5rem;
  font-size: var(--font-size-lg);
}

.cr-Button-root[data-full-width='true'] {
  width: 100%;
}

/* ─── intent × variant resolution ─────────────────────────────────────── */
/* Variant rules apply via cascade. data-variant=filled is the default. */

/* Each (variant, intent) combination sets the local --cr-button-* vars. */
/* primary intent */
.cr-Button-root[data-variant='filled'][data-intent='primary'] {
  --cr-button-bg: hsl(var(--color-primary-500));
  --cr-button-color: hsl(var(--color-neutral-0));
  --cr-button-border: hsl(var(--color-primary-500));
  --cr-button-hover-bg: hsl(var(--color-primary-600));
  --cr-button-active-bg: hsl(var(--color-primary-700));
}
.cr-Button-root[data-variant='outline'][data-intent='primary'] {
  --cr-button-bg: transparent;
  --cr-button-color: hsl(var(--color-primary-700));
  --cr-button-border: hsl(var(--color-primary-500));
  --cr-button-hover-bg: hsl(var(--color-primary-50));
}
.cr-Button-root[data-variant='subtle'][data-intent='primary'] {
  --cr-button-bg: hsl(var(--color-primary-100));
  --cr-button-color: hsl(var(--color-primary-800));
  --cr-button-border: transparent;
  --cr-button-hover-bg: hsl(var(--color-primary-200));
}
.cr-Button-root[data-variant='ghost'][data-intent='primary'] {
  --cr-button-bg: transparent;
  --cr-button-color: hsl(var(--color-primary-700));
  --cr-button-border: transparent;
  --cr-button-hover-bg: hsl(var(--color-primary-50));
}
.cr-Button-root[data-variant='link'][data-intent='primary'] {
  --cr-button-bg: transparent;
  --cr-button-color: hsl(var(--color-primary-700));
  --cr-button-border: transparent;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

/* Repeat the 5 variants for each of: neutral, success, warning, danger, info */
/* For brevity in this plan: copy the primary block 5 more times, replacing  */
/* "primary" with each intent name. Total: 5 variants × 6 intents = 30 rules.*/
/* The pattern is identical: filled = scale 500/600/700, outline = 500 ring  */
/* + 700 text + 50 hover, subtle = 100 bg + 800 text + 200 hover, ghost =    */
/* transparent + 700 text + 50 hover, link = transparent + 700 text + uline. */

/* ─── parts ──────────────────────────────────────────────────────────── */
.cr-Button-label {
  display: inline-block;
}

.cr-Button-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cr-Button-spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: cr-button-spin 600ms linear infinite;
}

@keyframes cr-button-spin {
  to { transform: rotate(360deg); }
}
```

**Important:** The "Repeat the 5 variants for each of: neutral, success, warning, danger, info" comment is a planning shortcut. In the actual file, write out all 30 rules explicitly. DRY-via-CSS-vars handles repetition cleanly: if the recipe shape is right, every (variant, intent) just sets a small set of `--cr-button-*` vars. If you find yourself writing complex per-cell CSS beyond setting those 4-5 vars, that's a smell — re-evaluate the cell.

- [ ] **Step 2: Create `apps/pilot/src/recipes/Button/Button.tsx`**

```tsx
/**
 * Button recipe — Wave 1 pilot for the pure-styled-primitive category.
 *
 * Authored with `definePolymorphicComponent` from @soribashi/factory.
 * Consumes only the consolidated theme tokens — no shad-*, no legacy the host library vars.
 *
 * Spec: docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md § 7
 * Journal: docs/superpowers/pilots/2026-04-26-button-conversion.md
 */
import { definePolymorphicComponent } from '@soribashi/core';
import './Button.css';

type Intent = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type Variant = 'filled' | 'outline' | 'subtle' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonOwnProps {
  intent?: Intent;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

// Type-param order: <TOwnProps, TDefaultAs> — matches the signature in
// packages/factory/src/define-polymorphic-component.tsx.
export const Button = definePolymorphicComponent<ButtonOwnProps, 'button'>({
  name: 'Button',
  defaultElement: 'button',
  selectors: ['root', 'label', 'icon', 'spinner'] as const,
  variants: ['filled', 'outline', 'subtle', 'ghost', 'link'] as const,
  classes: {
    root: 'cr-Button-root',
    label: 'cr-Button-label',
    icon: 'cr-Button-icon',
    spinner: 'cr-Button-spinner',
  },
  defaults: {
    intent: 'primary',
    variant: 'filled',
    size: 'md',
    loading: false,
    fullWidth: false,
  },
  render: ({ props, getStyles, Element }) => {
    const {
      intent,
      variant,
      size,
      loading,
      fullWidth,
      leftIcon,
      rightIcon,
      children,
      disabled,
      onClick,
      ...rest
    } = props as ButtonOwnProps & {
      disabled?: boolean;
      onClick?: (e: React.MouseEvent) => void;
      [k: string]: unknown;
    };

    const isDisabled = Boolean(disabled) || Boolean(loading);

    const handleClick = (e: React.MouseEvent) => {
      if (isDisabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <Element
        type={Element === 'button' ? 'button' : undefined}
        {...getStyles('root')}
        {...rest}
        data-intent={intent}
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth ? 'true' : undefined}
        data-loading={loading ? 'true' : undefined}
        data-part="root"
        disabled={Element === 'button' ? isDisabled : undefined}
        aria-disabled={Element !== 'button' && isDisabled ? true : undefined}
        onClick={handleClick}
      >
        {leftIcon && (
          <span {...getStyles('icon')} data-part="icon" data-position="left">
            {leftIcon}
          </span>
        )}
        <span {...getStyles('label')} data-part="label">{children}</span>
        {rightIcon && (
          <span {...getStyles('icon')} data-part="icon" data-position="right">
            {rightIcon}
          </span>
        )}
        {loading && <span {...getStyles('spinner')} data-part="spinner" aria-hidden />}
      </Element>
    );
  },
});
```

**Notes for the implementer:**
- The `definePolymorphicComponent` call signature here is the expected shape. If it doesn't compile, look at `packages/factory/src/define-polymorphic-component.tsx` for the actual signature and adapt — log any divergence as a soribashi gap in journal § 4.
- The `Element` reference inside `render` is the resolved tag (`'button'` by default, or whatever the consumer passed via `as`). If the actual API names this differently (e.g., `Component` or just resolves the JSX directly), adjust.
- `disabled` is a button-only attribute — for `as="a"`, set `aria-disabled` instead and rely on `e.preventDefault()` to suppress click.

If `definePolymorphicComponent` is not the right primitive (e.g., it doesn't yet exist or doesn't support this exact shape), fall back to `defineComponent` with a manual element override and document the gap. The behavior tests don't care about the inner mechanism — they care about the rendered output.

- [ ] **Step 3: Run the tests, confirm they pass**

Run: `bun test apps/pilot 2>&1 | tail -30`
Expected: all 11 tests pass.

If any fail:
- Read the failure message carefully.
- Adjust the recipe code, NOT the test (unless the test has an off-by-one or wrong assertion).
- Re-run.

- [ ] **Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: clean.

- [ ] **Step 5: Commit (GREEN)**

```bash
git add apps/pilot/src/recipes/Button/
git commit -m "$(cat <<'EOF'
feat(pilot): Button recipe authored with soribashi (Wave 1 task 1.5 GREEN)

Recipe defined via definePolymorphicComponent. Consumes consolidated
theme only — no shad-* vars, no legacy the host library tokens. Variant × intent
matrix expressed via CSS data-attribute rules over local --cr-button-*
vars (5 variants × 6 intents = 30 cells, one var-set per cell).
All 11 behavior tests passing. Polymorphic as=a supported with
aria-disabled fallback.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1.6: Build the ButtonMatrix demo page

**Goal:** Render the full variant × intent × size × state matrix in the pilot, with the vendored the host library Button shown side-by-side via screenshot or a simplified static replica.

**Files:**
- Create: `apps/pilot/src/pages/ButtonMatrix.tsx`
- Modify: `apps/pilot/src/App.tsx` (route)

- [ ] **Step 1: Create `apps/pilot/src/pages/ButtonMatrix.tsx`**

```tsx
/**
 * ButtonMatrix — full variant × intent × size × state matrix for the
 * Button recipe, in light + dark, with consolidation notes per cell.
 */
import { Button } from '../recipes/Button/Button.tsx';

const VARIANTS = ['filled', 'outline', 'subtle', 'ghost', 'link'] as const;
const INTENTS = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

export function ButtonMatrix() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontFamily: 'var(--font-family-sans)' }}>
        Variant × Intent (size = md)
      </h2>
      <table
        style={{
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-family-sans)',
          marginBottom: '2rem',
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>variant ↓ intent →</th>
            {INTENTS.map((intent) => (
              <th key={intent} style={{ textAlign: 'left', padding: '0.5rem' }}>{intent}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VARIANTS.map((variant) => (
            <tr key={variant}>
              <td style={{ padding: '0.5rem', fontWeight: 500 }}>{variant}</td>
              {INTENTS.map((intent) => (
                <td key={intent} style={{ padding: '0.5rem' }}>
                  <Button variant={variant} intent={intent} data-testid={`btn-${variant}-${intent}-md-default`}>
                    Click
                  </Button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontFamily: 'var(--font-family-sans)' }}>Sizes (variant=filled, intent=primary)</h2>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
        {SIZES.map((size) => (
          <Button key={size} size={size} data-testid={`btn-filled-primary-${size}-default`}>
            {size.toUpperCase()}
          </Button>
        ))}
      </div>

      <h2 style={{ fontFamily: 'var(--font-family-sans)' }}>States</h2>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Button data-testid="btn-state-default">Default</Button>
        <Button disabled data-testid="btn-state-disabled">Disabled</Button>
        <Button loading data-testid="btn-state-loading">Loading</Button>
        <Button leftIcon={<span>+</span>} data-testid="btn-state-leftIcon">Add</Button>
        <Button rightIcon={<span>→</span>} data-testid="btn-state-rightIcon">Next</Button>
        <Button as="a" href="#nowhere" data-testid="btn-state-link">Link</Button>
      </div>

      <div style={{ width: '300px' }}>
        <Button fullWidth data-testid="btn-state-fullwidth">Full width</Button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-family-sans)', marginTop: '2rem' }}>Consolidation notes</h2>
      <ul style={{ fontFamily: 'var(--font-family-sans)', fontSize: 'var(--font-size-sm)', maxWidth: '60ch' }}>
        <li><strong>Variant axis split.</strong> the host library's mixed `primary | secondary | outline | ghost | danger | success` is now `variant × intent`: 5 visual styles × 6 semantic roles = 30 cells.</li>
        <li><strong>`isLoading` → `loading`.</strong> Renamed for soribashi convention.</li>
        <li><strong>`asChild` → `as`.</strong> Polymorphism via `as` prop. Disabled `&lt;a&gt;` uses `aria-disabled` since the HTML disabled attribute is button-only.</li>
        <li><strong>Icons.</strong> ReactNode only — IconKey / icon-component wrapping is the integration project's concern.</li>
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Wire into App.tsx**

In `apps/pilot/src/App.tsx`, replace the `'buttons'` page placeholder:

```tsx
import { ButtonMatrix } from './pages/ButtonMatrix.tsx';
// ...
{page === 'buttons' && <ButtonMatrix />}
```

- [ ] **Step 3: Boot dev server and visually verify**

Run: `bun run dev:pilot`
Open `http://localhost:5174/`, click "Button matrix". Confirm:
- All 30 (variant × intent) cells render.
- Sizes render distinctly.
- States render correctly (disabled is faded, loading shows the spinner, link renders an `<a>` with `aria-disabled` if you also set disabled).
- Toggle dark mode — colors should shift but the structure stays.

Stop the server.

- [ ] **Step 4: Commit**

```bash
git add apps/pilot/src/pages/ButtonMatrix.tsx apps/pilot/src/App.tsx
git commit -m "$(cat <<'EOF'
feat(pilot): ButtonMatrix demo page (Wave 1 task 1.6)

Full variant × intent (5 × 6 = 30 cells) plus sizes plus states
matrix, light + dark. data-testid per cell for the Playwright
parity tests in the next task. Consolidation notes inline.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1.7: Extend Playwright config to include the pilot

**Goal:** Boot the pilot dev server alongside the playground and run pilot tests against `http://localhost:5174/`.

**Files:**
- Modify: `playwright.config.ts`

- [ ] **Step 1: Edit `playwright.config.ts` to add pilot project + webServer**

Replace the existing `projects` and `webServer` blocks with:

```ts
projects: [
  {
    name: 'blocks',
    testDir: './tests/browser-parity',
    testMatch: '**/*.spec.ts',
    use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' },
  },
  {
    name: 'pilot',
    testDir: './apps/pilot/tests',
    testMatch: '**/*.spec.ts',
    use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5174' },
  },
],

/* Boot both apps in parallel */
webServer: [
  {
    command: 'bun run --filter @soribashi/playground dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  {
    command: 'bun run --filter @soribashi/pilot dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
],
```

Also remove the top-level `testDir: './tests/browser-parity'` and the top-level `testMatch` if they exist — those are now on the `blocks` project. Leave the rest of the file as-is (forbidOnly, retries, workers, reporter, etc.).

Also remove the top-level `baseURL` from `use` (it's now per-project).

- [ ] **Step 2: Verify the existing browser-parity suite still works**

Run: `bun run test:browser --project=blocks 2>&1 | tail -30`
Expected: the existing 46 block parity tests still pass.

If they fail because of the project reorganization, fix the config before continuing.

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "$(cat <<'EOF'
test(pilot): add pilot project to playwright config (Wave 1 task 1.7)

Two playwright projects now: 'blocks' (existing) at port 5173,
'pilot' (new) at port 5174. webServer boots both apps
in parallel. Existing block parity suite verified intact.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1.8: Write Playwright parity tests for the Button matrix

**Goal:** Computed-style assertions per matrix cell — confirms the Button recipe paints from the consolidated tokens correctly.

**Files:**
- Create: `apps/pilot/tests/button-computed-styles.spec.ts`

- [ ] **Step 1: Write the spec file**

```ts
/**
 * Button matrix — computed-style parity tests.
 *
 * For each (variant, intent) cell rendered in pages/ButtonMatrix.tsx,
 * assert the computed background-color and color match what the
 * consolidated theme defines.
 *
 * Pattern reference: tests/browser-parity/blocks-computed-styles.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';

function cs(page: Page, testId: string, prop: string): Promise<string> {
  return page.evaluate(
    ([id, p]) => {
      const el = document.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
      if (!el) throw new Error(`Element not found: [data-testid="${id}"]`);
      return window.getComputedStyle(el).getPropertyValue(p).trim();
    },
    [testId, prop] as const,
  );
}

/**
 * Resolve a `--color-*-N` CSS var to its computed `rgb(...)` value, by
 * setting it on a temporary div and reading the computed background-color.
 * Lets us assert against token names rather than hardcoded RGB values that
 * would need to track theme changes.
 */
async function resolveColorVar(page: Page, varName: string): Promise<string> {
  return page.evaluate((v) => {
    const probe = document.createElement('div');
    probe.style.background = `hsl(var(${v}))`;
    document.body.appendChild(probe);
    const computed = window.getComputedStyle(probe).backgroundColor;
    probe.remove();
    return computed;
  }, varName);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Click the "Button matrix" nav button in App.tsx.
  await page.getByRole('button', { name: /button matrix/i }).click();
  await page.waitForSelector('[data-testid="btn-filled-primary-md-default"]');
});

const INTENTS = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const VARIANTS_FILLED = ['filled'] as const;

for (const intent of INTENTS) {
  for (const variant of VARIANTS_FILLED) {
    test(`${variant}/${intent}: background = scale 500`, async ({ page }) => {
      const actualBg = await cs(page, `btn-${variant}-${intent}-md-default`, 'background-color');
      const expectedBg = await resolveColorVar(page, `--color-${intent}-500`);
      expect(actualBg).toBe(expectedBg);
    });
  }
}

test('outline/primary: background is transparent', async ({ page }) => {
  const bg = await cs(page, 'btn-outline-primary-md-default', 'background-color');
  // computed-style for transparent is rgba(0, 0, 0, 0)
  expect(bg).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)/);
});

test('subtle/primary: background = scale 100', async ({ page }) => {
  const bg = await cs(page, 'btn-subtle-primary-md-default', 'background-color');
  const expected = await resolveColorVar(page, '--color-primary-100');
  expect(bg).toBe(expected);
});

test('size sm: height = 2rem (32px)', async ({ page }) => {
  const h = await cs(page, 'btn-filled-primary-sm-default', 'height');
  expect(h).toBe('32px');
});

test('size md: height = 2.5rem (40px)', async ({ page }) => {
  const h = await cs(page, 'btn-filled-primary-md-default', 'height');
  expect(h).toBe('40px');
});

test('size lg: height = 3rem (48px)', async ({ page }) => {
  const h = await cs(page, 'btn-filled-primary-lg-default', 'height');
  expect(h).toBe('48px');
});

test('disabled: opacity = 0.5', async ({ page }) => {
  const o = await cs(page, 'btn-state-disabled', 'opacity');
  expect(parseFloat(o)).toBeCloseTo(0.5, 2);
});

test('loading: spinner is present and disabled flag is set', async ({ page }) => {
  const btn = page.locator('[data-testid="btn-state-loading"]');
  await expect(btn).toHaveAttribute('disabled', '');
  await expect(btn.locator('[data-part="spinner"]')).toBeVisible();
});

test('fullWidth: width fills container', async ({ page }) => {
  // Container is 300px; button should match
  const w = await cs(page, 'btn-state-fullwidth', 'width');
  expect(w).toBe('300px');
});

test('as=a: renders an anchor', async ({ page }) => {
  const link = page.locator('[data-testid="btn-state-link"]');
  await expect(link).toHaveJSProperty('tagName', 'A');
});
```

This is a meaningful subset — full 30-cell parity isn't required for Wave 1's "is the framework real" question. The cases above exercise filled (the most-used variant) across all intents, plus key state behavior. Add more cells if visual review surfaces something specific.

- [ ] **Step 2: Run the tests**

Run: `bun run test:browser --project=pilot 2>&1 | tail -40`
Expected: all tests pass. The webServer config boots both playground and pilot in parallel, then runs the spec against port 5174.

If a test fails:
- Computed-color failure: the recipe's CSS for that cell isn't producing the expected token — check Button.css and the consolidated theme.
- "Element not found": data-testid mismatch between matrix page and spec.
- Timeout waiting for selector: matrix page didn't load, or the nav-click in `beforeEach` didn't work — inspect locally with `bunx playwright test --project=pilot --debug`.

- [ ] **Step 3: Commit**

```bash
git add apps/pilot/tests/button-computed-styles.spec.ts
git commit -m "$(cat <<'EOF'
test(pilot): Playwright Button parity tests (Wave 1 task 1.8)

Computed-style assertions per (variant, intent, size, state) cell.
Filled variant × all 6 intents × bg-color = scale 500 confirms the
intent-resolver wiring. Sizes assert exact heights. States assert
disabled opacity, loading spinner+disabled, fullWidth fills container,
as=a renders anchor.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1.9: Capture conversion findings in the journal (§ 3, § 4)

**Goal:** Document what soribashi patterns were used, what was easy, what was hard, and what gaps surfaced.

**Files:**
- Modify: `docs/superpowers/pilots/2026-04-26-button-conversion.md` (§ 3, § 4)

- [ ] **Step 1: Write § 3 of the conversion journal**

Use this template under § 3:

```markdown
## 3. What was easy / what was hard

### Easy
- [bullet per pattern that worked smoothly — e.g., "intent × variant via CSS data-attribute rules over local CSS vars"]

### Hard
- [bullet per friction point — e.g., "definePolymorphicComponent's render signature for the `as` prop wasn't documented anywhere; had to read `packages/factory/src/define-polymorphic-component.tsx` to figure it out"]

### Surprises
- [things that didn't work as expected — e.g., "consolidated theme's `surface.default` token wasn't picked up by Tailwind utilities; had to use inline style"]
```

Be honest. Friction points are the most valuable input to the playbook — don't soften them.

- [ ] **Step 2: Write § 4 of the conversion journal**

Use this template under § 4:

```markdown
## 4. Soribashi gaps surfaced

For each gap, use this format:

### Gap N: [short title]

**Severity:** blocking | important | nice-to-have
**Where surfaced:** [Phase 0 task X.Y or Phase 1 task X.Y]
**What we needed:** [one paragraph]
**What soribashi has today:** [one paragraph]
**Worked around by:** [Wave 1 workaround]
**Recommended resolution for soribashi:** [proposed change]
```

Pull every gap noted in passing throughout Phases 0 and 1 into this section. If you've been logging them in the consolidation journal § 6 instead, copy or cross-reference here so the conversion journal is self-contained for the playbook synthesis.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/pilots/2026-04-26-button-conversion.md
git commit -m "$(cat <<'EOF'
docs(pilot): conversion findings + soribashi gaps (Wave 1 task 1.9)

What was easy, what was hard, what surprised. Every gap surfaced
during Phases 0-1 captured with severity, workaround, and proposed
resolution — direct input to the Phase 2 playbook.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1.10: IconButton + ButtonDropdown extension sketch + playbook recommendations

**Goal:** Confirm the recipe shape extends cleanly to IconButton and ButtonDropdown WITHOUT building either. Capture recommendations for the pure-styled-primitive playbook section.

**Files:**
- Modify: `docs/superpowers/pilots/2026-04-26-button-conversion.md` (§ 5, § 6)

- [ ] **Step 1: Write § 5 — the extension sketch**

Under § 5:

```markdown
## 5. IconButton + ButtonDropdown extension sketch

### IconButton

Recipe shape:
- Reuses `Button.tsx`'s intent × variant × size system.
- Constrains: no `children` text, only an `icon` prop. `aria-label` required.
- Different sizing: square dimensions (h = w = sm/md/lg).
- Implementation sketch:
  ```tsx
  export const IconButton = definePolymorphicComponent<
    {
      intent?: Intent;
      variant?: Variant;
      size?: Size;
      icon: React.ReactNode;
      'aria-label': string;
      loading?: boolean;
    },
    'button'
  >({
    name: 'IconButton',
    defaultElement: 'button',
    selectors: ['root', 'icon'] as const,
    classes: { root: 'cr-IconButton-root', icon: 'cr-IconButton-icon' },
    render: ({ props, getStyles, Element }) => {
      const { intent, variant, size, icon, loading, ...rest } = props;
      return (
        <Element {...getStyles('root')} {...rest} data-intent={intent} data-variant={variant} data-size={size}>
          <span {...getStyles('icon')}>{icon}</span>
        </Element>
      );
    },
  });
  ```

**Conclusion:** the recipe shape extends cleanly. No new soribashi primitives needed.

### ButtonDropdown

Recipe shape: a Button + a Radix DropdownMenu (or wraps `DropdownMenu` once that's converted). The Button half reuses the existing recipe; the Dropdown half is the Wave-2-or-later overlay-compound work.

**Conclusion:** the recipe shape composes — but ButtonDropdown depends on a converted DropdownMenu. Defer until Wave 2's overlay-compound pattern lands.
```

- [ ] **Step 2: Write § 6 — playbook recommendations**

Under § 6:

```markdown
## 6. Recommended playbook entries — pure-styled-primitive category

The pattern Wave 1 surfaced for pure styled primitives:

1. **API split: variant × intent.** Always. Never let visual style and semantic role share a single prop.
2. **Authoring primitive:** `definePolymorphicComponent` if the component might appear as something other than its default element (`as="a"` for buttons-as-links is common). `defineComponent` for components that genuinely have one element.
3. **Style approach:** CSS data-attribute rules (`[data-variant='X'][data-intent='Y']`) that set local `--cr-{component}-*` CSS vars. The recipe's CSS is then mostly: defaults at the root, overrides per data-attribute, parts use the local vars. Avoid per-cell complexity.
4. **State props:** `disabled`, `loading`, plus any component-specific (e.g., `fullWidth`). Loading must suppress click and propagate `disabled`.
5. **Polymorphic + disabled:** When `as` is non-button, use `aria-disabled` + `e.preventDefault()` for click suppression; HTML `disabled` attribute is button-only.
6. **Slots:** keep a clean `selectors` list — for Button: `['root', 'label', 'icon', 'spinner']`. Each part gets its own class for downstream override.
7. **Tokens:** consume only the consolidated theme. Never hand-set hex; never reference legacy fragmented tokens.

The playbook (Phase 2) will expand each of these with code snippets and rationale.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/pilots/2026-04-26-button-conversion.md
git commit -m "$(cat <<'EOF'
docs(pilot): IconButton/ButtonDropdown extension sketch + playbook recs (Wave 1 task 1.10)

Sketches confirm IconButton extends cleanly (no new primitives needed)
and ButtonDropdown composes pending Wave 2's overlay-compound pattern.
Recommended playbook entries for the pure-styled-primitive category
captured for Phase 2 synthesis.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 1 Exit Check

Before moving to Phase 2:
- [ ] `bun test apps/pilot` — all 11 Button behavior tests pass.
- [ ] `bun run test:browser --project=pilot` — all Playwright parity tests pass.
- [ ] `bun run test:browser --project=blocks` — existing block tests still pass (regression check).
- [ ] `bun run typecheck` — clean.
- [ ] `bun run dev:pilot` — boots, ButtonMatrix renders all cells in light + dark.
- [ ] `docs/superpowers/pilots/2026-04-26-button-conversion.md` has all 6 sections populated.

If any of these fail, fix before continuing.

---

# Phase 2 — Wave 1 Playbook

Phase 2 synthesizes Phases 0 and 1 into a single forward-looking playbook. The pilots were the evidence; the playbook is the deliverable that future waves and the integration project consume.

---

## Task 2.1: Scaffold the playbook with all sections

**Goal:** Create the playbook file with the full section structure from spec § 8.2 — populated headings + brief context, content filled in subsequent tasks.

**Files:**
- Create: `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md`

- [ ] **Step 1: Create the file with structure**

```markdown
# Recipe Conversion Playbook (Wave 1 partial)

**Status:** Wave 1 complete — pure-styled-primitive category covered. Future waves extend.
**Date:** 2026-04-26
**Spec:** `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md`
**Pilots:**
- `docs/superpowers/pilots/2026-04-26-token-consolidation.md`
- `docs/superpowers/pilots/2026-04-26-button-conversion.md`

## How to read this playbook

The playbook is the synthesis layer over the pilot journals. The journals are the raw evidence — what was tried, what surfaced, what design choices were made and why. The playbook abstracts that into transferable methodology and recommended patterns.

The playbook is designed to extend, not be rewritten. Each future wave (Tooltip, Tabs, Select) appends its category-specific authoring pattern to § 2 and contributes additional gaps to § 3.

## 1. Token consolidation methodology

_Populated in Task 2.2._

## 2. Authoring patterns by category

### 2.1 Pure styled primitive (Wave 1 — Button)

_Populated in Task 2.3._

### 2.2 Transient overlay compound (Wave 2 — Tooltip)

_To be populated by Wave 2._

### 2.3 Persistent navigational compound (Wave 3 — Tabs)

_To be populated by Wave 3._

### 2.4 Form control (Wave 4 — Select)

_To be populated by Wave 4._

## 3. Soribashi gaps surfaced

_Populated in Task 2.4._

## 4. Legacy-token migration strategy stub

_Populated in Task 2.5._

## 5. Future waves outlined

_Populated in Task 2.5._
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md
git commit -m "$(cat <<'EOF'
docs(playbook): scaffold Wave 1 playbook structure (Wave 1 task 2.1)

Empty section structure matching spec § 8.2. Subsequent tasks populate
each section from the pilot journals.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2.2: Write § 1 — Token consolidation methodology

**Goal:** Generalize the inventory → classify → express → codegen → review → decide loop into a transferable methodology, not specific to the host library.

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md` (§ 1)

- [ ] **Step 1: Read the consolidation journal**

Read: `docs/superpowers/pilots/2026-04-26-token-consolidation.md` end-to-end.

- [ ] **Step 2: Write § 1 of the playbook**

Replace the `_Populated in Task 2.2._` placeholder with the methodology, structured as:

```markdown
## 1. Token consolidation methodology

The methodology is a 6-step loop that takes a fragmented design system and outputs a single focused soribashi theme. Wave 1 ran it against the host library; the same loop applies to any other library.

### Step 1: Inventory

Enumerate every token. For CSS-var-driven systems: read every `--*` declaration in your styles + every reference in your Tailwind config. Capture: name, light value, dark value, where defined, where used (rough usage count).

**Output:** a table — one row per token. (See `docs/superpowers/pilots/2026-04-26-token-consolidation.md` § 1 for the Wave 1 example.)

**Why:** classification needs evidence. Without the full inventory you'll miss duplicates and shadows.

### Step 2: Classify

Tag each token as:
- **signal** — real design intent. Kept.
- **hack** — tooling artifacts (shadcn defaults, framework defaults that were never customized intentionally). Dropped.
- **duplication** — same value under multiple names. Collapsed to one canonical.
- **deferred** — chart colors, ad-hoc one-offs. Documented but out of scope for this consolidation pass.

**Output:** add a `Class` column to the inventory table. Surface open questions in a separate section.

**Why:** without forcing classification, "everything is signal" creeps in and the consolidation loses value.

### Step 3: Express

Build the soribashi theme via `createTheme()`. Express:
- Brand/intent **scales** as `tokens.colors.{family}.{50..950}` — regenerate any scales that don't ramp coherently.
- **Semantic tokens** via `semantic.{text, surface, border}` references to scale anchors — never parallel hand-set values.
- **Dark variants** via the `dark` partial.

**Output:** `theme/index.ts` — the consolidated theme.

**Why:** soribashi's intent resolver gives you a clean home for "semantic name → scale lookup." Resist the urge to hand-set semantic colors.

### Step 4: Codegen

Run `soribashi codegen build --config <pilot>/soribashi.config.ts`. Produces `theme.css` (vars) + `tailwind.config.generated.js` (Tailwind partial).

Wire into the host's `tailwind.config.js` via the compose pattern (Option C — see § 3 for the C → A roadmap):

```js
const generated = require('./src/generated/tailwind.config.generated.js');
module.exports = {
  ...generated,
  content: [...],
  darkMode: 'class', // or your scope
  corePlugins: { preflight: false }, // mirror your host's setting
  plugins: [...(generated.plugins ?? []), require('tailwindcss-animate')],
};
```

**Output:** generated files committed; styles.css imports them; Tailwind utilities resolve from the consolidated theme.

### Step 5: Review

Build a `TokenReview` swatch page (every consolidated token rendered as a labeled swatch in light + dark) and a `ScreenReplica` (static markup of one representative screen using only consolidated tokens). Compare the replica against a screenshot of the original.

**Output:** visual review findings in the journal.

**Why:** **intent parity, not pixel parity.** Drift wherever consolidation deliberately changed something is expected and good. Drift you didn't expect is a finding.

### Step 6: Decide

For every open design question surfaced during steps 2-5: pick a defensible default, document the rationale, flag for human design review. The pilot doesn't block on design's blessing — the playbook escalates.

**Output:** the open-questions section of the journal, ready for design owner review.

### What this methodology assumes

- The host's design system is at least partly token-driven (CSS vars, Tailwind config, etc.). Hand-set hex values everywhere makes consolidation harder; you'll need a preliminary "extract tokens from inline styles" pass first.
- You can run the host's codebase (or a recent screenshot of it) for visual review.
- A human design owner exists and can answer escalated questions.

If any of these don't hold, the methodology is still valuable but produces less confident output.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md
git commit -m "$(cat <<'EOF'
docs(playbook): § 1 token consolidation methodology (Wave 1 task 2.2)

Generalized 6-step loop (inventory → classify → express → codegen →
review → decide) abstracted from the host library pilot. Transferable to any
fragmented design system.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2.3: Write § 2.1 — Pure styled primitive authoring pattern

**Goal:** Codify the Button category recipe pattern for future authors of pure styled primitives (Badge, Chip, Dot, Card, etc.).

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md` (§ 2.1)

- [ ] **Step 1: Read the conversion journal**

Read: `docs/superpowers/pilots/2026-04-26-button-conversion.md` end-to-end. Pay attention to § 6 (recommended playbook entries).

- [ ] **Step 2: Write § 2.1 of the playbook**

Replace the placeholder with:

```markdown
### 2.1 Pure styled primitive (Wave 1 — Button)

Pattern for components with no Radix anatomy, no portal, no controlled state — just styled markup that responds to props.

**Examples in host:** Button, Badge, Chip, Dot, Skeleton, Card.

#### Recipe shape

1. **API split: variant × intent.** Always. `variant` is visual style (filled, outline, subtle, ghost, link). `intent` is semantic role (primary, neutral, success, warning, danger, info). Never mix them on a single prop.
2. **Authoring primitive:** `definePolymorphicComponent` if the component might render as a non-default element (`as="a"` for buttons-as-links). `defineComponent` if the component genuinely has one element.
3. **Selectors:** keep a clean parts list. For Button: `['root', 'label', 'icon', 'spinner']`. Each part gets its own class for downstream override.
4. **Defaults:** set sensible defaults so consumers can drop the component in without ceremony. Wave 1's Button defaults: `intent: 'primary', variant: 'filled', size: 'md', loading: false, fullWidth: false`.

#### Style approach

Use CSS data-attribute rules over local CSS variables. For each (variant, intent) pair, set 4-5 local `--cr-{component}-*` vars; let the root stylesheet pull from those vars.

```css
/* root: pulls from local vars */
.cr-Button-root {
  background: var(--cr-button-bg);
  color: var(--cr-button-color);
  border-color: var(--cr-button-border);
  /* ... */
}

/* per-cell: just sets the local vars */
.cr-Button-root[data-variant='filled'][data-intent='primary'] {
  --cr-button-bg: hsl(var(--color-primary-500));
  --cr-button-color: hsl(var(--color-neutral-0));
  --cr-button-border: hsl(var(--color-primary-500));
  --cr-button-hover-bg: hsl(var(--color-primary-600));
  --cr-button-active-bg: hsl(var(--color-primary-700));
}
```

This collapses 30 (variant × intent) cells to: one root-rule + 30 4-line override blocks. If any cell needs more than that, it's a smell — re-evaluate.

#### State handling

- `disabled` and `loading` should both be visually distinguishable from default. Loading must propagate the `disabled` attribute and suppress click handlers in the recipe (not just rely on the consumer).
- Polymorphic + disabled: when `as` is non-button, use `aria-disabled={true}` and `e.preventDefault()` to suppress click. The HTML `disabled` attribute is button-only.

#### Token consumption

- ONLY consolidated theme tokens. Never hand-set hex, never reference legacy fragmented tokens.
- Hover and active states consume the next deeper shade in the scale (e.g., 500 default → 600 hover → 700 active for filled).
- Subtle/ghost variants consume the lighter shades (50/100 backgrounds, 700/800 text).

#### Tests

- Vitest behavior: rendering, default props, click handling (both directions: disabled/loading suppression AND default fires), icon ordering, polymorphic as=a, fullWidth.
- Playwright parity: computed `background-color` for the high-frequency cells (filled × all intents = 6 cells); computed heights for sizes; opacity for disabled; spinner present + disabled set for loading.
- Don't aim for 30-cell exhaustiveness in Playwright — the parity tests are smoke for the pattern, not exhaustive proof.

#### Recipe code snippet

```tsx
export const Button = definePolymorphicComponent<'button', ButtonOwnProps>({
  name: 'Button',
  defaultElement: 'button',
  selectors: ['root', 'label', 'icon', 'spinner'] as const,
  variants: ['filled', 'outline', 'subtle', 'ghost', 'link'] as const,
  classes: { root: 'cr-Button-root', label: 'cr-Button-label', icon: 'cr-Button-icon', spinner: 'cr-Button-spinner' },
  defaults: { intent: 'primary', variant: 'filled', size: 'md', loading: false, fullWidth: false },
  render: ({ props, getStyles, Element }) => { /* ... */ },
});
```

See `apps/pilot/src/recipes/Button/Button.tsx` for the full implementation.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md
git commit -m "$(cat <<'EOF'
docs(playbook): § 2.1 pure styled primitive authoring pattern (Wave 1 task 2.3)

Codified pattern from the Button pilot: API split, authoring primitive
choice, style approach (data-attr rules over local vars), state
handling, token consumption, test scope. Reusable for Badge, Chip,
Dot, Skeleton, Card and other pure primitives.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2.4: Write § 3 — Soribashi gaps surfaced (with severity)

**Goal:** Aggregate every gap from both pilot journals into a single severity-tagged list. This is the C → A bridge — what soribashi has to add before it can own the full Tailwind config and author every host category cleanly.

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md` (§ 3)

- [ ] **Step 1: Compile the gap list**

Read journal § 6 (consolidation) and journal § 4 (conversion). Aggregate every gap into a single ordered table:

```markdown
## 3. Soribashi gaps surfaced

| # | Gap | Severity | Surfaced in | Recommended resolution |
|---|---|---|---|---|
| 1 | [short title] | blocking / important / nice-to-have | Phase X task Y.Z | [proposed change] |
| 2 | ... | ... | ... | ... |
```

**Severity rubric:**
- **blocking** — would have prevented the pilot from completing without a workaround that hides the gap. Future waves WILL hit this gap; needs to be fixed in soribashi before a sane rollout.
- **important** — surfaced friction; workaround was viable for Wave 1 but the gap will compound. Fix before Wave 4 (Select) at the latest.
- **nice-to-have** — surfaced but the workaround is fine indefinitely. Optional cleanup.

For each gap, include a 1-paragraph "Recommended resolution" with the proposed soribashi change and roughly which package owns it (`@soribashi/codegen`, `@soribashi/factory`, `@soribashi/theme`).

- [ ] **Step 2: Add the C → A bridge subsection**

After the table, add:

```markdown
### The C → A bridge

Wave 1 ships against Option C (soribashi emits a Tailwind partial; host config composes). The north star is Option A (soribashi owns the entire Tailwind config). The gaps that must close to make A real:

- [list the gaps tagged `blocking` or `important` that pertain specifically to soribashi owning the full Tailwind config]
- [each as a single bullet pointing back to the table row]

Once those gaps are closed, the pilot's `tailwind.config.js` collapses to:

```js
module.exports = require('./src/generated/tailwind.config.generated.js');
```

and the soribashi theme owns dark-mode selector, preflight setting, plugin pass-through, content globs.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md
git commit -m "$(cat <<'EOF'
docs(playbook): § 3 soribashi gaps surfaced + C→A bridge (Wave 1 task 2.4)

Every gap from both pilot journals aggregated with severity, surface
location, and recommended resolution. C→A bridge subsection identifies
which gaps gate the north-star integration model.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2.5: Write § 4 (legacy-token migration stub) + § 5 (future waves)

**Goal:** Size the integration project's scope; outline future waves so they extend rather than rewrite.

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md` (§ 4, § 5)

- [ ] **Step 1: Write § 4 — Legacy-token migration strategy stub**

```markdown
## 4. Legacy-token migration strategy stub

**Scope:** the integration project's job — migrate the host library's existing 115 importers from fragmented tokens to the consolidated vocabulary. Sized here, not designed.

### Migration surface

Pull from `docs/superpowers/pilots/2026-04-26-token-consolidation.md` § 4 (deprecation list). Every dropped/collapsed token has a target. The migration is a find/replace at the token-name level, plus visual review.

### Phasing (rough sizing)

- **Phase A — `shad-*` rip-out (S/M).** Find every reference to `--background`, `--foreground`, `--primary` (shad), etc. Replace with the consolidated equivalents from the deprecation list. Mostly mechanical. ~50 file touches estimated.
- **Phase B — Scale renames (S).** `--color-error-*` → `--color-danger-*`, etc. Mechanical.
- **Phase C — Variant taxonomy migration on Button usages (M).** Every `<Button variant="primary">` becomes `<Button intent="primary" variant="filled">`. Codemod-friendly. ~80-100 call sites.
- **Phase D — Visual review per page (M/L).** After A-C, render each the host library page in the consolidated theme; capture findings; iterate.
- **Phase E — Deprecation of the legacy `host-styles.css` var declarations (S).** Once nothing references the legacy vars, delete them.

The integration project gets its own brainstorm + spec + plan. This stub is the input.
```

- [ ] **Step 2: Write § 5 — Future waves outlined**

```markdown
## 5. Future waves outlined

Each wave reuses the consolidated theme from Wave 1. None redoes the token work. Each produces its own pilot + journal + playbook extension (added to § 2.X above).

### Wave 2 — Tooltip (transient overlay compound)

**Why:** answers "how do I author a Radix-anatomy compound" — the open question Wave 1 deliberately deferred. Forces soribashi to address slot styling, portal handling, `data-state`-driven styling, and surface tokens (popover bg/border/shadow).

**Pre-work:** likely needs a soribashi compound-authoring helper. Design-and-spec is part of Wave 2, not Wave 1.

**Sizing:** M.

### Wave 3 — Tabs (persistent navigational compound)

**Why:** tests slot story at higher part-count (Root/List/Trigger/Content) and with controlled state passthrough.

**Pre-work:** Wave 2 lands the compound primitive; Wave 3 stresses it.

**Sizing:** M.

### Wave 4 — Select (form control)

**Why:** the heaviest anatomy in host. Field composition (label/help/error slots), controlled state, keyboard a11y, trigger-vs-content surface tokens, option rendering.

**Pre-work:** Waves 2 and 3 lock the compound + slot patterns. Wave 4 also exercises field composition (label/help/error slots).

**Sizing:** L.

### After Wave 4

The playbook covers all four authoring categories. The remaining ~20 host component groups can be sequenced as a sweep, leaning on the pattern most appropriate per category. Bundling vs one-by-one is a sequencing question for that project.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md
git commit -m "$(cat <<'EOF'
docs(playbook): § 4 migration stub + § 5 future waves (Wave 1 task 2.5)

Legacy-token migration sized into 5 phases (A-E) for the future
integration project. Future waves (Tooltip, Tabs, Select) named,
sized, and slotted into the playbook structure.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2.6: Self-review the playbook

**Goal:** Final pass before declaring Wave 1 done.

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md` (any inline fixes found during review)

- [ ] **Step 1: Placeholder scan**

Read the full playbook. Search for `TBD`, `TODO`, `XXX`, `_Populated_`, `[bullet`, `[short title`, or any other placeholder text that should have been replaced. Fix inline.

- [ ] **Step 2: Internal consistency**

Check:
- Section numbering is consecutive.
- Cross-references (e.g., "see § 3") point to real sections.
- Severity tags in § 3 match the rubric stated in § 3.
- The C → A bridge in § 3 only cites gaps that are actually in the table.
- The migration phasing in § 4 traces back to the deprecation list (referenced).

Fix any inconsistencies inline.

- [ ] **Step 3: Scope and ambiguity**

For each section, ask:
- Does this section's scope match what its heading promises?
- Is there language that two readers would interpret differently?
- Does each recommendation tell the reader what to actually do?

Tighten wherever a reader would have to guess.

- [ ] **Step 4: Coverage check against spec § 8.2**

The spec calls for 5 playbook sections:
1. Token consolidation methodology — § 1
2. Authoring patterns by category — § 2
3. Soribashi gaps surfaced — § 3
4. Legacy-token migration strategy stub — § 4
5. Future waves outlined — § 5

Confirm all five exist and are populated. If any is thin, fix.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md
git commit -m "$(cat <<'EOF'
docs(playbook): self-review pass (Wave 1 task 2.6)

Placeholder scan, internal consistency, scope/ambiguity, coverage
against spec § 8.2. Inline fixes applied. Wave 1 deliverables
complete.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 Exit Check

Before declaring Wave 1 complete:
- [ ] Playbook exists, all 5 sections populated.
- [ ] Both pilot journals exist, all sections populated.
- [ ] Token consolidation journal § 7 (visual review) signed off.
- [ ] Button conversion journal § 4 (gaps) populated.
- [ ] All commits prefixed with `(Wave 1 task X.Y)`.
- [ ] `bun test` clean (vitest workspace including the pilot).
- [ ] `bun run test:browser` clean (both projects).
- [ ] `bun run typecheck` clean.
- [ ] `bun run dev:pilot` boots and renders TokenReview, ScreenReplica, ButtonMatrix in light + dark.
- [ ] `bun run dev:playground` still works (regression check).

---

# Wave 1 Done

The engagement output:
- A consolidated soribashi theme expressing the host library's design intent (the token methodology proven against a real fragmented system).
- A working Button recipe authored with `defineComponent` against the consolidated theme — the pure-styled-primitive authoring pattern proven.
- Two pilot journals capturing the evidence (decisions, gaps, design questions).
- The Wave 1 partial playbook synthesizing methodology + Button category pattern + gaps + future-wave outline.

Future waves extend the playbook against the same theme; nothing in Wave 1's output blocks Wave 2.
