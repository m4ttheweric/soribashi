import {
  DEFAULT_SEMANTIC_TOKENS,
  type ResolvedTheme,
  type SemanticSurfaceValue,
} from '@soribashi/theme';

// Segments of a CSS custom property name; anything outside this set (spaces,
// dots, colons, ...) breaks the emitted `--color-{family}-{shade}` vars.
const SAFE_NAME = /^[a-zA-Z0-9_-]+$/;

// A bare dotted identifier path (e.g. `colors.primary.500`). Values that do
// not match — hex literals, `rgb(...)`, `1.5rem`, font stacks — are treated as
// literal CSS passthroughs, which emitCss emits verbatim by design.
const REF_SHAPE = /^[a-zA-Z_$][\w$-]*(\.[\w$-]+)+$/;

const NAMESPACES: Record<string, { arity: number; form: string }> = {
  colors: { arity: 3, form: 'colors.<family>.<shade>' },
  radius: { arity: 2, form: 'radius.<key>' },
  spacing: { arity: 2, form: 'spacing.<key>' },
  fontSize: { arity: 2, form: 'fontSize.<key>' },
};

/**
 * Build-time validation for a ResolvedTheme before emitting.
 *
 * Checks that every semanticTokens reference resolves to an existing token
 * (unknown namespaces, wrong arity, missing color families/shades, and missing
 * radius/spacing/fontSize keys all error), that color family/shade names
 * are safe to embed in CSS custom property names, and that `dark` overrides
 * are well-formed (see `validateDarkOverrides`): a colour override must have
 * a light counterpart to pair against (emitCss's pairing logic walks light
 * and looks up a matching dark entry, so a colour that exists only in `dark`
 * would be silently dropped from the emitted CSS entirely), and a non-colour
 * family may not appear in `dark` at all, because light-dark() is a `<color>`
 * production and cannot legally hold a length/number/keyword value. All
 * problems are collected and thrown together as one actionable error.
 */
export function validateTheme(theme: ResolvedTheme): void {
  const errors: string[] = [];

  validateColorNames(theme.tokens.colors, 'tokens.colors', errors);
  if (theme.dark.colors) {
    validateColorNames(
      theme.dark.colors as Record<string, Record<string, string> | undefined>,
      'dark.colors',
      errors,
    );
  }

  validateDarkOverrides(theme, errors);

  for (const [key, ref] of Object.entries(theme.semanticTokens.text)) {
    validateRef(ref, `semanticTokens.text.${key}`, theme, errors);
  }
  for (const [key, raw] of Object.entries(theme.semanticTokens.surface)) {
    if (typeof raw === 'string') {
      validateRef(raw, `semanticTokens.surface.${key}`, theme, errors);
    } else {
      validateRef(raw.value, `semanticTokens.surface.${key}.value`, theme, errors);
      if (raw.dark !== undefined) {
        validateRef(raw.dark, `semanticTokens.surface.${key}.dark`, theme, errors);
      }
      if (raw.foreground !== undefined) {
        validateRef(raw.foreground, `semanticTokens.surface.${key}.foreground`, theme, errors);
      }
    }
  }
  for (const [key, ref] of Object.entries(theme.semanticTokens.border)) {
    validateRef(ref, `semanticTokens.border.${key}`, theme, errors);
  }
  if (theme.semanticTokens.accent) {
    for (const [key, ref] of Object.entries(theme.semanticTokens.accent)) {
      validateRef(ref, `semanticTokens.accent.${key}`, theme, errors);
    }
  }

  if (errors.length > 0) {
    const hint = defaultBackfillHint(theme);
    throw new Error(
      `[soribashi] invalid theme '${theme.name}' (${errors.length} error(s)):\n${errors.map((e) => `  - ${e}`).join('\n')}${hint ? `\n\n${hint}` : ''}`,
    );
  }
}

/**
 * Names the CAUSE when the failures above came from slots the theme never
 * wrote.
 *
 * `createTheme` backfills the text/surface/border slots a fresh theme omitted
 * (`DEFAULT_SEMANTIC_TOKENS`), and every one of those defaults references the
 * `neutral` colour family. A palette built from scratch without a `neutral`
 * ramp therefore fails on nine `semanticTokens.*` slots that appear nowhere in
 * its source — and the per-error text only ever names the symptom (an
 * unresolved reference). This appends the missing half: that the slot is a
 * backfill, which family and shades the backfill needs, and how to opt out.
 *
 * A slot counts as backfilled only if it still holds the default value
 * verbatim; a theme that declared its own value for the same key owns that
 * error and is left out of the hint.
 */
