import { describe, expect, it } from 'vitest';
import { defaultDarkTokens, defaultTokens } from '../src/tokens/index.ts';

describe('defaultTokens', () => {
  it('includes a primary color scale with 50–900 shades', () => {
    expect(defaultTokens.colors.primary).toBeDefined();
    expect(defaultTokens.colors.primary?.['50']).toBeDefined();
    expect(defaultTokens.colors.primary?.['500']).toBeDefined();
    expect(defaultTokens.colors.primary?.['900']).toBeDefined();
  });

  it('includes radius scale with sm, md, lg', () => {
    expect(defaultTokens.radius.sm).toBeDefined();
    expect(defaultTokens.radius.md).toBeDefined();
    expect(defaultTokens.radius.lg).toBeDefined();
  });

  it('includes spacing scale with xs through xl', () => {
    expect(defaultTokens.spacing.xs).toBeDefined();
    expect(defaultTokens.spacing.sm).toBeDefined();
    expect(defaultTokens.spacing.md).toBeDefined();
    expect(defaultTokens.spacing.lg).toBeDefined();
    expect(defaultTokens.spacing.xl).toBeDefined();
  });

  it('includes font size scale with sm through xl', () => {
    expect(defaultTokens.fontSize.sm).toBeDefined();
    expect(defaultTokens.fontSize.md).toBeDefined();
    expect(defaultTokens.fontSize.lg).toBeDefined();
    expect(defaultTokens.fontSize.xl).toBeDefined();
  });

  it('includes neutral, success, danger, warning, info color families', () => {
    expect(defaultTokens.colors.neutral).toBeDefined();
    expect(defaultTokens.colors.success).toBeDefined();
    expect(defaultTokens.colors.danger).toBeDefined();
    expect(defaultTokens.colors.warning).toBeDefined();
    expect(defaultTokens.colors.info).toBeDefined();
  });

  it('defaultDarkTokens overrides primary and neutral colors', () => {
    expect(defaultDarkTokens.colors?.primary).toBeDefined();
    expect(defaultDarkTokens.colors?.neutral).toBeDefined();
  });

  it('includes fontWeight scale with regular/medium/semibold/bold', () => {
    expect(defaultTokens.fontWeight?.regular).toBe('400');
    expect(defaultTokens.fontWeight?.medium).toBe('500');
    expect(defaultTokens.fontWeight?.semibold).toBe('600');
    expect(defaultTokens.fontWeight?.bold).toBe('700');
  });

  it('includes lineHeight scale with xs through xl', () => {
    expect(defaultTokens.lineHeight?.xs).toBeDefined();
    expect(defaultTokens.lineHeight?.sm).toBeDefined();
    expect(defaultTokens.lineHeight?.md).toBeDefined();
    expect(defaultTokens.lineHeight?.lg).toBeDefined();
    expect(defaultTokens.lineHeight?.xl).toBeDefined();
  });

  it('includes fontFamily.heading', () => {
    expect(defaultTokens.fontFamily?.heading).toBeDefined();
  });

  it('includes heading.sizes for h1-h6', () => {
    expect(defaultTokens.heading?.sizes.h1.fontSize).toBeDefined();
    expect(defaultTokens.heading?.sizes.h2.fontSize).toBeDefined();
    expect(defaultTokens.heading?.sizes.h3.fontSize).toBeDefined();
    expect(defaultTokens.heading?.sizes.h4.fontSize).toBeDefined();
    expect(defaultTokens.heading?.sizes.h5.fontSize).toBeDefined();
    expect(defaultTokens.heading?.sizes.h6.fontSize).toBeDefined();
  });
});

// The default intent resolver hardcodes these shade lookups; if any default
// scale misses one, out-of-the-box components reference an undefined CSS var.
const DEFAULT_INTENTS = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const RESOLVER_SHADES = ['50', '100', '200', '500', '600', '700', '800', 'foreground'] as const;

describe('default scales satisfy the default intent resolver contract', () => {
  for (const intent of DEFAULT_INTENTS) {
    it(`${intent} defines every shade the default resolver references`, () => {
      const scale = defaultTokens.colors[intent];
      expect(scale).toBeDefined();
      for (const shade of RESOLVER_SHADES) {
        expect(scale?.[shade], `colors.${intent}.${shade}`).toBeDefined();
      }
    });
  }

  it('warning foreground is a dark value (white is unreadable on amber 500)', () => {
    const fg = defaultTokens.colors.warning?.foreground ?? '';
    const lightness = Number(/(\d+(?:\.\d+)?)%\)$/.exec(fg)?.[1]);
    expect(lightness).toBeLessThan(40);
  });

  it('non-warning foregrounds are white for the 500 backgrounds', () => {
    for (const intent of DEFAULT_INTENTS) {
      if (intent === 'warning') continue;
      expect(defaultTokens.colors[intent]?.foreground).toBe('hsl(0 0% 100%)');
    }
  });
});

describe('defaultDarkTokens: complete neutral inversion', () => {
  // Mirror pairing: dark shade k takes the light value of its opposite shade.
  const NEUTRAL_INVERSION: Record<string, string> = {
    '0': '950',
    '50': '900',
    '100': '800',
    '200': '700',
    '300': '600',
    '400': '500',
    '500': '400',
    '600': '300',
    '700': '200',
    '800': '100',
    '900': '50',
    '950': '0',
  };

  it('overrides every neutral shade the default semantics and resolver reference', () => {
    for (const shade of Object.keys(NEUTRAL_INVERSION)) {
      expect(defaultDarkTokens.colors?.neutral?.[shade], `dark neutral.${shade}`).toBeDefined();
    }
  });

  it('dark neutral shades mirror the light scale', () => {
    for (const [darkShade, lightShade] of Object.entries(NEUTRAL_INVERSION)) {
      expect(defaultDarkTokens.colors?.neutral?.[darkShade], `dark neutral.${darkShade}`).toBe(
        defaultTokens.colors.neutral?.[lightShade],
      );
    }
  });

  it('dark neutral foreground flips dark for the light dark-mode 500 background', () => {
    const fg = defaultDarkTokens.colors?.neutral?.foreground ?? '';
    const lightness = Number(/(\d+(?:\.\d+)?)%\)$/.exec(fg)?.[1]);
    expect(lightness).toBeLessThan(30);
  });

  it('border.default pairing resolves dark in dark mode (dark neutral.200 is a dark value)', () => {
    const border = defaultDarkTokens.colors?.neutral?.['200'] ?? '';
    const lightness = Number(/(\d+(?:\.\d+)?)%\)$/.exec(border)?.[1]);
    expect(lightness).toBeLessThan(40);
  });
});
