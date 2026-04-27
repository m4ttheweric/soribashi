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

| Token name | Light value | Dark value | Where defined | Flavor |
|---|---|---|---|---|
| `--background` | `0 0% 100%` | `222.2 84% 4.9%` | `claimview-islands.css` | shad-* |
| `--foreground` | `222.2 84% 4.9%` | `210 40% 98%` | `claimview-islands.css` | shad-* |
| `--card` | `0 0% 100%` | `222.2 84% 4.9%` | `claimview-islands.css` | shad-* |
| `--card-foreground` | `222.2 84% 4.9%` | `210 40% 98%` | `claimview-islands.css` | shad-* |
| `--popover` | `0 0% 100%` | `222.2 84% 4.9%` | `claimview-islands.css` | shad-* |
| `--popover-foreground` | `222.2 84% 4.9%` | `210 40% 98%` | `claimview-islands.css` | shad-* |
| `--primary` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` | `claimview-islands.css` | shad-* |
| `--primary-foreground` | `210 40% 98%` | `222.2 47.4% 11.2%` | `claimview-islands.css` | shad-* |
| `--secondary` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | `claimview-islands.css` | shad-* |
| `--secondary-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | `claimview-islands.css` | shad-* |
| `--muted` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | `claimview-islands.css` | shad-* |
| `--muted-foreground` | `215.4 16.3% 46.9%` | `215 20.2% 65.1%` | `claimview-islands.css` | shad-* |
| `--accent` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | `claimview-islands.css` | shad-* |
| `--accent-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | `claimview-islands.css` | shad-* |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | `claimview-islands.css` | shad-* |
| `--destructive-foreground` | `210 40% 98%` | `210 40% 98%` | `claimview-islands.css` | shad-* |
| `--border` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` | `claimview-islands.css` | shad-* |
| `--input` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` | `claimview-islands.css` | shad-* |
| `--ring` | `221.2 83.2% 53.3%` | `224.3 76.3% 48%` | `claimview-islands.css` | shad-* |
| `--radius` | `0.5rem` | — *(no override; light value reused)* | `claimview-islands.css` | shad-* |
| `--chart-1` | `12 76% 61%` | `220 70% 50%` | `claimview-islands.css` | chart |
| `--chart-2` | `173 58% 39%` | `160 60% 45%` | `claimview-islands.css` | chart |
| `--chart-3` | `197 37% 24%` | `30 80% 55%` | `claimview-islands.css` | chart |
| `--chart-4` | `43 74% 66%` | `280 65% 60%` | `claimview-islands.css` | chart |
| `--chart-5` | `27 87% 67%` | `340 75% 55%` | `claimview-islands.css` | chart |
| `--color-primary` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` | `claimview-islands.css` | Figma scale |
| `--color-primary-50` | `240 100% 98%` | `217 91% 15%` | `claimview-islands.css` | Figma scale |
| `--color-primary-100` | `240 100% 96%` | `217 91% 20%` | `claimview-islands.css` | Figma scale |
| `--color-primary-200` | `240 100% 92%` | `217 91% 25%` | `claimview-islands.css` | Figma scale |
| `--color-primary-300` | `240 100% 85%` | `217 91% 30%` | `claimview-islands.css` | Figma scale |
| `--color-primary-400` | `240 100% 75%` | `217 91% 40%` | `claimview-islands.css` | Figma scale |
| `--color-primary-500` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` | `claimview-islands.css` | Figma scale |
| `--color-primary-600` | `221.2 83.2% 45%` | `217 91% 65%` | `claimview-islands.css` | Figma scale |
| `--color-primary-700` | `221.2 83.2% 38%` | `217 91% 70%` | `claimview-islands.css` | Figma scale |
| `--color-primary-800` | `221.2 83.2% 30%` | `217 91% 75%` | `claimview-islands.css` | Figma scale |
| `--color-primary-900` | `221.2 83.2% 22%` | `217 91% 80%` | `claimview-islands.css` | Figma scale |
| `--color-primary-950` | `221.2 83.2% 15%` | `217 91% 85%` | `claimview-islands.css` | Figma scale |
| `--color-neutral-50` | `210 40% 98%` | `222 47% 11%` | `claimview-islands.css` | Figma scale |
| `--color-neutral-100` | `210 40% 96%` | `217 33% 17%` | `claimview-islands.css` | Figma scale |
| `--color-neutral-200` | `214 32% 91%` | `215 25% 27%` | `claimview-islands.css` | Figma scale |
| `--color-neutral-300` | `213 27% 84%` | `215 19% 35%` | `claimview-islands.css` | Figma scale |
| `--color-neutral-400` | `215 20% 65%` | `215 16% 47%` | `claimview-islands.css` | Figma scale |
| `--color-neutral-500` | `215 16% 47%` | `215 20% 65%` | `claimview-islands.css` | Figma scale |
| `--color-neutral-600` | `215 19% 35%` | `213 27% 84%` | `claimview-islands.css` | Figma scale |
| `--color-neutral-700` | `215 25% 27%` | `214 32% 91%` | `claimview-islands.css` | Figma scale |
| `--color-neutral-800` | `217 33% 17%` | `210 40% 96%` | `claimview-islands.css` | Figma scale |
| `--color-neutral-900` | `222 47% 11%` | `210 40% 98%` | `claimview-islands.css` | Figma scale |
| `--color-neutral-950` | `222 84% 5%` | `0 0% 100%` | `claimview-islands.css` | Figma scale |
| `--color-success` | `142 76% 36%` | `142 71% 45%` | `claimview-islands.css` | Figma scale |
| `--color-success-50` | `138 76% 97%` | `145 80% 10%` | `claimview-islands.css` | Figma scale |
| `--color-success-100` | `141 84% 93%` | `144 61% 20%` | `claimview-islands.css` | Figma scale |
| `--color-success-200` | `141 79% 85%` | `143 62% 20%` | `claimview-islands.css` | Figma scale |
| `--color-success-300` | `142 77% 73%` | `142 64% 24%` | `claimview-islands.css` | Figma scale |
| `--color-success-400` | `142 71% 45%` | `142 72% 29%` | `claimview-islands.css` | Figma scale |
| `--color-success-500` | `142 76% 36%` | `142 71% 45%` | `claimview-islands.css` | Figma scale |
| `--color-success-600` | `142 72% 29%` | `142 77% 73%` | `claimview-islands.css` | Figma scale |
| `--color-success-700` | `142 64% 24%` | `141 79% 85%` | `claimview-islands.css` | Figma scale |
| `--color-success-800` | `143 62% 20%` | `141 84% 93%` | `claimview-islands.css` | Figma scale |
| `--color-success-900` | `144 61% 20%` | `138 76% 97%` | `claimview-islands.css` | Figma scale |
| `--color-success-950` | `145 80% 10%` | `138 100% 99%` | `claimview-islands.css` | Figma scale |
| `--color-warning` | `38 92% 50%` | `49 98% 48%` | `claimview-islands.css` | Figma scale |
| `--color-warning-50` | `48 96% 89%` | `26 83% 14%` | `claimview-islands.css` | Figma scale |
| `--color-warning-100` | `48 96% 77%` | `22 78% 26%` | `claimview-islands.css` | Figma scale |
| `--color-warning-200` | `48 97% 63%` | `23 83% 31%` | `claimview-islands.css` | Figma scale |
| `--color-warning-300` | `49 98% 48%` | `26 90% 37%` | `claimview-islands.css` | Figma scale |
| `--color-warning-400` | `49 96% 47%` | `32 95% 44%` | `claimview-islands.css` | Figma scale |
| `--color-warning-500` | `38 92% 50%` | `49 98% 48%` | `claimview-islands.css` | Figma scale |
| `--color-warning-600` | `32 95% 44%` | `49 97% 63%` | `claimview-islands.css` | Figma scale |
| `--color-warning-700` | `26 90% 37%` | `48 97% 77%` | `claimview-islands.css` | Figma scale |
| `--color-warning-800` | `23 83% 31%` | `48 96% 89%` | `claimview-islands.css` | Figma scale |
| `--color-warning-900` | `22 78% 26%` | `48 100% 96%` | `claimview-islands.css` | Figma scale |
| `--color-warning-950` | `26 83% 14%` | `48 100% 98%` | `claimview-islands.css` | Figma scale |
| `--color-error` | `0 84% 60%` | `0 72% 51%` | `claimview-islands.css` | Figma scale |
| `--color-error-50` | `0 93% 94%` | `0 75% 15%` | `claimview-islands.css` | Figma scale |
| `--color-error-100` | `0 96% 89%` | `0 63% 31%` | `claimview-islands.css` | Figma scale |
| `--color-error-200` | `0 97% 85%` | `0 70% 35%` | `claimview-islands.css` | Figma scale |
| `--color-error-300` | `0 94% 82%` | `0 74% 42%` | `claimview-islands.css` | Figma scale |
| `--color-error-400` | `0 91% 71%` | `0 72% 51%` | `claimview-islands.css` | Figma scale |
| `--color-error-500` | `0 84% 60%` | `0 84% 60%` | `claimview-islands.css` | Figma scale |
| `--color-error-600` | `0 72% 51%` | `0 91% 71%` | `claimview-islands.css` | Figma scale |
| `--color-error-700` | `0 74% 42%` | `0 94% 82%` | `claimview-islands.css` | Figma scale |
| `--color-error-800` | `0 70% 35%` | `0 97% 85%` | `claimview-islands.css` | Figma scale |
| `--color-error-900` | `0 63% 31%` | `0 96% 89%` | `claimview-islands.css` | Figma scale |
| `--color-error-950` | `0 75% 15%` | `0 93% 94%` | `claimview-islands.css` | Figma scale |
| `--color-info` | `199 89% 48%` | `188 86% 53%` | `claimview-islands.css` | Figma scale |
| `--color-info-50` | `183 100% 96%` | `204 80% 16%` | `claimview-islands.css` | Figma scale |
| `--color-info-100` | `185 96% 90%` | `202 80% 24%` | `claimview-islands.css` | Figma scale |
| `--color-info-200` | `186 94% 81%` | `201 90% 27%` | `claimview-islands.css` | Figma scale |
| `--color-info-300` | `187 92% 69%` | `201 96% 32%` | `claimview-islands.css` | Figma scale |
| `--color-info-400` | `188 86% 53%` | `200 98% 39%` | `claimview-islands.css` | Figma scale |
| `--color-info-500` | `199 89% 48%` | `188 86% 53%` | `claimview-islands.css` | Figma scale |
| `--color-info-600` | `200 98% 39%` | `187 92% 69%` | `claimview-islands.css` | Figma scale |
| `--color-info-700` | `201 96% 32%` | `186 94% 81%` | `claimview-islands.css` | Figma scale |
| `--color-info-800` | `201 90% 27%` | `185 96% 90%` | `claimview-islands.css` | Figma scale |
| `--color-info-900` | `202 80% 24%` | `183 100% 96%` | `claimview-islands.css` | Figma scale |
| `--color-info-950` | `204 80% 16%` | `183 100% 98%` | `claimview-islands.css` | Figma scale |
| `--color-accent-feedback` | `300 40% 55%` | `300 45% 68%` | `claimview-islands.css` | direct semantic |
| `--color-background` | `0 0% 100%` | `222.2 84% 4.9%` | `claimview-islands.css` | direct semantic |
| `--color-background-secondary` | `210 40% 98%` | `217 33% 17%` | `claimview-islands.css` | direct semantic |
| `--color-background-tertiary` | `210 40% 96%` | `215 25% 27%` | `claimview-islands.css` | direct semantic |
| `--color-border-islands` | `214 32% 91%` | `217.2 32.6% 17.5%` | `claimview-islands.css` | direct semantic |
| `--color-text-primary` | `222 47% 11%` | `210 40% 98%` | `claimview-islands.css` | direct semantic |
| `--color-text-secondary` | `215 19% 35%` | `213 27% 84%` | `claimview-islands.css` | direct semantic |
| `--color-text-tertiary` | `215 20% 65%` | `215 20% 65%` | `claimview-islands.css` | direct semantic |
| `--color-text-disabled` | `213 27% 84%` | `215 19% 35%` | `claimview-islands.css` | direct semantic |
| `--cvi-search-highlight-bg` | `#fdd835` | `#f9a825` | `claimview-islands.css` (declared on `:root` and `.dark`, not on `.claim-view-islands`) | other |
| `--cvi-search-highlight-text` | `black` | `black` | `claimview-islands.css` (`:root` / `.dark`) | other |
| `--cvi-search-active-bg` | `#ff6d00` | `#e65100` | `claimview-islands.css` (`:root` / `.dark`) | other |
| `--cvi-search-active-text` | `white` | `white` | `claimview-islands.css` (`:root` / `.dark`) | other |
| `--glow-color` | _(not declared as a default; consumed by `.glowing` keyframe with fallback `currentColor`; set dynamically via inline style from JS)_ | — | `claimview-islands.css` (referenced inside `@keyframes glow`) | other |

