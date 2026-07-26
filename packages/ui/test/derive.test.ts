import { describe, expect, it } from 'vitest';
import { buildManifest, extractTokenDependencies } from '../scripts/derive.ts';

describe('extractTokenDependencies', () => {
  it('extracts a single theme-prefixed var() reference', () => {
    expect(extractTokenDependencies('.root { color: var(--text-default); }')).toEqual([
      '--text-default',
    ]);
  });

  it('extracts one reference per theme prefix in the allowed list', () => {
    const css = `
      .root {
        color: var(--color-danger-500);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        font-size: var(--font-size-sm);
        font-family: var(--font-family-sans);
        font-weight: var(--font-weight-medium);
        line-height: var(--line-height-md);
        box-shadow: var(--shadow-md);
        max-inline-size: var(--breakpoint-xs);
        z-index: var(--z-index-modal);
        color: var(--text-muted);
        background: var(--surface-default);
        border-color: var(--border-default);
        outline-color: var(--accent-primary);
      }
    `;
    expect(extractTokenDependencies(css)).toEqual([
      '--accent-primary',
      '--border-default',
      '--breakpoint-xs',
      '--color-danger-500',
      '--font-family-sans',
      '--font-size-sm',
      '--font-weight-medium',
      '--line-height-md',
      '--radius-md',
      '--shadow-md',
      '--spacing-md',
      '--surface-default',
      '--text-muted',
      '--z-index-modal',
    ]);
  });

  it('excludes recipe-local --sb-* vars', () => {
    expect(extractTokenDependencies('.root { block-size: var(--sb-button-h, 2.25rem); }')).toEqual(
      [],
    );
  });

  it('excludes autoVars --button-* / --popover-* vars (the recipe own contract)', () => {
    const css = `
      .root {
        background: var(--button-bg);
        color: var(--button-color);
      }
      .popup {
        background: var(--popover-surface);
      }
    `;
    expect(extractTokenDependencies(css)).toEqual([]);
  });

  it('walks into fallback positions and keeps a theme var used as a fallback', () => {
    // Outer ref is recipe-local (excluded); the fallback is theme-prefixed (kept).
    expect(
      extractTokenDependencies(
        '.root { background: var(--button-hover, var(--color-neutral-500)); }',
      ),
    ).toEqual(['--color-neutral-500']);
  });

  it('walks into fallback positions and excludes a recipe-local fallback of a theme var', () => {
    // Outer ref is theme-prefixed (kept); the fallback is recipe-local (excluded).
    expect(
      extractTokenDependencies(
        '.root { outline: 2px solid var(--accent-primary, var(--button-bg)); }',
      ),
    ).toEqual(['--accent-primary']);
  });

  it('handles triple-nested fallbacks, keeping only the theme-prefixed names', () => {
    expect(
      extractTokenDependencies(
        '.root { background: var(--button-active, var(--button-hover, var(--button-bg))); }',
      ),
    ).toEqual([]);
  });

  it('does not match a prefix that is a substring but not a boundary (color vs colorful)', () => {
    expect(extractTokenDependencies('.root { --colorful-thing: var(--colorful-thing); }')).toEqual(
      [],
    );
  });

  it('excludes a var with no theme prefix at all (e.g. Base UI runtime var)', () => {
    expect(
      extractTokenDependencies('.popup { transform-origin: var(--transform-origin); }'),
    ).toEqual([]);
  });

  it('sorts and dedupes repeated references', () => {
    const css = `
      .a { color: var(--text-default); }
      .b { color: var(--text-default); }
      .c { color: var(--accent-primary); }
    `;
    expect(extractTokenDependencies(css)).toEqual(['--accent-primary', '--text-default']);
  });

  it('returns an empty array for CSS with no var() references', () => {
    expect(extractTokenDependencies('.root { display: flex; }')).toEqual([]);
  });
});

describe('buildManifest', () => {
  it('returns entries for exactly Alert, AspectRatio, Badge, Box, Button, Center, Container, Grid, Group, Paper, Popover, Stack, Text, and Title', async () => {
    const manifest = await buildManifest();
    expect(manifest.recipes.map((r) => r.name)).toEqual([
      'Alert',
      'AspectRatio',
      'Badge',
      'Box',
      'Button',
      'Center',
      'Container',
      'Grid',
      'Group',
      'Paper',
      'Popover',
      'Stack',
      'Text',
      'Title',
    ]);
  });

  it('derives Button with its expected slots, axes, variants, defaults, and category', async () => {
    const manifest = await buildManifest();
    const button = manifest.recipes.find((r) => r.name === 'Button');
    expect(button).toBeDefined();
    expect(button?.builder).toBe('definePolymorphicComponent');
    expect(button?.category).toBe(1);
    expect(button?.slots).toEqual(['root', 'label']);
    expect(button?.parts).toEqual([]);
    expect(button?.vocabularyAxes).toEqual(['size', 'intent', 'variant']);
    expect(button?.variants).toEqual(['filled', 'outline', 'subtle', 'ghost', 'link']);
    expect(button?.defaults).toEqual({ intent: 'primary', variant: 'filled', size: 'md' });
    expect(button?.baseUi).toBe(false);
    expect(button?.files).toEqual([
      'packages/ui/src/recipes/Button/Button.tsx',
      'packages/ui/src/recipes/Button/Button.module.css',
      'packages/ui/src/recipes/Button/Button.test.tsx',
      'packages/ui/src/recipes/Button/Button.visual.test.tsx',
    ]);
    expect(button?.tokenDependencies).toContain('--accent-primary');
    expect(button?.tokenDependencies).not.toContain('--sb-button-h');
    expect(button?.tokenDependencies).not.toContain('--button-bg');
  });

  it('derives Popover with its expected slots, axes, and category, and detects baseUi', async () => {
    const manifest = await buildManifest();
    const popover = manifest.recipes.find((r) => r.name === 'Popover');
    expect(popover).toBeDefined();
    expect(popover?.builder).toBe('defineCompound');
    expect(popover?.category).toBe(2);
    expect(popover?.slots).toEqual([
      'root',
      'trigger',
      'positioner',
      'popup',
      'arrow',
      'title',
      'description',
      'close',
    ]);
    expect(popover?.parts).toEqual(['root', 'trigger', 'content', 'title', 'description', 'close']);
    expect(popover?.vocabularyAxes).toEqual([]);
    expect(popover?.baseUi).toBe(true);
    expect(popover?.tokenDependencies).not.toContain('--transform-origin');
  });

  it('derives the vocabulary from uiVocabulary', async () => {
    const manifest = await buildManifest();
    expect(manifest.vocabulary.size).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
    expect(manifest.vocabulary.intent).toEqual([
      'primary',
      'neutral',
      'success',
      'warning',
      'danger',
      'info',
    ]);
    expect(manifest.vocabulary.variant).toEqual(['filled', 'outline', 'subtle', 'ghost', 'link']);
  });
});
