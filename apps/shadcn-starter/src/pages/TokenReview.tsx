import { tokenMap } from '../../conversion/token-map.ts';
import { theme } from '../theme/index.ts';

/** Order primary first per spec, then neutral, then remaining intent families. */
const FAMILY_ORDER = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;

const SEMANTIC_TOKENS = [
  '--surface-canvas',
  '--surface-default',
  '--surface-raised',
  '--text-default',
  '--text-muted',
  '--border-default',
  '--border-input',
  '--border-focus',
  '--accent-default',
  '--accent-muted',
];

export function TokenReview() {
  const colors = theme.tokens.colors as Record<string, Record<string, string>>;
  const families = FAMILY_ORDER.filter((family) => family in colors).map(
    (family) => [family, colors[family] ?? {}] as const,
  );

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Token Review</h2>
      <p className="text-sm text-(--text-muted)">
        Primary ramp uses monochrome (near-black neutral). One-line swap in theme/index.ts to
        re-color all intent=primary surfaces.
      </p>
      {families.map(([family, scale]) => (
        <div key={family}>
          <h3 className="mb-2 font-medium text-sm">{family}</h3>
          <div className="flex flex-wrap gap-1">
            {Object.entries(scale).map(([step, value]) => (
              <div key={step} className="text-center">
                <div
                  className="h-10 w-10 rounded border border-(--border-default)"
                  style={{ backgroundColor: value }}
                  title={`${family}-${step}: ${value}`}
                />
                <span className="text-[10px] text-(--text-muted)">{step}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <h3 className="font-medium text-sm">Semantic Tokens</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SEMANTIC_TOKENS.map((v) => (
          <div key={v} className="flex items-center gap-2 text-xs">
            <div
              className="h-6 w-6 rounded border border-(--border-default)"
              style={{ backgroundColor: `var(${v})` }}
            />
            <span className="font-mono">{v}</span>
          </div>
        ))}
      </div>
      <h3 className="font-medium text-sm">Token Map (shadcn to soribashi)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-1 text-left">shadcn</th>
              <th className="p-1 text-left">soribashi</th>
              <th className="p-1 text-left">notes</th>
            </tr>
          </thead>
          <tbody>
            {tokenMap.map((row) => (
              <tr key={row.shadcn}>
                <td className="p-1 font-mono">{row.shadcn}</td>
                <td className="p-1 font-mono">{row.soribashi}</td>
                <td className="p-1">{row.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
