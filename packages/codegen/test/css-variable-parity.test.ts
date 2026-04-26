/**
 * CSS Variable Parity Test
 *
 * Validates that soribashi's emitCss() covers every Mantine CSS variable that
 * has an equivalent soribashi var per the substitution table in
 * docs/superpowers/audits/2026-04-25-css-variable-parity.md.
 *
 * Validated against Mantine commit 63dafbbf5f0135eb36455b7add4c0ddcd0f3240a.
 *
 * For each canonical mapping the test asserts:
 *   - The soribashi variable IS present in emitCss() output, OR
 *   - The mantine variable is in the INTENTIONAL_GAP allowlist.
 *
 * A new gap added to emit-css.ts without a matching allowlist entry will fail
 * this test, alerting future drift.
 */

import { describe, it, expect } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { emitCss } from '../src/emit-css.ts';

// ---------------------------------------------------------------------------
// Canonical mapping data
//
// Each entry describes one Mantine CSS variable and its soribashi equivalent.
//
// status:
//   'mapped'           - soribashi emits an equivalent var; parity test asserts presence
//   'INTENTIONAL_GAP'  - soribashi deliberately does not emit this; ledger entry exists
// ---------------------------------------------------------------------------

export interface ParityEntry {
  mantineVar: string;
  soribashiVar: string | null;
  status: 'mapped' | 'INTENTIONAL_GAP';
  notes: string;
}

// Colors families in the Mantine default palette
const MANTINE_COLOR_FAMILIES = [
  'blue', 'cyan', 'dark', 'grape', 'gray', 'green',
  'indigo', 'lime', 'orange', 'pink', 'red', 'teal',
  'violet', 'yellow',
] as const;

const MANTINE_SIZE_KEYS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
const HEADING_PROPS = ['font-size', 'font-weight', 'line-height'] as const;
const COLOR_VARIANT_SUFFIXES = [
  'filled', 'filled-hover', 'light', 'light-hover', 'light-color',
  'outline', 'outline-hover', 'text',
] as const;

