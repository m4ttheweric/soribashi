# Token Consolidation Pilot — Journal

**Wave:** 1
**Date started:** 2026-04-26
**Spec:** `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md`

This journal captures inventory, classification, the consolidated theme decisions, the deprecation list, and open design questions surfaced during Wave 1 Phase 0.

## 1. Inventory (Task 0.2)

### Source files surveyed

- `apps/adjuster/src/components/ClaimViewIslands/tailwind.config.js` (read in full, 224 lines)
- `apps/adjuster/src/components/ClaimViewIslands/claimview-islands.css` (read in full, 629 lines — `:root`/`.claim-view-islands` light block AND `.dark .claim-view-islands` dark block both fully consumed)

### Conventions used in the table below

- **Token name** — for CSS vars, the var name as declared (without the leading `--` stripped). For Tailwind config keys, the path inside `theme.extend` written as e.g. `colors.shad.background`.
- **Light value** — the value declared in the light block of the CSS (`.claim-view-islands { ... }`). For Tailwind-only entries, the resolved expression.
- **Dark value** — the value declared in `.dark .claim-view-islands { ... }`. `—` if the token has no dark override (Tailwind-only entries, mode-agnostic CSS vars, or vars whose light value is reused in dark mode by omission).
- **Where defined** — `claimview-islands.css`, `tailwind.config.js`, or `both` if the same identifier is defined in both. For Tailwind keys that point at a CSS var (e.g. `shad-background → hsl(var(--background))`), the entry is listed under `tailwind.config.js` and the row notes its underlying CSS var via `↳ underlies: --background`.
- **Flavor** — one of `shad-*`, `Figma scale`, `direct semantic`, `chart`, `other`.

All HSL values are written as raw `H S% L%` triples (no `hsl()` wrapper) — that matches CVI's convention because the wrapper is applied at the Tailwind layer via `hsl(var(--…) / <alpha-value>)`.

### 1.1 CSS variables — declared in `claimview-islands.css`

Rows are grouped by flavor; within each flavor, by source-file declaration order.

