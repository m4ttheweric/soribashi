import { Button } from '../recipes/Button/Button.tsx';

const INTENTS = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const VARIANTS = ['filled', 'outline', 'subtle', 'ghost', 'link'] as const;
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export function ButtonMatrix() {
  return (
    <div className="space-y-8">
      {VARIANTS.map((variant) => (
        <section key={variant}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">{variant}</h2>
          <div className="flex flex-wrap items-center gap-2">
            {INTENTS.map((intent) => (
              <Button key={intent} intent={intent} variant={variant}>
                {intent}
              </Button>
            ))}
          </div>
        </section>
      ))}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">sizes</h2>
        <div className="flex items-center gap-2">
          {SIZES.map((size) => (
            <Button key={size} size={size}>
              {size}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
