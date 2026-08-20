import { createTheme } from '@soribashi/theme';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    expect(result.root?.['--button-hover']).toBe(
      'color-mix(in oklab, var(--color-primary-500) 90%, black)',
    );
    expect(result.root?.['--button-active']).toBe(
      'color-mix(in oklab, var(--color-primary-500) 80%, black)',
    );
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

  // SORI-20: the missing-default no-op is deliberately unchanged behaviour;
  // these only pin the new dev-only diagnostic on top of it.
  describe('dev-only missing-default warning (SORI-20)', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    });

    it('warns, naming the component and the missing default, when intent is absent', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Distinct component name per test so the dedupe Set in auto-vars.ts
      // (module-scoped, shared across tests) can't mask a fresh warning.
      autoVars(theme, 'WarnIntentMissing', { variant: 'filled' }, true);

      expect(warn).toHaveBeenCalledTimes(1);
      const message = warn.mock.calls[0]?.[0] as string;
      expect(message).toContain('WarnIntentMissing');
      expect(message).toContain('intent');
    });

    it('warns, naming the component and the missing default, when variant is absent', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      autoVars(theme, 'WarnVariantMissing', { intent: 'primary' }, true);

      expect(warn).toHaveBeenCalledTimes(1);
      const message = warn.mock.calls[0]?.[0] as string;
      expect(message).toContain('WarnVariantMissing');
      expect(message).toContain('variant');
    });

    it('does not warn a second time for the same component + missing default', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      autoVars(theme, 'WarnDedupeCase', { variant: 'filled' }, true);
      autoVars(theme, 'WarnDedupeCase', { variant: 'filled' }, true);
      autoVars(theme, 'WarnDedupeCase', { variant: 'outline' }, true);

      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('never warns when both intent and variant are set (autoVars actually runs)', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      autoVars(theme, 'WarnNeverCase', { intent: 'primary', variant: 'filled' }, true);

      expect(warn).not.toHaveBeenCalled();
    });

    it('never warns when the component has no variants at all (hasVariants false)', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      autoVars(theme, 'WarnNoVariantsCase', {}, false);

      expect(warn).not.toHaveBeenCalled();
    });
  });
});
