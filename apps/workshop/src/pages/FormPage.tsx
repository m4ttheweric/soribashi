import { Field, RadioGroup, Switch, Textarea, TextInput } from '@soribashi/ui';

/**
 * The two-mode Field anatomy proof: the same four controls (TextInput,
 * Textarea, Switch, RadioGroup), rendered twice with identical labels,
 * descriptions, and an error on the name field. The left column uses each
 * control's own convenience props (`label`/`description`/`error`); the right
 * column hand-composes the SAME anatomy with `Field.Root` + `Field.Label` +
 * a bare control + `Field.Description` + `Field.Error match`. Convenience
 * props and a hand-composed ancestor Field are mutually exclusive per
 * control (giving a control anatomy props while nested in a hand-composed
 * Field.Root triggers a dev warning by design), so the right column's
 * controls are passed NO label/description/error props at all -- Field owns
 * that anatomy instead. Same visible anatomy in both columns IS the demo.
 */

const PLANS = [
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro', description: 'Everything in Free, plus priority support.' },
];

function ConveniencePropsColumn() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '20rem' }}>
      <TextInput label="Name" description="Your full name." error="Required" />
      <Textarea label="Bio" description="A short introduction." rows={3} />
      <Switch label="Notifications" description="Email me about updates." defaultChecked />
      <RadioGroup label="Plan" description="Choose a plan." items={PLANS} defaultValue="free" />
    </div>
  );
}

function HandComposedColumn() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '20rem' }}>
      <Field.Root invalid>
        <Field.Label>Name</Field.Label>
        <TextInput />
        <Field.Description>Your full name.</Field.Description>
        <Field.Error match>Required</Field.Error>
      </Field.Root>

      <Field.Root>
        <Field.Label>Bio</Field.Label>
        <Textarea rows={3} />
        <Field.Description>A short introduction.</Field.Description>
      </Field.Root>

      <Field.Root data-layout="row">
        <Field.Label>Notifications</Field.Label>
        <Switch defaultChecked />
        <Field.Description>Email me about updates.</Field.Description>
      </Field.Root>

      <Field.Root>
        <Field.Label>Plan</Field.Label>
        <RadioGroup items={PLANS} defaultValue="free" />
        <Field.Description>Choose a plan.</Field.Description>
      </Field.Root>
    </div>
  );
}

export function FormPage() {
  return (
    <div>
      <h1>Form</h1>
      <p>
        The two-mode Field anatomy contract, side by side: the same four controls, same labels,
        descriptions, and error, once via convenience props and once hand-composed inside{' '}
        <code>Field.Root</code>. The two columns should look identical.
      </p>

      <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
        <div>
          <h2>Convenience props</h2>
          <ConveniencePropsColumn />
        </div>
        <div>
          <h2>Hand-composed Field</h2>
          <HandComposedColumn />
        </div>
      </div>
    </div>
  );
}
