/**
 * Pure item/accessor/grouping resolution for Select<T>, deliberately split
 * out of Select.tsx so it is testable in the node tier (items.test.ts)
 * without a browser: no React, no Base UI, no DOM. Select.tsx calls
 * `resolveSelectItems` once per render and maps the result onto
 * `Select.Item`/`Select.Group`/`Select.GroupLabel`.
 */

/**
 * Accessor functions a caller supplies when its item shape isn't the
 * `{ label, value }` default. All three are optional; a caller with a
 * differently-shaped item only needs to supply the ones that apply.
 */
export interface SelectAccessors<T> {
  /** Defaults to reading `.label` off the item. */
  getLabel?: (item: T) => string;
  /** Defaults to reading `.value` off the item. */
  getValue?: (item: T) => unknown;
  /**
   * Optional grouping key. When every item resolves `undefined` (including
   * the common case of no `getGroup` supplied at all), `resolveSelectItems`
   * returns `groups: null`: there is nothing to group by, so the caller
   * renders the flat list instead of a `Select.Group` per bucket.
   */
  getGroup?: (item: T) => string | undefined;
}

/** One item, resolved: the label/value Select actually renders, plus the source item. */
export interface ResolvedSelectItem<T> {
  value: unknown;
  label: string;
  item: T;
}

/** One group: its label plus the resolved items belonging to it, in original order. */
export interface ResolvedSelectGroup<T> {
  group: string;
  items: ResolvedSelectItem<T>[];
}

export interface ResolvedSelectItems<T> {
  /** Every item, resolved, in the caller's original order, regardless of grouping. */
  flat: ResolvedSelectItem<T>[];
  /**
   * Non-null only when at least one item resolves a group key. Group order
   * follows first appearance in `items`; within a group, item order is
   * preserved from `items` (a stable partition, not a sort).
   */
  groups: ResolvedSelectGroup<T>[] | null;
}

interface DefaultShape {
  label?: unknown;
  value?: unknown;
}

/**
 * Default `label`/`value` readers, used only when the caller supplies no
 * `getLabel`/`getValue` accessor. Each throws loudly, naming the offending
 * item's index, rather than silently degrading to `''`/`undefined` for an
 * item shape that isn't `{label, value}` (fix round 1, Important finding):
 * a `String(item.label ?? '')`-style fallback would previously render a
 * blank, unlabeled, valueless option with no error at all for a single
 * non-conforming item, and only accidentally surface as a "duplicate value"
 * throw for two or more (both resolving to the same `undefined`), which is
 * not a designed check for this case. Checking `=== undefined` specifically
 * (not a falsy check) lets a deliberately empty label (`label: ''`) or a
 * deliberately falsy value (`value: 0`/`value: false`) through unharmed;
 * only a genuinely ABSENT property throws.
 */
const defaultGetLabel = <T>(item: T, index: number): string => {
  const label = (item as DefaultShape | null | undefined)?.label;
  if (label === undefined) {
    throw new Error(
      `Select: item at index ${index} has no "label" property and no getLabel accessor was supplied. Pass getLabel to resolve this item's display text.`,
    );
  }
  return String(label);
};

const defaultGetValue = <T>(item: T, index: number): unknown => {
  const shape = item as DefaultShape | null | undefined;
  if (shape?.value === undefined) {
    throw new Error(
      `Select: item at index ${index} has no "value" property and no getValue accessor was supplied. Pass getValue to resolve this item's value.`,
    );
  }
  return shape.value;
};

/**
 * Resolves a caller's raw `items` array into the label/value pairs Select
 * renders, and (optionally) buckets them into groups.
 *
 * Duplicate resolved values are rejected rather than silently accepted:
 * Base UI's Select identifies the selected item by value (`isItemEqualToValue`,
 * `Object.is` by default), so two items sharing a value make selection
 * ambiguous (`onValueChange` could correspond to either item) with no
 * way for a consumer to tell which was actually clicked. Failing fast here,
 * at resolution time, surfaces that as an authoring error instead of a
 * confusing runtime selection bug.
 */
export function resolveSelectItems<T>(
  items: readonly T[],
  accessors: SelectAccessors<T> = {},
): ResolvedSelectItems<T> {
  const getGroup = accessors.getGroup;

  const flat: ResolvedSelectItem<T>[] = [];
  const seenValues = new Set<unknown>();

  let index = 0;
  for (const item of items) {
    const value = accessors.getValue ? accessors.getValue(item) : defaultGetValue(item, index);
    if (seenValues.has(value)) {
      throw new Error(
        `Select: duplicate item value ${JSON.stringify(value)}. Every item's resolved value must be unique.`,
      );
    }
    seenValues.add(value);
    const label = accessors.getLabel ? accessors.getLabel(item) : defaultGetLabel(item, index);
    flat.push({ value, label, item });
    index += 1;
  }

  if (!getGroup) {
    return { flat, groups: null };
  }

  const groupOrder: string[] = [];
  const groupBuckets = new Map<string, ResolvedSelectItem<T>[]>();
  let sawAnyGroup = false;

  for (const resolved of flat) {
    const group = getGroup(resolved.item);
    if (group === undefined) continue;
    sawAnyGroup = true;
    let bucket = groupBuckets.get(group);
    if (!bucket) {
      bucket = [];
      groupBuckets.set(group, bucket);
      groupOrder.push(group);
    }
    bucket.push(resolved);
  }

  if (!sawAnyGroup) {
    return { flat, groups: null };
  }

  const groups = groupOrder.map((group) => ({ group, items: groupBuckets.get(group)! }));
  return { flat, groups };
}