CSS-var declaration count sanity check: `grep -c "^    --" claimview-islands.css` returns **209** lines, which matches **104 declarations × 2 modes (light + dark) + 1 light-only (`--radius`)** = 209. The four `--cvi-search-*` vars are declared at the `:root` / `.dark` selectors with a different indentation and are not part of the `^    --` count.

### 1.2 Tailwind config tokens — declared under `theme.extend` in `tailwind.config.js`

Tokens here that map to a CSS var are listed alongside their underlying CSS var, since the runtime value is owned by the CSS layer.

Row order mirrors `tailwind.config.js` source order — `DEFAULT` is interleaved at the position where the source config declares it (e.g., between `500` and `600` for `primary`; between `600` and `700` for `neutral`).

#### 1.2.1 `colors.shad.*` (shad-* alias group)

| Token name (Tailwind path) | Light value | Dark value | Where defined | Flavor |
|---|---|---|---|---|
| `colors.shad.background` | `hsl(var(--background) / <alpha-value>)` ↳ underlies `--background` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.foreground` | `hsl(var(--foreground) / <alpha-value>)` ↳ underlies `--foreground` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.card` | `hsl(var(--card) / <alpha-value>)` ↳ underlies `--card` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.card-foreground` | `hsl(var(--card-foreground) / <alpha-value>)` ↳ underlies `--card-foreground` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.popover` | `hsl(var(--popover) / <alpha-value>)` ↳ underlies `--popover` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.popover-foreground` | `hsl(var(--popover-foreground) / <alpha-value>)` ↳ underlies `--popover-foreground` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.primary` | `hsl(var(--primary) / <alpha-value>)` ↳ underlies `--primary` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.primary-foreground` | `hsl(var(--primary-foreground) / <alpha-value>)` ↳ underlies `--primary-foreground` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.secondary` | `hsl(var(--secondary) / <alpha-value>)` ↳ underlies `--secondary` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.secondary-foreground` | `hsl(var(--secondary-foreground) / <alpha-value>)` ↳ underlies `--secondary-foreground` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.muted` | `hsl(var(--muted) / <alpha-value>)` ↳ underlies `--muted` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.muted-foreground` | `hsl(var(--muted-foreground) / <alpha-value>)` ↳ underlies `--muted-foreground` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.accent` | `hsl(var(--accent) / <alpha-value>)` ↳ underlies `--accent` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.accent-foreground` | `hsl(var(--accent-foreground) / <alpha-value>)` ↳ underlies `--accent-foreground` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.destructive` | `hsl(var(--destructive) / <alpha-value>)` ↳ underlies `--destructive` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.destructive-foreground` | `hsl(var(--destructive-foreground) / <alpha-value>)` ↳ underlies `--destructive-foreground` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.border` | `hsl(var(--border) / <alpha-value>)` ↳ underlies `--border` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.input` | `hsl(var(--input) / <alpha-value>)` ↳ underlies `--input` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.ring` | `hsl(var(--ring) / <alpha-value>)` ↳ underlies `--ring` | (same) | `tailwind.config.js` | shad-* |
| `colors.shad.chart-1` | `hsl(var(--chart-1) / <alpha-value>)` ↳ underlies `--chart-1` | (same) | `tailwind.config.js` | chart |
| `colors.shad.chart-2` | `hsl(var(--chart-2) / <alpha-value>)` ↳ underlies `--chart-2` | (same) | `tailwind.config.js` | chart |
| `colors.shad.chart-3` | `hsl(var(--chart-3) / <alpha-value>)` ↳ underlies `--chart-3` | (same) | `tailwind.config.js` | chart |
| `colors.shad.chart-4` | `hsl(var(--chart-4) / <alpha-value>)` ↳ underlies `--chart-4` | (same) | `tailwind.config.js` | chart |
| `colors.shad.chart-5` | `hsl(var(--chart-5) / <alpha-value>)` ↳ underlies `--chart-5` | (same) | `tailwind.config.js` | chart |

