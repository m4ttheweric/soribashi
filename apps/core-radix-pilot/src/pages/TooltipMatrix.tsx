/**
 * TooltipMatrix — variant × side matrix + special cases for the Tooltip recipe.
 *
 * Covers:
 *   - 2 × 4 grid: variant ∈ {default, inverted} × side ∈ {top, right, bottom, left}
 *   - Long-content tooltip (forces wrapping within max-width)
 *   - withArrow={false} special case
 *   - Controlled open/close via open + onOpenChange
 */
import { useState } from 'react';
import { Tooltip } from '../recipes/Tooltip/Tooltip.tsx';

const VARIANTS = ['default', 'inverted'] as const;
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
                  <button
                    style={{
                      padding: '6px 14px',
                      fontFamily: 'var(--font-family-sans)',
                      fontSize: 'var(--font-size-sm)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-raised)',
                      color: 'var(--text-default)',
                    }}
                  >
                    hover me
                  </button>
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
              <button style={triggerStyle}>long content</button>
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
              <button style={triggerStyle}>no arrow</button>
            </Tooltip.Trigger>
            <Tooltip.Content withArrow={false}>No arrow on this one.</Tooltip.Content>
          </Tooltip>
        </SpecialCase>

        {/* Controlled open */}
        <SpecialCase label="controlled">
          <ControlledTooltip />
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

function ControlledTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <button style={triggerStyle}>controlled</button>
        </Tooltip.Trigger>
        <Tooltip.Content>open is {String(open)}</Tooltip.Content>
      </Tooltip>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          ...triggerStyle,
          background: 'var(--surface-raised)',
          color: 'var(--text-accent)',
        }}
      >
        toggle
      </button>
    </div>
  );
}

const triggerStyle: React.CSSProperties = {
  padding: '6px 14px',
  fontFamily: 'var(--font-family-sans)',
  fontSize: 'var(--font-size-sm)',
  cursor: 'pointer',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--surface-raised)',
  color: 'var(--text-default)',
};
