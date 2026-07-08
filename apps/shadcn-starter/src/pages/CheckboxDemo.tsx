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

      <section className="max-w-[24rem] space-y-6">
        <h3 className="text-sm font-medium text-(--text-muted)">Wrapped in Field</h3>

        <Field htmlFor="terms">
          <div className="flex items-start gap-2">
            <Checkbox id="terms" />
            <div className="space-y-1">
              <label htmlFor="terms" className="text-sm font-medium leading-none">
                Accept terms and conditions
              </label>
              <p className="text-sm text-(--text-muted)">I agree to the terms of service</p>
            </div>
          </div>
        </Field>

        <Field
          description="Receive occasional product updates and announcements."
          htmlFor="marketing"
        >
          <div className="flex items-start gap-2">
            <Checkbox id="marketing" checked={marketing} onCheckedChange={setMarketing} />
            <div className="space-y-1">
              <label htmlFor="marketing" className="text-sm font-medium leading-none">
                Marketing emails
              </label>
              <p className="text-sm text-(--text-muted)">Subscribe</p>
            </div>
          </div>
        </Field>

        <Field
          description="You must accept the terms to continue."
          error="You must accept the terms before submitting."
          htmlFor="required-terms"
        >
          <div className="flex items-start gap-2">
            <Checkbox id="required-terms" required />
            <div className="space-y-1">
              <label htmlFor="required-terms" className="text-sm font-medium leading-none">
                Accept terms
              </label>
              <p className="text-sm text-(--text-muted)">I have read and agree</p>
            </div>
          </div>
        </Field>
      </section>
    </div>
  );
}