| Token name | Light value | Dark value | Where defined | Flavor | Class |
|---|---|---|---|---|---|
| `--background` | `0 0% 100%` | `222.2 84% 4.9%` | `claimview-islands.css` | shad-* | hack |
| `--foreground` | `222.2 84% 4.9%` | `210 40% 98%` | `claimview-islands.css` | shad-* | hack |
| `--card` | `0 0% 100%` | `222.2 84% 4.9%` | `claimview-islands.css` | shad-* | hack |
| `--card-foreground` | `222.2 84% 4.9%` | `210 40% 98%` | `claimview-islands.css` | shad-* | hack |
| `--popover` | `0 0% 100%` | `222.2 84% 4.9%` | `claimview-islands.css` | shad-* | hack |
| `--popover-foreground` | `222.2 84% 4.9%` | `210 40% 98%` | `claimview-islands.css` | shad-* | hack |
| `--primary` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` | `claimview-islands.css` | shad-* | hack |
| `--primary-foreground` | `210 40% 98%` | `222.2 47.4% 11.2%` | `claimview-islands.css` | shad-* | hack |
| `--secondary` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | `claimview-islands.css` | shad-* | hack |
| `--secondary-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | `claimview-islands.css` | shad-* | hack |
| `--muted` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | `claimview-islands.css` | shad-* | hack |
| `--muted-foreground` | `215.4 16.3% 46.9%` | `215 20.2% 65.1%` | `claimview-islands.css` | shad-* | hack |
| `--accent` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | `claimview-islands.css` | shad-* | hack |
| `--accent-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | `claimview-islands.css` | shad-* | hack |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | `claimview-islands.css` | shad-* | hack |
| `--destructive-foreground` | `210 40% 98%` | `210 40% 98%` | `claimview-islands.css` | shad-* | hack |
| `--border` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` | `claimview-islands.css` | shad-* | hack |
| `--input` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` | `claimview-islands.css` | shad-* | hack |
| `--ring` | `221.2 83.2% 53.3%` | `224.3 76.3% 48%` | `claimview-islands.css` | shad-* | hack |
| `--radius` | `0.5rem` | — *(no override; light value reused)* | `claimview-islands.css` | shad-* | hack |
| `--chart-1` | `12 76% 61%` | `220 70% 50%` | `claimview-islands.css` | chart | deferred |
| `--chart-2` | `173 58% 39%` | `160 60% 45%` | `claimview-islands.css` | chart | deferred |
| `--chart-3` | `197 37% 24%` | `30 80% 55%` | `claimview-islands.css` | chart | deferred |
| `--chart-4` | `43 74% 66%` | `280 65% 60%` | `claimview-islands.css` | chart | deferred |
| `--chart-5` | `27 87% 67%` | `340 75% 55%` | `claimview-islands.css` | chart | deferred |
| `--color-primary` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` | `claimview-islands.css` | Figma scale | duplication → `--color-primary-500` |
| `--color-primary-50` | `240 100% 98%` | `217 91% 15%` | `claimview-islands.css` | Figma scale | signal |
| `--color-primary-100` | `240 100% 96%` | `217 91% 20%` | `claimview-islands.css` | Figma scale | signal |
| `--color-primary-200` | `240 100% 92%` | `217 91% 25%` | `claimview-islands.css` | Figma scale | signal |
| `--color-primary-300` | `240 100% 85%` | `217 91% 30%` | `claimview-islands.css` | Figma scale | signal |
| `--color-primary-400` | `240 100% 75%` | `217 91% 40%` | `claimview-islands.css` | Figma scale | signal |
| `--color-primary-500` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` | `claimview-islands.css` | Figma scale | signal |
| `--color-primary-600` | `221.2 83.2% 45%` | `217 91% 65%` | `claimview-islands.css` | Figma scale | signal |
| `--color-primary-700` | `221.2 83.2% 38%` | `217 91% 70%` | `claimview-islands.css` | Figma scale | signal |
| `--color-primary-800` | `221.2 83.2% 30%` | `217 91% 75%` | `claimview-islands.css` | Figma scale | signal |
| `--color-primary-900` | `221.2 83.2% 22%` | `217 91% 80%` | `claimview-islands.css` | Figma scale | signal |
| `--color-primary-950` | `221.2 83.2% 15%` | `217 91% 85%` | `claimview-islands.css` | Figma scale | signal |
| `--color-neutral-50` | `210 40% 98%` | `222 47% 11%` | `claimview-islands.css` | Figma scale | signal |
| `--color-neutral-100` | `210 40% 96%` | `217 33% 17%` | `claimview-islands.css` | Figma scale | signal |
| `--color-neutral-200` | `214 32% 91%` | `215 25% 27%` | `claimview-islands.css` | Figma scale | signal |
| `--color-neutral-300` | `213 27% 84%` | `215 19% 35%` | `claimview-islands.css` | Figma scale | signal |
| `--color-neutral-400` | `215 20% 65%` | `215 16% 47%` | `claimview-islands.css` | Figma scale | signal |
| `--color-neutral-500` | `215 16% 47%` | `215 20% 65%` | `claimview-islands.css` | Figma scale | signal |
| `--color-neutral-600` | `215 19% 35%` | `213 27% 84%` | `claimview-islands.css` | Figma scale | signal |
| `--color-neutral-700` | `215 25% 27%` | `214 32% 91%` | `claimview-islands.css` | Figma scale | signal |
| `--color-neutral-800` | `217 33% 17%` | `210 40% 96%` | `claimview-islands.css` | Figma scale | signal |
| `--color-neutral-900` | `222 47% 11%` | `210 40% 98%` | `claimview-islands.css` | Figma scale | signal |
| `--color-neutral-950` | `222 84% 5%` | `0 0% 100%` | `claimview-islands.css` | Figma scale | signal |
| `--color-success` | `142 76% 36%` | `142 71% 45%` | `claimview-islands.css` | Figma scale | duplication → `--color-success-500` |
| `--color-success-50` | `138 76% 97%` | `145 80% 10%` | `claimview-islands.css` | Figma scale | signal |
| `--color-success-100` | `141 84% 93%` | `144 61% 20%` | `claimview-islands.css` | Figma scale | signal |
| `--color-success-200` | `141 79% 85%` | `143 62% 20%` | `claimview-islands.css` | Figma scale | signal |
| `--color-success-300` | `142 77% 73%` | `142 64% 24%` | `claimview-islands.css` | Figma scale | signal |
| `--color-success-400` | `142 71% 45%` | `142 72% 29%` | `claimview-islands.css` | Figma scale | signal |
| `--color-success-500` | `142 76% 36%` | `142 71% 45%` | `claimview-islands.css` | Figma scale | signal |
| `--color-success-600` | `142 72% 29%` | `142 77% 73%` | `claimview-islands.css` | Figma scale | signal |
| `--color-success-700` | `142 64% 24%` | `141 79% 85%` | `claimview-islands.css` | Figma scale | signal |
| `--color-success-800` | `143 62% 20%` | `141 84% 93%` | `claimview-islands.css` | Figma scale | signal |
| `--color-success-900` | `144 61% 20%` | `138 76% 97%` | `claimview-islands.css` | Figma scale | signal |
| `--color-success-950` | `145 80% 10%` | `138 100% 99%` | `claimview-islands.css` | Figma scale | signal |
| `--color-warning` | `38 92% 50%` | `49 98% 48%` | `claimview-islands.css` | Figma scale | duplication → `--color-warning-500` |
| `--color-warning-50` | `48 96% 89%` | `26 83% 14%` | `claimview-islands.css` | Figma scale | signal |
| `--color-warning-100` | `48 96% 77%` | `22 78% 26%` | `claimview-islands.css` | Figma scale | signal |
| `--color-warning-200` | `48 97% 63%` | `23 83% 31%` | `claimview-islands.css` | Figma scale | signal |
| `--color-warning-300` | `49 98% 48%` | `26 90% 37%` | `claimview-islands.css` | Figma scale | signal |
| `--color-warning-400` | `49 96% 47%` | `32 95% 44%` | `claimview-islands.css` | Figma scale | signal |
| `--color-warning-500` | `38 92% 50%` | `49 98% 48%` | `claimview-islands.css` | Figma scale | signal |
| `--color-warning-600` | `32 95% 44%` | `49 97% 63%` | `claimview-islands.css` | Figma scale | signal |
| `--color-warning-700` | `26 90% 37%` | `48 97% 77%` | `claimview-islands.css` | Figma scale | signal |
| `--color-warning-800` | `23 83% 31%` | `48 96% 89%` | `claimview-islands.css` | Figma scale | signal |
| `--color-warning-900` | `22 78% 26%` | `48 100% 96%` | `claimview-islands.css` | Figma scale | signal |
| `--color-warning-950` | `26 83% 14%` | `48 100% 98%` | `claimview-islands.css` | Figma scale | signal |
| `--color-error` | `0 84% 60%` | `0 72% 51%` | `claimview-islands.css` | Figma scale | duplication → `--color-error-500` |
| `--color-error-50` | `0 93% 94%` | `0 75% 15%` | `claimview-islands.css` | Figma scale | signal |
| `--color-error-100` | `0 96% 89%` | `0 63% 31%` | `claimview-islands.css` | Figma scale | signal |
| `--color-error-200` | `0 97% 85%` | `0 70% 35%` | `claimview-islands.css` | Figma scale | signal |
| `--color-error-300` | `0 94% 82%` | `0 74% 42%` | `claimview-islands.css` | Figma scale | signal |
| `--color-error-400` | `0 91% 71%` | `0 72% 51%` | `claimview-islands.css` | Figma scale | signal |
| `--color-error-500` | `0 84% 60%` | `0 84% 60%` | `claimview-islands.css` | Figma scale | signal |
| `--color-error-600` | `0 72% 51%` | `0 91% 71%` | `claimview-islands.css` | Figma scale | signal |
| `--color-error-700` | `0 74% 42%` | `0 94% 82%` | `claimview-islands.css` | Figma scale | signal |
| `--color-error-800` | `0 70% 35%` | `0 97% 85%` | `claimview-islands.css` | Figma scale | signal |
| `--color-error-900` | `0 63% 31%` | `0 96% 89%` | `claimview-islands.css` | Figma scale | signal |
| `--color-error-950` | `0 75% 15%` | `0 93% 94%` | `claimview-islands.css` | Figma scale | signal |
| `--color-info` | `199 89% 48%` | `188 86% 53%` | `claimview-islands.css` | Figma scale | duplication → `--color-info-500` |
| `--color-info-50` | `183 100% 96%` | `204 80% 16%` | `claimview-islands.css` | Figma scale | signal |
| `--color-info-100` | `185 96% 90%` | `202 80% 24%` | `claimview-islands.css` | Figma scale | signal |
| `--color-info-200` | `186 94% 81%` | `201 90% 27%` | `claimview-islands.css` | Figma scale | signal |
| `--color-info-300` | `187 92% 69%` | `201 96% 32%` | `claimview-islands.css` | Figma scale | signal |
| `--color-info-400` | `188 86% 53%` | `200 98% 39%` | `claimview-islands.css` | Figma scale | signal |
| `--color-info-500` | `199 89% 48%` | `188 86% 53%` | `claimview-islands.css` | Figma scale | signal |
| `--color-info-600` | `200 98% 39%` | `187 92% 69%` | `claimview-islands.css` | Figma scale | signal |
| `--color-info-700` | `201 96% 32%` | `186 94% 81%` | `claimview-islands.css` | Figma scale | signal |
| `--color-info-800` | `201 90% 27%` | `185 96% 90%` | `claimview-islands.css` | Figma scale | signal |
| `--color-info-900` | `202 80% 24%` | `183 100% 96%` | `claimview-islands.css` | Figma scale | signal |
| `--color-info-950` | `204 80% 16%` | `183 100% 98%` | `claimview-islands.css` | Figma scale | signal |
| `--color-accent-feedback` | `300 40% 55%` | `300 45% 68%` | `claimview-islands.css` | direct semantic | signal |
| `--color-background` | `0 0% 100%` | `222.2 84% 4.9%` | `claimview-islands.css` | direct semantic | signal |
| `--color-background-secondary` | `210 40% 98%` | `217 33% 17%` | `claimview-islands.css` | direct semantic | signal |
| `--color-background-tertiary` | `210 40% 96%` | `215 25% 27%` | `claimview-islands.css` | direct semantic | signal |
| `--color-border-islands` | `214 32% 91%` | `217.2 32.6% 17.5%` | `claimview-islands.css` | direct semantic | signal |
| `--color-text-primary` | `222 47% 11%` | `210 40% 98%` | `claimview-islands.css` | direct semantic | signal |
| `--color-text-secondary` | `215 19% 35%` | `213 27% 84%` | `claimview-islands.css` | direct semantic | signal |
| `--color-text-tertiary` | `215 20% 65%` | `215 20% 65%` | `claimview-islands.css` | direct semantic | signal |
| `--color-text-disabled` | `213 27% 84%` | `215 19% 35%` | `claimview-islands.css` | direct semantic | signal |
| `--cvi-search-highlight-bg` | `#fdd835` | `#f9a825` | `claimview-islands.css` (declared on `:root` and `.dark`, not on `.claim-view-islands`) | other | deferred |
| `--cvi-search-highlight-text` | `black` | `black` | `claimview-islands.css` (`:root` / `.dark`) | other | deferred |
| `--cvi-search-active-bg` | `#ff6d00` | `#e65100` | `claimview-islands.css` (`:root` / `.dark`) | other | deferred |
| `--cvi-search-active-text` | `white` | `white` | `claimview-islands.css` (`:root` / `.dark`) | other | deferred |
| `--glow-color` | _(not declared as a default; consumed by `.glowing` keyframe with fallback `currentColor`; set dynamically via inline style from JS)_ | — | `claimview-islands.css` (referenced inside `@keyframes glow`) | other | deferred |

CSS-var declaration count sanity check: `grep -c "^    --" claimview-islands.css` returns **209** lines, which matches **104 declarations × 2 modes (light + dark) + 1 light-only (`--radius`)** = 209. The four `--cvi-search-*` vars are declared at the `:root` / `.dark` selectors with a different indentation and are not part of the `^    --` count.

### 1.2 Tailwind config tokens — declared under `theme.extend` in `tailwind.config.js`

Tokens here that map to a CSS var are listed alongside their underlying CSS var, since the runtime value is owned by the CSS layer.

Row order mirrors `tailwind.config.js` source order — `DEFAULT` is interleaved at the position where the source config declares it (e.g., between `500` and `600` for `primary`; between `600` and `700` for `neutral`).

#### 1.2.1 `colors.shad.*` (shad-* alias group)

