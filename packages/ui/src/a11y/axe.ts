import axe from 'axe-core';

/**
 * Runs axe-core's default ruleset against a rendered subtree, with
 * `color-contrast` explicitly enabled (it is off in some axe-core default
 * configurations, and this task is built around it). Thin on purpose:
 * callers own how they render the subtree (showcase states, force-open
 * popovers, ...) and how they assert on `results.violations`.
 *
 * The default ruleset, not a narrowed `runOnly`: an earlier version of this
 * helper restricted to `color-contrast` alone, which made the per-recipe
 * "zero violations" axe cases in Button.test.tsx / Popover.test.tsx
 * redundant with the contrast matrix (they proved nothing beyond what it
 * already did). The full ruleset is what actually earns the "axe assertions
 * per component" claim.
 *
 * Exactly one rule is disabled below, and only because it fires on markup
 * this package does not own and cannot change: see the comment on
 * `aria-hidden-focus`. No other rule is preemptively disabled; if the
 * default ruleset ever flags something else, that is a real finding to fix
 * in the recipe under test, not a reason to add another entry here.
 */
export async function runAxe(node: Element): Promise<axe.AxeResults> {
  const results = await axe.run(node, {
    rules: {
      'color-contrast': { enabled: true },
      // Base UI's `FloatingFocusManager` inserts invisible focus-guard
      // sentinels (`<span aria-hidden="true" tabindex="0"
      // data-base-ui-focus-guard>`) around portalled content (Popover's
      // popup) to contain Tab-cycling inside the open popup. They are
      // focusable-but-hidden by design, the same pattern Radix/react-aria
      // use for the same purpose, not a defect: axe-core's default
      // `aria-hidden-focus` rule flags them anyway (confirmed: they are the
      // ONLY thing this rule fires on across both recipes' axe cases, both
      // before and after this file stopped narrowing to `color-contrast`
      // alone). Soribashi's own markup owns none of these nodes and cannot
      // change how Base UI implements its focus trap, so this one rule is
      // exempted here rather than chased recipe by recipe.
      'aria-hidden-focus': { enabled: false },
    },
  });
  return results;
}

/**
 * Renders an axe violation list as a readable multi-line summary (id, impact,
 * help text, and the CSS target of every offending node) so a failing
 * assertion tells an agent what to fix without having to rerun axe manually.
 */
export function formatViolations(violations: axe.Result[]): string {
  if (violations.length === 0) return 'no violations';
  return violations
    .map((violation) => {
      const targets = violation.nodes
        .map((node) => (Array.isArray(node.target) ? node.target.join(' ') : String(node.target)))
        .join(', ');
      return `- ${violation.id} (${violation.impact ?? 'unknown impact'}): ${violation.help}\n  targets: ${targets}`;
    })
    .join('\n');
}
