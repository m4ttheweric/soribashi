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
 * Dark overrides are colour-only, so this freezing failure is not reachable
 * for the properties registered here. light-dark() is a <color> production;
 * substituting it into a registered <length> property like --radius-md is
 * invalid at computed-value time regardless of the @property freezing issue
 * documented above. emit-css.ts's pairValue() is therefore only ever called
 * for tokens.colors: radius/spacing/fontSize always emit their light value
 * bare, and validate-theme.ts's validateDarkOverrides rejects a `dark` entry
 * for any non-colour family outright. A registered non-colour property can
 * never end up wrapped in light-dark(), so it can never freeze.
 */
export function emitPropertyRegistrations(theme: ResolvedTheme): string[] {
  const blocks: string[] = [];

  const register = (name: string, value: string): void => {
    const syntax = inferLengthSyntax(value);
    // A value this family can't be typed as a <length> or <length-percentage>
    // (e.g. a keyword, a var() reference, an unrecognised calc()) is skipped
    // rather than registered with a syntax that would reject it outright.
    if (syntax === null) return;

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
      `  initial-value: ${value};`,
      '}',
    );
  };

  for (const [key, value] of Object.entries(theme.tokens.radius).sort(byKey)) {
    register(`--radius-${key}`, value);
  }
  for (const [key, value] of Object.entries(theme.tokens.spacing).sort(byKey)) {
    register(`--spacing-${key}`, value);
  }
  for (const [key, value] of Object.entries(theme.tokens.fontSize).sort(byKey)) {
    register(`--font-size-${key}`, value);
  }

  return blocks;
}

function byKey([a]: [string, unknown], [b]: [string, unknown]): number {
  return a.localeCompare(b);
}

const PLAIN_LENGTH = /^[+-]?(\d+\.?\d*|\.\d+)(px|rem|em|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc|q)$/i;
const PLAIN_PERCENTAGE = /^[+-]?(\d+\.?\d*|\.\d+)%$/;

/**
 * Picks the narrowest @property syntax that can hold `value`, or null when
 * the value isn't a length/percentage at all (a keyword, a var() reference,
 * an unrecognised calc() expression, ...) — such tokens are left unregistered
 * rather than registered under a syntax that would make the browser drop the
 * rule.
 */
function inferLengthSyntax(value: string): '<length>' | '<length-percentage>' | null {
  const trimmed = value.trim();

  if (trimmed.includes('%')) {
    if (PLAIN_PERCENTAGE.test(trimmed) || /^calc\(.*%.*\)$/i.test(trimmed)) {
      return '<length-percentage>';
    }
    return null;
  }

  if (trimmed === '0' || PLAIN_LENGTH.test(trimmed) || /^calc\(.*\)$/i.test(trimmed)) {
    return '<length>';
  }

  return null;
}
