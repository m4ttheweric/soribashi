import axe from 'axe-core';

/**
 * Runs axe-core against a rendered subtree, restricted to the
 * `color-contrast` rule. Thin on purpose: callers own how they render the
 * subtree (showcase states, force-open popovers, ...) and how they assert on
 * `results.violations`; this just wires the one rule this task (and the
 * per-recipe axe cases in Button.test.tsx / Popover.test.tsx) cares about.
 *
 * `runOnly` (not just `rules: { 'color-contrast': { enabled: true } }`,
 * which alone leaves every other default-ruleset rule running too) is
 * deliberate: axe-core's default ruleset also flags Base UI's internal
 * focus-guard sentinels (`aria-hidden="true" tabindex="0"` spans
 * FloatingFocusManager inserts for focus containment inside the popup) under
 * `aria-hidden-focus`, a known, intentional pattern for focus trapping (the
 * same one Radix/react-aria use), not a defect in this package's own markup,
 * and unrelated to the contrast work this task is about. Scoping to
 * `color-contrast` keeps this helper honest about what it checks instead of
 * quietly accumulating an allowlist for a third-party library's internals.
 */
export async function runAxe(node: Element): Promise<axe.AxeResults> {
  const results = await axe.run(node, {
    runOnly: { type: 'rule', values: ['color-contrast'] },
    rules: { 'color-contrast': { enabled: true } },
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
