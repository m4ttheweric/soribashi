/**
 * ScreenReplica — static markup of a representative CVI screen using only
 * consolidated tokens via direct CSS-var references.
 *
 * Purpose: validate that the consolidated tokens reach the DOM correctly
 * in a realistic composition. NOT a pixel-perfect copy of CVI — intent
 * parity, not pixel parity. Drift from the original is expected wherever
 * consolidation deliberately changed something (see journal § 4 deprecation
 * list and § 5 open design questions).
 *
 * Two adaptations vs the plan's draft snippet (per journal § 6):
 *   1. Badge backgrounds/colors use `var(--color-…)` directly rather than
 *      `hsl(var(--color-…))`. The codegen emits CSS vars whose values are
 *      already complete `hsl(...)` strings, so re-wrapping produces
 *      `hsl(hsl(...))` = invalid CSS = transparent.
 *   2. Tailwind utility classes for semantic surfaces/text (`bg-canvas`,
 *      `text-default`, `text-muted`) are not emitted by the current codegen
 *      (it only emits scale-only color utilities — see
 *      `src/generated/tailwind.config.generated.js`). Falls back to inline
 *      `style={{ … }}` with the appropriate `var(--surface-…)`,
 *      `var(--text-…)`, `var(--border-…)` token. Comment trail kept inline
 *      at each fallback for the integration project's playbook.
 */
export function ScreenReplica() {
  return (
    // tailwind utility `bg-canvas` not emitted; using direct var() per journal § 6
    <div className="min-h-screen p-8" style={{ background: 'var(--surface-canvas)' }}>
      <header className="mb-6">
        {/* tailwind utility `text-default` not emitted; using direct var() per journal § 6 */}
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-default)' }}>
          Auto · Statements Overview
        </h1>
        {/* tailwind utility `text-muted` not emitted; using direct var() per journal § 6 */}
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Claim #2401-93821 · last updated 2 hours ago
        </p>
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
            {/* tailwind utility `text-muted` not emitted; using direct var() per journal § 6 */}
            <div
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {card.label}
            </div>
            {/* tailwind utility `text-default` not emitted; using direct var() per journal § 6 */}
            <div className="text-3xl font-semibold" style={{ color: 'var(--text-default)' }}>
              {card.value}
            </div>
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
        {/* tailwind utility `text-default` not emitted; using direct var() per journal § 6 */}
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-default)' }}>
          Latest activity
        </h2>
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
                borderBottom:
                  idx < all.length - 1 ? '1px solid var(--border-muted)' : 'none',
              }}
            >
              {/* tailwind utility `text-default` not emitted; using direct var() per journal § 6 */}
              <div
                className="text-sm font-medium"
                style={{ color: 'var(--text-default)' }}
              >
                {row.who}
              </div>
              {/* tailwind utility `text-muted` not emitted; using direct var() per journal § 6 */}
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {row.what} · {row.when}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/*
        Badge chips: background/foreground use `var(--color-…)` directly (no
        `hsl()` wrapper) per journal § 6 — codegen emits already-wrapped values.
      */}
      <section className="flex gap-2">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium"
          style={{
            background: 'var(--color-success-100)',
            color: 'var(--color-success-800)',
          }}
        >
          Active
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium"
          style={{
            background: 'var(--color-warning-100)',
            color: 'var(--color-warning-800)',
          }}
        >
          Review
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium"
          style={{
            background: 'var(--color-danger-100)',
            color: 'var(--color-danger-800)',
          }}
        >
          Disputed
        </span>
      </section>
    </div>
  );
}
