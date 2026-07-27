import { Textarea, uiVocabulary } from '@soribashi/ui';

const SIZES = uiVocabulary.size.values;

export function TextareaPage() {
  return (
    <div>
      <h1>Textarea</h1>
      <p>Sizes (a MIN height, not a fixed one), plus the labelled, error, and disabled states.</p>

      <h2>Sizes</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '20rem' }}>
        {SIZES.map((size) => (
          <Textarea key={size} size={size} placeholder={size} />
        ))}
      </div>

      <h2>States</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '20rem' }}>
        <Textarea placeholder="Bare, no anatomy" rows={3} />
        <Textarea
          label="Bio"
          description="A short introduction."
          defaultValue="Ada Lovelace"
          rows={3}
        />
        <Textarea label="Bio" error="Required" rows={3} />
        <Textarea
          label="Bio"
          description="Disabled"
          disabled
          defaultValue="Ada Lovelace"
          rows={3}
        />
      </div>
    </div>
  );
}
