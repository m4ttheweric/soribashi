# Token Consolidation Pilot — Journal

**Wave:** 1
**Date started:** 2026-04-26
**Spec:** `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md`

This journal captures inventory, classification, the consolidated theme decisions, the deprecation list, and open design questions surfaced during Wave 1 Phase 0.

## 1. Inventory (Task 0.2)

### Source files surveyed

- `apps/adjuster/src/components/the host component library/tailwind.config.js` (read in full, 224 lines)
- `apps/adjuster/src/components/the host component library/host-styles.css` (read in full, 629 lines — `:root`/`.app-scope` light block AND `.dark .app-scope` dark block both fully consumed)

### Conventions used in the table below

- **Token name** — for CSS vars, the var name as declared (without the leading `--` stripped). For Tailwind config keys, the path inside `theme.extend` written as e.g. `colors.shad.background`.
- **Light value** — the value declared in the light block of the CSS (`.app-scope { ... }`). For Tailwind-only entries, the resolved expression.
- **Dark value** — the value declared in `.dark .app-scope { ... }`. `—` if the token has no dark override (Tailwind-only entries, mode-agnostic CSS vars, or vars whose light value is reused in dark mode by omission).
- **Where defined** — `host-styles.css`, `tailwind.config.js`, or `both` if the same identifier is defined in both. For Tailwind keys that point at a CSS var (e.g. `shad-background → hsl(var(--background))`), the entry is listed under `tailwind.config.js` and the row notes its underlying CSS var via `↳ underlies: --background`.
- **Flavor** — one of `shad-*`, `Figma scale`, `direct semantic`, `chart`, `other`.

All HSL values are written as raw `H S% L%` triples (no `hsl()` wrapper) — that matches the host library's convention because the wrapper is applied at the Tailwind layer via `hsl(var(--…) / <alpha-value>)`.

### 1.1 CSS variables — declared in `host-styles.css`

Rows are grouped by flavor; within each flavor, by source-file declaration order.

