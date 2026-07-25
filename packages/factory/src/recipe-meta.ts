export interface RecipeMeta {
  builder:
    | 'defineComponent'
    | 'definePolymorphicComponent'
    | 'defineCompound'
    | 'defineGenericComponent';
  name: string;
  /** Style slots: `selectors` for single components, part names for compounds. */
  slots: readonly string[];
  vocabularyAxes: readonly string[];
  variants: readonly string[];
  defaults: Readonly<Record<string, unknown>>;
}

/**
 * Attaches derivation metadata to a built recipe component. Non-enumerable so
 * it never leaks through prop spreads or Object.keys; frozen so downstream
 * tooling (manifest generation) can trust it as a value, not a mutable bag.
 */
export function attachRecipeMeta<T extends object>(component: T, meta: RecipeMeta): T {
  Object.defineProperty(component, 'recipeMeta', {
    value: Object.freeze({
      ...meta,
      slots: [...meta.slots],
      vocabularyAxes: [...meta.vocabularyAxes],
      variants: [...meta.variants],
      defaults: Object.freeze({ ...meta.defaults }),
    }),
    enumerable: false,
  });
  return component;
}

export function getRecipeMeta(component: unknown): RecipeMeta | undefined {
  if (component === null || (typeof component !== 'object' && typeof component !== 'function')) {
    return undefined;
  }
  return (component as { recipeMeta?: RecipeMeta }).recipeMeta;
}
