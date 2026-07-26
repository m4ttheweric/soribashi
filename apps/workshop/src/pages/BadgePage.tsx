import { Badge, uiVocabulary } from '@soribashi/ui';

const INTENTS = uiVocabulary.intent.values;
const VARIANTS = ['filled', 'outline', 'subtle'] as const;
const SIZES = uiVocabulary.size.values;

export function BadgePage() {
  return (
    <div>
      <h1>Badge</h1>
      <p>Every intent x variant combination, the size scale, and polymorphic `as`.</p>

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
                    <Badge intent={intent} variant={variant}>
                      {intent}
                    </Badge>
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
          <Badge key={size} size={size}>
            {size}
          </Badge>
        ))}
      </div>

      <h2>Polymorphic `as`</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Badge>span (default)</Badge>
        <Badge as="a" href="#">
          a
        </Badge>
        <Badge as="div">div</Badge>
      </div>
    </div>
  );
}
