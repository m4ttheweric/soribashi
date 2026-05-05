// packages/factory/test/define-compound.test.tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { defineCompound, SoribashiProvider } from '../src/index.ts';

const minimalTheme = createTheme({
  tokens: { colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
});

// ---------------------------------------------------------------------------
// Cycle 7.1 — Root-only shape
// ---------------------------------------------------------------------------

describe('defineCompound — basic shape', () => {
  it('returns a Root component when only root part is declared', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root' },
      parts: {
        root: {
          render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div>,
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>hi</Foo>
      </SoribashiProvider>,
    );

    const el = container.querySelector('.foo-root');
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe('hi');
  });

  it('Root has displayName equal to config.name', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root' },
      parts: {
        root: { render: ({ getStyles }) => <div {...getStyles()} /> },
      },
    });
    expect(Foo.displayName).toBe('Foo');
  });
});

// ---------------------------------------------------------------------------
// Cycle 7.2 — Non-root parts as namespaced components
// ---------------------------------------------------------------------------

describe('defineCompound — multi-part', () => {
  const Foo = defineCompound({
    name: 'Foo',
    classes: { root: 'foo-root', label: 'foo-label' },
    parts: {
      root: {
        render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div>,
      },
      label: {
        render: ({ getStyles, children }) => <span {...getStyles()}>{children}</span>,
      },
    },
  });

  it('attaches non-root parts as static properties', () => {
    expect(Foo.Label).toBeDefined();
  });

  it('renders parts inside Root reading from the safe-context', () => {
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Label>hi</Foo.Label>
        </Foo>
      </SoribashiProvider>,
    );

    const root = container.querySelector('.foo-root') as HTMLElement;
    const label = container.querySelector('.foo-label') as HTMLElement;
    expect(root).not.toBeNull();
    expect(label).not.toBeNull();
    expect(label.textContent).toBe('hi');
  });

  it('throws when a part is rendered outside Root', () => {
    expect(() =>
      render(
        <SoribashiProvider theme={minimalTheme}>
          <Foo.Label>oops</Foo.Label>
        </SoribashiProvider>,
      ),
    ).toThrow(/Foo parts must be inside <Foo>/);
  });

  it('part name on the namespace is capitalized from config key', () => {
    // parts.label → Foo.Label (capitalize first letter)
    expect((Foo as any).Label).toBeDefined();
    expect((Foo as any).label).toBeUndefined();
  });
});
