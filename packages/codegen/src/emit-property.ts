import type { ResolvedTheme } from '@soribashi/theme';

/**
 * Registers non-colour tokens as typed custom properties.
 *
 * COLOURS ARE DELIBERATELY EXCLUDED. Registering a custom property via
 * @property makes its value computed at the DECLARING element, which freezes
 * light-dark() to :root's color-scheme. Registering colour tokens would
 * silently break scoped dark mode, and therefore multi-tenancy. Verified in
 * Chromium: an unregistered light-dark() var resolves per-wrapper, a
 * registered one does not.
 *
 * syntax: "*" was considered as a dodge. It buys no type checking and no
 * animatability, so it earns nothing.
 *
 * Registration is what makes length tokens animatable, so transitioning
 * --sb-button-h becomes possible for the first time.
 *
 * TRAP FOR A FUTURE EDITOR: if a theme ever supplies a `dark` override for
 * radius/spacing/fontSize, `pairValue()` in emit-css.ts wraps the emitted
 * value in `light-dark(...)`, exactly like a colour token. Once that value is
 * registered here, the same freezing failure documented above for colours
 * applies to it too — light-dark() would resolve against the DECLARING
 * element (:root) instead of the consuming element, breaking a scoped `.dark`
 * wrapper for that token. No current theme does this and nothing here guards
 * against it; this comment exists so the risk is visible if one ever does.
 */
export function emitPropertyRegistrations(theme: ResolvedTheme): string[] {
  const blocks: string[] = [];

  const register = (name: string, syntax: string, initial: string): void => {
    blocks.push(
      `@property ${name} {`,
      `  syntax: "${syntax}";`,
      // INHERITS MUST BE TRUE. Unregistered custom properties inherit down
      // the DOM by default; `inherits: false` opts a registered property OUT
      // of that. A descendant that reads the property without redeclaring it
      // itself would then fall back to `initial-value` instead of picking up
      // an ancestor's override — silently dropping the scoped multi-tenant
      // override path (CssVariablesAddition.scopes in types.ts), which sets
      // e.g. `--radius-md` on a tenant wrapper and expects every descendant
      // component (Paper, Flex, etc. — never the wrapper itself) to see it.
      // Confirmed live in Chromium: with inherits:false a child of a wrapper
      // that overrides the var reads the registered initial-value, not the
      // wrapper's override; with inherits:true it correctly reads the
      // override. Syntax validation, fallback, and animatability are all
      // independent of this flag, so true costs nothing here.
      '  inherits: true;',
      `  initial-value: ${initial};`,
      '}',
    );
  };

  for (const [key, value] of Object.entries(theme.tokens.radius).sort(byKey)) {
    register(`--radius-${key}`, '<length>', value);
  }
  for (const [key, value] of Object.entries(theme.tokens.spacing).sort(byKey)) {
    register(`--spacing-${key}`, '<length>', value);
  }
  for (const [key, value] of Object.entries(theme.tokens.fontSize).sort(byKey)) {
    register(`--font-size-${key}`, '<length>', value);
  }

  return blocks;
}

function byKey([a]: [string, unknown], [b]: [string, unknown]): number {
  return a.localeCompare(b);
}
