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
