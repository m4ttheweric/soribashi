import { createTheme } from '@soribashi/theme';
import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';
import { emitTailwindV4 } from '../src/emit-tailwind-v4.ts';

/**
 * Tailwind v4 end-to-end smoke. Confirms that the `@theme` block emitted by
 * `emitTailwindV4` is picked up by the real Tailwind v4 compiler and that
 * utilities resolve through it. Without this, the v4 emitter is only verified
 * structurally — never executed.
 */

function wrap(themeBlock: string): string {
  return `@layer theme, base, components, utilities;

@layer theme {
  ${themeBlock}
}

@layer utilities {
  @tailwind utilities;
}
`;
}

describe('emitTailwindV4 — Tailwind v4 compile', () => {
  it('color utilities resolve to the emitted custom properties', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(217 91% 60%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.75rem' },
        fontSize: { md: '1rem' },
      },
    });

    const result = await compile(wrap(emitTailwindV4(theme)));
    const css = result.build(['bg-primary-500', 'text-primary-500']);

    expect(css).toContain('.bg-primary-500');
    expect(css).toContain('.text-primary-500');
    expect(css).toContain('--color-primary-500');
  });

  it('radius, spacing, font-size utilities resolve through the theme', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(217 91% 60%)' } },
        radius: { md: '0.5rem', lg: '0.75rem' },
        spacing: { md: '0.75rem', lg: '1.5rem' },
        fontSize: { md: '1rem', lg: '1.125rem' },
      },
    });

    const result = await compile(wrap(emitTailwindV4(theme)));
    const css = result.build(['rounded-md', 'rounded-lg', 'p-md', 'm-lg', 'text-md']);

    expect(css).toContain('.rounded-md');
    expect(css).toContain('.rounded-lg');
    expect(css).toContain('.p-md');
    expect(css).toContain('.m-lg');
    expect(css).toContain('.text-md');
  });

  it('breakpoint tokens become responsive variants', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(217 91% 60%)' } },
        radius: {},
        spacing: { md: '0.75rem' },
        fontSize: {},
        breakpoint: { md: '48rem', lg: '64rem' },
      },
    });

    const result = await compile(wrap(emitTailwindV4(theme)));
    const css = result.build(['md:bg-primary-500', 'lg:p-md']);

    expect(css).toContain('48rem');
    expect(css).toContain('64rem');
    expect(css).toContain('.md\\:bg-primary-500');
    expect(css).toContain('.lg\\:p-md');
  });

  it('shadow tokens resolve via shadow-* utilities', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(217 91% 60%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
        shadow: { card: '0 1px 2px rgb(0 0 0 / 0.1)' },
      },
    });

    const result = await compile(wrap(emitTailwindV4(theme)));
    const css = result.build(['shadow-card']);

    expect(css).toContain('.shadow-card');
    // v4 splits shadow values across --tw-shadow + --tw-shadow-color; the
    // length portion is inlined and the color is the fallback for the color
    // var. Both pieces must come through from the theme.
    expect(css).toContain('0 1px 2px');
    expect(css).toContain('rgb(0 0 0 / 0.1)');
  });

  it('unknown utilities produce no output (negative case)', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(217 91% 60%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const result = await compile(wrap(emitTailwindV4(theme)));
    const css = result.build(['bg-not-a-real-token-9999']);

    expect(css).not.toContain('.bg-not-a-real-token-9999');
  });
});