function defaultBackfillHint(theme: ResolvedTheme): string | null {
  const unresolved = new Set<string>();

  for (const section of ['text', 'surface', 'border'] as const) {
    for (const [key, defaultValue] of Object.entries(DEFAULT_SEMANTIC_TOKENS[section])) {
      const live: SemanticSurfaceValue | undefined = theme.semanticTokens[section][key];
      if (live === undefined) continue;
      if (JSON.stringify(live) !== JSON.stringify(defaultValue)) continue;
      for (const ref of refsOf(defaultValue)) {
        if (!refResolves(ref, theme)) unresolved.add(ref);
      }
    }
  }

  if (unresolved.size === 0) return null;

  const byFamily = new Map<string, Set<string>>();
  const other: string[] = [];
  for (const ref of unresolved) {
    const parts = ref.split('.');
    if (parts[0] === 'colors' && parts.length === 3) {
      const [, family, shade] = parts as [string, string, string];
      const shades = byFamily.get(family) ?? new Set<string>();
      shades.add(shade);
      byFamily.set(family, shades);
    } else {
      other.push(ref);
    }
  }

  const needs = [
    ...[...byFamily].map(
      ([family, shades]) =>
        `tokens.colors.${family} with shades ${[...shades].sort(shadeOrder).join(', ')}`,
    ),
    ...other.map((ref) => `tokens.${ref}`),
  ].join('; ');

  return [
    `Some of the failures above are semanticTokens slots this theme never declared: createTheme backfills the`,
    `text/surface/border slots a theme omits, and those defaults reference ${needs}.`,
    `Either declare that in tokens, override the named slots in semanticTokens, or opt out of the backfill`,
    `entirely with \`semanticTokens: { defaults: false }\` — then nothing is backfilled and this theme owns`,
    `every text/surface/border slot its recipes read.`,
  ].join(' ');
}

function refsOf(value: SemanticSurfaceValue): string[] {
  if (typeof value === 'string') return [value];
  return [value.value, value.dark, value.foreground].filter((v): v is string => v !== undefined);
}

function refResolves(ref: string, theme: ResolvedTheme): boolean {
  const probe: string[] = [];
  validateRef(ref, 'probe', theme, probe);
  return probe.length === 0;
}

// Numeric shades sort numerically ('50' before '100'); named ones alphabetically after.
function shadeOrder(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isNaN(na) && Number.isNaN(nb)) return a.localeCompare(b);
  if (Number.isNaN(na)) return 1;
  if (Number.isNaN(nb)) return -1;
  return na - nb;
}

function validateColorNames(
  colors: Record<string, Record<string, string> | undefined>,
  where: string,
  errors: string[],
): void {
  for (const [family, scale] of Object.entries(colors)) {
    if (!SAFE_NAME.test(family)) {
      errors.push(
        `${where} family '${family}' cannot be used in a CSS custom property name (allowed characters: letters, digits, hyphen, underscore)`,
      );
    }
    for (const shade of Object.keys(scale ?? {})) {
      if (!SAFE_NAME.test(shade)) {
        errors.push(
          `${where}.${family} shade '${shade}' cannot be used in a CSS custom property name (allowed characters: letters, digits, hyphen, underscore)`,
        );
      }
    }
  }
}

/**
 * Validates `dark`. Two independent rules apply, one for colours and one for
 * everything else, because light-dark() (what emitCss pairs light+dark into)
 * is a `<color>` production and nothing else.
 *
 * Colours: every `dark.colors` value must have a light counterpart declared
 * in `tokens.colors`. emitCss's pairing logic (`pairValue` in emit-css.ts)
 * walks the LIGHT token keys and looks up a matching dark override; it never
 * walks `dark` directly, so a shade that exists only in `dark.colors` is
 * never visited and silently produces no CSS in either scheme. The model
 * here is "light declares the token, dark overrides it"; a dark-only colour
 * is a theme authoring error, not a case codegen should carry a second code
 * path for.
 *
 * Everything else (radius, spacing, fontSize, fontFamily, fontWeight,
 * lineHeight, shadow, breakpoint, zIndex, heading): `dark` may not override
 * these AT ALL, regardless of whether a light counterpart exists. Pairing
 * one of these into `light-dark(light, dark)` is invalid CSS at
 * computed-value time (light-dark() only accepts colours), so the token
 * would resolve to nothing in both schemes rather than just being dropped
 * from one. See emit-css.ts's pairValue() doc comment for the browser-verified
 * behaviour.
 */