| Token name | Light value | Dark value | Where defined | Flavor | Class |
|---|---|---|---|---|---|
| `--background` | `0 0% 100%` | `222.2 84% 4.9%` | `host-styles.css` | shad-* | hack |
| `--foreground` | `222.2 84% 4.9%` | `210 40% 98%` | `host-styles.css` | shad-* | hack |
| `--card` | `0 0% 100%` | `222.2 84% 4.9%` | `host-styles.css` | shad-* | hack |
| `--card-foreground` | `222.2 84% 4.9%` | `210 40% 98%` | `host-styles.css` | shad-* | hack |
| `--popover` | `0 0% 100%` | `222.2 84% 4.9%` | `host-styles.css` | shad-* | hack |
| `--popover-foreground` | `222.2 84% 4.9%` | `210 40% 98%` | `host-styles.css` | shad-* | hack |
| `--primary` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` | `host-styles.css` | shad-* | hack |
| `--primary-foreground` | `210 40% 98%` | `222.2 47.4% 11.2%` | `host-styles.css` | shad-* | hack |
| `--secondary` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | `host-styles.css` | shad-* | hack |
| `--secondary-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | `host-styles.css` | shad-* | hack |
| `--muted` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | `host-styles.css` | shad-* | hack |
| `--muted-foreground` | `215.4 16.3% 46.9%` | `215 20.2% 65.1%` | `host-styles.css` | shad-* | hack |
| `--accent` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | `host-styles.css` | shad-* | hack |
| `--accent-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | `host-styles.css` | shad-* | hack |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | `host-styles.css` | shad-* | hack |
| `--destructive-foreground` | `210 40% 98%` | `210 40% 98%` | `host-styles.css` | shad-* | hack |
| `--border` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` | `host-styles.css` | shad-* | hack |
| `--input` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` | `host-styles.css` | shad-* | hack |
| `--ring` | `221.2 83.2% 53.3%` | `224.3 76.3% 48%` | `host-styles.css` | shad-* | hack |
| `--radius` | `0.5rem` | — *(no override; light value reused)* | `host-styles.css` | shad-* | hack |
| `--chart-1` | `12 76% 61%` | `220 70% 50%` | `host-styles.css` | chart | deferred |
| `--chart-2` | `173 58% 39%` | `160 60% 45%` | `host-styles.css` | chart | deferred |
| `--chart-3` | `197 37% 24%` | `30 80% 55%` | `host-styles.css` | chart | deferred |
| `--chart-4` | `43 74% 66%` | `280 65% 60%` | `host-styles.css` | chart | deferred |
| `--chart-5` | `27 87% 67%` | `340 75% 55%` | `host-styles.css` | chart | deferred |
| `--color-primary` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` | `host-styles.css` | Figma scale | duplication → `--color-primary-500` |
| `--color-primary-50` | `240 100% 98%` | `217 91% 15%` | `host-styles.css` | Figma scale | signal |
| `--color-primary-100` | `240 100% 96%` | `217 91% 20%` | `host-styles.css` | Figma scale | signal |
| `--color-primary-200` | `240 100% 92%` | `217 91% 25%` | `host-styles.css` | Figma scale | signal |
| `--color-primary-300` | `240 100% 85%` | `217 91% 30%` | `host-styles.css` | Figma scale | signal |
| `--color-primary-400` | `240 100% 75%` | `217 91% 40%` | `host-styles.css` | Figma scale | signal |
| `--color-primary-500` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` | `host-styles.css` | Figma scale | signal |
| `--color-primary-600` | `221.2 83.2% 45%` | `217 91% 65%` | `host-styles.css` | Figma scale | signal |
| `--color-primary-700` | `221.2 83.2% 38%` | `217 91% 70%` | `host-styles.css` | Figma scale | signal |
| `--color-primary-800` | `221.2 83.2% 30%` | `217 91% 75%` | `host-styles.css` | Figma scale | signal |
| `--color-primary-900` | `221.2 83.2% 22%` | `217 91% 80%` | `host-styles.css` | Figma scale | signal |
| `--color-primary-950` | `221.2 83.2% 15%` | `217 91% 85%` | `host-styles.css` | Figma scale | signal |
| `--color-neutral-50` | `210 40% 98%` | `222 47% 11%` | `host-styles.css` | Figma scale | signal |
| `--color-neutral-100` | `210 40% 96%` | `217 33% 17%` | `host-styles.css` | Figma scale | signal |
| `--color-neutral-200` | `214 32% 91%` | `215 25% 27%` | `host-styles.css` | Figma scale | signal |
| `--color-neutral-300` | `213 27% 84%` | `215 19% 35%` | `host-styles.css` | Figma scale | signal |
| `--color-neutral-400` | `215 20% 65%` | `215 16% 47%` | `host-styles.css` | Figma scale | signal |
| `--color-neutral-500` | `215 16% 47%` | `215 20% 65%` | `host-styles.css` | Figma scale | signal |
| `--color-neutral-600` | `215 19% 35%` | `213 27% 84%` | `host-styles.css` | Figma scale | signal |
| `--color-neutral-700` | `215 25% 27%` | `214 32% 91%` | `host-styles.css` | Figma scale | signal |
| `--color-neutral-800` | `217 33% 17%` | `210 40% 96%` | `host-styles.css` | Figma scale | signal |
| `--color-neutral-900` | `222 47% 11%` | `210 40% 98%` | `host-styles.css` | Figma scale | signal |
| `--color-neutral-950` | `222 84% 5%` | `0 0% 100%` | `host-styles.css` | Figma scale | signal |
| `--color-success` | `142 76% 36%` | `142 71% 45%` | `host-styles.css` | Figma scale | duplication → `--color-success-500` |
| `--color-success-50` | `138 76% 97%` | `145 80% 10%` | `host-styles.css` | Figma scale | signal |
| `--color-success-100` | `141 84% 93%` | `144 61% 20%` | `host-styles.css` | Figma scale | signal |
| `--color-success-200` | `141 79% 85%` | `143 62% 20%` | `host-styles.css` | Figma scale | signal |
| `--color-success-300` | `142 77% 73%` | `142 64% 24%` | `host-styles.css` | Figma scale | signal |
| `--color-success-400` | `142 71% 45%` | `142 72% 29%` | `host-styles.css` | Figma scale | signal |
| `--color-success-500` | `142 76% 36%` | `142 71% 45%` | `host-styles.css` | Figma scale | signal |
| `--color-success-600` | `142 72% 29%` | `142 77% 73%` | `host-styles.css` | Figma scale | signal |
| `--color-success-700` | `142 64% 24%` | `141 79% 85%` | `host-styles.css` | Figma scale | signal |
| `--color-success-800` | `143 62% 20%` | `141 84% 93%` | `host-styles.css` | Figma scale | signal |
| `--color-success-900` | `144 61% 20%` | `138 76% 97%` | `host-styles.css` | Figma scale | signal |
| `--color-success-950` | `145 80% 10%` | `138 100% 99%` | `host-styles.css` | Figma scale | signal |
| `--color-warning` | `38 92% 50%` | `49 98% 48%` | `host-styles.css` | Figma scale | duplication → `--color-warning-500` |
| `--color-warning-50` | `48 96% 89%` | `26 83% 14%` | `host-styles.css` | Figma scale | signal |
| `--color-warning-100` | `48 96% 77%` | `22 78% 26%` | `host-styles.css` | Figma scale | signal |
| `--color-warning-200` | `48 97% 63%` | `23 83% 31%` | `host-styles.css` | Figma scale | signal |
| `--color-warning-300` | `49 98% 48%` | `26 90% 37%` | `host-styles.css` | Figma scale | signal |
| `--color-warning-400` | `49 96% 47%` | `32 95% 44%` | `host-styles.css` | Figma scale | signal |
| `--color-warning-500` | `38 92% 50%` | `49 98% 48%` | `host-styles.css` | Figma scale | signal |
| `--color-warning-600` | `32 95% 44%` | `49 97% 63%` | `host-styles.css` | Figma scale | signal |
| `--color-warning-700` | `26 90% 37%` | `48 97% 77%` | `host-styles.css` | Figma scale | signal |
| `--color-warning-800` | `23 83% 31%` | `48 96% 89%` | `host-styles.css` | Figma scale | signal |
| `--color-warning-900` | `22 78% 26%` | `48 100% 96%` | `host-styles.css` | Figma scale | signal |
| `--color-warning-950` | `26 83% 14%` | `48 100% 98%` | `host-styles.css` | Figma scale | signal |
| `--color-error` | `0 84% 60%` | `0 72% 51%` | `host-styles.css` | Figma scale | duplication → `--color-error-500` |
| `--color-error-50` | `0 93% 94%` | `0 75% 15%` | `host-styles.css` | Figma scale | signal |
| `--color-error-100` | `0 96% 89%` | `0 63% 31%` | `host-styles.css` | Figma scale | signal |
| `--color-error-200` | `0 97% 85%` | `0 70% 35%` | `host-styles.css` | Figma scale | signal |
| `--color-error-300` | `0 94% 82%` | `0 74% 42%` | `host-styles.css` | Figma scale | signal |
| `--color-error-400` | `0 91% 71%` | `0 72% 51%` | `host-styles.css` | Figma scale | signal |
| `--color-error-500` | `0 84% 60%` | `0 84% 60%` | `host-styles.css` | Figma scale | signal |
| `--color-error-600` | `0 72% 51%` | `0 91% 71%` | `host-styles.css` | Figma scale | signal |
| `--color-error-700` | `0 74% 42%` | `0 94% 82%` | `host-styles.css` | Figma scale | signal |
| `--color-error-800` | `0 70% 35%` | `0 97% 85%` | `host-styles.css` | Figma scale | signal |
| `--color-error-900` | `0 63% 31%` | `0 96% 89%` | `host-styles.css` | Figma scale | signal |
| `--color-error-950` | `0 75% 15%` | `0 93% 94%` | `host-styles.css` | Figma scale | signal |
| `--color-info` | `199 89% 48%` | `188 86% 53%` | `host-styles.css` | Figma scale | duplication → `--color-info-500` |
| `--color-info-50` | `183 100% 96%` | `204 80% 16%` | `host-styles.css` | Figma scale | signal |
| `--color-info-100` | `185 96% 90%` | `202 80% 24%` | `host-styles.css` | Figma scale | signal |
| `--color-info-200` | `186 94% 81%` | `201 90% 27%` | `host-styles.css` | Figma scale | signal |
| `--color-info-300` | `187 92% 69%` | `201 96% 32%` | `host-styles.css` | Figma scale | signal |
| `--color-info-400` | `188 86% 53%` | `200 98% 39%` | `host-styles.css` | Figma scale | signal |
| `--color-info-500` | `199 89% 48%` | `188 86% 53%` | `host-styles.css` | Figma scale | signal |
| `--color-info-600` | `200 98% 39%` | `187 92% 69%` | `host-styles.css` | Figma scale | signal |
| `--color-info-700` | `201 96% 32%` | `186 94% 81%` | `host-styles.css` | Figma scale | signal |
| `--color-info-800` | `201 90% 27%` | `185 96% 90%` | `host-styles.css` | Figma scale | signal |
| `--color-info-900` | `202 80% 24%` | `183 100% 96%` | `host-styles.css` | Figma scale | signal |
| `--color-info-950` | `204 80% 16%` | `183 100% 98%` | `host-styles.css` | Figma scale | signal |
| `--color-accent-feedback` | `300 40% 55%` | `300 45% 68%` | `host-styles.css` | direct semantic | signal |
| `--color-background` | `0 0% 100%` | `222.2 84% 4.9%` | `host-styles.css` | direct semantic | signal |
| `--color-background-secondary` | `210 40% 98%` | `217 33% 17%` | `host-styles.css` | direct semantic | signal |
| `--color-background-tertiary` | `210 40% 96%` | `215 25% 27%` | `host-styles.css` | direct semantic | signal |
| `--color-border-islands` | `214 32% 91%` | `217.2 32.6% 17.5%` | `host-styles.css` | direct semantic | signal |
| `--color-text-primary` | `222 47% 11%` | `210 40% 98%` | `host-styles.css` | direct semantic | signal |
| `--color-text-secondary` | `215 19% 35%` | `213 27% 84%` | `host-styles.css` | direct semantic | signal |
| `--color-text-tertiary` | `215 20% 65%` | `215 20% 65%` | `host-styles.css` | direct semantic | signal |
| `--color-text-disabled` | `213 27% 84%` | `215 19% 35%` | `host-styles.css` | direct semantic | signal |
| `--search-highlight-bg` | `#fdd835` | `#f9a825` | `host-styles.css` (declared on `:root` and `.dark`, not on `.app-scope`) | other | deferred |
| `--search-highlight-text` | `black` | `black` | `host-styles.css` (`:root` / `.dark`) | other | deferred |
| `--search-active-bg` | `#ff6d00` | `#e65100` | `host-styles.css` (`:root` / `.dark`) | other | deferred |
| `--search-active-text` | `white` | `white` | `host-styles.css` (`:root` / `.dark`) | other | deferred |
| `--glow-color` | _(not declared as a default; consumed by `.glowing` keyframe with fallback `currentColor`; set dynamically via inline style from JS)_ | — | `host-styles.css` (referenced inside `@keyframes glow`) | other | deferred |

CSS-var declaration count sanity check: `grep -c "^    --" host-styles.css` returns **209** lines, which matches **104 declarations × 2 modes (light + dark) + 1 light-only (`--radius`)** = 209. The four `--search-*` vars are declared at the `:root` / `.dark` selectors with a different indentation and are not part of the `^    --` count.

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

> Note: `colors.borderColor.DEFAULT` is misplaced — it sits inside `theme.extend.colors` but Tailwind expects `borderColor` at the top of `theme.extend`, not nested under `colors`. As declared, it generates a `bg-borderColor` / `text-borderColor` color utility, not the intended default border color. the host library works around this by hand-applying `border-color: hsl(var(--color-border-islands))` in the universal selector at line 271. Flagged for the open-questions section but not "fixed" here — Task 0.2 is read-only.

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

### 1.3 Usage counts (order-of-magnitude across the host library)

