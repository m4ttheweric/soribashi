import { Tooltip } from '../recipes/Tooltip/Tooltip.tsx';

const positions = [
  { side: 'top', label: 'Top' },
  { side: 'right', label: 'Right' },
  { side: 'bottom', label: 'Bottom' },
  { side: 'left', label: 'Left' },
] as const;

export function TooltipDemo() {
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Tooltip</h2>
      <div className="flex flex-wrap items-center gap-6">
        {positions.map(({ side, label }) => (
          <Tooltip key={side}>
            <Tooltip.Trigger>
              <button
                type="button"
                className="rounded-md border border-(--border-default) bg-(--surface-raised) px-4 py-2 text-sm"
              >
                {label}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content side={side}>Tooltip on {label.toLowerCase()}</Tooltip.Content>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
