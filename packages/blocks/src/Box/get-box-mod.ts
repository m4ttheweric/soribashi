/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/get-box-mod/get-box-mod.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */

export type BoxMod = string | Record<string, unknown> | (string | Record<string, unknown>)[];

/**
 * Transforms a mod key (property name or bare string) into a `data-*` attribute
 * name. camelCase is converted to kebab-case per Mantine convention:
 *   isActive  → data-is-active
 *   XLarge    → data-x-large
 *   data-foo  → data-foo   (already-prefixed keys are preserved verbatim)
 */
function transformModKey(key: string): string {
  const cleanKey = key.startsWith('data-') ? key.slice(5) : key;
  const kebabKey = cleanKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return `data-${kebabKey}`;
}

/**
 * Converts a `mod` value into a flat record of `data-*` attributes.
 *
 *   getBoxMod('active')                       => { 'data-active': true }
 *   getBoxMod({ isActive: true, loading: 0 }) => { 'data-is-active': true }
 *   getBoxMod([{ active: true }, 'open'])     => { 'data-active': true, 'data-open': true }
 *   getBoxMod({ size: 'lg' })                  => { 'data-size': 'lg' }
 *
 * Falsy values (false, null, undefined, 0, '') are omitted.
 * Truthy non-boolean values become the data-attribute value (e.g., `'lg'`).
 * String inputs become a `data-{key}: true` entry.
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
    if (v === false || v === null || v === undefined || v === '' || v === 0) continue;
    out[transformModKey(key)] = v === true ? true : v;
  }
  return out;
}
