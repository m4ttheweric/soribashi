import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';
import { defaultIntentResolver } from '../src/default-intent-resolver.ts';
import { defineVocabulary } from '../src/define-vocabulary.ts';

describe('createTheme', () => {
  it('returns a normalized theme with required fields populated', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    expect(theme.scope).toBe(':root');
    expect(theme.darkMode).toEqual({ selector: '.dark' });
    expect(theme.intentResolver).toBe(defaultIntentResolver);
    expect(theme.components).toEqual({});
    expect(theme.dark).toEqual({});
    expect(theme.name).toBe('default');
  });

  it('respects custom scope and darkMode', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      scope: '.app-scope',
      darkMode: { selector: '.dark .app-scope' },
    });

    expect(theme.scope).toBe('.app-scope');
    expect(theme.darkMode.selector).toBe('.dark .app-scope');
  });

  it('applies default vocabulary intent and variant if not provided', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    expect(theme.vocabulary.intent.values).toEqual([
      'primary',
      'neutral',
      'success',
      'warning',
      'danger',
      'info',
    ]);
    expect(theme.vocabulary.variant.values).toEqual(['filled', 'outline', 'subtle', 'ghost', 'link']);
  });

  it('respects user-provided vocabulary intent and variant lists', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' }, brand: { '500': '#fff' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      vocabulary: {
        intent: defineVocabulary(['primary', 'brand']),
        variant: defineVocabulary(['filled', 'outline']),
      },
    });

    expect(theme.vocabulary.intent.values).toEqual(['primary', 'brand']);
    expect(theme.vocabulary.variant.values).toEqual(['filled', 'outline']);
  });

  it('uses custom intent resolver when provided', () => {
    const customResolver = () => ({
      background: 'red',
      color: 'white',
      border: 'transparent',
    });

    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      intentResolver: customResolver,
    });

    expect(theme.intentResolver).toBe(customResolver);
  });

  it('preserves the provided name', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      name: 'my-app',
    });

    expect(theme.name).toBe('my-app');
  });
});