| Token name (Tailwind path) | Light value | Dark value | Where defined | Flavor | Class |
|---|---|---|---|---|---|
| `colors.shad.background` | `hsl(var(--background) / <alpha-value>)` ↳ underlies `--background` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.foreground` | `hsl(var(--foreground) / <alpha-value>)` ↳ underlies `--foreground` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.card` | `hsl(var(--card) / <alpha-value>)` ↳ underlies `--card` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.card-foreground` | `hsl(var(--card-foreground) / <alpha-value>)` ↳ underlies `--card-foreground` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.popover` | `hsl(var(--popover) / <alpha-value>)` ↳ underlies `--popover` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.popover-foreground` | `hsl(var(--popover-foreground) / <alpha-value>)` ↳ underlies `--popover-foreground` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.primary` | `hsl(var(--primary) / <alpha-value>)` ↳ underlies `--primary` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.primary-foreground` | `hsl(var(--primary-foreground) / <alpha-value>)` ↳ underlies `--primary-foreground` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.secondary` | `hsl(var(--secondary) / <alpha-value>)` ↳ underlies `--secondary` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.secondary-foreground` | `hsl(var(--secondary-foreground) / <alpha-value>)` ↳ underlies `--secondary-foreground` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.muted` | `hsl(var(--muted) / <alpha-value>)` ↳ underlies `--muted` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.muted-foreground` | `hsl(var(--muted-foreground) / <alpha-value>)` ↳ underlies `--muted-foreground` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.accent` | `hsl(var(--accent) / <alpha-value>)` ↳ underlies `--accent` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.accent-foreground` | `hsl(var(--accent-foreground) / <alpha-value>)` ↳ underlies `--accent-foreground` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.destructive` | `hsl(var(--destructive) / <alpha-value>)` ↳ underlies `--destructive` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.destructive-foreground` | `hsl(var(--destructive-foreground) / <alpha-value>)` ↳ underlies `--destructive-foreground` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.border` | `hsl(var(--border) / <alpha-value>)` ↳ underlies `--border` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.input` | `hsl(var(--input) / <alpha-value>)` ↳ underlies `--input` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.ring` | `hsl(var(--ring) / <alpha-value>)` ↳ underlies `--ring` | (same) | `tailwind.config.js` | shad-* | hack |
| `colors.shad.chart-1` | `hsl(var(--chart-1) / <alpha-value>)` ↳ underlies `--chart-1` | (same) | `tailwind.config.js` | chart | deferred |
| `colors.shad.chart-2` | `hsl(var(--chart-2) / <alpha-value>)` ↳ underlies `--chart-2` | (same) | `tailwind.config.js` | chart | deferred |
| `colors.shad.chart-3` | `hsl(var(--chart-3) / <alpha-value>)` ↳ underlies `--chart-3` | (same) | `tailwind.config.js` | chart | deferred |
| `colors.shad.chart-4` | `hsl(var(--chart-4) / <alpha-value>)` ↳ underlies `--chart-4` | (same) | `tailwind.config.js` | chart | deferred |
| `colors.shad.chart-5` | `hsl(var(--chart-5) / <alpha-value>)` ↳ underlies `--chart-5` | (same) | `tailwind.config.js` | chart | deferred |

#### 1.2.2 Top-level palette colors (no CSS-var indirection)

| Token name | Light value | Dark value | Where defined | Flavor | Class |
|---|---|---|---|---|---|
| `colors.current` | `currentColor` | — | `tailwind.config.js` | other | signal |
| `colors.transparent` | `transparent` | — | `tailwind.config.js` | other | signal |
| `colors.white` | `#ffffff` | — | `tailwind.config.js` | other | signal |
| `colors.black` | `#000000` | — | `tailwind.config.js` | other | signal |

#### 1.2.3 `colors.primary.*` — Figma scale primary

| Token name | Light value | Dark value | Where defined | Flavor | Class |
|---|---|---|---|---|---|
| `colors.primary.50` | `hsl(var(--color-primary-50) / <alpha-value>)` ↳ underlies `--color-primary-50` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.primary.100` | `hsl(var(--color-primary-100) / <alpha-value>)` ↳ underlies `--color-primary-100` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.primary.200` | `hsl(var(--color-primary-200) / <alpha-value>)` ↳ underlies `--color-primary-200` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.primary.300` | `hsl(var(--color-primary-300) / <alpha-value>)` ↳ underlies `--color-primary-300` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.primary.400` | `hsl(var(--color-primary-400) / <alpha-value>)` ↳ underlies `--color-primary-400` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.primary.500` | `hsl(var(--color-primary-500) / <alpha-value>)` ↳ underlies `--color-primary-500` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.primary.DEFAULT` | `hsl(var(--color-primary) / <alpha-value>)` ↳ underlies `--color-primary` | (same) | `tailwind.config.js` | Figma scale | duplication → `colors.primary.500` |
| `colors.primary.600` | `hsl(var(--color-primary-600) / <alpha-value>)` ↳ underlies `--color-primary-600` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.primary.700` | `hsl(var(--color-primary-700) / <alpha-value>)` ↳ underlies `--color-primary-700` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.primary.800` | `hsl(var(--color-primary-800) / <alpha-value>)` ↳ underlies `--color-primary-800` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.primary.900` | `hsl(var(--color-primary-900) / <alpha-value>)` ↳ underlies `--color-primary-900` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.primary.950` | `hsl(var(--color-primary-950) / <alpha-value>)` ↳ underlies `--color-primary-950` | (same) | `tailwind.config.js` | Figma scale | signal |

#### 1.2.4 `colors.neutral.*` — Figma scale neutral

| Token name | Light value | Dark value | Where defined | Flavor | Class |
|---|---|---|---|---|---|
| `colors.neutral.50` | `hsl(var(--color-neutral-50) / <alpha-value>)` ↳ underlies `--color-neutral-50` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.neutral.100` | `hsl(var(--color-neutral-100) / <alpha-value>)` ↳ underlies `--color-neutral-100` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.neutral.200` | `hsl(var(--color-neutral-200) / <alpha-value>)` ↳ underlies `--color-neutral-200` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.neutral.300` | `hsl(var(--color-neutral-300) / <alpha-value>)` ↳ underlies `--color-neutral-300` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.neutral.400` | `hsl(var(--color-neutral-400) / <alpha-value>)` ↳ underlies `--color-neutral-400` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.neutral.500` | `hsl(var(--color-neutral-500) / <alpha-value>)` ↳ underlies `--color-neutral-500` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.neutral.600` | `hsl(var(--color-neutral-600) / <alpha-value>)` ↳ underlies `--color-neutral-600` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.neutral.DEFAULT` | `hsl(var(--color-neutral-600) / <alpha-value>)` ↳ underlies `--color-neutral-600` | (same) | `tailwind.config.js` | Figma scale | duplication → `colors.neutral.600` |
| `colors.neutral.700` | `hsl(var(--color-neutral-700) / <alpha-value>)` ↳ underlies `--color-neutral-700` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.neutral.800` | `hsl(var(--color-neutral-800) / <alpha-value>)` ↳ underlies `--color-neutral-800` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.neutral.900` | `hsl(var(--color-neutral-900) / <alpha-value>)` ↳ underlies `--color-neutral-900` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.neutral.950` | `hsl(var(--color-neutral-950) / <alpha-value>)` ↳ underlies `--color-neutral-950` | (same) | `tailwind.config.js` | Figma scale | signal |

#### 1.2.5 `colors.success.*` — Figma scale success

| Token name | Light value | Dark value | Where defined | Flavor | Class |
|---|---|---|---|---|---|
| `colors.success.50` | `hsl(var(--color-success-50) / <alpha-value>)` ↳ underlies `--color-success-50` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.success.100` | `hsl(var(--color-success-100) / <alpha-value>)` ↳ underlies `--color-success-100` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.success.200` | `hsl(var(--color-success-200) / <alpha-value>)` ↳ underlies `--color-success-200` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.success.300` | `hsl(var(--color-success-300) / <alpha-value>)` ↳ underlies `--color-success-300` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.success.400` | `hsl(var(--color-success-400) / <alpha-value>)` ↳ underlies `--color-success-400` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.success.500` | `hsl(var(--color-success-500) / <alpha-value>)` ↳ underlies `--color-success-500` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.success.DEFAULT` | `hsl(var(--color-success) / <alpha-value>)` ↳ underlies `--color-success` | (same) | `tailwind.config.js` | Figma scale | duplication → `colors.success.500` |
| `colors.success.600` | `hsl(var(--color-success-600) / <alpha-value>)` ↳ underlies `--color-success-600` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.success.700` | `hsl(var(--color-success-700) / <alpha-value>)` ↳ underlies `--color-success-700` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.success.800` | `hsl(var(--color-success-800) / <alpha-value>)` ↳ underlies `--color-success-800` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.success.900` | `hsl(var(--color-success-900) / <alpha-value>)` ↳ underlies `--color-success-900` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.success.950` | `hsl(var(--color-success-950) / <alpha-value>)` ↳ underlies `--color-success-950` | (same) | `tailwind.config.js` | Figma scale | signal |

#### 1.2.6 `colors.warning.*` — Figma scale warning

