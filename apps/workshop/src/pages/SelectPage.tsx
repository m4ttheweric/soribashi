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
  );
}
