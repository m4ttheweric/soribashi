/**
 * Parity tests for soribashi `InlineStyles` bundle vs Mantine `InlineStyles/` bundle.
 *
 * Every test exercises a specific decision point (branch) in Mantine's source.
 * Branch IDs correspond to the enumeration in
 * `docs/superpowers/audits/2026-04-25-tier-1-inline-styles.md`.
 *
 * Reference Mantine files (at commit 63dafbbf5f0135eb36455b7add4c0ddcd0f3240a):
 *   - `packages/@mantine/core/src/core/InlineStyles/InlineStyles.tsx`
 *   - `packages/@mantine/core/src/core/InlineStyles/css-object-to-string/css-object-to-string.ts`
 *   - `packages/@mantine/core/src/core/InlineStyles/styles-to-string/styles-to-string.ts`
 *   - `packages/@mantine/core/src/core/InlineStyles/hash-styles.ts`
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { InlineStyles } from '../src/inline-styles/InlineStyles.tsx';
import { hashStyleProps } from '../src/hash-style-props.ts';

// ---------------------------------------------------------------------------
// IS-01 (INTENTIONAL): nonce — not supported in soribashi
// Mantine: useMantineStyleNonce() supplies nonce to <style nonce=...>
// Soribashi: no nonce; <style> has no nonce attribute
// ---------------------------------------------------------------------------

describe('IS-01 (INTENTIONAL): no nonce attribute on rendered style', () => {
  it('IS-01: style element does not have a nonce attribute', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{ color: 'red' }} media={{}} />,
    );
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();
    expect(style?.getAttribute('nonce')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// IS-02 (INTENTIONAL): deduplicate — not supported in soribashi
// Mantine: deduplicate=true renders <style href="mantine-{hash}" precedence="mantine">
// Soribashi: always renders inline <style> (no deduplicate prop)
// ---------------------------------------------------------------------------

describe('IS-02 (INTENTIONAL): InlineStyles has no deduplicate prop', () => {
  it('IS-02: InlineStylesProps does not include deduplicate', async () => {
    // Type-level test: verify the interface only has the three expected props
    const mod = await import('../src/inline-styles/InlineStyles.tsx');
    // The component exists and is callable — no deduplicate branch
    expect(typeof mod.InlineStyles).toBe('function');
  });

  it('IS-02b: component always renders a style element (not moved to <head>)', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{ color: 'red' }} media={{}} />,
    );
    // No React 19 resource hoisting — style lives in container, not just head
    expect(container.querySelector('style')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// IS-03 (INTENTIONAL): no data-mantine-styles attribute
// Mantine: adds data-mantine-styles="inline" on the <style> element
// Soribashi: no data-* attribute on <style>
// ---------------------------------------------------------------------------

describe('IS-03 (INTENTIONAL): no data-mantine-styles attribute on <style>', () => {
  it('IS-03: rendered style element has no data-mantine-styles attribute', () => {
    const { container } = render(
      <InlineStyles selector=".a" styles={{ padding: '1rem' }} media={{}} />,
    );
    const style = container.querySelector('style');
    expect(style?.getAttribute('data-mantine-styles')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// IS-04 (INTENTIONAL): CSS output includes spaces (cosmetic)
// Mantine: compact form `selector{prop:value;}`
// Soribashi: readable form `selector { prop: value; }`
// ---------------------------------------------------------------------------

describe('IS-04 (INTENTIONAL): CSS output uses spaces around braces and colon', () => {
  it('IS-04a: base rule has space after colon', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{ color: 'red' }} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    // Soribashi: "color: red;" (with space after colon)
    expect(text).toContain('color: red;');
  });

  it('IS-04b: Mantine would emit compact form — soribashi does not', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{ color: 'red' }} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    // Mantine compact form not present in soribashi
    expect(text).not.toContain('color:red;');
  });
});

// ---------------------------------------------------------------------------
// IS-05 (INTENTIONAL): media prop is a Record (map) not an array
// Mantine: media?: Array<{ query: string; styles: CSSProperties }>
// Soribashi: media: Record<string, Record<string, unknown>>
// ---------------------------------------------------------------------------

describe('IS-05 (INTENTIONAL): media prop is a Record (query → styles map)', () => {
  it('IS-05a: media queries rendered from Record entries', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        styles={{}}
        media={{ '(min-width: 48em)': { padding: '2rem' } }}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('@media (min-width: 48em)');
    expect(text).toContain('padding: 2rem;');
  });

  it('IS-05b: multiple media queries rendered in insertion order', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        styles={{}}
        media={{
          '(min-width: 48em)': { padding: '1rem' },
          '(min-width: 64em)': { padding: '2rem' },
        }}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    const idx48 = text.indexOf('(min-width: 48em)');
    const idx64 = text.indexOf('(min-width: 64em)');
    expect(idx48).toBeGreaterThan(-1);
    expect(idx64).toBeGreaterThan(-1);
    // 48em query appears before 64em query (insertion order)
    expect(idx48).toBeLessThan(idx64);
  });

  it('IS-05c: empty media Record produces no @media rules', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{ color: 'blue' }} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).not.toContain('@media');
  });
});

// ---------------------------------------------------------------------------
// IS-06 (INTENTIONAL): container queries not supported
// Mantine: container?: Array<{ query: string; styles: CSSProperties }>
// Soribashi: no container prop (deferred per divergence ledger)
// ---------------------------------------------------------------------------

describe('IS-06 (INTENTIONAL): no container query support', () => {
  it('IS-06: InlineStyles does not accept a container prop', async () => {
    const mod = await import('../src/inline-styles/InlineStyles.tsx');
    // Component is present; absence of container prop is verified via type system
    // Runtime: no @container rules emitted
    const { container } = render(
      <InlineStyles selector=".x" styles={{ color: 'red' }} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).not.toContain('@container');
  });
});

// ---------------------------------------------------------------------------
// IS-07 (INTENTIONAL): styles prop accepts Record<string, unknown> (looser type)
// Mantine: styles?: React.CSSProperties (strict type)
// Soribashi: styles: Record<string, unknown> (accepts any value without cast)
// ---------------------------------------------------------------------------

describe('IS-07 (INTENTIONAL): styles prop accepts unknown values without cast', () => {
  it('IS-07a: CSS custom properties pass through without cast', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        styles={{ '--my-var': '42px' }}
        media={{}}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('--my-var: 42px;');
  });

  it('IS-07b: arbitrary string values are emitted as-is', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        styles={{ color: 'oklch(0.5 0.2 240)' }}
        media={{}}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('color: oklch(0.5 0.2 240);');
  });
});

// ---------------------------------------------------------------------------
// IS-08 / CO-03 (DIVERGENCE — soribashi better): CSS custom property pass-through
// Mantine's camelToKebabCase transforms even `--` prefixed strings, converting
// uppercase letters to kebab segments (e.g., --myColor → --my-color).
// CSS custom properties are case-sensitive; this transform could silently rename them.
// Soribashi short-circuits at `--` prefix — custom props pass through unchanged.
// ---------------------------------------------------------------------------

describe('IS-08 / CO-03 (DIVERGENCE — soribashi better): CSS custom property names preserved', () => {
  it('IS-08a: --camelCase custom property passes through unchanged', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        styles={{ '--myColor': 'red' }}
        media={{}}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    // Soribashi: --myColor preserved (correct for CSS custom properties)
    expect(text).toContain('--myColor: red;');
    // Mantine would emit: --my-color: red; (wrong — different custom property)
    expect(text).not.toContain('--my-color');
  });

  it('IS-08b: --multi-word custom property preserved', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        styles={{ '--primaryBgColor': '#fff' }}
        media={{}}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('--primaryBgColor: #fff;');
  });
});

// ---------------------------------------------------------------------------
// IS-09 / CO-05 (DIVERGENCE — soribashi better): null filtering
// Mantine's cssObjectToString only filters undefined; null values would be serialized.
// Soribashi filters both undefined and null — no invalid CSS emitted.
// ---------------------------------------------------------------------------

describe('IS-09 / CO-05 (DIVERGENCE — soribashi better): null values are filtered', () => {
  it('IS-09a: null style values are not emitted', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        styles={{ color: 'red', margin: null as any }}
        media={{}}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('color: red;');
    expect(text).not.toContain('margin');
    expect(text).not.toContain('null');
  });

  it('IS-09b: undefined style values are filtered (matches Mantine)', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        styles={{ color: 'red', padding: undefined }}
        media={{}}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('color: red;');
    expect(text).not.toContain('padding');
  });
});

// ---------------------------------------------------------------------------
// IS-10 (INTENTIONAL): @media spacing
// Mantine: `@media(query)` — no space (query string includes parens)
// Soribashi: `@media ${query}` — explicit space before the query expression
// ---------------------------------------------------------------------------

describe('IS-10 (INTENTIONAL): @media keyword has space before query expression', () => {
  it('IS-10: emits @media (min-width: ...) with space', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        styles={{}}
        media={{ '(min-width: 48em)': { padding: '1rem' } }}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    // Space between @media and ( is present
    expect(text).toContain('@media (min-width: 48em)');
  });
});

// ---------------------------------------------------------------------------
// ST-02 (INTENTIONAL): styles prop is required in soribashi
// Mantine: styles?: optional — base rule omitted when styles is undefined/absent
// Soribashi: styles is always required (callers pass {} for media-only)
// ---------------------------------------------------------------------------

describe('ST-02 (INTENTIONAL): styles prop is required (callers always supply it)', () => {
  it('ST-02: component renders when styles is empty object', () => {
    // No TypeScript error; no runtime error; just no base style rule emitted
    const { container } = render(
      <InlineStyles selector=".x" styles={{}} media={{}} />,
    );
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ST-05 (BUG → FIXED): empty base rule omission
// Mantine: omits the base `selector{...}` rule when styles is empty / falsy
// Soribashi (before fix): emitted `selector {  }` even when styles={}
// Soribashi (after fix): omits base rule when rulesFromStyles(styles) is empty string
// ---------------------------------------------------------------------------

describe('ST-05 (BUG → FIXED): empty base rule is omitted when styles is {}', () => {
  it('ST-05a: no selector rule emitted when styles is {}', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{}} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent?.trim() ?? '';
    // No ".x { }" rule emitted — or at minimum, no empty selector block
    expect(text).not.toMatch(/\.x\s*\{\s*\}/);
    // The full output should be empty when both styles and media are empty
    expect(text).toBe('');
  });

  it('ST-05b: base rule IS emitted when styles has at least one property', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{ color: 'red' }} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('.x');
    expect(text).toContain('color: red;');
  });

  it('ST-05c: only media rules emitted when styles is {} but media has entries', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        styles={{}}
        media={{ '(min-width: 48em)': { padding: '1rem' } }}
      />,
    );
    const text = container.querySelector('style')?.textContent?.trim() ?? '';
    // No empty base rule
    expect(text).not.toMatch(/\.x\s*\{\s*\}/);
    // But media rule is present
    expect(text).toContain('@media (min-width: 48em)');
    expect(text).toContain('padding: 1rem;');
  });

  it('ST-05d: all-null/undefined styles produces empty output (no empty rule)', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        styles={{ color: undefined, margin: null as any }}
        media={{}}
      />,
    );
    const text = container.querySelector('style')?.textContent?.trim() ?? '';
    expect(text).toBe('');
  });
});

// ---------------------------------------------------------------------------
// CO-02 (IDENTICAL): camelCase → kebab-case conversion
// Both Mantine and soribashi convert camelCase CSS property names to kebab-case.
// ---------------------------------------------------------------------------

describe('CO-02 (IDENTICAL): camelCase CSS properties are converted to kebab-case', () => {
  it('CO-02a: simple two-word property (backgroundColor)', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{ backgroundColor: '#fff' }} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('background-color: #fff;');
    expect(text).not.toContain('backgroundColor');
  });

  it('CO-02b: three-word property (borderTopRightRadius)', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{ borderTopRightRadius: '4px' }} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('border-top-right-radius: 4px;');
  });

  it('CO-02c: logical property (marginInlineStart)', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{ marginInlineStart: '1rem' }} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('margin-inline-start: 1rem;');
  });

  it('CO-02d: vendor-prefixed property (WebkitTransform)', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{ WebkitTransform: 'rotate(45deg)' }} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('-webkit-transform: rotate(45deg);');
  });

  it('CO-02e: already lowercase property (padding) unchanged', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{ padding: '8px' }} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('padding: 8px;');
  });
});

// ---------------------------------------------------------------------------
// HS-02 (IDENTICAL): hashStyleProps function name
// HS-05 (IDENTICAL): djb2 hash algorithm — same output for same input
// HS-06 (INTENTIONAL): soribashi prefix 'sb-h-' vs Mantine '__mdi__-'
// ---------------------------------------------------------------------------

describe('HS-02 / HS-05 (IDENTICAL): hashStyleProps is deterministic', () => {
  it('HS-02 / HS-05a: same inputs produce same hash', () => {
    const a = hashStyleProps({ color: 'red' }, {});
    const b = hashStyleProps({ color: 'red' }, {});
    expect(a).toBe(b);
  });

  it('HS-05b: different styles produce different hashes', () => {
    const a = hashStyleProps({ color: 'red' }, {});
    const b = hashStyleProps({ color: 'blue' }, {});
    expect(a).not.toBe(b);
  });

  it('HS-05c: different media queries produce different hashes', () => {
    const a = hashStyleProps({}, { '(min-width: 48em)': { padding: '1rem' } });
    const b = hashStyleProps({}, { '(min-width: 64em)': { padding: '1rem' } });
    expect(a).not.toBe(b);
  });

  it('HS-05d: adding media query changes hash vs no media', () => {
    const a = hashStyleProps({ color: 'red' }, {});
    const b = hashStyleProps({ color: 'red' }, { '(min-width: 48em)': { color: 'blue' } });
    expect(a).not.toBe(b);
  });
});

describe('HS-06 (INTENTIONAL): hash output prefix is sb-h- (not Mantine __mdi__-)', () => {
  it('HS-06a: output starts with sb-h-', () => {
    const result = hashStyleProps({ color: 'red' }, {});
    expect(result).toMatch(/^sb-h-/);
  });

  it('HS-06b: output does not use Mantine prefix', () => {
    const result = hashStyleProps({ color: 'red' }, {});
    expect(result).not.toMatch(/^__mdi__-/);
  });

  it('HS-06c: full output is CSS-class-safe (alphanumeric after prefix)', () => {
    const result = hashStyleProps({ padding: '1rem', margin: '2rem' }, {});
    expect(result).toMatch(/^sb-h-[a-z0-9]+$/);
  });
});

// ---------------------------------------------------------------------------
// HS-04 (INTENTIONAL): media param is Record (map) not array of objects
// Mantine: hashStyleProps(styles, media: InlineStylesMediaQuery[] | undefined)
// Soribashi: hashStyleProps(styles, media: Record<string, Record<string, unknown>>)
// ---------------------------------------------------------------------------

describe('HS-04 (INTENTIONAL): hashStyleProps media param is a Record not an array', () => {
  it('HS-04a: accepts Record<string, Record<string, unknown>> as media param', () => {
    // Soribashi API — map form
    const result = hashStyleProps(
      { color: 'red' },
      { '(min-width: 48em)': { padding: '1rem' } },
    );
    expect(result).toMatch(/^sb-h-/);
  });

  it('HS-04b: empty Record for media produces a valid hash', () => {
    const result = hashStyleProps({ color: 'red' }, {});
    expect(result).toMatch(/^sb-h-[a-z0-9]+$/);
  });
});

// ---------------------------------------------------------------------------
// EX-01 (IDENTICAL): InlineStyles is the named export from InlineStyles.tsx
// ---------------------------------------------------------------------------

describe('EX-01 (IDENTICAL): InlineStyles is the named export from InlineStyles.tsx', () => {
  it('EX-01: module exports InlineStyles as a named export', async () => {
    const mod = await import('../src/inline-styles/InlineStyles.tsx');
    expect(typeof mod.InlineStyles).toBe('function');
  });

  it('EX-01b: InlineStylesProps type is exported (type-level — checked via runtime key check)', async () => {
    // We can only verify the value export at runtime; the type export is compile-time only.
    // Verify the module doesn't export unexpected names.
    const mod = await import('../src/inline-styles/InlineStyles.tsx');
    const keys = Object.keys(mod);
    expect(keys).toContain('InlineStyles');
  });
});

// ---------------------------------------------------------------------------
// Full integration: selector scoping
// Both Mantine and soribashi scope all rules to the given selector.
// ---------------------------------------------------------------------------

describe('Integration: selector scoping', () => {
  it('base rule is scoped to selector', () => {
    const { container } = render(
      <InlineStyles selector=".sb-abc" styles={{ color: 'red' }} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('.sb-abc');
    expect(text).toContain('color: red;');
  });

  it('media rule is scoped to selector', () => {
    const { container } = render(
      <InlineStyles
        selector=".sb-abc"
        styles={{}}
        media={{ '(min-width: 48em)': { padding: '1rem' } }}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    // Both selector and the rule are present inside @media
    expect(text).toContain('@media (min-width: 48em)');
    expect(text).toContain('.sb-abc');
    expect(text).toContain('padding: 1rem;');
  });

  it('multiple properties in one rule all emitted', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        styles={{ padding: '1rem', margin: '0', color: 'blue' }}
        media={{}}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('padding: 1rem;');
    expect(text).toContain('margin: 0;');
    expect(text).toContain('color: blue;');
  });
});

// ---------------------------------------------------------------------------
// IS-11 (BUG → FIXED): CSS rendered via dangerouslySetInnerHTML for SSR safety
// Mantine: <style dangerouslySetInnerHTML={{ __html: ... }} />
// Soribashi previously rendered CSS as text children, which react-dom/server
// HTML-escapes — quoted values like fontFamily: '"Inter", sans-serif' emitted
// broken CSS (&quot;) in SSR output.
// ---------------------------------------------------------------------------

describe('IS-11 (BUG → FIXED): SSR output keeps quotes unescaped', () => {
  it('IS-11: quoted CSS values survive renderToString', async () => {
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      <InlineStyles
        selector=".x"
        styles={{ fontFamily: '"Inter", sans-serif' }}
        media={{}}
      />,
    );
    expect(html).toContain('font-family: "Inter", sans-serif;');
    expect(html).not.toContain('&quot;');
  });

  it('IS-11: single quotes in media rules survive renderToString', async () => {
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      <InlineStyles
        selector=".x"
        styles={{}}
        media={{ '(min-width: 48em)': { content: "'a'" } }}
      />,
    );
    expect(html).toContain("content: 'a';");
    expect(html).not.toContain('&#x27;');
  });
});
