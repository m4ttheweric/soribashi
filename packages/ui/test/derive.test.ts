import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertRecipeFilesExist,
  buildManifest,
  extractRecipeDependencies,
  extractTokenDependencies,
} from '../scripts/derive.ts';

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

describe('extractRecipeDependencies', () => {
  it('detects a sibling recipe import and lowercases it to the registry-item name', () => {
    const src = `import { Field } from '../Field/Field.tsx';\n`;
    expect(extractRecipeDependencies(src)).toEqual(['field']);
  });

  it('ignores same-directory, package, and builders imports', () => {
    const src = [
      `import classes from './TextInput.module.css';`,
      `import { autoVars } from '@soribashi/core';`,
      `import { defineComponent } from '../../builders.ts';`,
      `import { Input } from '@base-ui/react/input';`,
    ].join('\n');
    expect(extractRecipeDependencies(src)).toEqual([]);
  });

  it('dedupes and sorts multiple imports from sibling recipes', () => {
    const src = [
      `import { Field, FieldAnatomyContext } from '../Field/Field.tsx';`,
      `import type { FieldProps } from '../Field/Field.tsx';`,
      `import { Badge } from '../Badge/Badge.tsx';`,
    ].join('\n');
    expect(extractRecipeDependencies(src)).toEqual(['badge', 'field']);
  });
});

it('derives registryDependencies: [] for every current recipe except TextInput, Textarea, Switch, and RadioGroup (-> field)', async () => {
  // Task 3 landed this as an all-[] degenerate case (no recipe imported a
  // sibling recipe yet). TextInput (Task 5) is the first real, non-empty
  // instance: its render imports `Field` via '../Field/Field.tsx', so
  // extractRecipeDependencies picks it up. Textarea (Task 6) mirrors
  // TextInput's own '../Field/Field.tsx' import, so it grows the same
  // dependency. Switch (Task 7) mirrors it again (Checkbox's control
  // template plus the Field anatomy contract). RadioGroup (Task 8) mirrors it
  // a fourth time (its own items.ts module plus the same Field anatomy
  // contract; items.ts itself imports nothing from Field, so it contributes
  // no extra dependency edge). Every OTHER recipe stays degenerate, so this
  // keeps asserting that blanket case for everything but the four recipes
  // that have grown a real dependency. A named list, not a wildcard: a future
  // recipe that happens to also import Field must be added here explicitly,
  // not silently swept in.
  const manifest = await buildManifest();
  const FIELD_DEPENDENTS = new Set(['TextInput', 'Textarea', 'Switch', 'RadioGroup']);
  for (const recipe of manifest.recipes) {
    if (FIELD_DEPENDENTS.has(recipe.name)) {
      expect(recipe.registryDependencies, recipe.name).toEqual(['field']);
    } else {
      expect(recipe.registryDependencies, recipe.name).toEqual([]);
    }
  }
});

describe('buildManifest', () => {
  it('returns entries for exactly Accordion, Alert, AspectRatio, Avatar, Badge, Box, Button, Center, Checkbox, Container, Dialog, Divider, Field, Grid, Group, Paper, Popover, RadioGroup, Select, Skeleton, Stack, Switch, Tabs, Text, Textarea, TextInput, Title, and Tooltip', async () => {
    const manifest = await buildManifest();
    expect(manifest.recipes.map((r) => r.name)).toEqual([
      'Accordion',
      'Alert',
      'AspectRatio',
      'Avatar',
      'Badge',
      'Box',
      'Button',
      'Center',
      'Checkbox',
      'Container',
      'Dialog',
      'Divider',
      'Field',
      'Grid',
      'Group',
      'Paper',
      'Popover',
      'RadioGroup',
      'Select',
      'Skeleton',
      'Stack',
      'Switch',
      'Tabs',
      'Text',
      'Textarea',
      'TextInput',
      'Title',
      'Tooltip',
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
    expect(button?.variants).toEqual([
      'filled',
      'light',
      'outline',
      'subtle',
      'default',
      'transparent',
      'link',
    ]);
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
    expect(manifest.vocabulary.variant).toEqual([
      'filled',
      'light',
      'outline',
      'subtle',
      'default',
      'transparent',
      'link',
    ]);
  });
});

// SORI-16: a missing/misnamed declared file (derive.ts only ever read the
// .tsx/.module.css of the four) must fail loudly, naming the recipe and the
// specific missing file(s), instead of silently going unnoticed.
describe('assertRecipeFilesExist', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'soribashi-derive-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('passes silently when every declared file exists', () => {
    const files = ['Foo.tsx', 'Foo.module.css', 'Foo.test.tsx', 'Foo.visual.test.tsx'].map((name) =>
      join(tempDir, name),
    );
    for (const f of files) writeFileSync(f, '');

    expect(() => assertRecipeFilesExist('Foo', files)).not.toThrow();
  });

  it('throws naming the recipe and the single missing file', () => {
    const tsxPath = join(tempDir, 'Foo.tsx');
    const cssPath = join(tempDir, 'Foo.module.css');
    const testPath = join(tempDir, 'Foo.test.tsx');
    const visualTestPath = join(tempDir, 'Foo.visual.test.tsx');
    writeFileSync(tsxPath, '');
    writeFileSync(cssPath, '');
    writeFileSync(visualTestPath, '');
    // testPath deliberately never written — the missing/misnamed test file case.

    expect(() =>
      assertRecipeFilesExist('Foo', [tsxPath, cssPath, testPath, visualTestPath]),
    ).toThrow(/"Foo".*Foo\.test\.tsx/s);
  });

  it('throws naming every missing file when more than one is absent', () => {
    const tsxPath = join(tempDir, 'Foo.tsx');
    const cssPath = join(tempDir, 'Foo.module.css');
    const testPath = join(tempDir, 'Foo.test.tsx');
    const visualTestPath = join(tempDir, 'Foo.visual.test.tsx');
    writeFileSync(tsxPath, '');
    writeFileSync(cssPath, '');
    // testPath and visualTestPath both missing.

    let thrown: unknown;
    try {
      assertRecipeFilesExist('Foo', [tsxPath, cssPath, testPath, visualTestPath]);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Error);
    const message = (thrown as Error).message;
    expect(message).toContain('"Foo"');
    expect(message).toContain('Foo.test.tsx');
    expect(message).toContain('Foo.visual.test.tsx');
  });
});