#### 1.2.2 Top-level palette colors (no CSS-var indirection)

| Token name | Light value | Dark value | Where defined | Flavor |
|---|---|---|---|---|
| `colors.current` | `currentColor` | — | `tailwind.config.js` | other |
| `colors.transparent` | `transparent` | — | `tailwind.config.js` | other |
| `colors.white` | `#ffffff` | — | `tailwind.config.js` | other |
| `colors.black` | `#000000` | — | `tailwind.config.js` | other |

#### 1.2.3 `colors.primary.*` — Figma scale primary

| Token name | Light value | Dark value | Where defined | Flavor |
|---|---|---|---|---|
| `colors.primary.50` | `hsl(var(--color-primary-50) / <alpha-value>)` ↳ underlies `--color-primary-50` | (same) | `tailwind.config.js` | Figma scale |
| `colors.primary.100` | `hsl(var(--color-primary-100) / <alpha-value>)` ↳ underlies `--color-primary-100` | (same) | `tailwind.config.js` | Figma scale |
| `colors.primary.200` | `hsl(var(--color-primary-200) / <alpha-value>)` ↳ underlies `--color-primary-200` | (same) | `tailwind.config.js` | Figma scale |
| `colors.primary.300` | `hsl(var(--color-primary-300) / <alpha-value>)` ↳ underlies `--color-primary-300` | (same) | `tailwind.config.js` | Figma scale |
| `colors.primary.400` | `hsl(var(--color-primary-400) / <alpha-value>)` ↳ underlies `--color-primary-400` | (same) | `tailwind.config.js` | Figma scale |
| `colors.primary.500` | `hsl(var(--color-primary-500) / <alpha-value>)` ↳ underlies `--color-primary-500` | (same) | `tailwind.config.js` | Figma scale |
| `colors.primary.DEFAULT` | `hsl(var(--color-primary) / <alpha-value>)` ↳ underlies `--color-primary` | (same) | `tailwind.config.js` | Figma scale |
| `colors.primary.600` | `hsl(var(--color-primary-600) / <alpha-value>)` ↳ underlies `--color-primary-600` | (same) | `tailwind.config.js` | Figma scale |
| `colors.primary.700` | `hsl(var(--color-primary-700) / <alpha-value>)` ↳ underlies `--color-primary-700` | (same) | `tailwind.config.js` | Figma scale |
| `colors.primary.800` | `hsl(var(--color-primary-800) / <alpha-value>)` ↳ underlies `--color-primary-800` | (same) | `tailwind.config.js` | Figma scale |
| `colors.primary.900` | `hsl(var(--color-primary-900) / <alpha-value>)` ↳ underlies `--color-primary-900` | (same) | `tailwind.config.js` | Figma scale |
| `colors.primary.950` | `hsl(var(--color-primary-950) / <alpha-value>)` ↳ underlies `--color-primary-950` | (same) | `tailwind.config.js` | Figma scale |

