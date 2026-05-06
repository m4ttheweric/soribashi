/**
 * TooltipMatrix — variant × side matrix + special cases for the Tooltip recipe.
 *
 * Covers:
 *   - 2 × 4 grid: variant ∈ {default, subtle} × side ∈ {top, right, bottom, left}
 *     (default = inverted-style, the high-contrast "shadcn" tooltip;
 *      subtle = page-surface, opt-in)
 *   - Long-content tooltip (forces wrapping within max-width)
 *   - withArrow={false} special case
 *   - defaultOpen + onOpenChange listener (open-count demo)
 *
 * Note: an earlier version had a "toggle button" that called setOpen(v => !v)
 * to externally control the tooltip. That demo fought Radix's hover semantics
 * — by the time the toggle fires, mouseleave has already driven state to
 * false, so the toggle always observed false and flipped to true. Tooltip is
 * a hover primitive; for click-to-toggle behavior, use Popover instead.
 * Replaced with an `onOpenChange` listener pattern that demonstrates the
 * controlled-state architectural point cleanly.
 */
import { useState } from 'react';
import { Tooltip } from '../recipes/Tooltip/Tooltip.tsx';
import { Button } from '../recipes/Button/Button.tsx';

const VARIANTS = ['default', 'subtle'] as const;
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

export function TooltipMatrix() {
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32, fontFamily: 'var(--font-family-sans)' }}>
      <h2 style={{ color: 'var(--text-default)', margin: 0 }}>Tooltip — variant × side matrix</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        {VARIANTS.map((variant) =>
          SIDES.map((side) => (
            <div
              key={`${variant}-${side}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: 16,
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-default)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}
              >
                {variant} / {side}
              </span>
              <Tooltip variant={variant} side={side}>
                <Tooltip.Trigger asChild>
                  <Button intent="neutral" variant="outline" size="sm">
                    hover me
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  {variant} variant on {side}
                </Tooltip.Content>
              </Tooltip>
            </div>
          )),
        )}
      </div>

      <h2 style={{ color: 'var(--text-default)', margin: 0 }}>Special cases</h2>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Long content — should wrap within max-width constraint */}
        <SpecialCase label="long content">
          <Tooltip>
            <Tooltip.Trigger asChild>
              <Button intent="neutral" variant="outline" size="sm">long content</Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              A really long tooltip content that should wrap nicely within the max-width constraint
              and not overflow the viewport on any side. Lorem ipsum dolor sit amet.
            </Tooltip.Content>
          </Tooltip>
        </SpecialCase>

        {/* No arrow */}
        <SpecialCase label="withArrow={false}">
          <Tooltip>
            <Tooltip.Trigger asChild>
              <Button intent="neutral" variant="outline" size="sm">no arrow</Button>
            </Tooltip.Trigger>
            <Tooltip.Content withArrow={false}>No arrow on this one.</Tooltip.Content>
          </Tooltip>
        </SpecialCase>

        {/* defaultOpen + onOpenChange listener */}
        <SpecialCase label="defaultOpen + listen">
          <DefaultOpenWithListener />
        </SpecialCase>
      </div>
    </div>
  );
}

function SpecialCase({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        padding: 16,
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-default)',
        minWidth: 160,
      }}
    >
      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{label}</span>
      {children}
    </div>
  );
}

/**
 * Demonstrates `defaultOpen` (initial state) + `onOpenChange` listener
 * (consumer subscribes to state changes). Tooltip starts open on mount,
 * counts how many times it has opened. The consumer never tries to drive
 * `open` externally — Radix owns hover, the consumer just listens.
 */
function DefaultOpenWithListener() {
  const [openCount, setOpenCount] = useState(1); // starts open via defaultOpen
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Tooltip defaultOpen onOpenChange={(open: boolean) => open && setOpenCount((c) => c + 1)}>
        <Tooltip.Trigger asChild>
          <Button intent="neutral" variant="outline" size="sm">hover me</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>opened {openCount}×</Tooltip.Content>
      </Tooltip>
      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
        opens: {openCount}
      </span>
    </div>
  );
}
