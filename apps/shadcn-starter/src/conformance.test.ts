import { describe, expect, it } from 'vitest';
import { manifest } from '../conversion/manifest.ts';

describe('conversion conformance', () => {
  it('every manifest entry has a non-empty selectors array', () => {
    for (const entry of manifest) {
      expect(entry.selectors.length, `${entry.component} has no selectors`).toBeGreaterThan(0);
    }
  });

  it('every manifest entry has a valid category', () => {
    for (const entry of manifest) {
      expect([1, 2, 3, 4, 'integration']).toContain(entry.category);
    }
  });

  it('every manifest entry has upstream metadata', () => {
    for (const entry of manifest) {
      expect(entry.upstream.registryItem, `${entry.component} missing registryItem`).toBeTruthy();
      expect(entry.upstream.style).toBe('new-york');
    }
  });

  it('every manifest entry has a propMap', () => {
    for (const entry of manifest) {
      expect(entry.propMap, `${entry.component} missing propMap`).toBeDefined();
    }
  });

  it('manifest has expected Phase 1 components', () => {
    const names = manifest.map((e) => e.component);
    for (const expected of [
      'button',
      'badge',
      'card',
      'tooltip',
      'dialog',
      'dropdown-menu',
      'tabs',
      'accordion',
      'checkbox',
      'select',
    ]) {
      expect(names, `missing ${expected}`).toContain(expected);
    }
  });
});