function validateDarkOverrides(theme: ResolvedTheme, errors: string[]): void {
  const { tokens, dark } = theme;

  if (dark.colors) {
    for (const [family, scale] of Object.entries(dark.colors)) {
      for (const [shade, value] of Object.entries(scale ?? {})) {
        if (value === undefined) continue;
        if (tokens.colors[family]?.[shade] === undefined) {
          errors.push(darkOrphanMessage(`colors.${family}.${shade}`));
        }
      }
    }
  }

  rejectNonColourDarkFamily(dark.radius, 'radius', errors);
  rejectNonColourDarkFamily(dark.spacing, 'spacing', errors);
  rejectNonColourDarkFamily(dark.fontSize, 'fontSize', errors);
  rejectNonColourDarkFamily(dark.fontFamily, 'fontFamily', errors);
  rejectNonColourDarkFamily(dark.fontWeight, 'fontWeight', errors);
  rejectNonColourDarkFamily(dark.lineHeight, 'lineHeight', errors);
  rejectNonColourDarkFamily(dark.shadow, 'shadow', errors);
  rejectNonColourDarkFamily(dark.breakpoint, 'breakpoint', errors);
  rejectNonColourDarkFamily(dark.zIndex, 'zIndex', errors);

  if (dark.heading) {
    if (dark.heading.textWrap !== undefined) {
      errors.push(nonColourDarkMessage('heading.textWrap'));
    }
    if (dark.heading.sizes) {
      for (const [order, size] of Object.entries(dark.heading.sizes)) {
        if (!size) continue;
        if (size.fontSize !== undefined) {
          errors.push(nonColourDarkMessage(`heading.sizes.${order}.fontSize`));
        }
        if (size.fontWeight !== undefined) {
          errors.push(nonColourDarkMessage(`heading.sizes.${order}.fontWeight`));
        }
        if (size.lineHeight !== undefined) {
          errors.push(nonColourDarkMessage(`heading.sizes.${order}.lineHeight`));
        }
      }
    }
  }
}

function rejectNonColourDarkFamily(
  darkFamily: Partial<Record<string, string | number>> | undefined,
  name: string,
  errors: string[],
): void {
  if (!darkFamily) return;
  for (const [key, value] of Object.entries(darkFamily)) {
    if (value === undefined) continue;
    errors.push(nonColourDarkMessage(`${name}.${key}`));
  }
}

function darkOrphanMessage(path: string): string {
  return `dark.${path} overrides a token that tokens.${path} does not declare; dark may only override tokens that light declares`;
}

function nonColourDarkMessage(path: string): string {
  return `dark.${path} overrides a non-colour token; light-dark() is a colour-only CSS function (it is a <color> production, invalid in a length/number/keyword property at computed-value time), so a dark override cannot be expressed for it. Only dark.colors.* may be overridden; remove dark.${path}.`;
}

function validateRef(ref: string, slot: string, theme: ResolvedTheme, errors: string[]): void {
  if (!REF_SHAPE.test(ref)) return;

  const parts = ref.split('.');
  const namespace = NAMESPACES[parts[0]!];
  if (!namespace) {
    errors.push(
      `${slot} references "${ref}" but '${parts[0]}' is not a recognized token namespace (expected colors.<family>.<shade>, radius.<key>, spacing.<key>, or fontSize.<key>)`,
    );
    return;
  }
  if (parts.length !== namespace.arity) {
    errors.push(
      `${slot} references "${ref}" but ${parts[0]} references need the form ${namespace.form}`,
    );
    return;
  }

  if (parts[0] === 'colors') {
    const [, family, shade] = parts as [string, string, string];
    const scale = theme.tokens.colors[family];
    if (!scale) {
      errors.push(
        `${slot} references ${ref} but no color family '${family}' exists in tokens.colors`,
      );
      return;
    }
    if (scale[shade] === undefined) {
      errors.push(`${slot} references ${ref} but scale '${family}' has no shade '${shade}'`);
    }
    return;
  }

  const [prefix, key] = parts as [keyof typeof NAMESPACES, string];
  const record = theme.tokens[prefix as 'radius' | 'spacing' | 'fontSize'];
  if (record[key] === undefined) {
    errors.push(`${slot} references ${ref} but tokens.${prefix} has no key '${key}'`);
  }
}