#### 1.2.4 `colors.neutral.*` — Figma scale neutral

| Token name | Light value | Dark value | Where defined | Flavor |
|---|---|---|---|---|
| `colors.neutral.50` | `hsl(var(--color-neutral-50) / <alpha-value>)` ↳ underlies `--color-neutral-50` | (same) | `tailwind.config.js` | Figma scale |
| `colors.neutral.100` | `hsl(var(--color-neutral-100) / <alpha-value>)` ↳ underlies `--color-neutral-100` | (same) | `tailwind.config.js` | Figma scale |
| `colors.neutral.200` | `hsl(var(--color-neutral-200) / <alpha-value>)` ↳ underlies `--color-neutral-200` | (same) | `tailwind.config.js` | Figma scale |
| `colors.neutral.300` | `hsl(var(--color-neutral-300) / <alpha-value>)` ↳ underlies `--color-neutral-300` | (same) | `tailwind.config.js` | Figma scale |
| `colors.neutral.400` | `hsl(var(--color-neutral-400) / <alpha-value>)` ↳ underlies `--color-neutral-400` | (same) | `tailwind.config.js` | Figma scale |
| `colors.neutral.500` | `hsl(var(--color-neutral-500) / <alpha-value>)` ↳ underlies `--color-neutral-500` | (same) | `tailwind.config.js` | Figma scale |
| `colors.neutral.600` | `hsl(var(--color-neutral-600) / <alpha-value>)` ↳ underlies `--color-neutral-600` | (same) | `tailwind.config.js` | Figma scale |
| `colors.neutral.DEFAULT` | `hsl(var(--color-neutral-600) / <alpha-value>)` ↳ underlies `--color-neutral-600` | (same) | `tailwind.config.js` | Figma scale |
| `colors.neutral.700` | `hsl(var(--color-neutral-700) / <alpha-value>)` ↳ underlies `--color-neutral-700` | (same) | `tailwind.config.js` | Figma scale |
| `colors.neutral.800` | `hsl(var(--color-neutral-800) / <alpha-value>)` ↳ underlies `--color-neutral-800` | (same) | `tailwind.config.js` | Figma scale |
| `colors.neutral.900` | `hsl(var(--color-neutral-900) / <alpha-value>)` ↳ underlies `--color-neutral-900` | (same) | `tailwind.config.js` | Figma scale |
| `colors.neutral.950` | `hsl(var(--color-neutral-950) / <alpha-value>)` ↳ underlies `--color-neutral-950` | (same) | `tailwind.config.js` | Figma scale |

