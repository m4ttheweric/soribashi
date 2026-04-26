/**
 * CSS Parity Allowlist
 *
 * Entries here represent known-intentional divergences between soribashi's
 * block CSS and the upstream Mantine CSS. Each entry must reference a specific
 * section of the divergence ledger or the adaptation spec.
 *
 * Format: { block, kind, mantineSelector, reason, ledgerRef }
 *
 * The test in css-parity.test.ts reads this list and allows those findings
 * to pass while failing on any new DECL_DIFF or MISSING_IN_SORIBASHI finding
 * that is NOT in this list.
 */

export interface AllowlistEntry {
  block: string;
  kind: 'DECL_DIFF' | 'MISSING_IN_SORIBASHI' | 'EXTRA_IN_SORIBASHI' | 'TOKEN_DIFF' | 'SELECTOR_DIFF';
  /** The Mantine selector for this rule (as reported by the audit script) */
  mantineSelector: string;
  /** Human-readable reason why this divergence is intentional */
  reason: string;
  /** Reference to the divergence ledger or spec section */
  ledgerRef: string;
}

export const ALLOWLIST: AllowlistEntry[] = [
  // ---------------------------------------------------------------------------
  // Box — soribashi adds box-sizing: border-box reset (not in Mantine's Box.module.css)
  // ---------------------------------------------------------------------------
  {
    block: 'Box',
    kind: 'EXTRA_IN_SORIBASHI',
    mantineSelector: '(none)',
    reason:
      'Box.css adds box-sizing: border-box as a layout reset. Mantine achieves this via a global CSS reset; soribashi scopes it to .sb-Box-root.',
    ledgerRef: 'docs/superpowers/divergences/mantine-master.md § Closed (adapted from Mantine) > Box',
  },

  // ---------------------------------------------------------------------------
  // Flex — soribashi's .root has extra declarations (flex-direction, flex-wrap,
  // gap, row-gap, column-gap, align-items) that Mantine leaves to JS inline styles.
  // Mantine only puts `display: flex` in the CSS module; soribashi bakes the
  // CSS-variable-driven defaults into the CSS file.
  // ---------------------------------------------------------------------------
  {
    block: 'Flex',
    kind: 'DECL_DIFF',
    mantineSelector: '.root',
    reason:
      'Soribashi bakes flex-direction, flex-wrap, gap, row-gap, column-gap, and align-items as CSS-variable-driven defaults directly in the CSS file. Mantine only emits display:flex in the module and sets these via JS inline styles. This is an intentional adaptation: the CSS-variable approach is cleaner and avoids JS-computed inline styles for these common properties.',
    ledgerRef: 'docs/superpowers/specs/2026-04-25-mantine-blocks-adaptation-design.md § 5 — Flex adaptation note; docs/superpowers/divergences/mantine-master.md § Closed > Flex',
  },

  // ---------------------------------------------------------------------------
  // Grid — missing .container (container: mantine-grid / inline-size)
  // Container-query mode for Grid is deferred per the divergence ledger.
  // ---------------------------------------------------------------------------
  {
    block: 'Grid',
    kind: 'MISSING_IN_SORIBASHI',
    mantineSelector: '.container',
    reason:
      'Mantine Grid has a .container class that sets up a CSS container query context (container: mantine-grid / inline-size). This is used for the type="container" responsive mode. That mode is deferred in soribashi per the divergence ledger.',
    ledgerRef: 'docs/superpowers/divergences/mantine-master.md § Deferred > GridProvider context for responsive col span / offset / order',
  },

  // ---------------------------------------------------------------------------
  // Grid — missing --grid-column-gap and --grid-row-gap defaults on .root
  // These are CSS custom property initializations that soribashi omitted.
  // This is a REAL BUG (not intentional) — filed separately for fixing.
  // Temporarily allowlisted here to track it; will be removed after the fix.
  // ---------------------------------------------------------------------------
  // NOTE: This entry is intentionally NOT included in the allowlist —
  // the test should flag it until it is fixed. See fix in Grid.css.

  // ---------------------------------------------------------------------------
  // SimpleGrid — missing .container (container: simple-grid / inline-size)
  // type='container' mode is deferred per the divergence ledger.
  // ---------------------------------------------------------------------------
  {
    block: 'SimpleGrid',
    kind: 'MISSING_IN_SORIBASHI',
    mantineSelector: '.container',
    reason:
      'Mantine SimpleGrid has a .container class for CSS container query context. type="container" mode is deferred in soribashi.',
    ledgerRef: 'docs/superpowers/divergences/mantine-master.md § Deferred > SimpleGrid type=container mode',
  },

  // ---------------------------------------------------------------------------
  // SimpleGrid — [data-auto-cols] renamed to [data-auto-flow] in soribashi
  // Mantine uses data-auto-cols; soribashi uses data-auto-flow (more descriptive
  // of the CSS grid auto placement concept). MISSING_IN_SORIBASHI because the
  // Mantine selector [data-auto-cols] has no soribashi counterpart.
  // The soribashi [data-auto-flow] rules are EXTRA_IN_SORIBASHI.
  // ---------------------------------------------------------------------------
  {
    block: 'SimpleGrid',
    kind: 'MISSING_IN_SORIBASHI',
    mantineSelector: '.root[data-auto-cols="auto-fill"]',
    reason:
      "Mantine uses [data-auto-cols] attribute; soribashi renamed it to [data-auto-flow] (more accurately reflects CSS grid auto-placement). The equivalent [data-auto-flow='auto-fill'] rule exists in soribashi.",
    ledgerRef: "docs/superpowers/divergences/mantine-master.md § Closed > item #8: Prop renames (SimpleGrid autoCols → autoFlow)",
  },
  {
    block: 'SimpleGrid',
    kind: 'MISSING_IN_SORIBASHI',
    mantineSelector: '.root[data-auto-cols="auto-fit"]',
    reason:
      "Mantine uses [data-auto-cols] attribute; soribashi renamed it to [data-auto-flow]. The equivalent [data-auto-flow='auto-fit'] rule exists in soribashi.",
    ledgerRef: "docs/superpowers/divergences/mantine-master.md § Closed > item #8: Prop renames (SimpleGrid autoCols → autoFlow)",
  },
  {
    block: 'SimpleGrid',
    kind: 'EXTRA_IN_SORIBASHI',
    mantineSelector: '(none)',
    reason:
      "Soribashi uses [data-auto-flow] instead of Mantine's [data-auto-cols]. These are the soribashi-renamed equivalents. Also includes --sg-min-col-width fallback default of 12rem.",
    ledgerRef: "docs/superpowers/divergences/mantine-master.md § Closed > item #8",
  },

  // ---------------------------------------------------------------------------
  // SimpleGrid — --sg-cols default value difference
  // Mantine: repeat(var(--sg-cols), ...) — no default
  // Soribashi: repeat(var(--sg-cols, 1), ...) — defaults to 1 column
  // Intentional: providing a default prevents a broken layout when the JS hasn't
  // set the variable yet (e.g., SSR, streaming).
  // ---------------------------------------------------------------------------
  {
    block: 'SimpleGrid',
    kind: 'DECL_DIFF',
    mantineSelector: '.root',
    reason:
      'Soribashi adds a fallback default of 1 to --sg-cols (repeat(var(--sg-cols, 1), ...)). This prevents a layout collapse when the CSS variable is not yet set. Mantine relies on JS always setting --sg-cols before render.',
    ledgerRef: 'docs/superpowers/specs/2026-04-25-mantine-blocks-adaptation-design.md § 5 — SimpleGrid; intentional defensive default',
  },

  // ---------------------------------------------------------------------------
  // Container — compound vs. chained :where() selectors
  // Mantine: .root:where([data-strategy='block']):where([data-fluid])
  // Soribashi: .root:where([data-strategy='block'][data-fluid])
  // These are semantically equivalent (both match the same elements).
  // ---------------------------------------------------------------------------
  {
    block: 'Container',
    kind: 'MISSING_IN_SORIBASHI',
    mantineSelector: '.root:where([data-strategy="block"]):where([data-fluid])',
    reason:
      "Mantine chains two :where() pseudo-classes; soribashi combines them into one :where([data-strategy='block'][data-fluid]). Both match the same elements — semantically equivalent. The audit script doesn't normalize these equivalent forms.",
    ledgerRef: 'docs/superpowers/divergences/mantine-master.md § Closed (adapted from Mantine) > Container',
  },
  {
    block: 'Container',
    kind: 'EXTRA_IN_SORIBASHI',
    mantineSelector: '(none)',
    reason:
      "Soribashi uses combined :where([data-strategy='block'][data-fluid]) instead of Mantine's chained :where([data-strategy='block']):where([data-fluid]). Semantically equivalent.",
    ledgerRef: 'docs/superpowers/divergences/mantine-master.md § Closed (adapted from Mantine) > Container',
  },

  // ---------------------------------------------------------------------------
  // Paper — --paper-border-color default scoped differently
  // Mantine: @mixin light { --paper-border-color: ... } on .root (expands to :root .root)
  // Soribashi: --paper-border-color declared directly on .sb-Paper-root
  // Per the divergence ledger item #13, this was intentionally changed to scope
  // the variable to the component class, not the :root scope.
  // ---------------------------------------------------------------------------
  {
    block: 'Paper',
    kind: 'DECL_DIFF',
    mantineSelector: '.root',
    reason:
      'Soribashi declares --paper-border-color directly on .sb-Paper-root instead of inside @mixin light (which expands to :root scope). This keeps the variable scoped to the component per divergence ledger item #13 (Paper border-color global namespace fix).',
    ledgerRef: 'docs/superpowers/divergences/mantine-master.md § Post-adaptation validation > item #13: Paper --paper-border-color scoped to .sb-Paper-root',
  },

  // ---------------------------------------------------------------------------
  // Text — font-weight fallback value
  // Mantine: font-weight: var(--font-weight-regular)
  // Soribashi: font-weight: var(--font-weight-regular, 400)
  // Intentional: provides a browser-safe fallback in case the CSS variable
  // isn't defined (e.g., when used outside a theme scope).
  // ---------------------------------------------------------------------------
  {
    block: 'Text',
    kind: 'DECL_DIFF',
    mantineSelector: '.root',
    reason:
      'Soribashi adds 400 as a fallback value: var(--font-weight-regular, 400). This is a defensive addition ensuring normal font weight even if the CSS variable is not defined.',
    ledgerRef: 'docs/superpowers/specs/2026-04-25-mantine-blocks-adaptation-design.md § 4 — Token substitution; intentional defensive fallback',
  },

  // ---------------------------------------------------------------------------
  // Space — no CSS file (intentional)
  // ---------------------------------------------------------------------------
  {
    block: 'Space',
    kind: 'EXTRA_IN_SORIBASHI',
    mantineSelector: '(none)',
    reason:
      'Space has no CSS file in either Mantine or soribashi. Soribashi implements Space as a one-line Box wrapper using Box style props (w/h/miw/mih). The audit script reports this as EXTRA_IN_SORIBASHI (no Mantine CSS to compare against).',
    ledgerRef: 'docs/superpowers/divergences/mantine-master.md § Closed (adapted from Mantine) > Space',
  },

  // ---------------------------------------------------------------------------
  // Title — text-wrap fallback value
  // Mantine: text-wrap: var(--title-text-wrap, var(--mantine-heading-text-wrap))
  //   → normalized: text-wrap: var(--title-text-wrap, var(--heading-text-wrap))
  // Soribashi: text-wrap: var(--title-text-wrap, var(--heading-text-wrap, wrap))
  // Intentional: soribashi adds 'wrap' as ultimate fallback.
  // ---------------------------------------------------------------------------
  {
    block: 'Title',
    kind: 'DECL_DIFF',
    mantineSelector: '.root',
    reason:
      'Soribashi adds "wrap" as an ultimate fallback for text-wrap: var(--title-text-wrap, var(--heading-text-wrap, wrap)). This ensures text wraps normally even if neither variable is defined.',
    ledgerRef: 'docs/superpowers/specs/2026-04-25-mantine-blocks-adaptation-design.md § 4 — Token substitution; intentional defensive fallback',
  },
];

/**
 * Build a Set of allowlist keys for fast lookup.
 * Key format: `${block}::${kind}::${mantineSelector}`
 */
export function buildAllowlistSet(entries: AllowlistEntry[]): Set<string> {
  return new Set(entries.map(e => `${e.block}::${e.kind}::${e.mantineSelector}`));
}

export function makeFindingKey(
  block: string,
  kind: string,
  mantineSelector: string,
): string {
  return `${block}::${kind}::${mantineSelector}`;
}