function buildCanonicalList(): ParityEntry[] {
  const entries: ParityEntry[] = [];

  // ---- Always-emitted (variables section) -----------------------------------

  // z-index scale
  // Mantine hardcodes 5 z-index vars; soribashi has tokens.zIndex but emit-css.ts
  // does not emit it. These are INTENTIONAL_GAP because z-index values are
  // application-concern tokens that soribashi defers to the consumer.
  for (const [name] of [
    ['app', '100'], ['modal', '200'], ['popover', '300'], ['overlay', '400'], ['max', '9999'],
  ] as const) {
    entries.push({
      mantineVar: `--mantine-z-index-${name}`,
      soribashiVar: `--z-index-${name}`,
      status: 'INTENTIONAL_GAP',
      notes: 'Mantine hardcodes 5 z-index layers; soribashi supports tokens.zIndex but does not emit --z-index-* vars by default. Application-concern tokens deferred to consumer.',
    });
  }

  // scale
  entries.push({
    mantineVar: '--mantine-scale',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Mantine multiplies all rem values by a runtime --mantine-scale. Soribashi emits raw token values and does not need a scale multiplier; sizing is fixed at build time.',
  });

  // cursor-type
  entries.push({
    mantineVar: '--mantine-cursor-type',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Mantine exposes cursor-type as a CSS var for its interactive components. Soribashi sets cursor via Tailwind utility classes in component styles, not via a CSS variable.',
  });

  // font smoothing
  entries.push({
    mantineVar: '--mantine-webkit-font-smoothing',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Font smoothing is a global body concern, not a token. Soribashi leaves this to the consumer\'s CSS reset / Tailwind preflight.',
  });
  entries.push({
    mantineVar: '--mantine-moz-font-smoothing',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Same as webkit-font-smoothing.',
  });

  // white / black
  entries.push({
    mantineVar: '--mantine-color-white',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Mantine reserves --mantine-color-white / -black as escape-hatch absolute values. Soribashi uses tokens.colors.neutral.0 / .950 for equivalent semantics and does not need a separate white/black var.',
  });
  entries.push({
    mantineVar: '--mantine-color-black',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'See --mantine-color-white.',
  });

  // bare line-height (md alias)
  entries.push({
    mantineVar: '--mantine-line-height',
    soribashiVar: '--line-height-md',
    status: 'mapped',
    notes: 'Mantine emits --mantine-line-height = lineHeights.md as a convenience alias. Soribashi emits --line-height-md from tokens.lineHeight.md. Components reference the keyed var directly.',
  });

  // font-family vars
  entries.push({
    mantineVar: '--mantine-font-family',
    soribashiVar: '--font-family-sans',
    status: 'mapped',
    notes: 'Mantine --mantine-font-family → soribashi --font-family-sans (tokens.fontFamily.sans).',
  });
  entries.push({
    mantineVar: '--mantine-font-family-monospace',
    soribashiVar: '--font-family-mono',
    status: 'mapped',
    notes: 'Mantine --mantine-font-family-monospace → soribashi --font-family-mono (tokens.fontFamily.mono).',
  });
  entries.push({
    mantineVar: '--mantine-font-family-headings',
    soribashiVar: '--font-family-heading',
    status: 'mapped',
    notes: 'Mantine --mantine-font-family-headings → soribashi --font-family-heading (tokens.fontFamily.heading).',
  });

  // global heading font-weight
  entries.push({
    mantineVar: '--mantine-heading-font-weight',
    soribashiVar: '--heading-h1-font-weight',
    status: 'mapped',
    notes: 'Mantine emits one global --mantine-heading-font-weight. Soribashi emits per-heading font-weight vars (--heading-h1-font-weight through --heading-h6-font-weight). The h1 var serves the same role for test assertion; components reference the per-order var.',
  });

  // heading text-wrap
  entries.push({
    mantineVar: '--mantine-heading-text-wrap',
    soribashiVar: '--heading-text-wrap',
    status: 'mapped',
    notes: 'Direct 1:1 mapping.',
  });

  // radius-default
  entries.push({
    mantineVar: '--mantine-radius-default',
    soribashiVar: '--radius-md',
    status: 'mapped',
    notes: 'Mantine resolves defaultRadius (defaults to "md") into --mantine-radius-default. Soribashi emits --radius-md directly; components that need a "default" radius reference --radius-md. No extra alias needed.',
  });

  // primary color pointer vars
  entries.push({
    mantineVar: '--mantine-primary-color-filled',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Mantine emits --mantine-primary-color-filled as a pointer to --mantine-color-{primary}-filled. Soribashi\'s intent resolver computes filled/outline/etc. at render time; no CSS-layer intent pointer vars are emitted.',
  });
  entries.push({
    mantineVar: '--mantine-primary-color-filled-hover',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'See --mantine-primary-color-filled.',
  });
  entries.push({
    mantineVar: '--mantine-primary-color-light',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'See --mantine-primary-color-filled.',
  });
  entries.push({
    mantineVar: '--mantine-primary-color-light-hover',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'See --mantine-primary-color-filled.',
  });
  entries.push({
    mantineVar: '--mantine-primary-color-light-color',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'See --mantine-primary-color-filled.',
  });

  // breakpoints
  for (const key of MANTINE_SIZE_KEYS) {
    entries.push({
      mantineVar: `--mantine-breakpoint-${key}`,
      soribashiVar: `--breakpoint-${key}`,
      status: 'mapped',
      notes: `tokens.breakpoint.${key} → --breakpoint-${key}`,
    });
  }

  // spacing
  for (const key of MANTINE_SIZE_KEYS) {
    entries.push({
      mantineVar: `--mantine-spacing-${key}`,
      soribashiVar: `--spacing-${key}`,
      status: 'mapped',
      notes: `tokens.spacing.${key} → --spacing-${key}`,
    });
  }

  // font-size
  for (const key of MANTINE_SIZE_KEYS) {
    entries.push({
      mantineVar: `--mantine-font-size-${key}`,
      soribashiVar: `--font-size-${key}`,
      status: 'mapped',
      notes: `tokens.fontSize.${key} → --font-size-${key}`,
    });
  }

  // line-height per key
  for (const key of MANTINE_SIZE_KEYS) {
    entries.push({
      mantineVar: `--mantine-line-height-${key}`,
      soribashiVar: `--line-height-${key}`,
      status: 'mapped',
      notes: `tokens.lineHeight.${key} → --line-height-${key}`,
    });
  }

  // shadows
  for (const key of MANTINE_SIZE_KEYS) {
    entries.push({
      mantineVar: `--mantine-shadow-${key}`,
      soribashiVar: `--shadow-${key}`,
      status: 'mapped',
      notes: `tokens.shadow.${key} → --shadow-${key}`,
    });
  }

  // radius per key
  for (const key of MANTINE_SIZE_KEYS) {
    entries.push({
      mantineVar: `--mantine-radius-${key}`,
      soribashiVar: `--radius-${key}`,
      status: 'mapped',
      notes: `tokens.radius.${key} → --radius-${key}`,
    });
  }

  // font-weight per key
  for (const [mantineKey, soribashiKey] of [
    ['regular', 'regular'], ['medium', 'medium'], ['bold', 'bold'],
  ] as const) {
    entries.push({
      mantineVar: `--mantine-font-weight-${mantineKey}`,
      soribashiVar: `--font-weight-${soribashiKey}`,
      status: 'mapped',
      notes: `tokens.fontWeight.${soribashiKey} → --font-weight-${soribashiKey}`,
    });
  }

  // primary color shade pointers (--mantine-primary-color-0 through -9)
  for (let i = 0; i <= 9; i++) {
    entries.push({
      mantineVar: `--mantine-primary-color-${i}`,
      soribashiVar: null,
      status: 'INTENTIONAL_GAP',
      notes: 'Mantine emits --mantine-primary-color-{n} as pointers to the primary color family shades. Soribashi does not have a "primary color family" concept at the CSS-variable layer; components reference --color-{intent}-{shade} directly.',
    });
  }

  // color family shade values (--mantine-color-{family}-{0-9})
  // Soribashi maps --mantine-color-{family}-{n} → --color-{family}-{shade}
  // For Mantine's 0-9 scale: mantine shade index n → soribashi key
  // soribashi uses different keys (50, 100, etc.) so this is a NAMING_DIVERGENCE
  // but the values are emitted. For parity we test against soribashi's neutral/primary families.
  // The mantine default families (blue, gray, etc.) are not soribashi's defaults;
  // we test the pattern with soribashi's own families.
  //
  // Only the structural pattern is tested here; the color family names differ.
  // See INTENTIONAL_GAP note below.
  for (const family of MANTINE_COLOR_FAMILIES) {
    for (let i = 0; i <= 9; i++) {
      entries.push({
        mantineVar: `--mantine-color-${family}-${i}`,
        soribashiVar: null,
        status: 'INTENTIONAL_GAP',
        notes: `Mantine ships named color families (blue, gray, red, etc.) with numeric 0-9 shades. Soribashi ships semantic families (primary, neutral, danger, etc.) with numeric 50-950 shades. The structural pattern --color-{family}-{shade} IS implemented; the specific families and shade keys differ intentionally.`,
      });
    }

    // Per-color variant vars (light/dark scheme specific)
    for (const suffix of COLOR_VARIANT_SUFFIXES) {
      entries.push({
        mantineVar: `--mantine-color-${family}-${suffix}`,
        soribashiVar: null,
        status: 'INTENTIONAL_GAP',
        notes: `Mantine emits --mantine-color-{family}-{filled|outline|light|etc.} via getCSSColorVariables() in both light and dark schemes. Soribashi's intent resolver computes these at render time via React context; they are not emitted as static CSS variables. This is the most significant architectural divergence — Mantine's component theming is CSS-variable-driven; soribashi's is resolver-driven.`,
      });
    }
  }

  // heading per-level vars
  for (const level of HEADING_LEVELS) {
    for (const prop of HEADING_PROPS) {
      entries.push({
        mantineVar: `--mantine-${level}-${prop}`,
        soribashiVar: `--heading-${level}-${prop}`,
        status: 'mapped',
        notes: `tokens.heading.sizes.${level}.${prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())} → --heading-${level}-${prop}`,
      });
    }
  }

  // ---- Light/dark scheme variables ------------------------------------------

  // color-scheme indicator
  entries.push({
    mantineVar: '--mantine-color-scheme',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Mantine injects --mantine-color-scheme: light/dark in both color-scheme scopes. Soribashi manages color scheme via the .dark class on <html>; no CSS variable is needed.',
  });

  // primary-color-contrast
  entries.push({
    mantineVar: '--mantine-primary-color-contrast',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Mantine computes auto-contrast for the primary color. Soribashi\'s intent resolver handles contrast via intents/variants; no static CSS variable is emitted.',
  });

  // bright (absolute white/black per scheme)
  entries.push({
    mantineVar: '--mantine-color-bright',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Mantine --mantine-color-bright is black in light, white in dark. Soribashi uses tokens.colors.neutral.0/950 for the same purpose; no extra alias.',
  });

  // color-text
  entries.push({
    mantineVar: '--mantine-color-text',
    soribashiVar: '--text-default',
    status: 'mapped',
    notes: 'Mantine --mantine-color-text (black in light, dark-0 in dark) → soribashi --text-default (semantic.text.default → colors.neutral.900/50). Emitted by emitSemanticLines().',
  });

  // color-body
  entries.push({
    mantineVar: '--mantine-color-body',
    soribashiVar: '--surface-default',
    status: 'mapped',
    notes: 'Mantine --mantine-color-body (white in light, dark-7 in dark) → soribashi --surface-default (semantic.surface.default → colors.neutral.0). Emitted by emitSemanticLines().',
  });

  // color-error
  entries.push({
    mantineVar: '--mantine-color-error',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Mantine emits --mantine-color-error pointing at red-6/8. Soribashi has a danger color family and an error state can be expressed via --color-danger-{shade}. No top-level --color-error alias is emitted; components reference the danger family directly.',
  });

  // color-placeholder
  entries.push({
    mantineVar: '--mantine-color-placeholder',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Mantine emits a placeholder color var. Soribashi components set placeholder color via a utility class; no CSS variable alias is emitted.',
  });

  // color-anchor
  entries.push({
    mantineVar: '--mantine-color-anchor',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Mantine emits --mantine-color-anchor pointing at primary-{shade}. Soribashi anchor/link styling is handled at the component level via the intent resolver.',
  });

  // color-default (UI element background — distinct from body)
  entries.push({
    mantineVar: '--mantine-color-default',
    soribashiVar: '--surface-default',
    status: 'mapped',
    notes: 'Mantine --mantine-color-default is white/dark-6 (the "default" element surface). Soribashi --surface-default covers the same role. Note: --mantine-color-body and --mantine-color-default both map to --surface-default; the distinction is collapsed intentionally.',
  });

  // color-default-hover
  entries.push({
    mantineVar: '--mantine-color-default-hover',
    soribashiVar: null,
    status: 'INTENTIONAL_GAP',
    notes: 'Hover surface variant. Soribashi hover states are handled by the intent resolver at render time, not via a static CSS variable.',
  });

  // color-default-color
  entries.push({
    mantineVar: '--mantine-color-default-color',
    soribashiVar: '--text-default',
    status: 'mapped',
    notes: 'Mantine --mantine-color-default-color is the text color on default backgrounds (black/white). Maps to soribashi --text-default (semantic.text.default).',
  });

  // color-default-border
  entries.push({
    mantineVar: '--mantine-color-default-border',
    soribashiVar: '--border-default',
    status: 'mapped',
    notes: 'Mantine --mantine-color-default-border (gray-4/dark-4) → soribashi --border-default (semantic.border.default → colors.neutral.200). Emitted by emitSemanticLines().',
  });

  // color-dimmed
  entries.push({
    mantineVar: '--mantine-color-dimmed',
    soribashiVar: '--text-muted',
    status: 'mapped',
    notes: 'Mantine --mantine-color-dimmed (gray-6/dark-2) → soribashi --text-muted (semantic.text.muted → colors.neutral.500). Emitted by emitSemanticLines().',
  });

  // disabled states
  for (const suffix of ['', '-color', '-border'] as const) {
    entries.push({
      mantineVar: `--mantine-color-disabled${suffix}`,
      soribashiVar: null,
      status: 'INTENTIONAL_GAP',
      notes: 'Mantine emits 3 disabled-state color vars. Soribashi handles disabled styling via CSS attribute selectors ([data-disabled]) in component CSS; no disabled color vars are emitted.',
    });
  }

  return entries;
}

