import { Tooltip } from '@soribashi/ui';

const PLACEMENTS = ['top', 'right', 'bottom', 'left'] as const;

export function TooltipPage() {
  return (
    <div>
      <h1>Tooltip</h1>
      <p>
        A compound recipe over Base UI's Tooltip: portal, positioner, and the standard WAI-ARIA
        tooltip <code>aria-describedby</code> wiring.
      </p>

      <h2>Basic</h2>
      <div style={{ padding: '1.5rem 0' }}>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Helpful hint</Tooltip.Content>
        </Tooltip.Root>
      </div>

      <h2>Placement</h2>
      <div style={{ display: 'flex', gap: '1.5rem', padding: '3rem' }}>
        {PLACEMENTS.map((side) => (
          <Tooltip.Root key={side}>
            <Tooltip.Trigger>{side}</Tooltip.Trigger>
            <Tooltip.Content side={side}>Positioned on the {side}.</Tooltip.Content>
          </Tooltip.Root>
        ))}
      </div>
    </div>
  );
}
