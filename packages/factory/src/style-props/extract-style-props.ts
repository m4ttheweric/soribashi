/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/style-props/extract-style-props/extract-style-props.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */
import type { StylePropDefinition } from './style-types.ts';

export interface ExtractedStyleProps {
  styleProps: Record<string, unknown>;
  rest: Record<string, unknown>;
}

// Shared across every call with no style props present. Frozen so a caller
// can never mutate it into a shared-state bug.
const EMPTY_STYLE_PROPS: Record<string, unknown> = Object.freeze({});

/**
 * Splits a props record into:
 *   - styleProps: the keys that match a STYLE_PROPS_DATA entry
 *   - rest: everything else (passed through to the rendered element)
 */
export function extractStyleProps(
  props: Record<string, unknown>,
  data: Record<string, StylePropDefinition>,
): ExtractedStyleProps {
  // Fast path: this runs in every component's render path once builders
  // integrate it, so the (overwhelmingly common) zero-style-prop case must
  // not allocate. Scan first without copying; only build styleProps/rest
  // once a match is found.
  let hasStyleProp = false;
  for (const key in props) {
    if (Object.hasOwn(data, key)) {
      hasStyleProp = true;
      break;
    }
  }
  if (!hasStyleProp) {
    return { styleProps: EMPTY_STYLE_PROPS, rest: props };
  }

  const styleProps: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};

  for (const key in props) {
    // Object.hasOwn: `key in data` matched inherited keys, so a prop named
    // like a prototype member ('constructor') crashed the resolver pass.
    if (Object.hasOwn(data, key)) {
      styleProps[key] = props[key];
    } else {
      rest[key] = props[key];
    }
  }

  return { styleProps, rest };
}
