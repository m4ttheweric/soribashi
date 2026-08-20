import type { VocabularyAxis } from './types/vocabulary-axes.ts';

/**
 * Derives the root-slot data attributes for a recipe's declared vocabulary
 * axes. Emission through getStyles (spec C4) is what lets recipes stop
 * hand-writing data-variant/data-intent/data-size, and what CSS
 * `[data-variant='x']` rules and Tailwind `data-[variant=x]:` utilities key on.
 * Undefined values are skipped by useStyles' filterDefinedValues.
 */
export function buildDataAttrs(
  axes: readonly VocabularyAxis[],
  hasVariants: boolean,
  props: Record<string, unknown>,
): Record<string, string | undefined> {
  const attrs: Record<string, string | undefined> = {};
  if (hasVariants || axes.includes('variant')) {
    attrs['data-variant'] = props.variant as string | undefined;
  }
  if (axes.includes('intent')) {
    attrs['data-intent'] = props.intent as string | undefined;
  }
  if (axes.includes('size')) {
    attrs['data-size'] = props.size as string | undefined;
  }
  return attrs;
}
