import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { autoVars } from '../src/auto-vars.ts';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

describe('autoVars', () => {
  it('returns empty object when component has no variants and no intent prop', () => {
    const result = autoVars(theme, 'Button', { size: 'md' }, false);
    expect(result).toEqual({});
  });

  it('returns root vars when component declares variants and props have intent + variant', () => {
    const result = autoVars(theme, 'Button', { intent: 'primary', variant: 'filled' }, true);
    expect(result.root).toBeDefined();
    expect(result.root?.['--button-bg']).toBe('var(--color-primary-500)');
    expect(result.root?.['--button-color']).toBe('var(--color-primary-foreground)');
    expect(result.root?.['--button-border']).toBe('transparent');
  });

  it('lowercases the component name for the var prefix', () => {
    const result = autoVars(theme, 'IconButton', { intent: 'primary', variant: 'filled' }, true);
    expect(result.root?.['--iconbutton-bg']).toBe('var(--color-primary-500)');
  });

  it('returns hover and active vars when resolver provides them', () => {
    const result = autoVars(theme, 'Button', { intent: 'primary', variant: 'filled' }, true);
    expect(result.root?.['--button-hover']).toBe('var(--color-primary-600)');
    expect(result.root?.['--button-active']).toBe('var(--color-primary-700)');
  });

  it('omits hover when resolver does not provide it', () => {
    const customTheme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      intentResolver: () => ({
        background: 'red',
        color: 'white',
        border: 'transparent',
      }),
    });

    const result = autoVars(customTheme, 'Button', { intent: 'primary', variant: 'x' }, true);
    expect(result.root?.['--button-hover']).toBeUndefined();
    expect(result.root?.['--button-active']).toBeUndefined();
  });

  it('returns empty when component declares variants but instance lacks intent', () => {
    const result = autoVars(theme, 'Button', { variant: 'filled' }, true);
    expect(result).toEqual({});
  });
});
