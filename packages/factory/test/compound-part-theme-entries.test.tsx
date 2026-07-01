import { createTheme, defineVocabulary } from '@soribashi/theme';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerTheme } from '../src/create-builders.ts';
import { defineCompound } from '../src/define-compound.tsx';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { resetRegistry } from '../src/vocabulary-registry.ts';

const tokens = { colors: {}, radius: {}, spacing: {}, fontSize: {} };

// The observable contract: a theme entry produced by `Part.extend({...})`
// (stored under the flat part name, e.g. theme.components.FooLabel) takes
// effect when the part renders. Mantine achieves this by having sub-components
// pass both names to useStyles (name: string | string[], later names win).
// Reference: mantine/packages/@mantine/core/src/core/styles-api/use-styles/use-styles.ts

const makeFoo = () =>
  defineCompound({
    name: 'Foo',
    classes: { root: 'foo-root', label: 'foo-label' },
    parts: {
      root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
      label: { render: ({ getStyles }) => <span {...getStyles()} /> },
    },
  });

const wrap = (theme: any, ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('compound part theme entries (Part.extend flows through useStyles)', () => {
  it('part theme classNames apply to the part slot', () => {
    const Foo = makeFoo();
    const theme = createTheme({
      tokens: tokens as never,
      components: [(Foo as any).Label.extend({ classNames: { label: 'themed-label' } })],
    });
    const { container } = wrap(
      theme,
      <Foo>
        <Foo.Label />
      </Foo>,
    );
    expect(container.querySelector('.foo-label')?.className).toContain('themed-label');
  });

  it('part theme classNames do not leak onto the root slot', () => {
    const Foo = makeFoo();
    const theme = createTheme({
      tokens: tokens as never,
      components: [(Foo as any).Label.extend({ classNames: { root: 'label-entry-root' } })],
    });
    const { container } = wrap(
      theme,
      <Foo>
        <Foo.Label />
      </Foo>,
    );
    // The entry's 'root' key targets the root SLOT, but only for calls made by
    // the Label part; the Root component itself must not pick it up.
    expect(container.querySelector('.foo-root')?.className).not.toContain('label-entry-root');
  });

  it('part theme styles apply to the part slot', () => {
    const Foo = makeFoo();
    const theme = createTheme({
      tokens: tokens as never,
      components: [(Foo as any).Label.extend({ styles: { label: { color: 'rgb(1, 2, 3)' } } })],
    });
    const { container } = wrap(
      theme,
      <Foo>
        <Foo.Label />
      </Foo>,
    );
    const label = container.querySelector('.foo-label') as HTMLElement;
    expect(label.style.color).toBe('rgb(1, 2, 3)');
  });

  it('part theme vars apply to the part slot', () => {
    const Foo = makeFoo();
    const theme = createTheme({
      tokens: tokens as never,
      components: [
        (Foo as any).Label.extend({ vars: () => ({ label: { '--label-var': 'purple' } }) }),
      ],
    });
    const { container } = wrap(
      theme,
      <Foo>
        <Foo.Label />
      </Foo>,
    );
    const label = container.querySelector('.foo-label') as HTMLElement;
    expect(label.style.getPropertyValue('--label-var')).toBe('purple');
  });

  it('part theme attributes apply to the part slot', () => {
    const Foo = makeFoo();
    const theme = createTheme({
      tokens: tokens as never,
      components: [(Foo as any).Label.extend({ attributes: { label: { 'data-themed': 'yes' } } })],
    });
    const { container } = wrap(
      theme,
      <Foo>
        <Foo.Label />
      </Foo>,
    );
    expect(container.querySelector('.foo-label')?.getAttribute('data-themed')).toBe('yes');
  });

  it('part theme defaultProps apply (existing contract)', () => {
    let captured: unknown;
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', label: 'foo-label' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        label: {
          render: ({ getStyles, props }: any) => {
            captured = props.truncate;
            return <span {...getStyles()} />;
          },
        },
      },
    });
    const theme = createTheme({
      tokens: tokens as never,
      components: [(Foo as any).Label.extend({ defaultProps: { truncate: true } })],
    });
    wrap(
      theme,
      <Foo>
        <Foo.Label />
      </Foo>,
    );
    expect(captured).toBe(true);
  });

  it('part entry styles win over root entry styles for the same slot (later name wins)', () => {
    const Foo = makeFoo();
    const theme = createTheme({
      tokens: tokens as never,
      components: [
        (Foo as any).extend({ styles: { label: { color: 'rgb(255, 0, 0)' } } }),
        (Foo as any).Label.extend({ styles: { label: { color: 'rgb(0, 0, 255)' } } }),
      ],
    });
    const { container } = wrap(
      theme,
      <Foo>
        <Foo.Label />
      </Foo>,
    );
    const label = container.querySelector('.foo-label') as HTMLElement;
    expect(label.style.color).toBe('rgb(0, 0, 255)');
  });
});

describe('compound part vocabulary validation (own registered name)', () => {
  beforeEach(() => {
    resetRegistry();
  });

  it('part-level vocabulary override from the theme is consulted', () => {
    const Foo = defineCompound({
      name: 'Foo',
      vocabularyAxes: ['variant'] as const,
      classes: { root: 'foo-root', label: 'foo-label' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        label: { render: ({ getStyles }) => <span {...getStyles()} /> },
      },
    });
    const theme = createTheme({
      tokens: tokens as never,
      components: [
        (Foo as any).Label.extend({
          vocabulary: { variant: defineVocabulary(['special']) },
        }),
      ],
    });
    registerTheme(theme);

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    wrap(
      theme,
      <Foo>
        <Foo.Label variant="special" />
      </Foo>,
    );
    expect(errSpy).not.toHaveBeenCalled();

    errSpy.mockClear();
    wrap(
      theme,
      <Foo>
        <Foo.Label variant="not-in-vocab" />
      </Foo>,
    );
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
