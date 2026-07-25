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
  // The nested arrays and defaults object are reference-shared across every
  // getRecipeMeta() call for this component (they are copied once here, not
  // per call), so each one must be frozen individually. Freezing only the
  // outer object would leave them mutable in place, silently corrupting the
  // value every future caller receives.
  Object.defineProperty(component, 'recipeMeta', {
    value: Object.freeze({
      ...meta,
      slots: Object.freeze([...meta.slots]),
      vocabularyAxes: Object.freeze([...meta.vocabularyAxes]),
      variants: Object.freeze([...meta.variants]),
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
