import { Select } from '@soribashi/ui';

interface Fruit {
  label: string;
  value: string;
}

const FRUITS: Fruit[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
];

interface Grouped {
  label: string;
  value: string;
  group: string;
}

const GROUPED_ITEMS: Grouped[] = [
  { label: 'Apple', value: 'apple', group: 'Fruit' },
  { label: 'Carrot', value: 'carrot', group: 'Vegetable' },
  { label: 'Banana', value: 'banana', group: 'Fruit' },
  { label: 'Potato', value: 'potato', group: 'Vegetable' },
];

export function SelectPage() {
  return (
    <div>
      <h1>Select</h1>
      <p>Flat items and grouped items, with and without a placeholder.</p>

      {/*
        Select fills its container (Select.module.css's `.trigger` reads
        `inline-size: 100%`, the same rule TextInput and Textarea carry), so
        the demo constrains the field width here rather than in the recipe --
        the identical `maxWidth: '20rem'` wrapper TextInputPage uses for the
        same reason. Before the recipe's breakpoint-token min-width was
        removed, this page rendered at that floor (384px) with no wrapper.
      */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '20rem' }}>
        <h2>Flat, with placeholder</h2>
        <Select items={FRUITS} placeholder="Pick a fruit" />

        <h2>Flat, no placeholder (defaults to first item)</h2>
        <Select items={FRUITS} defaultValue={FRUITS[0]!.value} />

        <h2>Grouped, with placeholder</h2>
        <Select items={GROUPED_ITEMS} getGroup={(item) => item.group} placeholder="Pick a food" />

        <h2>Grouped, no placeholder (defaults to first item)</h2>
        <Select
          items={GROUPED_ITEMS}
          getGroup={(item) => item.group}
          defaultValue={GROUPED_ITEMS[0]!.value}
        />
      </div>
    </div>
  );
}