#### 1.2.5 `colors.success.*` — Figma scale success

| Token name | Light value | Dark value | Where defined | Flavor |
|---|---|---|---|---|
| `colors.success.50` | `hsl(var(--color-success-50) / <alpha-value>)` ↳ underlies `--color-success-50` | (same) | `tailwind.config.js` | Figma scale |
| `colors.success.100` | `hsl(var(--color-success-100) / <alpha-value>)` ↳ underlies `--color-success-100` | (same) | `tailwind.config.js` | Figma scale |
| `colors.success.200` | `hsl(var(--color-success-200) / <alpha-value>)` ↳ underlies `--color-success-200` | (same) | `tailwind.config.js` | Figma scale |
| `colors.success.300` | `hsl(var(--color-success-300) / <alpha-value>)` ↳ underlies `--color-success-300` | (same) | `tailwind.config.js` | Figma scale |
| `colors.success.400` | `hsl(var(--color-success-400) / <alpha-value>)` ↳ underlies `--color-success-400` | (same) | `tailwind.config.js` | Figma scale |
| `colors.success.500` | `hsl(var(--color-success-500) / <alpha-value>)` ↳ underlies `--color-success-500` | (same) | `tailwind.config.js` | Figma scale |
| `colors.success.DEFAULT` | `hsl(var(--color-success) / <alpha-value>)` ↳ underlies `--color-success` | (same) | `tailwind.config.js` | Figma scale |
| `colors.success.600` | `hsl(var(--color-success-600) / <alpha-value>)` ↳ underlies `--color-success-600` | (same) | `tailwind.config.js` | Figma scale |
| `colors.success.700` | `hsl(var(--color-success-700) / <alpha-value>)` ↳ underlies `--color-success-700` | (same) | `tailwind.config.js` | Figma scale |
| `colors.success.800` | `hsl(var(--color-success-800) / <alpha-value>)` ↳ underlies `--color-success-800` | (same) | `tailwind.config.js` | Figma scale |
| `colors.success.900` | `hsl(var(--color-success-900) / <alpha-value>)` ↳ underlies `--color-success-900` | (same) | `tailwind.config.js` | Figma scale |
| `colors.success.950` | `hsl(var(--color-success-950) / <alpha-value>)` ↳ underlies `--color-success-950` | (same) | `tailwind.config.js` | Figma scale |

