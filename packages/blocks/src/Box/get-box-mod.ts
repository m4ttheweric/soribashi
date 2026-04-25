/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/get-box-mod/get-box-mod.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */

export type BoxMod = string | Record<string, unknown> | (string | Record<string, unknown>)[];

/**
 * Converts a `mod` value into a flat record of `data-*` attributes.
 *
 *   getBoxMod('active')                       => { 'data-active': true }
 *   getBoxMod({ active: true, loading: 0 })   => { 'data-active': true }
 *   getBoxMod([{ active: true }, 'open'])     => { 'data-active': true, 'data-open': true }
 *   getBoxMod({ size: 'lg' })                  => { 'data-size': 'lg' }
 *
 * Falsy values (false, null, undefined, 0, '') are omitted.
 * Truthy non-boolean values become the data-attribute value (e.g., `'lg'`).
 * String inputs become a `data-{key}: true` entry.
 */
export function getBoxMod(value: BoxMod | undefined): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value === 'string') return { [`data-${value}`]: true };

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
    // If the key already starts with 'data-', preserve it; otherwise prefix.
    const attr = key.startsWith('data-') ? key : `data-${key}`;
    out[attr] = v === true ? true : v;
  }
  return out;
}