export const PARITY_TABLE = buildCanonicalList();

// ---------------------------------------------------------------------------
// The test theme — uses soribashi default tokens for a realistic full theme
// ---------------------------------------------------------------------------

function buildFullTheme() {
  return createTheme({
    tokens: {
      colors: {
        primary: {
          '50': 'hsl(214 100% 97%)',
          '100': 'hsl(214 95% 93%)',
          '500': 'hsl(217 91% 60%)',
          '900': 'hsl(224 64% 33%)',
        },
        neutral: {
          '0': '#ffffff',
          '50': 'hsl(210 40% 98%)',
          '100': 'hsl(210 40% 96%)',
          '200': 'hsl(214 32% 91%)',
          '400': 'hsl(215 20% 65%)',
          '500': 'hsl(215 16% 47%)',
          '900': 'hsl(222 47% 11%)',
        },
      },
      radius: { xs: '0.125rem', sm: '0.25rem', md: '0.5rem', lg: '1rem', xl: '2rem' },
      spacing: { xs: '0.625rem', sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '2rem' },
      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.25rem' },
      fontFamily: {
        sans: '-apple-system, BlinkMacSystemFont, sans-serif',
        mono: 'ui-monospace, monospace',
        heading: '-apple-system, BlinkMacSystemFont, sans-serif',
      },
      fontWeight: { regular: '400', medium: '600', bold: '700' },
      lineHeight: { xs: '1.4', sm: '1.45', md: '1.55', lg: '1.6', xl: '1.65' },
      shadow: {
        xs: '0 1px 2px rgba(0,0,0,0.05)',
        sm: '0 1px 3px rgba(0,0,0,0.1)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        xl: '0 20px 25px rgba(0,0,0,0.1)',
      },
      breakpoint: { xs: '36em', sm: '48em', md: '62em', lg: '75em', xl: '88em' },
      heading: {
        textWrap: 'wrap',
        sizes: {
          h1: { fontSize: '2.125rem', fontWeight: '700', lineHeight: '1.3' },
          h2: { fontSize: '1.625rem', fontWeight: '700', lineHeight: '1.35' },
          h3: { fontSize: '1.375rem', fontWeight: '700', lineHeight: '1.4' },
          h4: { fontSize: '1.125rem', fontWeight: '700', lineHeight: '1.45' },
          h5: { fontSize: '1rem', fontWeight: '700', lineHeight: '1.5' },
          h6: { fontSize: '0.875rem', fontWeight: '700', lineHeight: '1.5' },
        },
      },
    },
    semantic: {
      text: {
        default: 'colors.neutral.900',
        muted: 'colors.neutral.500',
        disabled: 'colors.neutral.400',
      },
      surface: {
        default: 'colors.neutral.0',
        raised: 'colors.neutral.100',
        sunken: 'colors.neutral.50',
      },
      border: {
        default: 'colors.neutral.200',
        strong: 'colors.neutral.400',
        muted: 'colors.neutral.100',
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse the emitted CSS into a Set of variable names that appear as declarations. */
function parseDeclaredVars(css: string): Set<string> {
  const vars = new Set<string>();
  // Match `  --foo-bar: ...;` lines
  const re = /^\s+(--[a-zA-Z0-9-]+)\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    if (m[1] !== undefined) vars.add(m[1]);
  }
  return vars;
}

// ---------------------------------------------------------------------------
// The parity test
// ---------------------------------------------------------------------------

describe('CSS variable parity (Mantine → soribashi)', () => {
  const theme = buildFullTheme();
  const css = emitCss(theme);
  const emittedVars = parseDeclaredVars(css);

  const mapped = PARITY_TABLE.filter((e) => e.status === 'mapped');
  const gaps = PARITY_TABLE.filter((e) => e.status === 'INTENTIONAL_GAP');

  it('every mapped variable is present in emitCss() output', () => {
    const missing: ParityEntry[] = [];
    for (const entry of mapped) {
      if (!entry.soribashiVar) {
        missing.push(entry);
        continue;
      }
      if (!emittedVars.has(entry.soribashiVar)) {
        missing.push(entry);
      }
    }

    if (missing.length > 0) {
      const detail = missing
        .map((e) => `  ${e.mantineVar} → ${e.soribashiVar ?? '(no mapping)'} | ${e.notes}`)
        .join('\n');
      throw new Error(
        `${missing.length} mapped variable(s) not found in emitCss() output:\n${detail}`,
      );
    }
  });

  it('emitted variables set is non-empty (sanity)', () => {
    expect(emittedVars.size).toBeGreaterThan(0);
  });

  it('intentional gaps are not accidentally emitted under their expected mantine-equivalent names', () => {
    // If a var that is an INTENTIONAL_GAP appears with its soribashiVar name
    // in the output, it means something was changed. This is a soft smoke-check,
    // not an error — emit rules can change legitimately.
    // We just verify the test data is consistent: every INTENTIONAL_GAP with a
    // soribashiVar that IS emitted should be in the 'mapped' list instead.
    const accidentallyEmitted: string[] = [];
    for (const entry of gaps) {
      if (entry.soribashiVar && emittedVars.has(entry.soribashiVar)) {
        // Verify it's not already covered by a 'mapped' entry for the same soribashiVar
        const alreadyMapped = mapped.some((m) => m.soribashiVar === entry.soribashiVar);
        if (!alreadyMapped) {
          accidentallyEmitted.push(
            `${entry.mantineVar} → ${entry.soribashiVar} is emitted but listed as INTENTIONAL_GAP`,
          );
        }
      }
    }
    // This is informational only — don't fail if something new is emitted, just report
    if (accidentallyEmitted.length > 0) {
      console.warn(
        '[parity] These vars are listed as INTENTIONAL_GAP but are now emitted — consider updating the parity table:\n' +
        accidentallyEmitted.map((s) => `  ${s}`).join('\n'),
      );
    }
  });

  it('prints coverage summary', () => {
    const total = PARITY_TABLE.length;
    const mappedCount = mapped.length;
    const gapCount = gaps.length;
    const emittedMappedCount = mapped.filter(
      (e) => e.soribashiVar && emittedVars.has(e.soribashiVar),
    ).length;

    console.log(
      `\n[CSS variable parity] emitted ${emittedMappedCount} of ${mappedCount} mapped vars` +
      ` (${Math.round((emittedMappedCount / mappedCount) * 100)}%)` +
      ` | ${gapCount} INTENTIONAL_GAP entries` +
      ` | ${total} total canonical Mantine vars audited`,
    );

    // Coverage must be 100% of the mapped set
    expect(emittedMappedCount).toBe(mappedCount);
  });
});
