import { Switch, uiVocabulary } from '@soribashi/ui';
import { useState } from 'react';

const SIZES = uiVocabulary.size.values;
const INTENTS = uiVocabulary.intent.values;

export function SwitchPage() {
  const [checked, setChecked] = useState(false);

  return (
    <div>
      <h1>Switch</h1>
      <p>Sizes and intents, plus the unchecked, checked, disabled, and Field-anatomy states.</p>

      <h2>Sizes</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {SIZES.map((size) => (
          <Switch key={size} size={size} label={size} defaultChecked />
        ))}
      </div>

      <h2>Intents</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {INTENTS.map((intent) => (
          <Switch key={intent} intent={intent} label={intent} defaultChecked />
        ))}
      </div>

      <h2>States</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Switch label="Unchecked" />
        <Switch
          label="Checked (controlled, toggles)"
          checked={checked}
          onCheckedChange={(value) => setChecked(value)}
        />
        <Switch label="Disabled, unchecked" disabled />
        <Switch label="Disabled, checked" disabled defaultChecked />
      </div>

      <h2>Field anatomy (label + description + error)</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Switch label="Notifications" description="Email me about updates" defaultChecked />
        <Switch label="Required toggle" error="This field is required" />
      </div>
    </div>
  );
}
