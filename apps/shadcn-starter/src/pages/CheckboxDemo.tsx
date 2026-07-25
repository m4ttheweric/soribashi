import { useState } from 'react';
import { Checkbox } from '../recipes/Checkbox/Checkbox.tsx';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '../recipes/Field/Field.tsx';

export function CheckboxDemo() {
  const [marketing, setMarketing] = useState<boolean | 'indeterminate'>(false);

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Checkbox</h2>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-(--text-muted)">Standalone</h3>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox id="standalone-unchecked" />
            <label htmlFor="standalone-unchecked" className="text-sm">
              Unchecked
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="standalone-checked" defaultChecked />
            <label htmlFor="standalone-checked" className="text-sm">
              Checked
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="standalone-disabled" disabled />
            <label htmlFor="standalone-disabled" className="text-sm">
              Disabled
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="standalone-disabled-checked" disabled defaultChecked />
            <label htmlFor="standalone-disabled-checked" className="text-sm">
              Disabled + checked
            </label>
          </div>
        </div>
      </section>

      <section className="max-w-sm space-y-6">
        <h3 className="text-sm font-medium text-(--text-muted)">Wrapped in Field</h3>

        <FieldGroup>
          <Field orientation="horizontal">
            <Checkbox id="terms" />
            <FieldContent>
              <FieldLabel htmlFor="terms">Accept terms and conditions</FieldLabel>
              <FieldDescription>I agree to the terms of service</FieldDescription>
            </FieldContent>
          </Field>

          <Field orientation="horizontal">
            <Checkbox id="marketing" checked={marketing} onCheckedChange={setMarketing} />
            <FieldContent>
              <FieldLabel htmlFor="marketing">Marketing emails</FieldLabel>
              <FieldDescription>
                Receive occasional product updates and announcements.
              </FieldDescription>
            </FieldContent>
          </Field>

          <FieldSeparator>or</FieldSeparator>

          <Field orientation="horizontal" invalid>
            <Checkbox id="required-terms" required />
            <FieldContent>
              <FieldLabel htmlFor="required-terms">Accept terms</FieldLabel>
              <FieldDescription>You must accept the terms to continue.</FieldDescription>
              <FieldError errors={[{ message: 'You must accept the terms before submitting.' }]} />
            </FieldContent>
          </Field>
        </FieldGroup>
      </section>
    </div>
  );
}
