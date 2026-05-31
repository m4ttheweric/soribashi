import { createTheme, defineVocabulary, registerTheme } from '@soribashi/core';
import { buttonTheme } from '../recipes/Button/Button.tsx';
import { tooltipTheme } from '../recipes/Tooltip/Tooltip.tsx';
import { tabsTheme } from '../recipes/Tabs/Tabs.tsx';

/**
 * Wave 1 consolidated theme for the core-radix pilot.
 *
 * Source of truth: docs/superpowers/pilots/2026-04-26-token-consolidation.md
 * Spec: docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md
 *
 * Consolidation choices vs CVI's current tokens (see journal § 3 for full
 * rationale and § 5 for the open design questions that drove ambiguous calls):
 *
 * - shad-* layer DROPPED in full (Q1, classification § 2.2). The Figma scale
 *   plus semantic surface tokens carry every signal the shad-* layer carried;
 *   shad-* utility usage is 14 hits across 6 files (mostly bg-shad-background
 *   / bg-shad-foreground), which the new `surface` + `text` semantics absorb.
 * - The primary ramp's `50..400` steps are REGENERATED from the `500` anchor
 *   (Q2). CVI's lighter steps drift to hue 240 with 100% saturation — a
 *   19-degree jump from the `500..950` anchor at hue 221. Wave 1 default
 *   treats that drift as accidental and rebuilds the lighter steps at the
 *   anchor's hue/sat with CVI's existing lightness ramp preserved.
 * - DEFAULT/side-channel CSS vars (`--color-primary`, `--color-success`, ...,
 *   `--color-warning`, `--color-error`, `--color-info`) and their Tailwind
 *   `colors.*.DEFAULT` aliases collapse into the `500` step (Q6). Neutral's
 *   outlier (`DEFAULT → 600`) is normalized to `500`.
 * - `error` family RENAMED to `danger` to match soribashi convention. The
 *   shape, anchors, and ramp are CVI's verbatim error scale.
 * - Surface tokens collapse `card` + `popover` into a single `surface`
 *   semantic group (Q1). Both held identical values in CVI; two names with
 *   one value is duplication.
 * - Text semantics use `default`/`muted`/`subtle`/`disabled` referencing
 *   neutral scale anchors rather than the CVI `text.{primary,secondary,
 *   tertiary,disabled}` direct vars (Q3). The four-step taxonomy is
 *   preserved in shape via the four named slots; the values now lookup
 *   through the intent resolver.
 * - `boxShadow.popover` collapsed into `shadow.lg` (byte-identical).
 * - Chart colors, `--cvi-search-*` highlight vars, `--glow-color`, and the
 *   five unused `spacing.*` extensions are DEFERRED. Tracked in journal § 5
 *   (Q8, Q9, Q10) and § 6 as appropriate.
 *
 * Open design questions live in the journal § 5 (Q1-Q10).
 */
