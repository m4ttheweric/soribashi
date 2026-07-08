import { useState } from 'react';
import { Field } from '../recipes/Field/Field.tsx';
import { Select } from '../recipes/Select/Select.tsx';

export function SelectDemo() {
  const [fruit, setFruit] = useState<string | undefined>(undefined);
  const [timezone, setTimezone] = useState('utc');

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Select</h2>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-(--text-muted)">Standalone</h3>
        <div className="flex flex-wrap items-center gap-6">
          <Select value={fruit} onValueChange={setFruit}>
            <Select.Trigger className="w-[180px]">
              <Select.Value placeholder="Pick a fruit" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="apple">Apple</Select.Item>
              <Select.Item value="banana">Banana</Select.Item>
              <Select.Item value="blueberry">Blueberry</Select.Item>
              <Select.Item value="grape" disabled>
                Grape (out of stock)
              </Select.Item>
              <Select.Item value="pineapple">Pineapple</Select.Item>
            </Select.Content>
          </Select>

          <Select disabled defaultValue="apple">
            <Select.Trigger className="w-[180px]">
              <Select.Value placeholder="Disabled" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="apple">Apple</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-(--text-muted)">
          With groups, labels, and a separator
        </h3>
        <div className="flex flex-wrap items-center gap-6">
          <Select defaultValue="est">
            <Select.Trigger className="w-[220px]">
              <Select.Value placeholder="Select a timezone" />
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.Label>North America</Select.Label>
                <Select.Item value="est">Eastern Standard Time (EST)</Select.Item>
                <Select.Item value="cst">Central Standard Time (CST)</Select.Item>
                <Select.Item value="mst">Mountain Standard Time (MST)</Select.Item>
                <Select.Item value="pst">Pacific Standard Time (PST)</Select.Item>
              </Select.Group>
              <Select.Separator />
              <Select.Group>
                <Select.Label>Europe &amp; Africa</Select.Label>
                <Select.Item value="gmt">Greenwich Mean Time (GMT)</Select.Item>
                <Select.Item value="cet">Central European Time (CET)</Select.Item>
              </Select.Group>
            </Select.Content>
          </Select>
        </div>
      </section>

      <section className="max-w-[24rem] space-y-6">
        <h3 className="text-sm font-medium text-(--text-muted)">Wrapped in Field</h3>

        <Field
          label="Timezone"
          description="Used for scheduling and notification times."
          htmlFor="timezone-select"
        >
          <Select value={timezone} onValueChange={setTimezone}>
            <Select.Trigger id="timezone-select" className="w-full">
              <Select.Value placeholder="Select a timezone" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="utc">Coordinated Universal Time (UTC)</Select.Item>
              <Select.Item value="est">Eastern Standard Time (EST)</Select.Item>
              <Select.Item value="pst">Pacific Standard Time (PST)</Select.Item>
            </Select.Content>
          </Select>
        </Field>

        <Field
          label="Role"
          description="Required to grant the correct permissions."
          error="Please select a role before continuing."
          htmlFor="role-select"
        >
          <Select required>
            <Select.Trigger id="role-select" className="w-full">
              <Select.Value placeholder="Select a role" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="admin">Admin</Select.Item>
              <Select.Item value="editor">Editor</Select.Item>
              <Select.Item value="viewer">Viewer</Select.Item>
            </Select.Content>
          </Select>
        </Field>
      </section>
    </div>
  );
}
