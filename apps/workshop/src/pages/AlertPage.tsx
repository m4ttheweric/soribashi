import { Alert, uiVocabulary } from '@soribashi/ui';
import { useState } from 'react';

const INTENTS = uiVocabulary.intent.values;
const VARIANTS = ['filled', 'outline', 'light'] as const;

function BellIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M8 1a4 4 0 0 0-4 4v2.2c0 .5-.2 1-.6 1.4L2 10h12l-1.4-1.4a2 2 0 0 1-.6-1.4V5a4 4 0 0 0-4-4Zm0 13a1.7 1.7 0 0 0 1.7-1.5H6.3A1.7 1.7 0 0 0 8 14Z" />
    </svg>
  );
}

export function AlertPage() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div>
      <h1>Alert</h1>
      <p>Every intent x variant combination, the title and icon slots, and the close button.</p>

      <h2>Intent x variant</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {INTENTS.map((intent) => (
          <div key={intent} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {VARIANTS.map((variant) => (
              <Alert
                key={variant}
                intent={intent}
                variant={variant}
                title={`${intent} / ${variant}`}
              >
                An alert with intent="{intent}" and variant="{variant}".
              </Alert>
            ))}
          </div>
        ))}
      </div>

      <h2>Icon</h2>
      <Alert intent="info" variant="light" icon={<BellIcon />} title="With an icon">
        Rendered in the icon slot, before the title and body.
      </Alert>

      <h2>Close button</h2>
      {dismissed ? (
        <button type="button" onClick={() => setDismissed(false)}>
          Reset dismissed alert
        </button>
      ) : (
        <Alert
          intent="warning"
          variant="filled"
          title="Dismissible"
          withCloseButton
          onClose={() => setDismissed(true)}
        >
          Click the close button to dismiss this alert.
        </Alert>
      )}
    </div>
  );
}
