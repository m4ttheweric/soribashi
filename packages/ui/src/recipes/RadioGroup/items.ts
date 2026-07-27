/**
 * Pure item/accessor resolution for RadioGroup<T>, split out of RadioGroup.tsx
 * so it is testable in the node tier (items.test.ts) without a browser: no
 * React, no Base UI, no DOM. Deliberately its own module, NOT an import of
 * Select's items.ts: a cross-recipe import would create a real
 * registryDependencies edge on "select" for what is thirty lines of flat
 * resolution, and RadioGroup needs none of Select's grouping machinery (a
 * radio group has no notion of an item group the way a select listbox does).
 * RadioGroup.tsx calls `resolveRadioGroupItems` once per render and maps the
 * flat result onto Radio.Root/Radio.Indicator plus its own item label/
 * description spans.
 */

/**
 * Accessor functions a caller supplies when its item shape isn't the
 * `{ label, value, description? }` default. Both are optional; a caller with
 * a differently-shaped item only needs to supply the one that applies.
 * Unlike Select's `SelectAccessors`, there is no `getGroup` (a radio group has
 * no grouping concept) and no `getDescription` either: `description` is
 * always read directly off the item (see `ResolvedRadioGroupItem` below),
 * since it is optional passthrough content, not a resolved identity the way
 * label/value are.
 */
export interface RadioGroupAccessors<T> {
  /** Defaults to reading `.label` off the item. */
  getLabel?: (item: T) => string;
  /** Defaults to reading `.value` off the item. */
  getValue?: (item: T) => unknown;
}

/** One item, resolved: the label/value/description RadioGroup actually renders, plus the source item. */
export interface ResolvedRadioGroupItem<T> {
  value: unknown;
  label: string;
  /** Read directly off `item.description`; `undefined` when the item has none. Never accessor-driven. */
  description?: unknown;
  item: T;
}

interface DefaultShape {
  label?: unknown;
  value?: unknown;
  description?: unknown;
}

/**
 * Default `label`/`value` readers, used only when the caller supplies no
 * `getLabel`/`getValue` accessor. Each throws loudly, naming the offending
 * item's index, rather than silently degrading to `''`/`undefined` for an
 * item shape that isn't `{label, value}` -- copying the loud-failure shape
 * from Select's items.ts (its own "fix round 1, Important finding"): a
 * `String(item.label ?? '')`-style fallback would silently render a blank,
 * unlabeled, valueless radio with no error at all for a single
 * non-conforming item. Checking `=== undefined` specifically (not a falsy
 * check) lets a deliberately empty label (`label: ''`) or a deliberately
 * falsy value (`value: 0`/`value: false`) through unharmed; only a genuinely
 * ABSENT property throws.
 */
const defaultGetLabel = <T>(item: T, index: number): string => {
  const label = (item as DefaultShape | null | undefined)?.label;
  if (label === undefined) {
    throw new Error(
      `RadioGroup: item at index ${index} has no "label" property and no getLabel accessor was supplied. Pass getLabel to resolve this item's display text.`,
    );
  }
  return String(label);
};

const defaultGetValue = <T>(item: T, index: number): unknown => {
  const shape = item as DefaultShape | null | undefined;
  if (shape?.value === undefined) {
    throw new Error(
      `RadioGroup: item at index ${index} has no "value" property and no getValue accessor was supplied. Pass getValue to resolve this item's value.`,
    );
  }
  return shape.value;
};

/**
 * Resolves a caller's raw `items` array into the label/value/description
 * RadioGroup renders. Flat only, in the caller's original order: unlike
 * Select's `resolveSelectItems`, there is no grouping pass here at all.
 *
 * Duplicate resolved values are rejected rather than silently accepted: Base
 * UI's RadioGroup identifies the checked radio by comparing each
 * `Radio.Root`'s own `value` against the group's shared checked value, so two
 * items sharing a value make selection ambiguous (both radios would report
 * `aria-checked="true"` simultaneously, with no way for a consumer to tell
 * which was actually clicked). Failing fast here, at resolution time,
 * surfaces that as an authoring error instead of a confusing runtime
 * selection bug.
 */
export function resolveRadioGroupItems<T>(
  items: readonly T[],
  accessors: RadioGroupAccessors<T> = {},
): ResolvedRadioGroupItem<T>[] {
  const resolved: ResolvedRadioGroupItem<T>[] = [];
  const seenValues = new Set<unknown>();

  let index = 0;
  for (const item of items) {
    const value = accessors.getValue ? accessors.getValue(item) : defaultGetValue(item, index);
    if (seenValues.has(value)) {
      throw new Error(
        `RadioGroup: duplicate item value ${JSON.stringify(value)}. Every item's resolved value must be unique.`,
      );
    }
    seenValues.add(value);
    const label = accessors.getLabel ? accessors.getLabel(item) : defaultGetLabel(item, index);
    const description = (item as DefaultShape | null | undefined)?.description;
    resolved.push({ value, label, description, item });
    index += 1;
  }

  return resolved;
}