| Token name | Light value | Dark value | Where defined | Flavor | Class |
|---|---|---|---|---|---|
| `colors.warning.50` | `hsl(var(--color-warning-50) / <alpha-value>)` ↳ underlies `--color-warning-50` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.warning.100` | `hsl(var(--color-warning-100) / <alpha-value>)` ↳ underlies `--color-warning-100` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.warning.200` | `hsl(var(--color-warning-200) / <alpha-value>)` ↳ underlies `--color-warning-200` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.warning.300` | `hsl(var(--color-warning-300) / <alpha-value>)` ↳ underlies `--color-warning-300` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.warning.400` | `hsl(var(--color-warning-400) / <alpha-value>)` ↳ underlies `--color-warning-400` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.warning.500` | `hsl(var(--color-warning-500) / <alpha-value>)` ↳ underlies `--color-warning-500` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.warning.DEFAULT` | `hsl(var(--color-warning) / <alpha-value>)` ↳ underlies `--color-warning` | (same) | `tailwind.config.js` | Figma scale | duplication → `colors.warning.500` |
| `colors.warning.600` | `hsl(var(--color-warning-600) / <alpha-value>)` ↳ underlies `--color-warning-600` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.warning.700` | `hsl(var(--color-warning-700) / <alpha-value>)` ↳ underlies `--color-warning-700` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.warning.800` | `hsl(var(--color-warning-800) / <alpha-value>)` ↳ underlies `--color-warning-800` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.warning.900` | `hsl(var(--color-warning-900) / <alpha-value>)` ↳ underlies `--color-warning-900` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.warning.950` | `hsl(var(--color-warning-950) / <alpha-value>)` ↳ underlies `--color-warning-950` | (same) | `tailwind.config.js` | Figma scale | signal |

#### 1.2.7 `colors.error.*` — Figma scale error

| Token name | Light value | Dark value | Where defined | Flavor | Class |
|---|---|---|---|---|---|
| `colors.error.50` | `hsl(var(--color-error-50) / <alpha-value>)` ↳ underlies `--color-error-50` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.error.100` | `hsl(var(--color-error-100) / <alpha-value>)` ↳ underlies `--color-error-100` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.error.200` | `hsl(var(--color-error-200) / <alpha-value>)` ↳ underlies `--color-error-200` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.error.300` | `hsl(var(--color-error-300) / <alpha-value>)` ↳ underlies `--color-error-300` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.error.400` | `hsl(var(--color-error-400) / <alpha-value>)` ↳ underlies `--color-error-400` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.error.500` | `hsl(var(--color-error-500) / <alpha-value>)` ↳ underlies `--color-error-500` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.error.DEFAULT` | `hsl(var(--color-error) / <alpha-value>)` ↳ underlies `--color-error` | (same) | `tailwind.config.js` | Figma scale | duplication → `colors.error.500` |
| `colors.error.600` | `hsl(var(--color-error-600) / <alpha-value>)` ↳ underlies `--color-error-600` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.error.700` | `hsl(var(--color-error-700) / <alpha-value>)` ↳ underlies `--color-error-700` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.error.800` | `hsl(var(--color-error-800) / <alpha-value>)` ↳ underlies `--color-error-800` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.error.900` | `hsl(var(--color-error-900) / <alpha-value>)` ↳ underlies `--color-error-900` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.error.950` | `hsl(var(--color-error-950) / <alpha-value>)` ↳ underlies `--color-error-950` | (same) | `tailwind.config.js` | Figma scale | signal |

#### 1.2.8 `colors.info.*` — Figma scale info

| Token name | Light value | Dark value | Where defined | Flavor | Class |
|---|---|---|---|---|---|
| `colors.info.50` | `hsl(var(--color-info-50) / <alpha-value>)` ↳ underlies `--color-info-50` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.info.100` | `hsl(var(--color-info-100) / <alpha-value>)` ↳ underlies `--color-info-100` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.info.200` | `hsl(var(--color-info-200) / <alpha-value>)` ↳ underlies `--color-info-200` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.info.300` | `hsl(var(--color-info-300) / <alpha-value>)` ↳ underlies `--color-info-300` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.info.400` | `hsl(var(--color-info-400) / <alpha-value>)` ↳ underlies `--color-info-400` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.info.500` | `hsl(var(--color-info-500) / <alpha-value>)` ↳ underlies `--color-info-500` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.info.DEFAULT` | `hsl(var(--color-info) / <alpha-value>)` ↳ underlies `--color-info` | (same) | `tailwind.config.js` | Figma scale | duplication → `colors.info.500` |
| `colors.info.600` | `hsl(var(--color-info-600) / <alpha-value>)` ↳ underlies `--color-info-600` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.info.700` | `hsl(var(--color-info-700) / <alpha-value>)` ↳ underlies `--color-info-700` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.info.800` | `hsl(var(--color-info-800) / <alpha-value>)` ↳ underlies `--color-info-800` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.info.900` | `hsl(var(--color-info-900) / <alpha-value>)` ↳ underlies `--color-info-900` | (same) | `tailwind.config.js` | Figma scale | signal |
| `colors.info.950` | `hsl(var(--color-info-950) / <alpha-value>)` ↳ underlies `--color-info-950` | (same) | `tailwind.config.js` | Figma scale | signal |

#### 1.2.9 Direct semantic Tailwind keys

| Token name | Light value | Dark value | Where defined | Flavor | Class |
|---|---|---|---|---|---|
| `colors.background.DEFAULT` | `hsl(var(--color-background) / <alpha-value>)` ↳ underlies `--color-background` | (same) | `tailwind.config.js` | direct semantic | signal |
| `colors.background.secondary` | `hsl(var(--color-background-secondary) / <alpha-value>)` ↳ underlies `--color-background-secondary` | (same) | `tailwind.config.js` | direct semantic | signal |
| `colors.background.tertiary` | `hsl(var(--color-background-tertiary) / <alpha-value>)` ↳ underlies `--color-background-tertiary` | (same) | `tailwind.config.js` | direct semantic | signal |
| `colors.borderColor.DEFAULT` | `hsl(var(--color-border-islands) / <alpha-value>)` ↳ underlies `--color-border-islands` | (same) | `tailwind.config.js` | direct semantic | signal |
| `colors.text.primary` | `hsl(var(--color-text-primary) / <alpha-value>)` ↳ underlies `--color-text-primary` | (same) | `tailwind.config.js` | direct semantic | signal |
| `colors.text.secondary` | `hsl(var(--color-text-secondary) / <alpha-value>)` ↳ underlies `--color-text-secondary` | (same) | `tailwind.config.js` | direct semantic | signal |
| `colors.text.tertiary` | `hsl(var(--color-text-tertiary) / <alpha-value>)` ↳ underlies `--color-text-tertiary` | (same) | `tailwind.config.js` | direct semantic | signal |
| `colors.text.disabled` | `hsl(var(--color-text-disabled) / <alpha-value>)` ↳ underlies `--color-text-disabled` | (same) | `tailwind.config.js` | direct semantic | signal |
| `colors.accent.feedback` | `hsl(var(--color-accent-feedback) / <alpha-value>)` ↳ underlies `--color-accent-feedback` | (same) | `tailwind.config.js` | direct semantic | signal |

> Note: `colors.borderColor.DEFAULT` is misplaced — it sits inside `theme.extend.colors` but Tailwind expects `borderColor` at the top of `theme.extend`, not nested under `colors`. As declared, it generates a `bg-borderColor` / `text-borderColor` color utility, not the intended default border color. CVI works around this by hand-applying `border-color: hsl(var(--color-border-islands))` in the universal selector at line 271. Flagged for the open-questions section but not "fixed" here — Task 0.2 is read-only.

#### 1.2.10 `spacing.*` extensions

| Token name | Value | Where defined | Flavor | Class |
|---|---|---|---|---|
| `spacing.18` | `4.5rem` (72px) | `tailwind.config.js` | other | deferred |
| `spacing.88` | `22rem` (352px) | `tailwind.config.js` | other | deferred |
| `spacing.100` | `25rem` (400px) | `tailwind.config.js` | other | deferred |
| `spacing.112` | `28rem` (448px) | `tailwind.config.js` | other | deferred |
| `spacing.128` | `32rem` (512px) | `tailwind.config.js` | other | deferred |

#### 1.2.11 `borderRadius.*` overrides

| Token name | Value | Where defined | Flavor | Class |
|---|---|---|---|---|
| `borderRadius.sm` | `0.25rem` | `tailwind.config.js` | other | signal |
| `borderRadius.DEFAULT` | `0.375rem` | `tailwind.config.js` | other | signal |
| `borderRadius.md` | `0.5rem` | `tailwind.config.js` | other | signal |
| `borderRadius.lg` | `0.75rem` | `tailwind.config.js` | other | signal |
| `borderRadius.xl` | `1rem` | `tailwind.config.js` | other | signal |
| `borderRadius.2xl` | `1.5rem` | `tailwind.config.js` | other | signal |

#### 1.2.12 `boxShadow.*` overrides

| Token name | Value | Where defined | Flavor | Class |
|---|---|---|---|---|
| `boxShadow.popover` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` | `tailwind.config.js` | other | duplication → `boxShadow.lg` |
| `boxShadow.sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` | `tailwind.config.js` | other | signal |
| `boxShadow.md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)` | `tailwind.config.js` | other | signal |
| `boxShadow.lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` | `tailwind.config.js` | other | signal |
| `boxShadow.xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)` | `tailwind.config.js` | other | signal |

