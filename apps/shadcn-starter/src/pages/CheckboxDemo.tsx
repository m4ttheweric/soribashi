import { useState } from 'react';
import { Checkbox } from '../recipes/Checkbox/Checkbox.tsx';
import { Field } from '../recipes/Field/Field.tsx';

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

        <Field label="Accept terms and conditions" htmlFor="terms">
          <div className="flex items-center gap-2">
            <Checkbox id="terms" />
            <label htmlFor="terms" className="text-sm">
              I agree to the terms of service
            </label>
          </div>
        </Field>

        <Field
          label="Marketing emails"
          description="Receive occasional product updates and announcements."
          htmlFor="marketing"
        >
          <div className="flex items-center gap-2">
            <Checkbox id="marketing" checked={marketing} onCheckedChange={setMarketing} />
            <label htmlFor="marketing" className="text-sm">
              Subscribe
            </label>
          </div>
        </Field>

        <Field
          label="Accept terms"
          description="You must accept the terms to continue."
          error="You must accept the terms before submitting."
          htmlFor="required-terms"
        >
          <div className="flex items-center gap-2">
            <Checkbox id="required-terms" required />
            <label htmlFor="required-terms" className="text-sm">
              I have read and agree
            </label>
          </div>
        </Field>
      </section>
    </div>
  );
}
