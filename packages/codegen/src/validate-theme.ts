import type { HeadingTokens, ResolvedTheme } from '@soribashi/theme';

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
 * are safe to embed in CSS custom property names, and that every `dark`
 * override has a light counterpart (see `validateDarkOverrides` — emitCss
 * pairs light+dark into a single `light-dark()` declaration per token, so a
 * dark-only key has nothing to pair with and would otherwise be silently
 * dropped rather than emitted anywhere). All problems are collected and
 * thrown together as one actionable error.
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
    throw new Error(
      `[soribashi] invalid theme '${theme.name}' (${errors.length} error(s)):\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
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
 * Confirms every value `dark` provides has a light counterpart declared in
 * `tokens`. emitCss's pairing logic (`pairValue` in emit-css.ts) walks the
 * LIGHT token keys and looks up a matching dark override — it never walks
 * `dark` directly — so a key that exists only in `dark` is never visited and
 * silently produces no CSS in either scheme. The model here is "light
 * declares the token, dark overrides it"; a dark-only key is a theme
 * authoring error, not a case codegen should carry a second code path for.
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

  validateDarkScalarFamily(dark.radius, tokens.radius, 'radius', errors);
  validateDarkScalarFamily(dark.spacing, tokens.spacing, 'spacing', errors);
  validateDarkScalarFamily(dark.fontSize, tokens.fontSize, 'fontSize', errors);
  validateDarkScalarFamily(dark.fontFamily, tokens.fontFamily, 'fontFamily', errors);
  validateDarkScalarFamily(dark.fontWeight, tokens.fontWeight, 'fontWeight', errors);
  validateDarkScalarFamily(dark.lineHeight, tokens.lineHeight, 'lineHeight', errors);
  validateDarkScalarFamily(dark.shadow, tokens.shadow, 'shadow', errors);
  validateDarkScalarFamily(dark.breakpoint, tokens.breakpoint, 'breakpoint', errors);
  validateDarkScalarFamily(dark.zIndex, tokens.zIndex, 'zIndex', errors);

  if (dark.heading) {
    if (dark.heading.textWrap !== undefined && tokens.heading?.textWrap === undefined) {
      errors.push(darkOrphanMessage('heading.textWrap'));
    }
    if (dark.heading.sizes) {
      for (const [order, size] of Object.entries(dark.heading.sizes)) {
        if (!size) continue;
        const lightSize = tokens.heading?.sizes?.[order as keyof HeadingTokens['sizes']];
        if (size.fontSize !== undefined && lightSize?.fontSize === undefined) {
          errors.push(darkOrphanMessage(`heading.sizes.${order}.fontSize`));
        }
        if (size.fontWeight !== undefined && lightSize?.fontWeight === undefined) {
          errors.push(darkOrphanMessage(`heading.sizes.${order}.fontWeight`));
        }
        if (size.lineHeight !== undefined && lightSize?.lineHeight === undefined) {
          errors.push(darkOrphanMessage(`heading.sizes.${order}.lineHeight`));
        }
      }
    }
  }
}

function validateDarkScalarFamily(
  darkFamily: Partial<Record<string, string | number>> | undefined,
  lightFamily: Record<string, string | number> | undefined,
  name: string,
  errors: string[],
): void {
  if (!darkFamily) return;
  for (const [key, value] of Object.entries(darkFamily)) {
    if (value === undefined) continue;
    if (lightFamily?.[key] === undefined) {
      errors.push(darkOrphanMessage(`${name}.${key}`));
    }
  }
}

function darkOrphanMessage(path: string): string {
  return `dark.${path} overrides a token that tokens.${path} does not declare; dark may only override tokens that light declares`;
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