#### 1.2.13 `fontSize.*` overrides

| Token name | Font size | Line height | Where defined | Flavor | Class |
|---|---|---|---|---|---|
| `fontSize.xs` | `0.75rem` (12px) | `1rem` | `tailwind.config.js` | other | signal |
| `fontSize.sm` | `0.875rem` (14px) | `1.25rem` | `tailwind.config.js` | other | signal |
| `fontSize.base` | `1rem` (16px) | `1.5rem` | `tailwind.config.js` | other | signal |
| `fontSize.lg` | `1.125rem` (18px) | `1.75rem` | `tailwind.config.js` | other | signal |
| `fontSize.xl` | `1.25rem` (20px) | `1.75rem` | `tailwind.config.js` | other | signal |
| `fontSize.2xl` | `1.5rem` (24px) | `2rem` | `tailwind.config.js` | other | signal |
| `fontSize.3xl` | `1.875rem` (30px) | `2.25rem` | `tailwind.config.js` | other | signal |

#### 1.2.14 `fontFamily.*` overrides

| Token name | Value | Where defined | Flavor | Class |
|---|---|---|---|---|
| `fontFamily.sans` | `Inter, system-ui, -apple-system, sans-serif` | `tailwind.config.js` | other | signal |

### 1.3 Usage counts (order-of-magnitude across CVI)

Counts come from grepping `apps/adjuster/src/components/ClaimViewIslands` (`.tsx`/`.ts`/`.css`). Buckets: `<10`, `10–100`, `100+`.

Counts prefixed `~` indicate approximate values from greps that span multiple quote/attribute contexts; exact counts have no prefix.

#### 1.3.1 Color-utility class counts (Tailwind utilities consumed in source)

Top consumed Figma-scale utility classes (raw uniq counts of class fragments):

| Utility | Count | Bucket |
|---|---:|---|
| `text-neutral-500` | 93 | 10–100 |
| `bg-neutral-100` | 64 | 10–100 |
| `border-neutral-200` | 59 | 10–100 |
| `text-neutral-700` | 54 | 10–100 |
| `text-neutral-600` | 47 | 10–100 |
| `text-neutral-900` | 42 | 10–100 |
| `bg-neutral-50` | 37 | 10–100 |
| `bg-primary-100` | 30 | 10–100 |
| `border-neutral-300` | 22 | 10–100 |
| `bg-neutral-200` | 22 | 10–100 |
| `text-error-600` | 18 | 10–100 |
| `ring-primary-500` | 15 | 10–100 |
| `bg-error-50` | 14 | 10–100 |
| `text-primary-600` | 13 | 10–100 |
| `text-neutral-400` | 12 | 10–100 |
| `border-primary-500` | 12 | 10–100 |
| `bg-success-100` | 12 | 10–100 |
| `bg-primary-50` | 11 | 10–100 |
| `border-error-600` | 9 | <10 |
| `text-primary-700` | 7 | <10 |
| `bg-primary-500` | 7 | <10 |
| `bg-neutral-300` | 7 | <10 |
| `text-error-700` | 6 | <10 |
| `bg-primary-600` | 6 | <10 |
| `text-neutral-300` | 5 | <10 |
| `bg-neutral-900` | 5 | <10 |
| `text-warning-700`, `text-success-700`, `text-info-700`, `border-neutral-900`, `bg-warning-50`, `bg-neutral-400` | 4 each | <10 |
| `border-primary-600`, `border-neutral-100`, `border-error-500`, `bg-success-600`, `bg-success-50`, `bg-primary-700`, `bg-info-50` | 3 each | <10 |
| `text-neutral-800`, `text-neutral-100`, `border-primary-400`, `border-neutral-700`, `bg-primary-200` | 2 each | <10 |
| `text-warning-800`, `text-success-600`, `text-error-500`, `ring-error-500`, `divide-neutral-200`, `border-warning-300`, `border-warning-200`, `border-success-300`, `border-neutral-600`, `border-info-300`, `border-error-300`, `border-error-200`, `bg-warning-600`, `bg-success-700`, `bg-primary-400`, `bg-primary-300` | 1 each | <10 |

Per-family **file** count (unique files where any utility from that family appears):

| Family | Files |
|---|---:|
| `neutral-*` | 87 |
| `primary-*` | 36 |
| `error-*` | 16 |
| `success-*` | 13 |
| `warning-*` | 7 |
| `info-*` | 3 |

DEFAULT (no-step) Figma-scale utility usages:

| Utility | Count |
|---|---:|
| `bg-primary` | 5 |
| `text-primary` | ~6 (split across several quote contexts) |
| `ring-primary` | ~5 |
| `text-neutral` | 4 |
| `bg-success`, `bg-warning`, `bg-error`, `text-success`, `text-warning`, `text-error`, `border-primary`, `outline-primary`, `stroke-success` | 1–7 each |

shad-* utility usages (very low):

| Utility | Count |
|---|---:|
| `bg-shad-background` | 6 |
| `bg-shad-foreground` | 3 |
| `text-shad-background` | 2 |
| `fill-shad-foreground` | 2 |
| `text-shad-foreground` | 1 |
| All other `shad-*` utilities (card, popover, primary, secondary, muted, accent, destructive, border, input, ring, chart-*) | 0 |

shad-* utility **file** count: 6 files total touch any `shad-*` utility.

Direct semantic utility usages:

| Utility | Count |
|---|---:|
| `bg-background` | 56 |
| `text-text-secondary` | 3 |
| `bg-background-secondary` | 2 |
| `text-text-primary` | 1 |
| `text-text-disabled` | 1 |
| `text-background` | 1 |
| `text-accent-feedback` | 1 |
| `text-text-tertiary` | 0 |

Direct-semantic utility **file** count: 5 files.