#### 1.2.6 `colors.warning.*` — Figma scale warning

| Token name | Light value | Dark value | Where defined | Flavor |
|---|---|---|---|---|
| `colors.warning.50` | `hsl(var(--color-warning-50) / <alpha-value>)` ↳ underlies `--color-warning-50` | (same) | `tailwind.config.js` | Figma scale |
| `colors.warning.100` | `hsl(var(--color-warning-100) / <alpha-value>)` ↳ underlies `--color-warning-100` | (same) | `tailwind.config.js` | Figma scale |
| `colors.warning.200` | `hsl(var(--color-warning-200) / <alpha-value>)` ↳ underlies `--color-warning-200` | (same) | `tailwind.config.js` | Figma scale |
| `colors.warning.300` | `hsl(var(--color-warning-300) / <alpha-value>)` ↳ underlies `--color-warning-300` | (same) | `tailwind.config.js` | Figma scale |
| `colors.warning.400` | `hsl(var(--color-warning-400) / <alpha-value>)` ↳ underlies `--color-warning-400` | (same) | `tailwind.config.js` | Figma scale |
| `colors.warning.500` | `hsl(var(--color-warning-500) / <alpha-value>)` ↳ underlies `--color-warning-500` | (same) | `tailwind.config.js` | Figma scale |
| `colors.warning.DEFAULT` | `hsl(var(--color-warning) / <alpha-value>)` ↳ underlies `--color-warning` | (same) | `tailwind.config.js` | Figma scale |
| `colors.warning.600` | `hsl(var(--color-warning-600) / <alpha-value>)` ↳ underlies `--color-warning-600` | (same) | `tailwind.config.js` | Figma scale |
| `colors.warning.700` | `hsl(var(--color-warning-700) / <alpha-value>)` ↳ underlies `--color-warning-700` | (same) | `tailwind.config.js` | Figma scale |
| `colors.warning.800` | `hsl(var(--color-warning-800) / <alpha-value>)` ↳ underlies `--color-warning-800` | (same) | `tailwind.config.js` | Figma scale |
| `colors.warning.900` | `hsl(var(--color-warning-900) / <alpha-value>)` ↳ underlies `--color-warning-900` | (same) | `tailwind.config.js` | Figma scale |
| `colors.warning.950` | `hsl(var(--color-warning-950) / <alpha-value>)` ↳ underlies `--color-warning-950` | (same) | `tailwind.config.js` | Figma scale |

#### 1.2.7 `colors.error.*` — Figma scale error

| Token name | Light value | Dark value | Where defined | Flavor |
|---|---|---|---|---|
| `colors.error.50` | `hsl(var(--color-error-50) / <alpha-value>)` ↳ underlies `--color-error-50` | (same) | `tailwind.config.js` | Figma scale |
| `colors.error.100` | `hsl(var(--color-error-100) / <alpha-value>)` ↳ underlies `--color-error-100` | (same) | `tailwind.config.js` | Figma scale |
| `colors.error.200` | `hsl(var(--color-error-200) / <alpha-value>)` ↳ underlies `--color-error-200` | (same) | `tailwind.config.js` | Figma scale |
| `colors.error.300` | `hsl(var(--color-error-300) / <alpha-value>)` ↳ underlies `--color-error-300` | (same) | `tailwind.config.js` | Figma scale |
| `colors.error.400` | `hsl(var(--color-error-400) / <alpha-value>)` ↳ underlies `--color-error-400` | (same) | `tailwind.config.js` | Figma scale |
| `colors.error.500` | `hsl(var(--color-error-500) / <alpha-value>)` ↳ underlies `--color-error-500` | (same) | `tailwind.config.js` | Figma scale |
| `colors.error.DEFAULT` | `hsl(var(--color-error) / <alpha-value>)` ↳ underlies `--color-error` | (same) | `tailwind.config.js` | Figma scale |
| `colors.error.600` | `hsl(var(--color-error-600) / <alpha-value>)` ↳ underlies `--color-error-600` | (same) | `tailwind.config.js` | Figma scale |
| `colors.error.700` | `hsl(var(--color-error-700) / <alpha-value>)` ↳ underlies `--color-error-700` | (same) | `tailwind.config.js` | Figma scale |
| `colors.error.800` | `hsl(var(--color-error-800) / <alpha-value>)` ↳ underlies `--color-error-800` | (same) | `tailwind.config.js` | Figma scale |
| `colors.error.900` | `hsl(var(--color-error-900) / <alpha-value>)` ↳ underlies `--color-error-900` | (same) | `tailwind.config.js` | Figma scale |
| `colors.error.950` | `hsl(var(--color-error-950) / <alpha-value>)` ↳ underlies `--color-error-950` | (same) | `tailwind.config.js` | Figma scale |

