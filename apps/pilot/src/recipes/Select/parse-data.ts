/**
 * Select data model and parser, ported from Mantine's Combobox.
 * Reference: mantine core/components/Combobox/{Combobox.types.ts, get-parsed-combobox-data}.
 */
export type Primitive = string | number | boolean;

export interface ComboboxItem<V extends Primitive = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface ComboboxGroup<V extends Primitive = string> {
  group: string;
  items: (V | ComboboxItem<V>)[];
}

export type SelectData<V extends Primitive = string> = readonly (
  | V
  | ComboboxItem<V>
  | ComboboxGroup<V>
)[];

export type ParsedItem<V extends Primitive = string> =
  | ComboboxItem<V>
  | { group: string; items: ComboboxItem<V>[] };

function parseItem<V extends Primitive>(
  item: V | ComboboxItem<V> | ComboboxGroup<V>,
): ParsedItem<V> {
  if (typeof item !== 'object') {
    return { value: item, label: `${item}` };
  }
  if ('group' in item) {
    return { group: item.group, items: item.items.map((i) => parseItem<V>(i) as ComboboxItem<V>) };
  }
  if (!('label' in item)) {
    // Defensive: a value-only object (no `label`). Not part of the typed
    // SelectData surface, so `item` narrows to `never` here; cast to read it.
    const valueOnly = item as { value: V; disabled?: boolean };
    return { value: valueOnly.value, label: `${valueOnly.value}`, disabled: valueOnly.disabled };
  }
  return item;
}

export function parseSelectData<V extends Primitive>(
  data: SelectData<V> | undefined,
): ParsedItem<V>[] {
  if (!data) {
    return [];
  }
  return data.map((item) => parseItem<V>(item));
}

export function flattenOptions<V extends Primitive>(parsed: ParsedItem<V>[]): ComboboxItem<V>[] {
  const out: ComboboxItem<V>[] = [];
  for (const item of parsed) {
    if ('group' in item) {
      out.push(...item.items);
    } else {
      out.push(item);
    }
  }
  return out;
}
