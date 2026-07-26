import { definePolymorphicComponent } from '@soribashi/core';
import classes from './Box.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 1 = pure styled primitive (§ 2.1). Read by packages/ui/scripts/derive.ts to
 * build the agent-facing manifest; not itself derived, since it records an
 * authoring decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 1 as const;

/**
 * A `mod` value: a bare string (`'active'`), a record of key/value pairs
 * (`{ isActive: true, loading: 0 }`), or an array mixing either form.
 * Converted to `data-*` attributes by `getBoxMod` below.
 */
export type BoxMod = string | Record<string, unknown> | (string | Record<string, unknown>)[];

/**
 * Transforms a mod key (property name or bare string) into a `data-*`
 * attribute name. camelCase only splits at a lowercase-to-uppercase
 * transition (a leading capital does not split):
 *   isActive  -> data-is-active
 *   XLarge    -> data-xlarge
 *   data-foo  -> data-foo (already-prefixed keys pass through unchanged)
 */
function transformModKey(key: string): string {
  const cleanKey = key.startsWith('data-') ? key.slice(5) : key;
  const kebabKey = cleanKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return `data-${kebabKey}`;
}

/**
 * Converts a `mod` value into a flat record of `data-*` attributes:
 *
 *   getBoxMod('active')                        => { 'data-active': true }
 *   getBoxMod({ isActive: true, loading: 0 })   => { 'data-is-active': true, 'data-loading': 0 }
 *   getBoxMod([{ active: true }, 'open'])       => { 'data-active': true, 'data-open': true }
 *   getBoxMod({ size: 'lg' })                   => { 'data-size': 'lg' }
 *
 * `false`, `null`, `undefined`, and `''` are omitted; numeric `0` is a real
 * value and is kept. Non-boolean values become the data-attribute's value;
 * string inputs become a `data-{key}: true` entry.
 */
export function getBoxMod(value: BoxMod | undefined): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value === 'string') return { [transformModKey(value)]: true };

  if (Array.isArray(value)) {
    const out: Record<string, unknown> = {};
    for (const item of value) {
      if (item === undefined || item === null) continue;
      Object.assign(out, getBoxMod(item));
    }
    return out;
  }

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (v === false || v === null || v === undefined || v === '') continue;
    out[transformModKey(key)] = v === true ? true : v;
  }
  return out;
}

export interface BoxProps {
  /** Data-attribute shorthand: a bare string, a record, or an array of either. */
  mod?: BoxMod;
}

/**
 * The polymorphic primitive: element choice via `as`, plus every universal
 * style prop (`p`, `m`, `bg`, `c`, `fz`, ...) and the Styles API, all
 * supplied by `definePolymorphicComponent` itself. Box adds nothing on top
 * of the builder for any of that; that absence is the point, since Box
 * exists so a consumer never has to hand-wire style-prop extraction. Its own
 * surface is `mod`, converted to `data-*` attributes below.
 */
export const Box = definePolymorphicComponent<BoxProps, 'div'>({
  name: 'Box',
  defaultElement: 'div',
  selectors: ['root'] as const,
  classes,
  render: ({ Element, props, getStyles, ref }) => {
    // classNames/styles/vars/attributes/unstyled are the Styles API's own
    // config surface (consumed internally by useStyles via config.*, not by
    // getStyles's return value) and are not valid DOM attributes, so they're
    // stripped here the same way Button.tsx strips them. `mod` is Box's own
    // prop and is never a valid DOM attribute either; it is converted via
    // getBoxMod below instead of being spread directly.
    const {
      mod,
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...rest
    } = props as typeof props & Record<string, unknown>;
    return <Element ref={ref} {...rest} {...getBoxMod(mod)} {...getStyles('root')} />;
  },
});

export const boxTheme = Box.extend({});
