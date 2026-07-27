import { TextInput, uiVocabulary } from '@soribashi/ui';

const SIZES = uiVocabulary.size.values;

export function TextInputPage() {
  return (
    <div>
      <h1>TextInput</h1>
      <p>Sizes, plus the labelled, description, error, and disabled states.</p>

      <h2>Sizes</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '20rem' }}>
        {SIZES.map((size) => (
          <TextInput key={size} size={size} placeholder={size} />
        ))}
      </div>

      <h2>States</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '20rem' }}>
        <TextInput placeholder="Bare, no anatomy" />
        <TextInput label="Email" description="We never share it." defaultValue="ada@example.com" />
        <TextInput label="Email" error="Required" />
        <TextInput label="Email" description="Disabled" disabled defaultValue="ada@example.com" />
      </div>
    </div>
  );
}
