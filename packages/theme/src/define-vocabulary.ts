import { z } from 'zod';

/**
 * Branded vocabulary container. The product of `defineVocabulary()`.
 *
 * Conventions:
 *   - `__vocab` brand prevents arbitrary objects from being mistaken for vocabularies.
 *   - `schema` is a Zod enum that validates incoming values at render time.
 *   - `values` is the readonly tuple of accepted strings; preserved as literal types
 *     via the `const` modifier on the generic parameter.
 *   - `type` is a phantom (`undefined` at runtime); reachable only via TypeScript's
 *     `typeof vocab['type']` for type extraction.
 *
 * NOT directly constructible — consumers must go through `defineVocabulary()` so
 * the Zod schema and values stay in lockstep.
 */
export interface Vocabulary<T extends string = string> {
  readonly __vocab: true;
  readonly schema: z.ZodEnum<[T, ...T[]]>;
  readonly values: readonly T[];
  /** Phantom type — never set at runtime. Use `typeof vocab['type']` for type extraction. */
  readonly type?: T;
}

/**
 * The only sanctioned way to declare a vocabulary.
 *
 * The `const` modifier on the generic preserves literal types so
 * `defineVocabulary(['compact', 'standard'])` infers `Vocabulary<'compact' | 'standard'>`
 * rather than `Vocabulary<string>`. Consumers don't need to write `as const`.
 *
 * @example
 * const sizeVocab = defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl']);
 * type Size = typeof sizeVocab['type'];  // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * sizeVocab.schema.safeParse('xs');  // { success: true, data: 'xs' }
 * sizeVocab.schema.safeParse('huge');  // { success: false, ... }
 */
export function defineVocabulary<const T extends string>(
  values: readonly [T, ...T[]],
): Vocabulary<T> {
  return {
    __vocab: true,
    schema: z.enum(values as unknown as [T, ...T[]]),
    values,
  };
}
