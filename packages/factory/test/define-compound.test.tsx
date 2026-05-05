// packages/factory/test/define-compound.test.tsx
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
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
    ).toThrow(/must be inside <Foo>/);
  });

  it('part name on the namespace is capitalized from config key', () => {
    // parts.label → Foo.Label (capitalize first letter)
    expect((Foo as any).Label).toBeDefined();
    expect((Foo as any).label).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Cycle 7.3 — context() callback
// ---------------------------------------------------------------------------

describe('defineCompound — context()', () => {
  it('context() receives merged props (post-useProps)', () => {
    let captured: { side?: string } | null = null;

    const Foo = defineCompound({
      name: 'Foo',
      defaults: { side: 'top' } as any,
      classes: { root: 'foo-root', child: 'foo-child' },
      context: (rootProps: any) => {
        captured = { side: rootProps.side };
        return { side: rootProps.side };
      },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        child: { render: ({ ctx }) => <span data-side={(ctx as any).side} /> },
      },
    });

    render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Child />
        </Foo>
      </SoribashiProvider>,
    );

    expect(captured).toEqual({ side: 'top' }); // recipe-default applied
  });

  it('context() output flows to part.ctx', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', child: 'foo-child' },
      context: () => ({ customField: 'from-context' }),
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        child: {
          render: ({ ctx }) => <span data-custom={(ctx as any).customField} />,
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Child />
        </Foo>
      </SoribashiProvider>,
    );

    const el = container.querySelector('[data-custom]') as HTMLElement;
    expect(el.dataset.custom).toBe('from-context');
  });

  it('context() can call React hooks (useId)', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', child: 'foo-child' },
      context: () => {
        // useId is a React hook — runs inside Root's render.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const id = (require('react') as typeof import('react')).useId();
        return { id };
      },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        child: { render: ({ ctx }) => <span data-id={(ctx as any).id} /> },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Child />
        </Foo>
      </SoribashiProvider>,
    );

    const el = container.querySelector('[data-id]') as HTMLElement;
    expect(el.dataset.id).toMatch(/^:r/); // useId-style identifier
  });
});

// ---------------------------------------------------------------------------
// Cycle 7.4 — vars resolver lands as inline custom properties
// ---------------------------------------------------------------------------

describe('defineCompound — vars resolver', () => {
  it('vars output lands as inline CSS custom properties on the right slot', () => {
    const Foo = defineCompound({
      name: 'Foo',
      variants: ['default', 'inverted'] as const,
      classes: { root: 'foo-root', child: 'foo-child' },
      defaults: { variant: 'default' } as any,
      vars: (_theme, props: any) => ({
        child: {
          '--foo-bg': props.variant === 'inverted' ? 'black' : 'white',
        },
      }),
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        child: { render: ({ getStyles }) => <span {...getStyles()} /> },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo variant="inverted">
          <Foo.Child />
        </Foo>
      </SoribashiProvider>,
    );

    const child = container.querySelector('.foo-child') as HTMLElement;
    expect(child.style.getPropertyValue('--foo-bg')).toBe('black');
  });
});

// ---------------------------------------------------------------------------
// Cycle 7.5 — Sibling-slot getStyles
// ---------------------------------------------------------------------------

describe('defineCompound — sibling-slot getStyles', () => {
  it('getStyles({ part: "sibling" }) resolves to sibling slot class', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', main: 'foo-main', arrow: 'foo-arrow' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        main: {
          render: ({ getStyles }) => (
            <div {...getStyles()}>
              <span {...getStyles({ part: 'arrow' })} data-testid="arrow-inside-main" />
            </div>
          ),
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Main />
        </Foo>
      </SoribashiProvider>,
    );

    const arrow = container.querySelector('[data-testid="arrow-inside-main"]') as HTMLElement;
    expect(arrow.className).toBe('foo-arrow');
  });
});

// ---------------------------------------------------------------------------
// Cycle 7.7 — Polymorphic parts
// ---------------------------------------------------------------------------

describe('defineCompound — polymorphic parts', () => {
  const Foo = defineCompound({
    name: 'Foo',
    classes: { root: 'foo-root', trigger: 'foo-trigger' },
    parts: {
      root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
      trigger: {
        polymorphic: true,
        defaultElement: 'button',
        render: ({ Element, getStyles, props, ref }: any) => (
          <Element {...getStyles()} {...props} ref={ref} />
        ),
      },
    },
  });

  it('renders the default element when `as` is not provided', () => {
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Trigger>click</Foo.Trigger>
        </Foo>
      </SoribashiProvider>,
    );
    const trigger = container.querySelector('.foo-trigger');
    expect(trigger?.tagName).toBe('BUTTON');
  });

  it('renders the polymorphic element when `as` is provided', () => {
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Trigger as="a" href="/x">link</Foo.Trigger>
        </Foo>
      </SoribashiProvider>,
    );
    const trigger = container.querySelector('.foo-trigger');
    expect(trigger?.tagName).toBe('A');
    expect(trigger?.getAttribute('href')).toBe('/x');
  });

  it('forwards refs through polymorphic parts', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Trigger ref={ref}>click</Foo.Trigger>
        </Foo>
      </SoribashiProvider>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

// ---------------------------------------------------------------------------
// Cycle 7.6 — Passthrough parts (class-3)
// ---------------------------------------------------------------------------

describe('defineCompound — passthrough parts', () => {
  it('a part that does NOT consume ctx renders fine outside Root', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        provider: {
          render: ({ children }) => <section data-provider>{children}</section>,
        },
      },
    });

    // Render Foo.Provider OUTSIDE any Foo Root — should not throw because
    // its render doesn't touch ctx.
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo.Provider>content</Foo.Provider>
      </SoribashiProvider>,
    );

    expect(container.querySelector('[data-provider]')?.textContent).toBe('content');
  });
});
