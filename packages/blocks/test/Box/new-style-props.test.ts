/**
 * Tests for the 12 style props added in finding #7.
 */
import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { parseStyleProps } from '../../src/Box/style-props/parse-style-props.ts';
import { STYLE_PROPS_DATA } from '../../src/Box/style-props/style-props-data.ts';

const theme = createTheme({
  tokens: {
    colors: {},
    radius: {},
    spacing: { md: '0.75rem' },
    fontSize: {},
    breakpoint: { xs: '24rem', sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem' },
  },
});

const parse = (styleProps: Record<string, unknown>) =>
  parseStyleProps({ styleProps, data: STYLE_PROPS_DATA, theme });

describe('new style props — margin inline axis (mis / mie)', () => {
  it('mis="md" → marginInlineStart: var(--spacing-md)', () => {
    expect(parse({ mis: 'md' }).inlineStyles.marginInlineStart).toBe('var(--spacing-md)');
  });

  it('mie="md" → marginInlineEnd: var(--spacing-md)', () => {
    expect(parse({ mie: 'md' }).inlineStyles.marginInlineEnd).toBe('var(--spacing-md)');
  });
});

describe('new style props — padding inline axis (pis / pie)', () => {
  it('pis="md" → paddingInlineStart: var(--spacing-md)', () => {
    expect(parse({ pis: 'md' }).inlineStyles.paddingInlineStart).toBe('var(--spacing-md)');
  });

  it('pie="md" → paddingInlineEnd: var(--spacing-md)', () => {
    expect(parse({ pie: 'md' }).inlineStyles.paddingInlineEnd).toBe('var(--spacing-md)');
  });
});

describe('new style props — typography (ff / fs / tt / td)', () => {
  it('ff="monospace" → fontFamily: monospace (identity)', () => {
    expect(parse({ ff: 'monospace' }).inlineStyles.fontFamily).toBe('monospace');
  });

  it('fs="italic" → fontStyle: italic (identity)', () => {
    expect(parse({ fs: 'italic' }).inlineStyles.fontStyle).toBe('italic');
  });

  it('tt="uppercase" → textTransform: uppercase (identity)', () => {
    expect(parse({ tt: 'uppercase' }).inlineStyles.textTransform).toBe('uppercase');
  });

  it('td="underline" → textDecoration: underline (identity)', () => {
    expect(parse({ td: 'underline' }).inlineStyles.textDecoration).toBe('underline');
  });
});

describe('new style props — background (bgsz / bgp / bgr / bga)', () => {
  it('bgsz="cover" → backgroundSize: cover', () => {
    expect(parse({ bgsz: 'cover' }).inlineStyles.backgroundSize).toBe('cover');
  });

  it('bgsz={16} → backgroundSize: 1rem (rem conversion via sizeOrRem)', () => {
    expect(parse({ bgsz: 16 }).inlineStyles.backgroundSize).toBe('1rem');
  });

  it('bgp="center" → backgroundPosition: center (identity)', () => {
    expect(parse({ bgp: 'center' }).inlineStyles.backgroundPosition).toBe('center');
  });

  it('bgr="no-repeat" → backgroundRepeat: no-repeat (identity)', () => {
    expect(parse({ bgr: 'no-repeat' }).inlineStyles.backgroundRepeat).toBe('no-repeat');
  });

  it('bga="fixed" → backgroundAttachment: fixed (identity)', () => {
    expect(parse({ bga: 'fixed' }).inlineStyles.backgroundAttachment).toBe('fixed');
  });
});
