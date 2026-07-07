import { Badge } from '../recipes/Badge/Badge.tsx';
import { intents as INTENTS, sizes as SIZES, badgeVariants as VARIANTS } from '../theme/index.ts';

export function BadgeMatrix() {
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Badge</h2>
      {VARIANTS.map((variant) => (
        <div key={variant} className="space-y-2">
          <h3 className="text-sm font-medium text-(--text-muted)">{variant}</h3>
          <div className="flex flex-wrap gap-2">
            {INTENTS.map((intent) => (
              <Badge key={intent} variant={variant} intent={intent}>
                {intent}
              </Badge>
            ))}
          </div>
        </div>
      ))}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-(--text-muted)">sizes</h3>
        <div className="flex flex-wrap items-center gap-2">
          {SIZES.map((size) => (
            <Badge key={size} size={size}>
              {size}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