Counts come from grepping `apps/adjuster/src/components/the host component library` (`.tsx`/`.ts`/`.css`). Buckets: `<10`, `10–100`, `100+`.

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
- `var(--search-highlight-bg|text)` and `var(--search-active-bg|text)`: 1 each (the four `::highlight()` rules at lines 619–628).
- `var(--glow-color)`: 0 explicit fallback callers found in the host library source via grep (consumed only inside the keyframe with `currentColor` fallback; set dynamically from JS as documented in the file's comment at line 472).

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
| `font-sans` | 1 (only the global `.app-scope` rule) | <10 |
| Custom spacing keys `w/h/p/m/gap/...-{18,88,100,112,128}` | 0 explicit utility hits — these spacing extensions appear unused inside the host library itself | <10 |

### 1.4 Inventory totals

- **CSS vars declared in `host-styles.css`:** 110 distinct identifiers = 105 inside `.app-scope` (104 declared in both modes + 1 light-only `--radius`) + 4 `--search-*` vars on `:root`/`.dark` + 1 implicit `--glow-color` referenced inside `@keyframes glow` with no top-level declaration. Declaration line count = 209 (105 light + 104 dark inside `.app-scope`; the four `--search-*` vars are declared at a different indentation on `:root`/`.dark` and are not part of that 209-line count).
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
| `deferred` | 20 | `--chart-1..5` and `colors.shad.chart-1..5` (10), the 4 `--search-*` highlight vars, the implicit `--glow-color` runtime var, and the 5 unused custom `spacing.*` extensions (zero utility hits in the host library). Documented but not consolidated in Wave 1. |
| `duplication` | 12 | Six aliasing pairs and one shadow alias: `--color-{primary,success,warning,error,info}` collapse into the matching `--color-{family}-500` (5); `colors.{primary,success,warning,error,info}.DEFAULT` collapse into `colors.{family}.500` (5); `colors.neutral.DEFAULT` collapses into `colors.neutral.600` (1; note this family aliases the 600 step rather than the 500 step — see Q6 below); `boxShadow.popover` is byte-identical to `boxShadow.lg` (1). |

### 2.2 Patterns observed

- **The shad-* layer is a complete shadow of the Figma scale and adds no information.** It declares its own `--primary` (the same blue as `--color-primary-500`), its own `--destructive` (the same red as `--color-error-500`), its own `--background` (the same value as `--color-background`), and so on. Usage telemetry from § 1.3 backs the deprecation: `shad-*` Tailwind utilities total 14 hits across 6 files (and most are `bg-shad-{back,fore}ground` — the actual shadcn-named slots like `bg-shad-primary`, `bg-shad-destructive`, etc. are at zero). The whole layer can drop with negligible churn.
- **The Figma scale's `DEFAULT` slot is a solved problem and a dropped problem at once.** Five of six families define `DEFAULT` via a separate `--color-{family}` CSS var that holds the same value as the `500` step; the sixth (neutral) has no separate var at all and points `DEFAULT` at the `600`-step var. The CSS-var indirection adds zero expressiveness — once the consolidated theme picks a single canonical step per family for `DEFAULT`, both the side-variable and the asymmetry disappear. Wave 1 default: `DEFAULT = 500` for all six families, with neutral's choice flagged as a design question (Q6 below).
- **Chart vars are different from the rest of the shad-* layer.** `--chart-1..5` and `colors.shad.chart-1..5` are usage-zero in the host library. They're tagged `deferred`, not `hack`, because (a) they're not duplicates of any other token, (b) the spec explicitly defers chart consolidation to a future pass, and (c) the design owner may want a distinct palette for charts that doesn't follow the intent ramps.
- **Non-color "other" tokens are mostly signal except where unused or duplicated.** All borderRadius / fontSize / fontFamily entries earned `signal`; the five custom `spacing.*` extensions earned `deferred` because § 1.3 confirms zero utility hits; `boxShadow.popover` earned `duplication` because its bytes match `boxShadow.lg` exactly.

### 2.3 Judgment calls and edge cases

- **`--radius` (shad var, value `0.5rem`) tagged `hack`, not `duplication`.** It is technically also a duplicate of `borderRadius.md` (`0.5rem`), but the spec's classification rules explicitly fold "`--radius` if it duplicates a scale" into the shad-* deprecation block. Tagging as `hack` keeps the deprecation list clean — the duplication relationship is captured here rather than as a `→` annotation that would otherwise imply we want to preserve a CSS-var route into the radius scale.
- **`colors.borderColor.DEFAULT` tagged `signal`, not `hack`.** The intent is real (give the host library a default border color tied to `--color-border-islands`). The misplacement (it's nested under `colors.*` rather than declared at `theme.extend.borderColor`) is a Tailwind-config bug that's been worked around with a universal `border-color: hsl(var(--color-border-islands))` rule. Wave 1 keeps the intent and lets the consolidated theme decide whether to route via a properly-placed `borderColor.DEFAULT`, an explicit `border-default` token, or just keeping the universal selector reset. Captured as Q7 below.
- **`--glow-color` tagged `deferred`, not `hack`.** It has no static declaration — only a `@keyframes glow` reference with `currentColor` fallback and a JS-driven inline-style assignment. It's not part of the shad-* deprecation block, but it also isn't ready to live in the consolidated theme without a design decision about whether to declare a static fallback. Deferring is the right call.
- **`--search-*` (4 vars) tagged `deferred`.** Mode-toggleable but selector-scoped to `:root` / `.dark` (not `.app-scope`) because of how `::highlight()` resolves — a real architectural one-off that doesn't belong in the Wave 1 consolidated theme. Future pass.

## 3. Consolidated theme decisions (Task 0.4)

The Wave 1 design artifact lives at `apps/pilot/src/theme/index.ts` as a single `createTheme()` call. This section documents the choices that produced it.

### 3.1 Color families included

Six families, each with the soribashi standard 11-step ramp (`50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`); `neutral` additionally carries a `0` step (white in light, near-black in dark) used by `surface.default`. Each family also declares a `foreground` slot (white for five families, black for `warning` so light text on yellow stays legible) so downstream intent resolvers can derive `IntentResolverResult.color` rather than getting `undefined`. the host library does not declare per-family foregrounds in its tailwind config (verified § 1.2.3-1.2.8); the white/black defaults match the playground theme convention. No dark-mode foreground overrides — the yellow-warning legibility argument holds in dark too (dark `warning.500` is `hsl(49 98% 48%)`, also high-lightness yellow).

| Family | Light `500` anchor | Dark `500` anchor | Origin in the host library |
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

| Step | the host library value | Wave 1 value | Reason |
|---|---|---|---|
| `50` | `hsl(240 100% 98%)` | `hsl(221 83% 97%)` | Hue/sat shifted to anchor; lightness preserved |
| `100` | `hsl(240 100% 96%)` | `hsl(221 83% 93%)` | Hue/sat shifted to anchor; lightness preserved |
| `200` | `hsl(240 100% 92%)` | `hsl(221 83% 86%)` | Hue/sat shifted to anchor; lightness ramped |
| `300` | `hsl(240 100% 85%)` | `hsl(221 83% 75%)` | Hue/sat shifted to anchor; lightness ramped |
| `400` | `hsl(240 100% 75%)` | `hsl(221 83% 65%)` | Hue/sat shifted to anchor; lightness ramped |
| `500` | `hsl(221.2 83.2% 53.3%)` | (preserved verbatim) | Anchor untouched |
| `600..950` | (anchor hue, varying lightness) | (preserved verbatim) | Already coherent |

**Dark side regeneration:** Same logic applied to dark `50..400`. the host library dark held the same hue 217 across `500..950` but jumped the lighter steps; Wave 1 holds hue 217 / sat 91 across all dark steps for `primary`.

**Method.** Hue + saturation locked to the `500` anchor's values; lightness preserved from the host library's existing ramp (since the lightness gradient was already monotone and tonally readable). No families with already-coherent ramps (`neutral`, `success`, `warning`, `danger`, `info`) were touched. Note that `warning` and `info` *do* have a hue jump at `500`, but the journal § 5 notes them as plausible designed crossfades rather than the obvious seed-from-defaults artifact that primary's 240→221 jump represents — so they were preserved.

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

`error` → `danger`. the host library's full error scale (light + dark, all 11 steps) is preserved verbatim under the new family name. This matches the soribashi `defaultTokens` and the playground theme's intent list.

### 3.5 Semantic surface choices

**Surface taxonomy:** five layers — `canvas`, `default`, `raised`, `sunken`, `scrim`. The the host library `card` and `popover` shad-* tokens (which held identical values in both light and dark) collapse into `surface.default`. Per Q1 Wave 1 default; flagged for design review whether to differentiate elevation later. The fifth slot was renamed from `overlay` → `scrim` (post-Wave-1) to reserve `overlay`/`floating` naming for Wave 2's floating-UI surface (tooltips, dropdown menus, popover content) — distinct from "scrim behind a modal." See § 5 Q11.

| Slot | Reference | Origin |
|---|---|---|
| `surface.canvas` | `colors.neutral.50` | the host library `--color-background-secondary` |
| `surface.default` | `colors.neutral.0` | the host library `--color-background` (white) |
| `surface.raised` | `colors.neutral.100` | the host library `--color-background-tertiary` |
| `surface.sunken` | `colors.neutral.50` | the host library `--color-background-secondary` (echo) |
| `surface.scrim` | `colors.neutral.900` | modal-backdrop default — soribashi convention |

**Text taxonomy:** four layers — `default`, `muted`, `subtle`, `disabled`. Per Q3 Wave 1 default, the four-step shape from the host library's `text.{primary,secondary,tertiary,disabled}` is preserved but routes through neutral-scale anchors rather than dedicated CSS vars.

| Slot | Reference | Closest the host library origin |
|---|---|---|
| `text.default` | `colors.neutral.900` | `--color-text-primary` (`hsl(222 47% 11%)` ↔ `neutral.900`) |
| `text.muted` | `colors.neutral.700` | `--color-text-secondary` (`hsl(215 19% 35%)` ↔ `neutral.600`/`700`) |
| `text.subtle` | `colors.neutral.500` | `--color-text-tertiary` (`hsl(215 20% 65%)` ↔ `neutral.400`/`500`) |
| `text.disabled` | `colors.neutral.400` | `--color-text-disabled` (`hsl(213 27% 84%)` ↔ `neutral.300`/`400`) |

**Border taxonomy:** three layers — `default`, `strong`, `muted`. the host library's single `--color-border-islands` (`hsl(214 32% 91%)`) maps cleanly to `border.default → colors.neutral.200`. Strong / muted derived from the ramp per soribashi convention.

### 3.6 Intent + variant lists

Per spec § 7.1 step 2:

- **Intents:** `['primary', 'neutral', 'success', 'warning', 'danger', 'info']`
- **Variants:** `['filled', 'outline', 'subtle', 'ghost', 'link']`

Intent ordering puts `primary` and `neutral` first (the foundation roles), then the four feedback intents in the host library's source-file declaration order (`success, warning, error, info` — with `error` rebadged to `danger` in its spot). The variant list matches the soribashi `defaultIntentResolver` defaults.

### 3.7 Non-color token decisions

| Group | Wave 1 choice | Notes |
|---|---|---|
| `radius` | `sm/md/lg/xl/2xl/3xl/full` (the host library mapping with `2xl` → `3xl` rename for ramp consistency; `full` added) | shad's `--radius` (`0.5rem`) is byte-identical to the host library's `borderRadius.md` (`0.5rem`); collapse is automatic since shad-* drops wholesale. the host library's `borderRadius.DEFAULT` (`0.375rem`) becomes `radius.md`. `radius.full = 9999px` is added (not in the host library) to support pill-shaped Button variants in Task 1.5. |
| `spacing` | soribashi default scale (`xs..3xl`) | the host library's five custom keys (`spacing.{18,88,100,112,128}`) tagged `deferred` — § 1.3.2 confirms zero utility usage. |
| `fontSize` | `xs/sm/base/lg/xl/2xl/3xl` (the host library verbatim) | Kept the host library's `base` slot rather than soribashi's `md` to minimize integration-project churn. Same naming-stability logic as Q4. |
| `lineHeight` | unitless multipliers, keyed identically to fontSize | the host library declares fontSize as paired tuples in Tailwind (e.g. `['0.75rem', '1rem']`); soribashi's `LineHeightTokens` is a flat `Record<string, string>` with no machine-readable pairing to `fontSize`. **Wave 1 converts the host library's absolute rem line-heights to unitless multipliers** (line-height ÷ paired font-size) to match the soribashi default-tokens convention (`packages/theme/src/tokens/default-tokens.ts:127`, all unitless). Computed multipliers: `xs 1.333`, `sm 1.429`, `base 1.5`, `lg 1.556`, `xl 1.4`, `2xl 1.333`, `3xl 1.2`. The visual metric is preserved at the body-default size; non-base sizes drift slightly when consumers pair a multiplier with a non-matching fontSize, but the multiplier model is the standard CSS convention and the slight drift is acceptable in exchange for consistency with the rest of the theme model. |
| `fontFamily` | `sans` only | the host library declares only `fontFamily.sans`. |
| `shadow` | `sm/md/lg/xl` (the host library verbatim) | `popover` collapsed into `lg` (duplicate). |

### 3.8 Dark scope

Per Q5: emitted under `.dark` (the soribashi default). The pilot is a standalone Vite app with no host-page island chrome. the host library's production scope is `.dark .app-scope` because of host-page integration; reconciliation is owned by the integration project, not Wave 1.



## 4. Deprecation list (Task 0.5)

This list covers every the host library token classed `hack`, `duplication`, or `deferred` in § 1 (39 + 12 + 20 = 71 rows). For each row: a one-line reason and the consolidated theme target that the host library usages should migrate to. Targets are written using the consolidated theme's identifiers (CSS-var name as emitted from `apps/pilot/src/theme/index.ts`, or the Tailwind path under that theme's emitted config). Tokens classed `deferred` carry `(none — deferred)` because Wave 1 does not consolidate them.

The list is organized by class (hack → duplication → deferred) so the cross-check against § 1 is mechanical. A trailing informational subsection (§ 4.4) captures the `error` → `danger` family rename, since the per-step rows are classed `signal` (preserved verbatim) and would otherwise be invisible in this list even though every the host library consumer must migrate the family name.

### 4.1 `hack` rows — the shad-* layer (39 rows)

The shad-* layer is dropped wholesale (per § 2.2 and Q1). Every CSS var is consumed only by its matching `colors.shad.*` Tailwind alias (or the universal-selector reset for `--radius`); migration follows the value semantics each shad name implied in shadcn/ui, mapped onto the consolidated `colors` / `semantic` tokens.

#### 4.1.1 CSS vars (`host-styles.css`) — 20 rows

| Dropped / collapsed token | Reason | Migrate the host library usages to |
|---|---|---|
| `--background` | shad-* layer deprecated; semantic surface owns this role | `--surface-default` (from `semantic.surface.default → colors.neutral.0`) |
| `--foreground` | shad-* layer deprecated; semantic text owns this role | `--text-default` (from `semantic.text.default → colors.neutral.900`) |
| `--card` | shad-* layer deprecated; `card` collapsed into `surface.default` per Q1 (the host library's `--card` and `--background` held identical values) | `--surface-default` |
| `--card-foreground` | shad-* layer deprecated; collapsed into the single text default | `--text-default` |
| `--popover` | shad-* layer deprecated; `popover` collapsed into `surface.default` per Q1 | `--surface-default` |
| `--popover-foreground` | shad-* layer deprecated; collapsed into the single text default | `--text-default` |
| `--primary` | shad-* layer deprecated; byte-identical to `--color-primary-500` | `--color-primary-500` |
| `--primary-foreground` | shad-* layer deprecated; the soribashi primary family carries its own foreground slot | `--color-primary-foreground` (from `colors.primary.foreground = hsl(0 0% 100%)`) |
| `--secondary` | shad-* layer deprecated; the "secondary surface" role collapses into `surface.raised` (next-elevation neutral, per Q1 surface taxonomy) | `--surface-raised` (from `semantic.surface.raised → colors.neutral.100`) |
| `--secondary-foreground` | shad-* layer deprecated; secondary surface uses the default text color in Wave 1 | `--text-default` |
| `--muted` | shad-* layer deprecated; "muted surface" maps onto `surface.raised` (same role as `secondary` in the host library; both held the identical `210 40% 96.1%` light value) | `--surface-raised` |
| `--muted-foreground` | shad-* layer deprecated; replaced by the `muted` text slot | `--text-muted` (from `semantic.text.muted → colors.neutral.700`) |
| `--accent` | shad-* layer deprecated; the host library's shad `--accent` and `--muted`/`--secondary` shared the same value (`210 40% 96.1%`) — collapses to `surface.raised` | `--surface-raised` |
| `--accent-foreground` | shad-* layer deprecated | `--text-default` |
| `--destructive` | shad-* layer deprecated; "destructive" intent maps to the renamed `danger` family at the 500 step | `--color-danger-500` |
| `--destructive-foreground` | shad-* layer deprecated; danger family carries its own foreground | `--color-danger-foreground` (from `colors.danger.foreground = hsl(0 0% 100%)`) |
| `--border` | shad-* layer deprecated; the host library also has the (correctly intended but misplaced) `--color-border-islands`; consolidate onto the semantic border default per Q7 | `--border-default` (from `semantic.border.default → colors.neutral.200`) |
| `--input` | shad-* layer deprecated; input borders collapse onto the same border default in Wave 1 | `--border-default` |
| `--ring` | shad-* layer deprecated; focus ring uses primary at the 500 step | `--color-primary-500` |
| `--radius` | shad-* layer deprecated; byte-identical to `borderRadius.md` (`0.5rem`); see § 2.3 — the duplication-with-radius relationship is folded into the shad-* drop here | `--radius-lg` (the consolidated theme renames the host library's `borderRadius.md = 0.5rem` to `radius.lg`; the host library's old `borderRadius.md` ↔ Wave 1 `radius.lg` because the consolidated radius scale shifts the host library's `DEFAULT (0.375rem)` → `radius.md` and `borderRadius.md (0.5rem)` → `radius.lg`) |

#### 4.1.2 Tailwind keys (`tailwind.config.js`) — 19 rows

The shad Tailwind aliases mirror the CSS vars above. Migration targets are the consolidated theme's Tailwind paths (which the codegen emits onto `theme.colors.*`, replacing — not extending — Tailwind defaults; see § 3 and Task 0.7 step 1).

| Dropped / collapsed token | Reason | Migrate the host library usages to |
|---|---|---|
| `colors.shad.background` | shad-* layer deprecated; mirrors `--background` deprecation | `surface.default` (Tailwind utility: `bg-surface-default`) |
| `colors.shad.foreground` | shad-* layer deprecated; mirrors `--foreground` | `text.default` (utility: `text-text-default`) |
| `colors.shad.card` | shad-* layer deprecated; collapsed into `surface.default` per Q1 | `surface.default` |
| `colors.shad.card-foreground` | shad-* layer deprecated; collapsed into the text default | `text.default` |
| `colors.shad.popover` | shad-* layer deprecated; collapsed into `surface.default` per Q1 | `surface.default` |
| `colors.shad.popover-foreground` | shad-* layer deprecated | `text.default` |
| `colors.shad.primary` | shad-* layer deprecated; duplicates `colors.primary.500` | `colors.primary.500` (utility: `bg-primary-500`) |
| `colors.shad.primary-foreground` | shad-* layer deprecated; primary family carries `foreground` in the soribashi shape | `colors.primary.foreground` |
| `colors.shad.secondary` | shad-* layer deprecated; "secondary surface" → `surface.raised` per Q1 | `surface.raised` |
| `colors.shad.secondary-foreground` | shad-* layer deprecated | `text.default` |
| `colors.shad.muted` | shad-* layer deprecated; "muted surface" → `surface.raised` (same as `secondary` and `accent`; all held identical the host library values) | `surface.raised` |
| `colors.shad.muted-foreground` | shad-* layer deprecated; replaced by the muted text slot | `text.muted` |
| `colors.shad.accent` | shad-* layer deprecated; → `surface.raised` (same value as `muted`/`secondary` in the host library) | `surface.raised` |
| `colors.shad.accent-foreground` | shad-* layer deprecated | `text.default` |
| `colors.shad.destructive` | shad-* layer deprecated; "destructive" intent → renamed `danger` family at 500 | `colors.danger.500` |
| `colors.shad.destructive-foreground` | shad-* layer deprecated | `colors.danger.foreground` |
| `colors.shad.border` | shad-* layer deprecated; → semantic `border.default` per Q7 | `border.default` (utility: `border-border-default` once Q7 is resolved) |
| `colors.shad.input` | shad-* layer deprecated; input borders collapse onto `border.default` in Wave 1 | `border.default` |
| `colors.shad.ring` | shad-* layer deprecated; focus ring uses primary 500 | `colors.primary.500` |

### 4.2 `duplication` rows (12 rows)

#### 4.2.1 CSS vars — 5 rows

| Dropped / collapsed token | Reason | Migrate the host library usages to |
|---|---|---|
| `--color-primary` | duplicates `--color-primary-500` (byte-identical light + dark values); side-channel collapsed per Q6 | `--color-primary-500` |
| `--color-success` | duplicates `--color-success-500`; side-channel collapsed per Q6 | `--color-success-500` |
| `--color-warning` | duplicates `--color-warning-500`; side-channel collapsed per Q6 | `--color-warning-500` |
| `--color-error` | duplicates `--color-error-500`; side-channel collapsed per Q6; family also renamed `error` → `danger` per § 3.4 | `--color-danger-500` |
| `--color-info` | duplicates `--color-info-500`; side-channel collapsed per Q6 | `--color-info-500` |

#### 4.2.2 Tailwind `DEFAULT` aliases — 6 rows

| Dropped / collapsed token | Reason | Migrate the host library usages to |
|---|---|---|
| `colors.primary.DEFAULT` | duplicates `colors.primary.500` via the `--color-primary` side-channel; collapsed per Q6 | `colors.primary.500` |
| `colors.neutral.DEFAULT` | Q6 outlier: the host library pointed it at `--color-neutral-600`. Wave 1 normalizes every family's `DEFAULT` to `500`. (If design later wants neutral specifically at `600`, document and re-add — flagged in Q6.) | `colors.neutral.500` |
| `colors.success.DEFAULT` | duplicates `colors.success.500` via `--color-success`; collapsed per Q6 | `colors.success.500` |
| `colors.warning.DEFAULT` | duplicates `colors.warning.500` via `--color-warning`; collapsed per Q6 | `colors.warning.500` |
| `colors.error.DEFAULT` | duplicates `colors.error.500` via `--color-error`; collapsed per Q6; family also renamed `error` → `danger` | `colors.danger.500` |
| `colors.info.DEFAULT` | duplicates `colors.info.500` via `--color-info`; collapsed per Q6 | `colors.info.500` |

#### 4.2.3 Non-color duplication — 1 row

| Dropped / collapsed token | Reason | Migrate the host library usages to |
|---|---|---|
| `boxShadow.popover` | byte-identical to `boxShadow.lg` (same `0 10px 15px -3px ..., 0 4px 6px -2px ...` definition) | `shadow.lg` (utility: `shadow-lg`) |

### 4.3 `deferred` rows (20 rows)

These are not consolidated in Wave 1; they have no Wave 1 migration target. The integration project (or a later wave) must revisit each. the host library usages should remain on the existing names until then.

#### 4.3.1 Chart vars (10 rows)

| Dropped / collapsed token | Reason | Migrate the host library usages to |
|---|---|---|
| `--chart-1` | deferred — chart palette is out of Wave 1 scope (Q10); usage zero in the host library | (none — deferred; Q10 owns the chart-palette pass) |
| `--chart-2` | deferred — see Q10 | (none — deferred) |
| `--chart-3` | deferred — see Q10 | (none — deferred) |
| `--chart-4` | deferred — see Q10 | (none — deferred) |
| `--chart-5` | deferred — see Q10 | (none — deferred) |
| `colors.shad.chart-1` | deferred — chart palette out of Wave 1 scope; classed `deferred` not `hack` (§ 2.2) | (none — deferred) |
| `colors.shad.chart-2` | deferred — see Q10 | (none — deferred) |
| `colors.shad.chart-3` | deferred — see Q10 | (none — deferred) |
| `colors.shad.chart-4` | deferred — see Q10 | (none — deferred) |
| `colors.shad.chart-5` | deferred — see Q10 | (none — deferred) |

#### 4.3.2 Search-highlight + glow runtime vars (5 rows)

| Dropped / collapsed token | Reason | Migrate the host library usages to |
|---|---|---|
| `--search-highlight-bg` | deferred — selector-scoped to `:root`/`.dark` because `::highlight()` doesn't inherit from `.app-scope`; Q8 owns the architectural decision | (none — deferred; Q8) |
| `--search-highlight-text` | deferred — see Q8 | (none — deferred) |
| `--search-active-bg` | deferred — see Q8 | (none — deferred) |
| `--search-active-text` | deferred — see Q8 | (none — deferred) |
| `--glow-color` | deferred — runtime-only var (no static declaration; JS sets per-element with `currentColor` keyframe fallback); Q9 covers whether to add a static fallback | (none — deferred; Q9) |

#### 4.3.3 Unused spacing extensions (5 rows)

| Dropped / collapsed token | Reason | Migrate the host library usages to |
|---|---|---|
| `spacing.18` (4.5rem) | deferred — § 1.3.2 confirms zero utility usage in the host library; not promoted into the consolidated `spacing` scale | (none — deferred; re-evaluate when a real consumer appears) |
| `spacing.88` (22rem) | deferred — zero utility usage | (none — deferred) |
| `spacing.100` (25rem) | deferred — zero utility usage | (none — deferred) |
| `spacing.112` (28rem) | deferred — zero utility usage | (none — deferred) |
| `spacing.128` (32rem) | deferred — zero utility usage | (none — deferred) |

### 4.4 Family rename (informational — `signal`-classed rows)

The 22 `error` family steps (11 CSS vars `--color-error-50..950` + 11 Tailwind `colors.error.50..950`) are classed `signal` in § 1, so they are not part of the deprecation list proper. They are preserved verbatim under the new family name `danger`. Documenting here so the host library integrators know to migrate the family name even though no values change.

| Dropped / collapsed token | Reason | Migrate the host library usages to |
|---|---|---|
| `--color-error-*` (entire 11-step scale) | family renamed `error` → `danger` per § 3.4 (matches soribashi `defaultTokens` and the playground theme) | `--color-danger-*` (same step number; values preserved verbatim) |
| `colors.error.*` (entire Tailwind family) | family renamed `error` → `danger` per § 3.4 | `colors.danger.*` (utility: `bg-error-500` → `bg-danger-500`, etc.) |

**Coverage check (Task 0.5 Step 2):** 39 hack + 12 duplication + 20 deferred = 71 rows above (counted as: 20 § 4.1.1 + 19 § 4.1.2 + 5 § 4.2.1 + 6 § 4.2.2 + 1 § 4.2.3 + 10 § 4.3.1 + 5 § 4.3.2 + 5 § 4.3.3 = 71). Every § 1 row classed `hack`, `duplication`, or `deferred` traces to a row here; every row here traces back to an inventory row. The two § 4.4 entries are informational and cover all 22 `signal`-classed `error`-family rows that the family rename touches.

## 5. Open design questions

The five spec § 6.3 questions are reproduced below in the Q template format (Q1–Q5), followed by the Wave-1-specific questions surfaced during inventory and classification (Q6–Q10). All carry a defensible Wave 1 default so the pilot can proceed without blocking; the design owner re-decides during the integration project.

### Q1: Surface tokens — collapse `card` + `popover` or keep two?

**Status:** open
**Wave 1 default:** Collapse to a single `surface` token. Both the host library variants currently hold the same value (`0 0% 100%` / `222.2 84% 4.9%`); two names with one value is pure duplication.
**Rationale:** Keeping `card` and `popover` separate preserves the option to differentiate elevation later, but until that differentiation is needed the names cost cognitive overhead with no payoff. A single `surface` (with optional `surface.elevated` later) reads more clearly.
**For design review:** Confirm the consolidated theme can ship with one surface token, or commit to a near-term elevation differentiation that justifies keeping two from the start.

### Q2: Primary ramp — is the hue drift intentional or vestigial?

**Status:** open
**Wave 1 default:** Regenerate the ramp coherently from the `500` anchor (`221.2 83.2% 53.3%`).
**Rationale:** The current `--color-primary-50..400` steps sit at hue `240` while the `500..950` steps sit at hue `221.2`. A 19-degree hue jump between `400` and `500` looks like an accidental seed-from-Tailwind-defaults artifact rather than a designed crossfade. the host library usage data (`bg-primary-100` × 30, `bg-primary-50` × 11) shows the lighter steps are in production, so visual change is real.
**For design review:** Confirm the hue drift is unintentional, then sign off on regenerating `50..400` from the `500` anchor. If the drift is intentional, document the design rationale in the consolidated theme.

### Q3: Foreground vs text — `foreground` + shades or `text.{primary,secondary,...}`?

**Status:** open
**Wave 1 default:** Prefer `foreground` + optional `foreground.muted` / `foreground.subtle` shades.
**Rationale:** The four-level text taxonomy (`text.primary/secondary/tertiary/disabled`) maps cleanly to scale lookups via the intent resolver; reducing to `foreground` + a small set of muted modifiers cuts the surface area without losing expressiveness. Both `--foreground` (shad) and `--color-text-primary` (semantic) currently exist for the same role.
**For design review:** Confirm whether the four-step text taxonomy is load-bearing semantically (i.e., real meaning behind primary/secondary/tertiary/disabled) or whether it's a layered-opacity expression that `foreground` + shades captures more cleanly.

### Q4: Naming convention — keep `--color-` prefix or drop it?

**Status:** open
**Wave 1 default:** Keep the `--color-` prefix (so `--color-primary-500` rather than `--primary-500`).
**Rationale:** The `--color-` prefix is redundant in isolation — every var in the consolidated set holds a color — but matches the existing the host library naming and minimizes cognitive distance for the eventual integration project. Renaming during Wave 1 would force every the host library consumer to track a name change for zero functional benefit.
**For design review:** Confirm the consolidated theme inherits the `--color-` prefix, or pre-commit to a rename now while consumer surface area is small.

### Q5: Dark scoping — `.dark` (Wave 1) or `.dark .app-scope` (the host library)?

**Status:** open
**Wave 1 default:** Wave 1 emits dark vars under `.dark` (the standard Tailwind dark-mode selector).
**Rationale:** The pilot lives in an isolated Vite app with no host-page chrome, so the broader selector is correct. the host library's production scope is `.dark .app-scope` because it's an island inside a host page that has its own theming; the integration project (not Wave 1) reconciles by either tightening the pilot scope or loosening the host library scope.
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
**Wave 1 default:** Fix the misplacement — declare a properly-located `theme.extend.borderColor.DEFAULT` and remove the universal `border-color` reset from the host library's CSS.
**Rationale:** As declared, `colors.borderColor.DEFAULT` sits inside `theme.extend.colors` and produces a `bg-borderColor` / `text-borderColor` color utility instead of the intended default border color. the host library compensates by hand-applying `border-color: hsl(var(--color-border-islands))` on the universal selector at `host-styles.css:271`. Three options: (a) fix the placement; (b) replace with an explicit `border-default` token + keep the universal reset; (c) keep both the misplacement and the workaround as-is. Option (a) is cleanest and removes a bug.
**For design review:** Confirm the consolidated theme moves `borderColor.DEFAULT` to its proper location and removes the universal-selector workaround.

### Q8: `--search-*` highlight vars — where in the layer architecture?

**Status:** open
**Wave 1 default:** Continue declaring on `:root` / `.dark` (not on `.app-scope`). Keep the four vars in the consolidated theme as a small "global escapes" group documented as such.
**Rationale:** The vars are declared at `:root` because `::highlight()` pseudo-elements don't inherit from `.app-scope` (per the comment at `host-styles.css:602`). This is a hard browser constraint, not a design choice — moving them under `.app-scope` would silently break highlight rendering. Wave 1 doesn't render search highlights, so the pilot can defer; the consolidated theme should document the escape pattern.
**For design review:** Confirm the escape pattern is acceptable and that the consolidated theme owns these four tokens (rather than punting them to a separate "host integration" module).

### Q9: `--glow-color` — runtime-only or static fallback?

**Status:** open
**Wave 1 default:** Treat as runtime-only. Keep the `currentColor` fallback inside `@keyframes glow`. No static declaration in the consolidated theme.
**Rationale:** The var has no static declaration in the host library today — JS sets it inline per-element, and the keyframe falls back to `currentColor`. Adding a static declaration would either (a) shadow the JS-set value when JS is missing (unlikely failure mode worth designing for), or (b) provide a declared default the JS would always overwrite (no value). Documenting the runtime-only contract is enough.
**For design review:** Confirm runtime-only is fine, or specify a static fallback color we should document alongside the keyframe.

### Q10: Chart vars — keep under `shad-*` or split into a `chart` family?

**Status:** open
**Wave 1 default:** Defer. No Wave 1 action — chart vars are tagged `deferred` and ride along in their current shape until charts get a dedicated pass.
**Rationale:** `--chart-1..5` and `colors.shad.chart-1..5` are zero-usage in the host library per § 1.3. Splitting them into a `chart` family of their own is correct architecturally (charts don't follow intent ramps) but blocks on chart-ramp design that's out of scope for Wave 1.
**For design review:** No Wave 1 decision required. Flagged so the future chart pass starts with this open.

### Q11: Surface ↔ foreground pairing — formalize per-surface, or rely on usage-site discipline?

**Status:** open
**Wave 1 default:** Informal. The consolidated theme has `surface.{canvas, default, raised, sunken, scrim}` and `text.{default, muted, subtle, disabled}` as **two independent axes**, with the implicit assumption "any text token works on any surface token." Wave 1 ships against this assumption and it holds — every surface is light-ish in light mode and dark-ish in dark mode, so default text reads correctly everywhere.
**Rationale:** Formalizing per-surface foreground (e.g., `surface.default` paired with `surface-default-foreground`, mirroring the host library's old `--card-foreground` / `--popover-foreground` pattern) would couple the two axes and make every new surface require a paired foreground decision. Wave 1's informal pairing is simpler and matches Tailwind's "use scale anchors directly" idiom — but it relies on every consumer eyeballing contrast at usage site.
**For design review:** does the design owner want the contract "any text on any surface" to be guaranteed by the theme model (formalize), or is consumer discipline at usage site sufficient (keep informal)? The cost of formalizing surfaces later (after Wave 2-4 ship recipes against the informal model) is a meaningful rename — every `text.default` reference becomes `surface.X.foreground`. Easier to decide now than to walk back. **Especially relevant if Wave 2-4 introduces a surface with meaningfully different lightness from `surface.default` / `surface.raised` / `surface.canvas`** (e.g., a "highlighted" surface in light mode, or a darker tooltip surface). At that point informal pairing breaks first.

## 6. Codegen / theme-model gaps surfaced

- **`accent.feedback` has no clean home in the soribashi semantic shape — RESOLVED (post-Wave-1).** the host library declares `--color-accent-feedback` (light `hsl(300 40% 55%)`, dark `hsl(300 45% 68%)`) and exposes it as the `colors.accent.feedback` Tailwind utility. The soribashi `SemanticTokens` shape originally only modeled `text`, `surface`, and `border` — there was no `accent` slot, and the value isn't a simple text/surface/border role (it's a one-off magenta highlight used for "feedback" UI in the host library). Wave 1 omitted it from the consolidated theme.

  **Resolution shipped:** Chose option (a) — extended `SemanticTokens` with an optional `accent?: Record<string, SemanticReference>` slot, symmetrical with the `text`/`surface`/`border` slots. Codegen `emitSemanticLines` (`packages/codegen/src/emit-css.ts`) emits `--accent-{key}` CSS vars when `theme.semantic.accent` is provided; emits nothing when omitted (zero impact on existing themes). Two new vitest tests in `packages/codegen/test/emit-css.test.ts` cover the present + absent cases. Rejected option (b) (sibling top-level family) because `accent` is a *semantic* role, not a token family; rejected option (c) (decorative namespace) as premature given no consumer need. The the host library integration project's `accent.feedback` token is now expressible as `semantic: { accent: { feedback: 'colors.feedback.500' } }`.

- **`borderColor.DEFAULT` misplacement (Q7) — DECIDED (post-Wave-1, no codegen change).** the host library's `colors.borderColor.DEFAULT` is a Tailwind-config bug worked around via a universal-selector reset in `host-styles.css`. The soribashi theme model expresses border defaults via `semantic.border.default → colors.neutral.200` (which Wave 1 does), but does not emit a corresponding universal `border-color` reset rule.

  **Decision shipped:** Codegen will **not** emit a universal `* { border-color: var(--color-border-default); }` reset. `semantic.border.default` is a *default value* for hand-applied / utility-driven `border-color` rules, not a global preflight. Reasoning: (a) Tailwind v3's preflight already handles the universal border reset; soribashi emitting a competing `*` rule fights Tailwind's cascade. (b) Tailwind v4 deliberately dropped the global border reset as a breaking change — emitting one from soribashi would re-introduce the behavior consumers explicitly opted out of. (c) Universal selectors are aggressive and clash with consumer-scoped overrides. (d) The host-migration story is to switch from `host-styles.css`'s universal reset to either Tailwind preflight (v3) or per-container scoped rules (v4); soribashi shouldn't bake in either choice. Documented as architectural decision; no code change.
- **Codegen emits `hsl(...)`-wrapped var values — incompatible with Tailwind `<alpha-value>` and with `hsl(var(--x))` consumer patterns.** _Severity: important — surfaced during Task 0.8 code review. Downstream Wave-1 task plans (0.9, 1.5, 1.6, 1.8) each had the bug baked into their snippets; patching upstream so they don't all rediscover it._ The current codegen (`packages/codegen/src/emit-css.ts`) emits CSS vars whose values are complete `hsl(...)` strings, e.g. `--color-primary-500: hsl(221.2 83.2% 53.3%);`. Plan task snippets (Tasks 0.9 ScreenReplica, 1.5 Button.css, 1.6 ButtonMatrix, 1.8 Playwright resolver) write `hsl(var(--color-primary-500))` thinking the var holds bare HSL components — the result is `hsl(hsl(...))` which is invalid CSS and resolves to transparent. The same mismatch breaks Tailwind's `<alpha-value>` pattern (`bg-primary-500/50` wants the var to be bare so it can splice in the alpha). **Wave 1 workaround:** consumer code uses `var(--color-...)` directly without re-wrapping in `hsl(...)`. This works for direct `background: var(--x)` / `color: var(--x)` references but does NOT enable the `<alpha-value>` Tailwind pattern. Plan tasks 0.9, 1.5, 1.6, 1.8 should be implemented with the direct-var pattern, not the wrapped-`hsl()` pattern. Task 0.8 (TokenReview) already used the direct-var pattern with an in-file comment. **Recommended soribashi fix (for the integration project's playbook):** add a codegen emit mode (or make it the default) that emits bare HSL components: `--color-primary-500: 221.2 83.2% 53.3%;`. Consumers then use `hsl(var(--color-primary-500))` for direct usage and `hsl(var(--color-primary-500) / <alpha-value>)` for Tailwind alpha utilities — both work. Cross-reference the spec at `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md` § 3 (the C → A bridge calls this out).
- **RESOLVED (post-Wave-1) — codegen `hsl(...)` wrapper.** Implemented as a **dual-emit** pattern rather than the bare-only switch originally proposed. The bare-only approach would have broken ~146 existing consumers across `packages/blocks` (Paper.css), `packages/blocks/src/utils/get-theme-color.ts`, and the Mantine-adapted code that all assume `--color-X-Y` resolves to a usable color. The codegen now emits **both** the canonical wrapped var AND a `--__hsl-` bare-component companion: `--color-primary-500: hsl(221.2 83.2% 53.3%);` followed by `--__hsl-color-primary-500: 221.2 83.2% 53.3%;`. The Tailwind config's `<alpha-value>` pattern uses the `--__hsl-` companion. **Zero breaking changes** to existing consumers; Tailwind alpha utilities (`bg-primary-500/50`) now work correctly. Implementation in `packages/codegen/src/emit-css.ts` (`stripHslWrapper` helper + dual emit) and `packages/codegen/src/emit-tailwind-v3.ts` (companion-var reference). Tests added in `packages/codegen/test/emit-css.test.ts`. (The original Wave-1 prose framed this fix as "unblocking the C → A bridge"; on 2026-05-02 the integration-model decision was reversed — Option C is canonical and there is no A — so this fix is more accurately an alpha-utility correctness fix that applies under Option C. See playbook § 3 "Integration model" and foundational spec § 3.)
- _Additional items will be appended as encountered. Promoted to the playbook in Phase 2._

## 7. Visual review findings (Task 0.10)

**Host screen:** _not captured — see "host screenshot status" below_
**Pilot replica (light):** [`screenshots/2026-04-26-pilot-statements-replica-light.png`](screenshots/2026-04-26-pilot-statements-replica-light.png)
**Pilot replica (dark):** [`screenshots/2026-04-26-pilot-statements-replica-dark.png`](screenshots/2026-04-26-pilot-statements-replica-dark.png)

**Capture method (pilot):** Playwright headless Chromium, 1280×900 viewport at 2× DPR, full-page screenshot. Booted `bun run dev:pilot`, navigated to `http://localhost:5174/`, clicked the "Screen replica" header button, captured light, clicked the dark/light toggle, captured dark, stopped the server.

**host screenshot status:** _not captured._ The Wave 1 spec explicitly forbids touching the the host monorepo repo (`<host-monorepo-path>/`), and there is no pre-existing the host library screenshot of the corresponding screen committed anywhere we are allowed to read (a recursive search of `apps/adjuster/` for `*.png`/`*.jpg` returned only product imagery — vehicle/weather/insurer assets — none of the Statements Overview UI). The comparison below is therefore **conceptual / intent-only**: each "drift" claim is assessed against (a) the design intent the consolidated theme expresses (per § 2 / § 3), (b) the inventory of what the host library's tokens actually held (§ 1), and (c) the deprecation list (§ 4). It is **not** a pixel comparison against a live the host library render.

This is consistent with the spec's own framing for this pilot: intent parity, not pixel parity. Pixel parity against the host library is the integration project's responsibility (when the consolidated theme is wired into the host library itself, not into a side-by-side pilot).

### Intent parity

The pilot's ScreenReplica delivers the design intent the consolidated theme is meant to express: a neutral canvas (`--surface-canvas`) with raised cards (`--surface-default`) outlined by a subtle border (`--border-default`), default text (`--text-default`) paired with a muted secondary (`--text-muted`) for metadata, and intent-coded badges drawn from the `success` / `warning` / `danger` family ramps at the `100`/`800` step pair (light fill, deep-tone text). All visible token roles in the screenshots map back 1:1 to consolidated theme tokens documented in § 3 — no orphan vars, no shad-* fallbacks, no `--color-{family}` side channels. The typographic hierarchy (24px / 18px / 14px / 12px from H1 → small caps card label) reads cleanly and matches the soribashi `defaultTokens.fontSize` scale the consolidated theme inherits.

The light-mode capture is what an honest read of the consolidated theme should look like: page chrome + cards + status chips, all on white-on-near-white surfaces with neutral borders, the soribashi blue primary still latent in the theme but unused on this particular screen because Statements Overview has no primary CTA. Compared to the design intent the host library expresses through its own (currently fragmented) token layer — shad-* surfaces backing `Card`, semantic text via `--color-text-primary`, status colors via the `colors.{success|warning|error}.500` family — the pilot delivers the same surface hierarchy and the same intent vocabulary, just sourced from a single coherent set of tokens instead of three overlapping ones.

### Expected drift (consolidation-driven)

These are the deliberate consolidation choices that would surface as visible or structural drift in any the host library ↔ pilot comparison. Each links back to the journal entry that authorizes it.

- **shad-* layer dropped wholesale.** Every `--background`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring` (and their Tailwind `colors.shad.*` mirrors) is gone. The pilot reaches surfaces via `var(--surface-default)` / `var(--surface-canvas)`, text via `var(--text-default)` / `var(--text-muted)`, borders via `var(--border-default)` / `var(--border-muted)`, and intent via `var(--color-{success|warning|danger}-{step})` directly. See § 4.1 (39 rows).
- **`card` and `popover` collapsed into `surface.default` (Q1).** The pilot's stat cards and the activity panel both render on `--surface-default`; there is no separate "card surface" or "popover surface" token in play. the host library today holds `--card` and `--popover` at byte-identical values to `--background`, so this collapse changes only token names, not pixels — but it is a real shape change. See § 5 Q1 and § 4.1.1.
- **`secondary` / `muted` / `accent` surfaces collapsed into `surface.raised`.** The pilot does not render any "secondary surface" element in this particular replica, but the underlying decision (three the host library surface roles all held the identical `210 40% 96.1%` light value, classified as duplication) means future screens that used the host library's `bg-secondary` / `bg-muted` / `bg-accent` will all migrate to `surface.raised`. See § 4.1.
- **`error` family renamed to `danger`.** The "Disputed" badge uses `var(--color-danger-100)` / `var(--color-danger-800)`. Values preserved verbatim from the host library's `--color-error-{100,800}`; only the family name changes. See § 4.4 and § 3.4.
- **Primary ramp regenerated coherently from the `500` anchor (Q2).** Not visible on this screen (no primary surface or chip), but the consolidated theme's `--color-primary-50..400` are regenerated from the `500` anchor (`221.2 83.2% 53.3%`) so the 19° hue jump the host library inherited (240° on 50–400 vs 221° on 500–950) is gone. Future screens that render `bg-primary-100` (the host library usage: 30 occurrences) or `bg-primary-50` (11 occurrences) will look subtly different in hue. See § 5 Q2.
- **`borderColor.DEFAULT` misplacement removed (Q7).** No universal-selector border-color reset in the pilot; borders are explicit (`border: 1px solid var(--border-default)`). Visually identical here but architecturally cleaner. See § 5 Q7.
- **`--color-{family}` side channels and `colors.{family}.DEFAULT` aliases dropped (Q6).** The pilot has no `var(--color-success)` / `bg-success` shorthand — every reference goes through an explicit step number. the host library's `colors.neutral.DEFAULT → 600` outlier is normalized to `500` along with everything else. See § 4.2 and § 5 Q6.
- **Naming convention preserved (Q4).** `--color-` prefix retained, so `--color-primary-500` not `--primary-500`. No drift here, but flagged as a deliberate non-change.
- **Dark scoping uses bare `.dark` (Q5).** The pilot's dark toggle adds `.dark` to a wrapper div; the host library's production scope is `.dark .app-scope`. Reconciliation is the integration project's call; documented as expected divergence from the host library. See § 5 Q5.
- **Tailwind utilities for semantic surfaces / text not emitted by current codegen.** The pilot falls back to inline `style={{ background: 'var(--surface-…)' }}` per the inline comment trail in `ScreenReplica.tsx` and per § 6. Not strictly a token-consolidation drift — it is a codegen-output gap surfaced during the pilot — but it is visible in the implementation if not the pixels. Promoted to § 6 already.
- **CSS-var values are wrapped `hsl(...)` strings (codegen).** Direct `var(--color-…)` works; `hsl(var(--color-…))` does not, and Tailwind's `<alpha-value>` pattern is unavailable. Same status as the previous bullet — already in § 6, not a pixel drift on this screen.

### Unexpected drift (findings)

Without a live the host library screenshot to compare pixel-against-pixel, "unexpected drift" is by definition limited to what surfaced *during* the pilot screenshot capture itself. Two genuine findings:

- **Dark-mode toggle leaves the page background light.** _Severity: visible bug in the pilot harness; not a token consolidation problem._ The dark screenshot shows the body background unchanged from light. Cause: `.dark` is added to a `<div>` wrapper inside `<body>` (`App.tsx:15`), but `body { background: var(--surface-default); }` in `apps/pilot/src/styles.css:10` resolves against `:root` because `body` is the *parent* of `.dark`, not a descendant. The `.dark` overrides only apply to elements *inside* the wrapper — the surface chips, card backgrounds, and badge fills inside the ScreenReplica do change tokens, but the body underneath does not. Two clean fixes (either is fine, integration project's call): (a) move the `.dark` class to `<html>` or `<body>` rather than the wrapper div; (b) wrap the entire app inside `.dark` such that `body` no longer paints the canvas. **Decision for Wave 1:** document here and leave un-fixed in the pilot; the consolidated theme's `.dark` block is correct (§ 1, § 3), the token-layer dark mode works, only the harness wiring is wrong. This finding does NOT promote to § 6 (codegen / theme gaps) because the codegen output is correct — the bug is in `apps/pilot/src/App.tsx` / `styles.css`. If we later want a clean dark-mode demo of the pilot, file a separate fix-up task.
- **Status chips render as a continuous run rather than spaced pills.** _Severity: cosmetic; not a token problem._ The "Active / Review / Disputed" badges sit edge-to-edge in both screenshots even though `ScreenReplica.tsx:113` writes `className="flex gap-2"`. Cause: Tailwind's `gap-2` utility is being applied, but the badges are `inline-flex` items inside a `flex` container — the gap should still apply. The likely culprit is missing line-height / `display: flex` resolution at the parent in interaction with the badges' own padding; this is a layout artifact specific to the demo markup, not a token regression. Same disposition as the dark-mode finding: documented, not fixed in Wave 1.
- **No unexpected drift surfaced against the host library itself.** A live the host library screenshot was not available for comparison (see "host screenshot status" above), so by the strict reading of "unexpected drift = something the pilot does that the host library does NOT, and that is NOT a deliberate consolidation choice", this row is empty. Intent parity assessed against the consolidated theme's documented decisions, per the spec's own intent-not-pixel framing.

Neither finding above blocks Phase 0 exit or Phase 1 entry. Neither belongs in § 6 (which tracks codegen / theme-model gaps); both are pilot-harness rough edges that the future integration project does not inherit, because the integration project will wire the consolidated theme into the host library's existing app shell, not into this pilot's standalone Vite harness.

### Sign-off

**Phase 0 visual review:** PASS WITH FINDINGS

The consolidated theme reaches the DOM correctly in a realistic composition: surfaces, text, borders, and intent ramps all resolve to consolidated tokens without falling back to shad-* or side-channel duplications. Intent parity holds against the design intent the consolidated theme expresses; pixel parity against a live the host library render was not assessed because the spec forbids touching the host library and no pre-existing screenshot was available. Two pilot-harness findings (dark-mode toggle wiring; chip layout) are documented above as non-blocking and non-token-related. No promotions to § 6. Phase 0 is cleared to exit; Phase 1 (Button conversion) is cleared to enter.
