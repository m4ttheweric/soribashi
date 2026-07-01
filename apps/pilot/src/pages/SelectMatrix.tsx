import { useState } from 'react';
import { Select } from '../recipes/Select/Select.tsx';

const sizes = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

export function SelectMatrix() {
  // `sizes` is not `as const`, so V infers as `string` here; the literal-union
  // narrowing is proven by the inline-data compile-time test in Select.test.tsx.
  const [single, setSingle] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  return (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: 320, padding: '1.5rem' }}>
      <Select
        data={sizes}
        label="Single"
        description="pick one"
        placeholder="Choose a size"
        value={single}
        onChange={setSingle}
      />
      <Select data={sizes} label="Searchable" placeholder="Type to filter" searchable />
      <Select
        data={sizes}
        label="Multiple"
        placeholder="Choose sizes"
        multiple
        value={multi}
        onChange={(v) => setMulti(v as string[])}
      />
      <Select data={sizes} label="Disabled" placeholder="Unavailable" disabled />
      <Select
        data={sizes}
        label="With error"
        placeholder="Choose"
        error="Required field"
        required
      />
      <Select
        data={sizes}
        label="Clearable (opt-in)"
        placeholder="Choose a size"
        clearable
        value={single}
        onChange={setSingle}
      />
    </div>
  );
}
