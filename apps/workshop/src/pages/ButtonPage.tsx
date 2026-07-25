import { Button, uiVocabulary } from '@soribashi/ui';

const INTENTS = uiVocabulary.intent.values;
const VARIANTS = uiVocabulary.variant.values;
const SIZES = uiVocabulary.size.values;

export function ButtonPage() {
  return (
    <div>
      <h1>Button</h1>
      <p>Every intent x variant combination, the size scale, and disabled examples.</p>

      <h2>Intent x variant</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem' }} />
              {VARIANTS.map((variant) => (
                <th key={variant} style={{ textAlign: 'left', padding: '0.5rem' }}>
                  {variant}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INTENTS.map((intent) => (
              <tr key={intent}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>{intent}</th>
                {VARIANTS.map((variant) => (
                  <td key={variant} style={{ padding: '0.5rem' }}>
                    <Button intent={intent} variant={variant}>
                      {intent}
                    </Button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Sizes</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {SIZES.map((size) => (
          <Button key={size} size={size}>
            {size}
          </Button>
        ))}
      </div>

      <h2>Disabled</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {VARIANTS.map((variant) => (
          <Button key={variant} variant={variant} disabled>
            {variant}
          </Button>
        ))}
      </div>
    </div>
  );
}