#### 1.2.8 `colors.info.*` — Figma scale info

| Token name | Light value | Dark value | Where defined | Flavor |
|---|---|---|---|---|
| `colors.info.50` | `hsl(var(--color-info-50) / <alpha-value>)` ↳ underlies `--color-info-50` | (same) | `tailwind.config.js` | Figma scale |
| `colors.info.100` | `hsl(var(--color-info-100) / <alpha-value>)` ↳ underlies `--color-info-100` | (same) | `tailwind.config.js` | Figma scale |
| `colors.info.200` | `hsl(var(--color-info-200) / <alpha-value>)` ↳ underlies `--color-info-200` | (same) | `tailwind.config.js` | Figma scale |
| `colors.info.300` | `hsl(var(--color-info-300) / <alpha-value>)` ↳ underlies `--color-info-300` | (same) | `tailwind.config.js` | Figma scale |
| `colors.info.400` | `hsl(var(--color-info-400) / <alpha-value>)` ↳ underlies `--color-info-400` | (same) | `tailwind.config.js` | Figma scale |
| `colors.info.500` | `hsl(var(--color-info-500) / <alpha-value>)` ↳ underlies `--color-info-500` | (same) | `tailwind.config.js` | Figma scale |
| `colors.info.DEFAULT` | `hsl(var(--color-info) / <alpha-value>)` ↳ underlies `--color-info` | (same) | `tailwind.config.js` | Figma scale |
| `colors.info.600` | `hsl(var(--color-info-600) / <alpha-value>)` ↳ underlies `--color-info-600` | (same) | `tailwind.config.js` | Figma scale |
| `colors.info.700` | `hsl(var(--color-info-700) / <alpha-value>)` ↳ underlies `--color-info-700` | (same) | `tailwind.config.js` | Figma scale |
| `colors.info.800` | `hsl(var(--color-info-800) / <alpha-value>)` ↳ underlies `--color-info-800` | (same) | `tailwind.config.js` | Figma scale |
| `colors.info.900` | `hsl(var(--color-info-900) / <alpha-value>)` ↳ underlies `--color-info-900` | (same) | `tailwind.config.js` | Figma scale |
| `colors.info.950` | `hsl(var(--color-info-950) / <alpha-value>)` ↳ underlies `--color-info-950` | (same) | `tailwind.config.js` | Figma scale |

#### 1.2.9 Direct semantic Tailwind keys

| Token name | Light value | Dark value | Where defined | Flavor |
|---|---|---|---|---|
| `colors.background.DEFAULT` | `hsl(var(--color-background) / <alpha-value>)` ↳ underlies `--color-background` | (same) | `tailwind.config.js` | direct semantic |
| `colors.background.secondary` | `hsl(var(--color-background-secondary) / <alpha-value>)` ↳ underlies `--color-background-secondary` | (same) | `tailwind.config.js` | direct semantic |
| `colors.background.tertiary` | `hsl(var(--color-background-tertiary) / <alpha-value>)` ↳ underlies `--color-background-tertiary` | (same) | `tailwind.config.js` | direct semantic |
| `colors.borderColor.DEFAULT` | `hsl(var(--color-border-islands) / <alpha-value>)` ↳ underlies `--color-border-islands` | (same) | `tailwind.config.js` | direct semantic |
| `colors.text.primary` | `hsl(var(--color-text-primary) / <alpha-value>)` ↳ underlies `--color-text-primary` | (same) | `tailwind.config.js` | direct semantic |
| `colors.text.secondary` | `hsl(var(--color-text-secondary) / <alpha-value>)` ↳ underlies `--color-text-secondary` | (same) | `tailwind.config.js` | direct semantic |
| `colors.text.tertiary` | `hsl(var(--color-text-tertiary) / <alpha-value>)` ↳ underlies `--color-text-tertiary` | (same) | `tailwind.config.js` | direct semantic |
| `colors.text.disabled` | `hsl(var(--color-text-disabled) / <alpha-value>)` ↳ underlies `--color-text-disabled` | (same) | `tailwind.config.js` | direct semantic |
| `colors.accent.feedback` | `hsl(var(--color-accent-feedback) / <alpha-value>)` ↳ underlies `--color-accent-feedback` | (same) | `tailwind.config.js` | direct semantic |

> Note: `colors.borderColor.DEFAULT` is misplaced — it sits inside `theme.extend.colors` but Tailwind expects `borderColor` at the top of `theme.extend`, not nested under `colors`. As declared, it generates a `bg-borderColor` / `text-borderColor` color utility, not the intended default border color. CVI works around this by hand-applying `border-color: hsl(var(--color-border-islands))` in the universal selector at line 271. Flagged for the open-questions section but not "fixed" here — Task 0.2 is read-only.