// The theme definition WITHOUT per-component entries. `baseTheme` (below) is
// built from this and carries the global vocabulary type that `builders.ts`
// threads from. Keeping the builders' threading source component-free is what
// avoids a TYPE cycle: the full `theme` references the recipes (via .extend()),
// the recipes reference the builders, and the builders must NOT reference a type
// that loops back through the recipes — so they thread from `baseTheme`, not `theme`.
const definition = {
  name: 'core-radix-pilot',
  tokens: {
    colors: {
      primary: {
        // 50..400 REGENERATED from the 500 anchor (Q2 — hue drift treated
        // as accidental). Lightnesses preserved from CVI; hue + saturation
        // shifted to the anchor's hue 221 / sat 83%.
        '50': 'hsl(221 83% 97%)', // was hsl(240 100% 98%)
        '100': 'hsl(221 83% 93%)', // was hsl(240 100% 96%)
        '200': 'hsl(221 83% 86%)', // was hsl(240 100% 92%)
        '300': 'hsl(221 83% 75%)', // was hsl(240 100% 85%)
        '400': 'hsl(221 83% 65%)', // was hsl(240 100% 75%)
        '500': 'hsl(221.2 83.2% 53.3%)', // anchor preserved verbatim from CVI
        '600': 'hsl(221.2 83.2% 45%)',
        '700': 'hsl(221.2 83.2% 38%)',
        '800': 'hsl(221.2 83.2% 30%)',
        '900': 'hsl(221.2 83.2% 22%)',
        '950': 'hsl(221.2 83.2% 15%)',
        // foreground = text color when this family is the background.
        // Convention from soribashi defaults / playground theme; CVI does
        // not declare per-family foreground tokens (verified § 1.2.3-1.2.8).
        // Required so downstream intent resolvers can derive
        // IntentResolverResult.color — undefined otherwise.
        foreground: 'hsl(0 0% 100%)',
      },
      neutral: {
        // CVI ramp preserved verbatim. Adds `0` for surface.default (white)
        // — soribashi convention; defaultTokens uses `0` for the same role.
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
        '950': 'hsl(222 84% 5%)',
        foreground: 'hsl(0 0% 100%)',
      },
      success: {
        // CVI ramp preserved verbatim — anchors and steps already coherent.
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
        foreground: 'hsl(0 0% 100%)',
      },
      warning: {
        // CVI ramp preserved verbatim. Note: CVI's `500` anchor sits at
        // hue 38 while `50..400` and `600..950` sit at hues 22..49 — the
        // ramp is intentionally warm-amber on the upper end and cooler-
        // gold on the lighter end. Not regenerated.
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
        // black on warning yellow for legibility — matches playground.
        foreground: 'hsl(0 0% 0%)',
      },
      danger: {
        // RENAMED from CVI's `error` family per soribashi convention.
        // Ramp preserved verbatim.
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
        foreground: 'hsl(0 0% 100%)',
      },
      info: {
        // CVI ramp preserved verbatim. Note: like warning, the `500` anchor
        // (hue 199) shifts from the `50..400` cyan band (hues 183..188) and
        // sits cooler than the `600..950` blues (hues 200..204). Treated as
        // intentional crossfade — not regenerated. (Compare to primary,
        // where the 240 → 221 jump was a clear seed-from-defaults artifact.)
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
        foreground: 'hsl(0 0% 100%)',
      },
    },
    // CVI's borderRadius extend, preserved. Note: shad's `--radius` (0.5rem)
    // is byte-identical to `radius.md` here — that duplication is captured
    // in the deprecation list (shad-* layer fully dropped).
    radius: {
      sm: '0.25rem',
      md: '0.375rem', // CVI's borderRadius.DEFAULT
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem', // CVI's borderRadius.2xl, renamed for ramp consistency
      full: '9999px', // not in CVI but standard for pill shapes — needed for some Button variants
    },
    // soribashi default spacing scale. CVI's five custom spacing extensions
    // (18, 88, 100, 112, 128) are DEFERRED — § 1.3.2 confirms zero utility
    // hits in CVI source.
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
      '2xl': '2rem',
      '3xl': '3rem',
    },
    // CVI's fontSize ramp. Note CVI uses `base`; soribashi convention uses
    // `md` for the body slot. Keeping `base` here to minimize cognitive
    // distance for the integration project (see Q4 — same naming-stability
    // logic applies).
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    // Unitless multipliers, matching the soribashi default-tokens convention
    // (`packages/theme/src/tokens/default-tokens.ts:127`). CVI declares
    // fontSize line-heights as paired tuples in tailwind (e.g.
    // `['0.75rem', '1rem']`); each multiplier here is the CVI absolute
    // line-height divided by its paired fontSize, preserving the visual
    // metric while matching the standard CSS unitless-multiplier convention.
    // Computations:
    //   xs:   16/12 = 1.333
    //   sm:   20/14 = 1.429
    //   base: 24/16 = 1.5
    //   lg:   28/18 = 1.556
    //   xl:   28/20 = 1.4
    //   2xl:  32/24 = 1.333
    //   3xl:  36/30 = 1.2
    lineHeight: {
      xs: '1.333',
      sm: '1.429',
      base: '1.5',
      lg: '1.556',
      xl: '1.4',
      '2xl': '1.333',
      '3xl': '1.2',
    },
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
    },
    // CVI's boxShadow extend. `boxShadow.popover` collapsed into `lg`
    // (byte-identical — classification § 2.1).
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
  },
  // Dark overrides per CVI's `.dark .claim-view-islands` block. Per Q5,
  // emitted under `.dark` in Wave 1 (the pilot is a standalone Vite app, not
  // an island). Only colors carry dark deltas — radius/spacing/fontSize/etc.
  // are mode-agnostic in CVI.
  //
  // CVI's `accent.feedback` direct-semantic var has no clean home in the
  // soribashi semantic shape (Q-style logged in journal § 6 as a gap); it is
  // not declared here in Wave 1.
  dark: {
    colors: {
      primary: {
        // 50..400 REGENERATED dark counterparts to mirror the regenerated
        // light ramp (Q2). CVI's dark values held the same hue-241→217
        // drift as the light side; this rebuilds the lighter dark steps at
        // the anchor hue (217 in dark, since CVI's dark anchor itself sits
        // at 217.2). Lightnesses preserved from CVI's dark column.
        '50': 'hsl(217 91% 15%)',
        '100': 'hsl(217 91% 20%)',
        '200': 'hsl(217 91% 25%)',
        '300': 'hsl(217 91% 30%)',
        '400': 'hsl(217 91% 40%)',
        '500': 'hsl(217.2 91.2% 59.8%)', // CVI's dark `--color-primary-500`
        '600': 'hsl(217 91% 65%)',
        '700': 'hsl(217 91% 70%)',
        '800': 'hsl(217 91% 75%)',
        '900': 'hsl(217 91% 80%)',
        '950': 'hsl(217 91% 85%)',
      },
      neutral: {
        // CVI inverts the neutral scale in dark (`50` ↔ `900` swap pattern).
        // Lower steps (0-300, the surface/border tones) had 25-84% saturation
        // which read as heavy navy on the page. Dialled down to 6-10%
        // saturation — subtle cool tint, reads as dark gray rather than blue.
        // Hue shifted slightly to 220 for consistency. Lightness preserved.
        '0': 'hsl(220 6% 9%)',     // was hsl(222 84% 5%) — page bg / surface.default
        '50': 'hsl(220 6% 13%)',   // was hsl(222 47% 11%) — surface.sunken in dark
        '100': 'hsl(220 5% 18%)',  // was hsl(217 33% 17%) — surface.raised (default-variant tooltip)
        '200': 'hsl(220 5% 25%)',  // was hsl(215 25% 27%) — borders
        '300': 'hsl(220 5% 35%)',  // was hsl(215 19% 35%)
        '400': 'hsl(215 16% 47%)', // unchanged — mid-tone, sat already moderate
        '500': 'hsl(215 20% 65%)',
        '600': 'hsl(213 27% 84%)',
        '700': 'hsl(214 32% 91%)',
        '800': 'hsl(210 40% 96%)',
        '900': 'hsl(210 40% 98%)',
        '950': 'hsl(0 0% 100%)',
      },
      success: {
        '50': 'hsl(145 80% 10%)',
        '100': 'hsl(144 61% 20%)',
        '200': 'hsl(143 62% 20%)',
        '300': 'hsl(142 64% 24%)',
        '400': 'hsl(142 72% 29%)',
        '500': 'hsl(142 71% 45%)',
        '600': 'hsl(142 77% 73%)',
        '700': 'hsl(141 79% 85%)',
        '800': 'hsl(141 84% 93%)',
        '900': 'hsl(138 76% 97%)',
        '950': 'hsl(138 100% 99%)',
      },
      warning: {
        '50': 'hsl(26 83% 14%)',
        '100': 'hsl(22 78% 26%)',
        '200': 'hsl(23 83% 31%)',
        '300': 'hsl(26 90% 37%)',
        '400': 'hsl(32 95% 44%)',
        '500': 'hsl(49 98% 48%)',
        '600': 'hsl(49 97% 63%)',
        '700': 'hsl(48 97% 77%)',
        '800': 'hsl(48 96% 89%)',
        '900': 'hsl(48 100% 96%)',
        '950': 'hsl(48 100% 98%)',
      },
      danger: {
        // Renamed from CVI's `error` family in dark too. Ramp verbatim.
        '50': 'hsl(0 75% 15%)',
        '100': 'hsl(0 63% 31%)',
        '200': 'hsl(0 70% 35%)',
        '300': 'hsl(0 74% 42%)',
        '400': 'hsl(0 72% 51%)',
        '500': 'hsl(0 84% 60%)',
        '600': 'hsl(0 91% 71%)',
        '700': 'hsl(0 94% 82%)',
        '800': 'hsl(0 97% 85%)',
        '900': 'hsl(0 96% 89%)',
        '950': 'hsl(0 93% 94%)',
      },
      info: {
        '50': 'hsl(204 80% 16%)',
        '100': 'hsl(202 80% 24%)',
        '200': 'hsl(201 90% 27%)',
        '300': 'hsl(201 96% 32%)',
        '400': 'hsl(200 98% 39%)',
        '500': 'hsl(188 86% 53%)',
        '600': 'hsl(187 92% 69%)',
        '700': 'hsl(186 94% 81%)',
        '800': 'hsl(185 96% 90%)',
        '900': 'hsl(183 100% 96%)',
        '950': 'hsl(183 100% 98%)',
      },
    },
  },
  // Option B: variant is per-recipe, declared in `components` below — NOT here.
  // The global vocabulary holds only the genuinely-shared axes.
  vocabulary: {
    size: defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl']),
    intent: defineVocabulary(['primary', 'neutral', 'success', 'warning', 'danger', 'info']),
  },
  semanticTokens: {
    text: {
      // Per Q3 Wave 1 default: `default`/`muted`/`subtle`/`disabled` lookups
      // against the neutral ramp. Preserves CVI's four-step text taxonomy
      // shape but routes through scale anchors instead of dedicated vars.
      default: 'colors.neutral.900',
      muted: 'colors.neutral.700',
      subtle: 'colors.neutral.500',
      disabled: 'colors.neutral.400',
    },
    surface: {
      // Per Q1 Wave 1 default: card + popover collapsed into `default`.
      canvas: 'colors.neutral.50',
      default: 'colors.neutral.0',
      raised: 'colors.neutral.100',
      sunken: 'colors.neutral.50',
      // Backdrop scrim for modals/dialogs. Renamed from `overlay` to `scrim`
      // to reserve `overlay`/`floating` naming for Wave 2's floating-UI
      // surface (tooltips, dropdown menus, popover content) — distinct from
      // "scrim behind a modal." See journal § 5 Q11.
      scrim: 'colors.neutral.900',
      // Wave 2: formalized foreground pairing for floating surfaces
      // (tooltips, dropdowns, popovers). Object form enables codegen to emit
      // both --surface-floating and --surface-floating-foreground so
      // variants like Tooltip's `inverted` can guarantee contrast.
      floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.0' },
    },
    border: {
      // CVI's `--color-border-islands` (light hsl(214 32% 91%)) maps cleanly
      // to `colors.neutral.200`. Strong/muted are derived from the neutral
      // ramp, matching playground/default conventions.
      default: 'colors.neutral.200',
      strong: 'colors.neutral.400',
      muted: 'colors.neutral.100',
    },
  },
} as const;

/**
 * Component-free theme. `builders.ts` threads its builder types from
 * `typeof baseTheme` (a TYPE-only import), which carries the global vocabulary
 * (size/intent) without referencing the recipes — breaking the type cycle that
 * `typeof theme` would create (theme → recipes → builders → theme).
 */
export const baseTheme = createTheme(definition);

/**
 * The full theme used at runtime. Adds the per-recipe vocabulary entries via
 * `Recipe.extend(...)` — declared canonically now that builders.ts no longer
 * imports the theme value (no module cycle). Each recipe derives its variant
 * vocab from the same const that types its `variant` prop.
 */
export const theme = createTheme({
  ...definition,
  components: [buttonTheme, tooltipTheme, tabsTheme],
});

// Populate the runtime vocabulary registry (global + per-component) so the
// dev-only Zod validation resolves. Done here — the single place the fully
// composed theme exists — so every consumer (the app via SoribashiProvider, and
// tests that import `theme`) gets registration without a separate call.
registerTheme(theme);
