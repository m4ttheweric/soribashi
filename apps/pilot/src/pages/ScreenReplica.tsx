/**
 * ScreenReplica — static markup of a representative the host library screen using only
 * consolidated tokens via direct CSS-var references.
 *
 * Purpose: validate that the consolidated tokens reach the DOM correctly
 * in a realistic composition. NOT a pixel-perfect copy of the host library — intent
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
 *
 * Wave 2 Tooltip integration (Phase 9.2):
 *   - Stat cards: value numbers wrapped with Tooltip describing the metric
 *   - Activity list: relative timestamps wrapped with Tooltip showing exact datetime
 *   - Status badges: wrapped with Tooltip explaining each status
 */
import { Tabs } from '../recipes/Tabs/Tabs.tsx';
import { Tooltip } from '../recipes/Tooltip/Tooltip.tsx';

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
          {
            label: 'Open statements',
            value: '3',
            tone: 'primary' as const,
            tooltip: '3 statements are currently open and awaiting action',
          },
          {
            label: 'Pending review',
            value: '1',
            tone: 'warning' as const,
            tooltip: '1 statement is pending adjuster review — action required',
          },
          {
            label: 'Resolved',
            value: '14',
            tone: 'success' as const,
            tooltip: '14 statements have been fully resolved on this claim',
          },
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
            {/* Tooltip wraps the stat value — icon-free metric card pattern from the host library.
                tabIndex={0} makes the non-interactive <div> focusable so keyboard
                users can open the tooltip via Tab + focus, not just hover. */}
            <Tooltip side="bottom">
              <Tooltip.Trigger asChild>
                <div
                  tabIndex={0}
                  className="text-3xl font-semibold"
                  style={{
                    color: 'var(--text-default)',
                    cursor: 'default',
                    display: 'inline-block',
                  }}
                >
                  {card.value}
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content>{card.tooltip}</Tooltip.Content>
            </Tooltip>
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
            {
              who: 'M. Goodwin',
              what: 'Reviewed FNOL statement',
              when: '2h ago',
              fullTime: 'May 5, 2026 at 10:14 AM',
            },
            {
              who: 'A. Patel',
              what: 'Added incident notes',
              when: '5h ago',
              fullTime: 'May 5, 2026 at 7:22 AM',
            },
            {
              who: 'System',
              what: 'Merged FC into incident',
              when: 'yesterday',
              fullTime: 'May 4, 2026 at 3:45 PM',
            },
          ].map((row, idx, all) => (
            <li
              key={row.who + row.when}
              className="pb-3"
              style={{
                borderBottom: idx < all.length - 1 ? '1px solid var(--border-muted)' : 'none',
              }}
            >
              {/* tailwind utility `text-default` not emitted; using direct var() per journal § 6 */}
              <div className="text-sm font-medium" style={{ color: 'var(--text-default)' }}>
                {row.who}
              </div>
              {/* tailwind utility `text-muted` not emitted; using direct var() per journal § 6 */}
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {row.what} ·{' '}
                {/* Tooltip on truncated relative timestamp — shows exact datetime on hover.
                    tabIndex={0} keeps the dotted-underline span focusable for keyboard users. */}
                <Tooltip side="right">
                  <Tooltip.Trigger asChild>
                    <span
                      tabIndex={0}
                      style={{ cursor: 'default', borderBottom: '1px dotted var(--border-muted)' }}
                    >
                      {row.when}
                    </span>
                  </Tooltip.Trigger>
                  <Tooltip.Content>{row.fullTime}</Tooltip.Content>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/*
        Claim detail side-panel tabs — mirrors the host library's RightToolbar PanelTabs
        pattern (Details / Activity / Notes). Default variant used (no `variant`
        prop) so the underline-on-active styling matches existing the host library styling.
      */}
      <section
        className="rounded-md p-6 mb-6"
        style={{
          background: 'var(--surface-default)',
          border: '1px solid var(--border-default)',
        }}
      >
        <Tabs defaultValue="details">
          <Tabs.List>
            <Tabs.Trigger value="details">Details</Tabs.Trigger>
            <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
            <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="details">
            <p style={{ color: 'var(--text-default)' }}>Claim details placeholder.</p>
          </Tabs.Content>
          <Tabs.Content value="activity">
            <p style={{ color: 'var(--text-default)' }}>Activity feed placeholder.</p>
          </Tabs.Content>
          <Tabs.Content value="notes">
            <p style={{ color: 'var(--text-default)' }}>Notes placeholder.</p>
          </Tabs.Content>
        </Tabs>
      </section>

      {/*
        Badge chips: background/foreground use `var(--color-…)` directly (no
        `hsl()` wrapper) per journal § 6 — codegen emits already-wrapped values.
        Tooltip wraps each badge — status-indicator pattern from the host library.
      */}
      <section className="flex gap-2">
        {/* Each badge gets tabIndex={0} so keyboard users can focus the
            non-interactive <span> and read its tooltip via focus, not just hover. */}
        <Tooltip side="top">
          <Tooltip.Trigger asChild>
            <span
              tabIndex={0}
              className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium"
              style={{
                background: 'var(--color-success-100)',
                color: 'var(--color-success-800)',
                cursor: 'default',
              }}
            >
              Active
            </span>
          </Tooltip.Trigger>
          <Tooltip.Content>Claim is active — payments processing normally</Tooltip.Content>
        </Tooltip>

        <Tooltip side="top">
          <Tooltip.Trigger asChild>
            <span
              tabIndex={0}
              className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium"
              style={{
                background: 'var(--color-warning-100)',
                color: 'var(--color-warning-800)',
                cursor: 'default',
              }}
            >
              Review
            </span>
          </Tooltip.Trigger>
          <Tooltip.Content>Pending adjuster review before next action</Tooltip.Content>
        </Tooltip>

        <Tooltip side="top">
          <Tooltip.Trigger asChild>
            <span
              tabIndex={0}
              className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium"
              style={{
                background: 'var(--color-danger-100)',
                color: 'var(--color-danger-800)',
                cursor: 'default',
              }}
            >
              Disputed
            </span>
          </Tooltip.Trigger>
          <Tooltip.Content>
            Claimant has opened a formal dispute — legal hold active
          </Tooltip.Content>
        </Tooltip>
      </section>
    </div>
  );
}
