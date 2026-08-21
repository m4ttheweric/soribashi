import { describe, expect, it } from 'vitest';
import { uiTheme, uiVocabulary } from '../src/theme.ts';

describe('uiTheme', () => {
  it('is named soribashi-ui', () => {
    expect(uiTheme.name).toBe('soribashi-ui');
  });
});

describe('uiVocabulary', () => {
  it('parses declared size values', () => {
    for (const value of ['xs', 'sm', 'md', 'lg', 'xl']) {
      expect(uiVocabulary.size.schema.parse(value)).toBe(value);
    }
  });

  it('parses declared intent values', () => {
    for (const value of ['primary', 'neutral', 'success', 'warning', 'danger', 'info']) {
      expect(uiVocabulary.intent.schema.parse(value)).toBe(value);
    }
  });

  it('parses declared variant values', () => {
    for (const value of ['filled', 'outline', 'light', 'subtle', 'link']) {
      expect(uiVocabulary.variant.schema.parse(value)).toBe(value);
    }
  });

  it('rejects an undeclared value on each axis', () => {
    expect(() => uiVocabulary.size.schema.parse('huge')).toThrow();
    expect(() => uiVocabulary.intent.schema.parse('brand')).toThrow();
    expect(() => uiVocabulary.variant.schema.parse('gradient')).toThrow();
  });
});
