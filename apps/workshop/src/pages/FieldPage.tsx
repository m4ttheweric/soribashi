import { Field, Switch, TextInput } from '@soribashi/ui';

export function FieldPage() {
  return (
    <div>
      <h1>Field</h1>
      <p>
        The hand-composed anatomy (Root/Label/Description/Error) wrapping a bare control, the column
        layout, the row layout (<code>data-layout="row"</code>), and a forced error state.
      </p>

      <h2>Column anatomy (default layout)</h2>
      <Field.Root style={{ maxWidth: '20rem' }}>
        <Field.Label>Email</Field.Label>
        <TextInput />
        <Field.Description>We never share it.</Field.Description>
      </Field.Root>

      <h2>Row layout</h2>
      <Field.Root data-layout="row">
        <Field.Label>Notifications</Field.Label>
        <Switch />
        <Field.Description>Email me about updates</Field.Description>
      </Field.Root>

      <h2>Forced error</h2>
      <Field.Root invalid style={{ maxWidth: '20rem' }}>
        <Field.Label>Email</Field.Label>
        <TextInput />
        <Field.Error match>Required</Field.Error>
      </Field.Root>
    </div>
  );
}
