import { Checkbox, uiVocabulary } from '@soribashi/ui';
import { useState } from 'react';

const SIZES = uiVocabulary.size.values;
const INTENTS = uiVocabulary.intent.values;

export function CheckboxPage() {
  const [checked, setChecked] = useState(false);

  return (
    <div>
      <h1>Checkbox</h1>
      <p>Sizes and intents, plus the unchecked, checked, indeterminate, and disabled states.</p>

      <h2>Sizes</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {SIZES.map((size) => (
          <Checkbox key={size} size={size} label={size} defaultChecked />
        ))}
      </div>

      <h2>Intents</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {INTENTS.map((intent) => (
          <Checkbox key={intent} intent={intent} label={intent} defaultChecked />
        ))}
      </div>

      <h2>States</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Checkbox label="Unchecked" />
        <Checkbox
          label="Checked (controlled, toggles)"
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
        />
        <Checkbox label="Indeterminate" indeterminate />
        <Checkbox label="Disabled, unchecked" disabled />
        <Checkbox label="Disabled, checked" disabled defaultChecked />
      </div>
    </div>
  );
}
