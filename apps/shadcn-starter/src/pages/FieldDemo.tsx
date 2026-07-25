import { Button } from '../recipes/Button/Button.tsx';
import { Checkbox } from '../recipes/Checkbox/Checkbox.tsx';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '../recipes/Field/Field.tsx';
import { Select } from '../recipes/Select/Select.tsx';

/**
 * Exercises every part of the Field family, including the ones no other page
 * reaches: FieldSet, FieldLegend, FieldTitle, and orientation="responsive".
 * Responsive only reflows against a FieldGroup container, so the two column
 * widths below are the point of that section, not decoration.
 *
 * The narrow column stays a raw `w-[18rem]` on purpose: it is calibrated to sit
 * below Field's `@md/field-group` breakpoint (28rem). `w-2xs` is the same value
 * but hides why that number was chosen.
 */
export function FieldDemo() {
  return (
    <div className="space-y-10">
      <h2 className="font-semibold text-lg">Field</h2>

      <section className="max-w-md space-y-4">
        <h3 className="font-medium text-(--text-muted) text-sm">Vertical (default)</h3>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="field-name">Name</FieldLabel>
            <input
              id="field-name"
              className="h-9 rounded-md border border-(--border-input) bg-(--surface-raised) px-3 text-sm"
            />
            <FieldDescription>Shown on your public profile.</FieldDescription>
          </Field>

          <Field invalid>
            <FieldLabel htmlFor="field-email">Email</FieldLabel>
            <input
              id="field-email"
              className="h-9 rounded-md border border-(--border-input) bg-(--surface-raised) px-3 text-sm"
            />
            <FieldError
              errors={[{ message: 'Enter a valid address' }, { message: 'Must not be a alias' }]}
            />
          </Field>
        </FieldGroup>
      </section>

      <section className="max-w-md space-y-4">
        <h3 className="font-medium text-(--text-muted) text-sm">Horizontal, with FieldContent</h3>
        <FieldGroup>
          <Field orientation="horizontal">
            <Checkbox id="field-terms" />
            <FieldContent>
              <FieldLabel htmlFor="field-terms">Accept terms</FieldLabel>
              <FieldDescription>The control keeps its baseline against the label.</FieldDescription>
            </FieldContent>
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Notifications</FieldTitle>
              <FieldDescription>FieldTitle is a div, so it claims no control.</FieldDescription>
            </FieldContent>
            <Button size="sm" variant="outline">
              Configure
            </Button>
          </Field>
        </FieldGroup>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-(--text-muted) text-sm">
          Responsive (reflows on the FieldGroup container, not the viewport)
        </h3>
        <div className="flex gap-6">
          <div className="w-[18rem] rounded-md border border-(--border-default) border-dashed p-3">
            <p className="mb-2 text-(--text-muted) text-xs">narrow container: stacks</p>
            <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel htmlFor="field-role-narrow">Role</FieldLabel>
                <Select>
                  <Select.Trigger id="field-role-narrow" className="w-full">
                    <Select.Value placeholder="Pick a role" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="admin">Admin</Select.Item>
                    <Select.Item value="viewer">Viewer</Select.Item>
                  </Select.Content>
                </Select>
              </Field>
            </FieldGroup>
          </div>
          <div className="flex-1 rounded-md border border-(--border-default) border-dashed p-3">
            <p className="mb-2 text-(--text-muted) text-xs">wide container: rows</p>
            <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel htmlFor="field-role-wide">Role</FieldLabel>
                <Select>
                  <Select.Trigger id="field-role-wide" className="w-full">
                    <Select.Value placeholder="Pick a role" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="admin">Admin</Select.Item>
                    <Select.Item value="viewer">Viewer</Select.Item>
                  </Select.Content>
                </Select>
              </Field>
            </FieldGroup>
          </div>
        </div>
      </section>

      <section className="max-w-md space-y-4">
        <h3 className="font-medium text-(--text-muted) text-sm">FieldSet and FieldLegend</h3>
        <FieldSet>
          <FieldLegend>Preferences</FieldLegend>
          <FieldDescription>Legend variant sets the heading scale.</FieldDescription>
          <FieldGroup>
            <Field orientation="horizontal">
              <Checkbox id="field-weekly" />
              <FieldContent>
                <FieldLabel htmlFor="field-weekly">Weekly digest</FieldLabel>
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="field-product" />
              <FieldContent>
                <FieldLabel htmlFor="field-product">Product updates</FieldLabel>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">Compact legend</FieldLegend>
          <FieldDescription>variant="label" drops it to the label scale.</FieldDescription>
        </FieldSet>
      </section>
    </div>
  );
}
