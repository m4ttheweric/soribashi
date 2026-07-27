import { RadioGroup, uiVocabulary } from '@soribashi/ui';

const SIZES = uiVocabulary.size.values;
const INTENTS = uiVocabulary.intent.values;

const PLANS = [
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro', description: 'Everything in Free, plus priority support.' },
];

export function RadioGroupPage() {
  return (
    <div>
      <h1>RadioGroup</h1>
      <p>
        Sizes and intents, plus the unselected, selected, disabled, item-description, and
        Field-anatomy states.
      </p>

      <h2>Sizes</h2>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
        {SIZES.map((size) => (
          <RadioGroup key={size} size={size} items={PLANS} defaultValue="pro" label={size} />
        ))}
      </div>

      <h2>Intents</h2>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
        {INTENTS.map((intent) => (
          <RadioGroup
            key={intent}
            intent={intent}
            items={PLANS}
            defaultValue="pro"
            label={intent}
          />
        ))}
      </div>

      <h2>States</h2>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
        <RadioGroup label="Unselected" items={PLANS} />
        <RadioGroup label="Selected" items={PLANS} defaultValue="pro" />
        <RadioGroup label="Disabled" items={PLANS} defaultValue="free" disabled />
      </div>

      <h2>Field anatomy (label + description + error)</h2>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
        <RadioGroup label="Plan" description="Choose a plan" items={PLANS} defaultValue="free" />
        <RadioGroup label="Plan" error="Required" items={PLANS} />
      </div>
    </div>
  );
}
