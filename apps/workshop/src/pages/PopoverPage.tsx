import { Popover } from '@soribashi/ui';

const PLACEMENTS = ['top', 'right', 'bottom', 'left'] as const;

export function PopoverPage() {
  return (
    <div>
      <h1>Popover</h1>
      <p>
        A compound recipe over Base UI's Popover: portal, positioner, and a pure-CSS enter/exit
        animation driven by <code>[data-starting-style]</code>/<code>[data-ending-style]</code>.
      </p>

      <h2>Basic</h2>
      <Popover.Root>
        <Popover.Trigger>Open popover</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Popover title</Popover.Title>
          <Popover.Description>
            A short description of what this popover is showing.
          </Popover.Description>
          <Popover.Close>Close</Popover.Close>
        </Popover.Content>
      </Popover.Root>

      <h2>Placement</h2>
      <div style={{ display: 'flex', gap: '1.5rem', padding: '3rem' }}>
        {PLACEMENTS.map((side) => (
          <Popover.Root key={side}>
            <Popover.Trigger>{side}</Popover.Trigger>
            <Popover.Content side={side}>
              <Popover.Title>{side}</Popover.Title>
              <Popover.Description>Positioned on the {side}.</Popover.Description>
            </Popover.Content>
          </Popover.Root>
        ))}
      </div>
    </div>
  );
}