#### 1.2.10 `spacing.*` extensions

| Token name | Value | Where defined | Flavor |
|---|---|---|---|
| `spacing.18` | `4.5rem` (72px) | `tailwind.config.js` | other |
| `spacing.88` | `22rem` (352px) | `tailwind.config.js` | other |
| `spacing.100` | `25rem` (400px) | `tailwind.config.js` | other |
| `spacing.112` | `28rem` (448px) | `tailwind.config.js` | other |
| `spacing.128` | `32rem` (512px) | `tailwind.config.js` | other |

#### 1.2.11 `borderRadius.*` overrides

| Token name | Value | Where defined | Flavor |
|---|---|---|---|
| `borderRadius.sm` | `0.25rem` | `tailwind.config.js` | other |
| `borderRadius.DEFAULT` | `0.375rem` | `tailwind.config.js` | other |
| `borderRadius.md` | `0.5rem` | `tailwind.config.js` | other |
| `borderRadius.lg` | `0.75rem` | `tailwind.config.js` | other |
| `borderRadius.xl` | `1rem` | `tailwind.config.js` | other |
| `borderRadius.2xl` | `1.5rem` | `tailwind.config.js` | other |

#### 1.2.12 `boxShadow.*` overrides

| Token name | Value | Where defined | Flavor |
|---|---|---|---|
| `boxShadow.popover` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` | `tailwind.config.js` | other |
| `boxShadow.sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` | `tailwind.config.js` | other |
| `boxShadow.md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)` | `tailwind.config.js` | other |
| `boxShadow.lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` | `tailwind.config.js` | other |
| `boxShadow.xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)` | `tailwind.config.js` | other |

#### 1.2.13 `fontSize.*` overrides

| Token name | Font size | Line height | Where defined | Flavor |
|---|---|---|---|---|
| `fontSize.xs` | `0.75rem` (12px) | `1rem` | `tailwind.config.js` | other |
| `fontSize.sm` | `0.875rem` (14px) | `1.25rem` | `tailwind.config.js` | other |
| `fontSize.base` | `1rem` (16px) | `1.5rem` | `tailwind.config.js` | other |
| `fontSize.lg` | `1.125rem` (18px) | `1.75rem` | `tailwind.config.js` | other |
| `fontSize.xl` | `1.25rem` (20px) | `1.75rem` | `tailwind.config.js` | other |
| `fontSize.2xl` | `1.5rem` (24px) | `2rem` | `tailwind.config.js` | other |
| `fontSize.3xl` | `1.875rem` (30px) | `2.25rem` | `tailwind.config.js` | other |

#### 1.2.14 `fontFamily.*` overrides

| Token name | Value | Where defined | Flavor |
|---|---|---|---|
| `fontFamily.sans` | `Inter, system-ui, -apple-system, sans-serif` | `tailwind.config.js` | other |

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

_Populated below._

## 3. Consolidated theme decisions (Task 0.4)

_Populated below._

## 4. Deprecation list (Task 0.5)

_Populated below._

## 5. Open design questions

- `colors.borderColor.DEFAULT` is declared inside `theme.extend.colors` rather than at `theme.extend.borderColor`. As written it produces a `borderColor`-named **color** utility (`bg-borderColor`, etc.) rather than the intended default border color. CVI compensates by hand-applying `border-color: hsl(var(--color-border-islands))` to the universal selector. Flag for the consolidated theme: decide whether to keep the universal border-color reset, fix the misplacement, or replace both with an explicit `border-default` token.
- The Figma-scale colors include both numbered steps (`50…950`) and an unnumbered `DEFAULT` for primary / success / warning / error / info / neutral. For `primary`, `success`, `warning`, `error`, `info` the `DEFAULT` maps to `--color-{family}` (a separate CSS var). For `neutral`, `DEFAULT` aliases the `600` step's CSS var directly (no separate `--color-neutral` declared). Decide whether the consolidated theme normalises this asymmetry.
- The `--cvi-search-*` highlights are declared on `:root` and `.dark`, NOT inside `.claim-view-islands`. The comment on line 602 explains why (the `::highlight()` pseudo doesn't inherit from `.claim-view-islands`). When porting to soribashi, decide where these belong in the layer architecture.
- `--glow-color` is referenced inside `@keyframes glow` with a `currentColor` fallback and is set dynamically via inline style from JS (no static declaration). Decide whether the consolidated theme treats it as a runtime-only var or adds an explicit declaration with a documented fallback.
- The `colors.shad.chart-*` keys point at the shad chart vars (`--chart-1…5`) but the spec lumps charts as a separate flavor. Decide whether they live under `shad-*` (shadcn convention) or get split into a `chart` family of their own.

## 6. Codegen / theme-model gaps surfaced

- _Populated as encountered. Promoted to the playbook in Phase 2._

## 7. Visual review findings (Task 0.10)

_Populated below._