Notes:
- The raw `var(--…)` greps for shad-* and Figma-scale CSS vars all return 0 in `.tsx` / `.ts` / `.css` source. That's expected — those vars are only consumed inside the generated Tailwind stylesheet via the config's `hsl(var(--…) / <alpha-value>)` mappings. The meaningful usage signal is the Tailwind class greps above.
- `var(--color-background)`: 2 raw `var()` usages (in CSS).
- `var(--color-border-islands)`: 6 raw `var()` usages (the universal border-color reset at line 271 plus a few component-level uses).
- `var(--cvi-search-highlight-bg|text)` and `var(--cvi-search-active-bg|text)`: 1 each (the four `::highlight()` rules at lines 619–628).
- `var(--glow-color)`: 0 explicit fallback callers found in CVI source via grep (consumed only inside the keyframe with `currentColor` fallback; set dynamically from JS as documented in the file's comment at line 472).

#### 1.3.2 Spacing / radius / shadow / typography utility counts

| Utility | Count | Bucket |
|---|---:|---|
| `text-sm` | 174 | 100+ |
| `text-xs` | 81 | 10–100 |
| `text-base` | 18 | 10–100 |
| `text-lg` | 10 | 10–100 |
| `text-xl` | 6 | <10 |
| `text-2xl` | 6 | <10 |
| `text-3xl` | 0 | <10 |
| `rounded` (DEFAULT, all quote contexts combined) | ~125 | 100+ |
| `rounded-lg` (all contexts) | ~68 | 10–100 |
| `rounded-md` (all contexts) | ~43 | 10–100 |
| `rounded-sm` (all contexts) | ~7 | <10 |
| `rounded-xl` (all contexts) | ~5 | <10 |
| `rounded-2xl` | 1 | <10 |
| `shadow-lg` | 15 | 10–100 |
| `shadow-sm` | 10 | 10–100 |
| `shadow-md` | 5 | <10 |
| `shadow-xl` | 2 | <10 |
| `shadow-popover` | 0 | <10 |
| `font-sans` | 1 (only the global `.claim-view-islands` rule) | <10 |
| Custom spacing keys `w/h/p/m/gap/...-{18,88,100,112,128}` | 0 explicit utility hits — these spacing extensions appear unused inside CVI itself | <10 |

### 1.4 Inventory totals

- **CSS vars declared in `claimview-islands.css`:** 110 distinct identifiers = 105 inside `.claim-view-islands` (104 declared in both modes + 1 light-only `--radius`) + 4 `--cvi-search-*` vars on `:root`/`.dark` + 1 implicit `--glow-color` referenced inside `@keyframes glow` with no top-level declaration. Declaration line count = 209 (105 light + 104 dark inside `.claim-view-islands`; the four `--cvi-search-*` vars are declared at a different indentation on `:root`/`.dark` and are not part of that 209-line count).
- **Tailwind config color tokens (resolved keys, including DEFAULT and underlying-var aliases):** 24 shad-* keys + 4 base palette (current/transparent/white/black) + 13 primary + 13 neutral + 13 success + 13 warning + 13 error + 13 info + 9 direct-semantic (background.{DEFAULT,secondary,tertiary} + borderColor.DEFAULT + text.{primary,secondary,tertiary,disabled} + accent.feedback) = **115 color keys**.
- **Tailwind config non-color tokens:** 5 spacing + 6 borderRadius + 5 boxShadow + 7 fontSize + 1 fontFamily = **24 keys**.

This is the source-of-truth dataset for the classification pass in Task 0.3 and the consolidated theme authoring in Task 0.4.

## 2. Classification (Task 0.3)

### 2.1 Distribution

Across all 243 inventoried rows (110 in § 1.1 + 133 in § 1.2.1–§ 1.2.14):

| Class | Count | Notes |
|---|---:|---|
| `signal` | 172 | Real design intent — kept in the consolidated theme. Dominated by the Figma scales (`primary`, `neutral`, `success`, `warning`, `error`, `info` × 11 numbered steps × {CSS var + Tailwind key} = 132), the direct-semantic vars + Tailwind keys (text/background/border/accent.feedback × 2 layers), the spacing-free non-color tokens (borderRadius, boxShadow, fontSize, fontFamily), and the four base palette primitives (`current`, `transparent`, `white`, `black`). |
| `hack` | 39 | The complete shad-* layer: 20 CSS vars (`--background`, `--foreground`, `--card[-foreground]`, `--popover[-foreground]`, `--primary[-foreground]`, `--secondary[-foreground]`, `--muted[-foreground]`, `--accent[-foreground]`, `--destructive[-foreground]`, `--border`, `--input`, `--ring`, `--radius`) and the matching 19 `colors.shad.*` Tailwind keys (chart-* keys are excluded — they are `deferred`, not `hack`). The user has confirmed wholesale deprecation. |
| `deferred` | 20 | `--chart-1..5` and `colors.shad.chart-1..5` (10), the 4 `--cvi-search-*` highlight vars, the implicit `--glow-color` runtime var, and the 5 unused custom `spacing.*` extensions (zero utility hits in CVI). Documented but not consolidated in Wave 1. |
| `duplication` | 12 | Six aliasing pairs and one shadow alias: `--color-{primary,success,warning,error,info}` collapse into the matching `--color-{family}-500` (5); `colors.{primary,success,warning,error,info}.DEFAULT` collapse into `colors.{family}.500` (5); `colors.neutral.DEFAULT` collapses into `colors.neutral.600` (1; note this family aliases the 600 step rather than the 500 step — see Q6 below); `boxShadow.popover` is byte-identical to `boxShadow.lg` (1). |

### 2.2 Patterns observed

- **The shad-* layer is a complete shadow of the Figma scale and adds no information.** It declares its own `--primary` (the same blue as `--color-primary-500`), its own `--destructive` (the same red as `--color-error-500`), its own `--background` (the same value as `--color-background`), and so on. Usage telemetry from § 1.3 backs the deprecation: `shad-*` Tailwind utilities total 14 hits across 6 files (and most are `bg-shad-{back,fore}ground` — the actual shadcn-named slots like `bg-shad-primary`, `bg-shad-destructive`, etc. are at zero). The whole layer can drop with negligible churn.
- **The Figma scale's `DEFAULT` slot is a solved problem and a dropped problem at once.** Five of six families define `DEFAULT` via a separate `--color-{family}` CSS var that holds the same value as the `500` step; the sixth (neutral) has no separate var at all and points `DEFAULT` at the `600`-step var. The CSS-var indirection adds zero expressiveness — once the consolidated theme picks a single canonical step per family for `DEFAULT`, both the side-variable and the asymmetry disappear. Wave 1 default: `DEFAULT = 500` for all six families, with neutral's choice flagged as a design question (Q6 below).
- **Chart vars are different from the rest of the shad-* layer.** `--chart-1..5` and `colors.shad.chart-1..5` are usage-zero in CVI. They're tagged `deferred`, not `hack`, because (a) they're not duplicates of any other token, (b) the spec explicitly defers chart consolidation to a future pass, and (c) the design owner may want a distinct palette for charts that doesn't follow the intent ramps.
- **Non-color "other" tokens are mostly signal except where unused or duplicated.** All borderRadius / fontSize / fontFamily entries earned `signal`; the five custom `spacing.*` extensions earned `deferred` because § 1.3 confirms zero utility hits; `boxShadow.popover` earned `duplication` because its bytes match `boxShadow.lg` exactly.

### 2.3 Judgment calls and edge cases

- **`--radius` (shad var, value `0.5rem`) tagged `hack`, not `duplication`.** It is technically also a duplicate of `borderRadius.md` (`0.5rem`), but the spec's classification rules explicitly fold "`--radius` if it duplicates a scale" into the shad-* deprecation block. Tagging as `hack` keeps the deprecation list clean — the duplication relationship is captured here rather than as a `→` annotation that would otherwise imply we want to preserve a CSS-var route into the radius scale.
- **`colors.borderColor.DEFAULT` tagged `signal`, not `hack`.** The intent is real (give CVI a default border color tied to `--color-border-islands`). The misplacement (it's nested under `colors.*` rather than declared at `theme.extend.borderColor`) is a Tailwind-config bug that's been worked around with a universal `border-color: hsl(var(--color-border-islands))` rule. Wave 1 keeps the intent and lets the consolidated theme decide whether to route via a properly-placed `borderColor.DEFAULT`, an explicit `border-default` token, or just keeping the universal selector reset. Captured as Q7 below.
- **`--glow-color` tagged `deferred`, not `hack`.** It has no static declaration — only a `@keyframes glow` reference with `currentColor` fallback and a JS-driven inline-style assignment. It's not part of the shad-* deprecation block, but it also isn't ready to live in the consolidated theme without a design decision about whether to declare a static fallback. Deferring is the right call.
- **`--cvi-search-*` (4 vars) tagged `deferred`.** Mode-toggleable but selector-scoped to `:root` / `.dark` (not `.claim-view-islands`) because of how `::highlight()` resolves — a real architectural one-off that doesn't belong in the Wave 1 consolidated theme. Future pass.

## 3. Consolidated theme decisions (Task 0.4)

The Wave 1 design artifact lives at `apps/core-radix-pilot/src/theme/index.ts` as a single `createTheme()` call. This section documents the choices that produced it.

### 3.1 Color families included

Six families, each with the soribashi standard 11-step ramp (`50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`); `neutral` additionally carries a `0` step (white in light, near-black in dark) used by `surface.default`. Each family also declares a `foreground` slot (white for five families, black for `warning` so light text on yellow stays legible) so downstream intent resolvers can derive `IntentResolverResult.color` rather than getting `undefined`. CVI does not declare per-family foregrounds in its tailwind config (verified § 1.2.3-1.2.8); the white/black defaults match the playground theme convention. No dark-mode foreground overrides — the yellow-warning legibility argument holds in dark too (dark `warning.500` is `hsl(49 98% 48%)`, also high-lightness yellow).

| Family | Light `500` anchor | Dark `500` anchor | Origin in CVI |
|---|---|---|---|
| `primary` | `hsl(221.2 83.2% 53.3%)` | `hsl(217.2 91.2% 59.8%)` | `--color-primary-500` |
| `neutral` | `hsl(215 16% 47%)` | `hsl(215 20% 65%)` | `--color-neutral-500` |
| `success` | `hsl(142 76% 36%)` | `hsl(142 71% 45%)` | `--color-success-500` |
| `warning` | `hsl(38 92% 50%)` | `hsl(49 98% 48%)` | `--color-warning-500` |
| `danger` | `hsl(0 84% 60%)` | `hsl(0 84% 60%)` | `--color-error-500` (renamed) |
| `info` | `hsl(199 89% 48%)` | `hsl(188 86% 53%)` | `--color-info-500` |

### 3.2 Scale regenerations

Only the **primary** family was regenerated, on the light `50..400` and dark `50..400` steps.

**Light side regeneration:**

| Step | CVI value | Wave 1 value | Reason |
|---|---|---|---|
| `50` | `hsl(240 100% 98%)` | `hsl(221 83% 97%)` | Hue/sat shifted to anchor; lightness preserved |
| `100` | `hsl(240 100% 96%)` | `hsl(221 83% 93%)` | Hue/sat shifted to anchor; lightness preserved |
| `200` | `hsl(240 100% 92%)` | `hsl(221 83% 86%)` | Hue/sat shifted to anchor; lightness ramped |
| `300` | `hsl(240 100% 85%)` | `hsl(221 83% 75%)` | Hue/sat shifted to anchor; lightness ramped |
| `400` | `hsl(240 100% 75%)` | `hsl(221 83% 65%)` | Hue/sat shifted to anchor; lightness ramped |
| `500` | `hsl(221.2 83.2% 53.3%)` | (preserved verbatim) | Anchor untouched |
| `600..950` | (anchor hue, varying lightness) | (preserved verbatim) | Already coherent |

**Dark side regeneration:** Same logic applied to dark `50..400`. CVI dark held the same hue 217 across `500..950` but jumped the lighter steps; Wave 1 holds hue 217 / sat 91 across all dark steps for `primary`.

**Method.** Hue + saturation locked to the `500` anchor's values; lightness preserved from CVI's existing ramp (since the lightness gradient was already monotone and tonally readable). No families with already-coherent ramps (`neutral`, `success`, `warning`, `danger`, `info`) were touched. Note that `warning` and `info` *do* have a hue jump at `500`, but the journal § 5 notes them as plausible designed crossfades rather than the obvious seed-from-defaults artifact that primary's 240→221 jump represents — so they were preserved.

### 3.3 Duplicates collapsed

Per the inventory's `duplication` class (12 rows in § 2.1):

| What was duplicated | Now lives as |
|---|---|
| `--color-primary` / `colors.primary.DEFAULT` | `colors.primary.500` |
| `--color-success` / `colors.success.DEFAULT` | `colors.success.500` |
| `--color-warning` / `colors.warning.DEFAULT` | `colors.warning.500` |
| `--color-error` / `colors.error.DEFAULT` | `colors.danger.500` (renamed family) |
| `--color-info` / `colors.info.DEFAULT` | `colors.info.500` |
| `colors.neutral.DEFAULT` (→ `--color-neutral-600`) | `colors.neutral.500` (anchored to `500` per Q6 default) |
| `boxShadow.popover` | `shadow.lg` (byte-identical) |

The shad-* layer (39 hack rows) is dropped wholesale — see § 4 for the deprecation list.

### 3.4 Family rename

`error` → `danger`. CVI's full error scale (light + dark, all 11 steps) is preserved verbatim under the new family name. This matches the soribashi `defaultTokens` and the playground theme's intent list.

### 3.5 Semantic surface choices

**Surface taxonomy:** five layers — `canvas`, `default`, `raised`, `sunken`, `overlay`. The CVI `card` and `popover` shad-* tokens (which held identical values in both light and dark) collapse into `surface.default`. Per Q1 Wave 1 default; flagged for design review whether to differentiate elevation later.

| Slot | Reference | Origin |
|---|---|---|
| `surface.canvas` | `colors.neutral.50` | CVI `--color-background-secondary` |
| `surface.default` | `colors.neutral.0` | CVI `--color-background` (white) |
| `surface.raised` | `colors.neutral.100` | CVI `--color-background-tertiary` |
| `surface.sunken` | `colors.neutral.50` | CVI `--color-background-secondary` (echo) |
| `surface.overlay` | `colors.neutral.900` | overlay default — soribashi convention |

**Text taxonomy:** four layers — `default`, `muted`, `subtle`, `disabled`. Per Q3 Wave 1 default, the four-step shape from CVI's `text.{primary,secondary,tertiary,disabled}` is preserved but routes through neutral-scale anchors rather than dedicated CSS vars.

| Slot | Reference | Closest CVI origin |
|---|---|---|
| `text.default` | `colors.neutral.900` | `--color-text-primary` (`hsl(222 47% 11%)` ↔ `neutral.900`) |
| `text.muted` | `colors.neutral.700` | `--color-text-secondary` (`hsl(215 19% 35%)` ↔ `neutral.600`/`700`) |
| `text.subtle` | `colors.neutral.500` | `--color-text-tertiary` (`hsl(215 20% 65%)` ↔ `neutral.400`/`500`) |
| `text.disabled` | `colors.neutral.400` | `--color-text-disabled` (`hsl(213 27% 84%)` ↔ `neutral.300`/`400`) |

**Border taxonomy:** three layers — `default`, `strong`, `muted`. CVI's single `--color-border-islands` (`hsl(214 32% 91%)`) maps cleanly to `border.default → colors.neutral.200`. Strong / muted derived from the ramp per soribashi convention.

### 3.6 Intent + variant lists

Per spec § 7.1 step 2:

- **Intents:** `['primary', 'neutral', 'success', 'warning', 'danger', 'info']`
- **Variants:** `['filled', 'outline', 'subtle', 'ghost', 'link']`

Intent ordering puts `primary` and `neutral` first (the foundation roles), then the four feedback intents in CVI's source-file declaration order (`success, warning, error, info` — with `error` rebadged to `danger` in its spot). The variant list matches the soribashi `defaultIntentResolver` defaults.

### 3.7 Non-color token decisions

| Group | Wave 1 choice | Notes |
|---|---|---|
| `radius` | `sm/md/lg/xl/2xl/3xl/full` (CVI mapping with `2xl` → `3xl` rename for ramp consistency; `full` added) | shad's `--radius` (`0.5rem`) is byte-identical to CVI's `borderRadius.md` (`0.5rem`); collapse is automatic since shad-* drops wholesale. CVI's `borderRadius.DEFAULT` (`0.375rem`) becomes `radius.md`. `radius.full = 9999px` is added (not in CVI) to support pill-shaped Button variants in Task 1.5. |
| `spacing` | soribashi default scale (`xs..3xl`) | CVI's five custom keys (`spacing.{18,88,100,112,128}`) tagged `deferred` — § 1.3.2 confirms zero utility usage. |
| `fontSize` | `xs/sm/base/lg/xl/2xl/3xl` (CVI verbatim) | Kept CVI's `base` slot rather than soribashi's `md` to minimize integration-project churn. Same naming-stability logic as Q4. |
| `lineHeight` | unitless multipliers, keyed identically to fontSize | CVI declares fontSize as paired tuples in Tailwind (e.g. `['0.75rem', '1rem']`); soribashi's `LineHeightTokens` is a flat `Record<string, string>` with no machine-readable pairing to `fontSize`. **Wave 1 converts CVI's absolute rem line-heights to unitless multipliers** (light-height ÷ paired font-size) to match the soribashi default-tokens convention (`packages/theme/src/tokens/default-tokens.ts:127`, all unitless). Computed multipliers: `xs 1.333`, `sm 1.429`, `base 1.5`, `lg 1.556`, `xl 1.4`, `2xl 1.333`, `3xl 1.2`. The visual metric is preserved at the body-default size; non-base sizes drift slightly when consumers pair a multiplier with a non-matching fontSize, but the multiplier model is the standard CSS convention and the slight drift is acceptable in exchange for consistency with the rest of the theme model. |
| `fontFamily` | `sans` only | CVI declares only `fontFamily.sans`. |
| `shadow` | `sm/md/lg/xl` (CVI verbatim) | `popover` collapsed into `lg` (duplicate). |

### 3.8 Dark scope

Per Q5: emitted under `.dark` (the soribashi default). The pilot is a standalone Vite app with no host-page island chrome. CVI's production scope is `.dark .claim-view-islands` because of host-page integration; reconciliation is owned by the integration project, not Wave 1.



## 4. Deprecation list (Task 0.5)

_Populated below._

## 5. Open design questions

The five spec § 6.3 questions are reproduced below in the Q template format (Q1–Q5), followed by the Wave-1-specific questions surfaced during inventory and classification (Q6–Q10). All carry a defensible Wave 1 default so the pilot can proceed without blocking; the design owner re-decides during the integration project.

### Q1: Surface tokens — collapse `card` + `popover` or keep two?

**Status:** open
**Wave 1 default:** Collapse to a single `surface` token. Both CVI variants currently hold the same value (`0 0% 100%` / `222.2 84% 4.9%`); two names with one value is pure duplication.
**Rationale:** Keeping `card` and `popover` separate preserves the option to differentiate elevation later, but until that differentiation is needed the names cost cognitive overhead with no payoff. A single `surface` (with optional `surface.elevated` later) reads more clearly.
**For design review:** Confirm the consolidated theme can ship with one surface token, or commit to a near-term elevation differentiation that justifies keeping two from the start.

### Q2: Primary ramp — is the hue drift intentional or vestigial?

**Status:** open
**Wave 1 default:** Regenerate the ramp coherently from the `500` anchor (`221.2 83.2% 53.3%`).
**Rationale:** The current `--color-primary-50..400` steps sit at hue `240` while the `500..950` steps sit at hue `221.2`. A 19-degree hue jump between `400` and `500` looks like an accidental seed-from-Tailwind-defaults artifact rather than a designed crossfade. CVI usage data (`bg-primary-100` × 30, `bg-primary-50` × 11) shows the lighter steps are in production, so visual change is real.
**For design review:** Confirm the hue drift is unintentional, then sign off on regenerating `50..400` from the `500` anchor. If the drift is intentional, document the design rationale in the consolidated theme.

### Q3: Foreground vs text — `foreground` + shades or `text.{primary,secondary,...}`?

**Status:** open
**Wave 1 default:** Prefer `foreground` + optional `foreground.muted` / `foreground.subtle` shades.
**Rationale:** The four-level text taxonomy (`text.primary/secondary/tertiary/disabled`) maps cleanly to scale lookups via the intent resolver; reducing to `foreground` + a small set of muted modifiers cuts the surface area without losing expressiveness. Both `--foreground` (shad) and `--color-text-primary` (semantic) currently exist for the same role.
**For design review:** Confirm whether the four-step text taxonomy is load-bearing semantically (i.e., real meaning behind primary/secondary/tertiary/disabled) or whether it's a layered-opacity expression that `foreground` + shades captures more cleanly.

### Q4: Naming convention — keep `--color-` prefix or drop it?

**Status:** open
**Wave 1 default:** Keep the `--color-` prefix (so `--color-primary-500` rather than `--primary-500`).
**Rationale:** The `--color-` prefix is redundant in isolation — every var in the consolidated set holds a color — but matches the existing CVI naming and minimizes cognitive distance for the eventual integration project. Renaming during Wave 1 would force every CVI consumer to track a name change for zero functional benefit.
**For design review:** Confirm the consolidated theme inherits the `--color-` prefix, or pre-commit to a rename now while consumer surface area is small.

### Q5: Dark scoping — `.dark` (Wave 1) or `.dark .claim-view-islands` (CVI)?

**Status:** open
**Wave 1 default:** Wave 1 emits dark vars under `.dark` (the standard Tailwind dark-mode selector).
**Rationale:** The pilot lives in an isolated Vite app with no host-page chrome, so the broader selector is correct. CVI's production scope is `.dark .claim-view-islands` because it's an island inside a host page that has its own theming; the integration project (not Wave 1) reconciles by either tightening the pilot scope or loosening the CVI scope.
**For design review:** Confirm the integration project owns the reconciliation. No Wave 1 action needed beyond documenting the divergence in the playbook.

---

The remaining questions surfaced during inventory (Task 0.2) and classification (Task 0.3). They are observations that *do* need a design decision — the Task 0.2 pre-seeded items have been promoted into the Q template here. Pure observations that don't require a decision are folded into § 2's prose instead of being repeated.

### Q6: Figma-scale `DEFAULT` — anchor at `500` or preserve `neutral`'s `600` outlier?

**Status:** open
**Wave 1 default:** Anchor every family's `DEFAULT` at the `500` step. (Drops the separate `--color-{family}` CSS vars; collapses neutral's outlier.)
**Rationale:** Five of six families (`primary`, `success`, `warning`, `error`, `info`) map `DEFAULT` to a side-channel CSS var (`--color-{family}`) that holds the same value as the `500` step — pure duplication, classified accordingly. The sixth (`neutral`) maps `DEFAULT` to `--color-neutral-600` directly with no side var. Normalizing to `500` for all six is the obvious move; the only loss is whatever intent lay behind neutral's `600` choice (likely "neutral text wants to be a little darker than mid-scale").
**For design review:** Confirm `DEFAULT = 500` for all families. If neutral specifically wants `600`, document why and we keep that one outlier.

### Q7: `colors.borderColor.DEFAULT` misplacement — fix, replace, or keep the workaround?

**Status:** open
**Wave 1 default:** Fix the misplacement — declare a properly-located `theme.extend.borderColor.DEFAULT` and remove the universal `border-color` reset from CVI's CSS.
**Rationale:** As declared, `colors.borderColor.DEFAULT` sits inside `theme.extend.colors` and produces a `bg-borderColor` / `text-borderColor` color utility instead of the intended default border color. CVI compensates by hand-applying `border-color: hsl(var(--color-border-islands))` on the universal selector at `claimview-islands.css:271`. Three options: (a) fix the placement; (b) replace with an explicit `border-default` token + keep the universal reset; (c) keep both the misplacement and the workaround as-is. Option (a) is cleanest and removes a bug.
**For design review:** Confirm the consolidated theme moves `borderColor.DEFAULT` to its proper location and removes the universal-selector workaround.

### Q8: `--cvi-search-*` highlight vars — where in the layer architecture?

**Status:** open
**Wave 1 default:** Continue declaring on `:root` / `.dark` (not on `.claim-view-islands`). Keep the four vars in the consolidated theme as a small "global escapes" group documented as such.
**Rationale:** The vars are declared at `:root` because `::highlight()` pseudo-elements don't inherit from `.claim-view-islands` (per the comment at `claimview-islands.css:602`). This is a hard browser constraint, not a design choice — moving them under `.claim-view-islands` would silently break highlight rendering. Wave 1 doesn't render search highlights, so the pilot can defer; the consolidated theme should document the escape pattern.
**For design review:** Confirm the escape pattern is acceptable and that the consolidated theme owns these four tokens (rather than punting them to a separate "host integration" module).

### Q9: `--glow-color` — runtime-only or static fallback?

**Status:** open
**Wave 1 default:** Treat as runtime-only. Keep the `currentColor` fallback inside `@keyframes glow`. No static declaration in the consolidated theme.
**Rationale:** The var has no static declaration in CVI today — JS sets it inline per-element, and the keyframe falls back to `currentColor`. Adding a static declaration would either (a) shadow the JS-set value when JS is missing (unlikely failure mode worth designing for), or (b) provide a declared default the JS would always overwrite (no value). Documenting the runtime-only contract is enough.
**For design review:** Confirm runtime-only is fine, or specify a static fallback color we should document alongside the keyframe.

### Q10: Chart vars — keep under `shad-*` or split into a `chart` family?

**Status:** open
**Wave 1 default:** Defer. No Wave 1 action — chart vars are tagged `deferred` and ride along in their current shape until charts get a dedicated pass.
**Rationale:** `--chart-1..5` and `colors.shad.chart-1..5` are zero-usage in CVI per § 1.3. Splitting them into a `chart` family of their own is correct architecturally (charts don't follow intent ramps) but blocks on chart-ramp design that's out of scope for Wave 1.
**For design review:** No Wave 1 decision required. Flagged so the future chart pass starts with this open.

## 6. Codegen / theme-model gaps surfaced

- **`accent.feedback` has no clean home in the soribashi semantic shape.** CVI declares `--color-accent-feedback` (light `hsl(300 40% 55%)`, dark `hsl(300 45% 68%)`) and exposes it as the `colors.accent.feedback` Tailwind utility. The soribashi `SemanticTokens` shape only models `text`, `surface`, and `border` — there is no `accent` slot, and the value isn't a simple text/surface/border role (it's a one-off magenta highlight used for "feedback" UI in CVI). Wave 1 omits it from the consolidated theme. **Resolution paths:** (a) extend `SemanticTokens` with a free-form `accent: Record<string, SemanticReference>` slot, (b) promote it to a sibling top-level color family (`colors.accent`), or (c) fold it into a future "decorative" namespace. Not blocking for Wave 1 since the pilot doesn't render the feedback UI; flagged for the integration project.
- **`borderColor.DEFAULT` misplacement (Q7) has no in-theme expression yet.** CVI's `colors.borderColor.DEFAULT` is a Tailwind-config bug worked around via a universal-selector reset in `claimview-islands.css`. The soribashi theme model expresses border defaults via `semantic.border.default → colors.neutral.200` (which Wave 1 does), but doesn't currently emit a corresponding universal `border-color` reset rule. Whether the codegen should emit such a reset, or whether consumers are expected to apply `border-default` explicitly, is an architectural choice that's not yet documented. Not blocking for Wave 1; surfaced for the integration project.
- _Additional items will be appended as encountered. Promoted to the playbook in Phase 2._

## 7. Visual review findings (Task 0.10)

_Populated below._
