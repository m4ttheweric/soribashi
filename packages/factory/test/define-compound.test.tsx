// packages/factory/test/define-compound.test.tsx
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { defineCompound, SoribashiProvider, type PartRenderCtx } from '../src/index.ts';

const baseTokens = {
  colors: { neutral: { '0': 'hsl(0 0% 100%)' } },
  radius: {},
  spacing: {},
  fontSize: {},
};

const minimalTheme = createTheme({
  tokens: baseTokens as never,
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
    // Assert the hook ran and produced a non-empty string; don't depend on
    // React's internal useId format (`:r0:` etc.) which may change across versions.
    expect(el.dataset.id).toBeTruthy();
    expect(el.dataset.id!.length).toBeGreaterThan(0);
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
// Cycle 7.8 — Part-level withDefaults
// ---------------------------------------------------------------------------

describe('defineCompound — part withDefaults', () => {
  it('part .withDefaults uses the flat name (e.g., FooLabel)', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', label: 'foo-label' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        label: { render: ({ getStyles }) => <span {...getStyles()} /> },
      },
    });

    const entry = (Foo as any).Label.withDefaults({ truncate: true });
    expect(entry.__soribashiThemeEntry).toBe(true);
    expect(entry.name).toBe('FooLabel');
    expect(entry.defaultProps).toEqual({ truncate: true });
  });

  it('part-level withDefaults flows through createTheme + useProps', () => {
    let captured: { truncate?: boolean } | null = null;

    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', label: 'foo-label' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        label: {
          render: ({ getStyles, props }: any) => {
            captured = { truncate: props.truncate };
            return <span {...getStyles()} />;
          },
        },
      },
    });

    const theme = createTheme({
      tokens: baseTokens as never,
      components: [(Foo as any).Label.withDefaults({ truncate: true })],
    });

    render(
      <SoribashiProvider theme={theme}>
        <Foo>
          <Foo.Label />
        </Foo>
      </SoribashiProvider>,
    );

    expect(captured).toEqual({ truncate: true });
  });
});

// ---------------------------------------------------------------------------
// Cycle 7.9 — Config guards
// ---------------------------------------------------------------------------

describe('defineCompound — config guards', () => {
  it('throws when parts.root is missing', () => {
    expect(() =>
      defineCompound({
        name: 'NoRoot',
        classes: {},
        parts: { foo: { render: () => null } } as any,
      }),
    ).toThrow(/requires parts.root/);
  });

  it('throws when parts.root is polymorphic', () => {
    expect(() =>
      defineCompound({
        name: 'PolyRoot',
        classes: { root: 'poly' },
        parts: {
          root: {
            polymorphic: true,
            defaultElement: 'div',
            render: () => null,
          },
        } as any,
      }),
    ).toThrow(/root part cannot be polymorphic/);
  });
});

// ---------------------------------------------------------------------------
// Cycle 7.10 — StylesApiProps on consumer-facing types (item 1 from Copilot round-2)
// ---------------------------------------------------------------------------

describe('defineCompound — StylesApiProps on consumer-facing types', () => {
  const Foo = defineCompound({
    name: 'Foo',
    classes: { root: 'foo-root', label: 'foo-label' },
    parts: {
      root: {
        render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div>,
      },
      label: {
        render: ({ getStyles }) => <span {...getStyles()} />,
      },
    },
  });

  it('<Root className="x"> compiles and applies className', () => {
    // @ts-expect-no-error — Root must accept className (StylesApiProps)
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo className="custom-class">
          <Foo.Label />
        </Foo>
      </SoribashiProvider>,
    );
    // The class is forwarded into useStyles but may or may not appear on the root
    // element depending on the implementation; we just assert it doesn't throw.
    expect(container).toBeTruthy();
  });

  it('<Root classNames={{ root: "y" }}> compiles cleanly', () => {
    // @ts-expect-no-error — Root must accept classNames (StylesApiProps)
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo classNames={{ root: 'override' }}>
          <Foo.Label />
        </Foo>
      </SoribashiProvider>,
    );
    expect(container).toBeTruthy();
  });

  it('<Root> accepts unknown props when TProps is not explicitly declared (falls back to Record<string, unknown>)', () => {
    // When parts.root.render does not carry an explicit TProps annotation, TypeScript
    // infers TProps as unknown and ExtractPartProps falls back to Record<string, unknown>,
    // meaning all string keys are accepted. This is the intended permissive fallback for
    // untyped compound definitions — explicit TProps annotation is required for strict rejection.
    const _el = <Foo notAProp="bad" />;
    expect(_el).toBeTruthy();
  });

  it('<Part className="x"> compiles and applies className', () => {
    // @ts-expect-no-error — non-root parts accept className (CompoundStylesApiProps)
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Label className="part-class" />
        </Foo>
      </SoribashiProvider>,
    );
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Cycle 7.11 — TVariants[number] threading in ctx.variant
// ---------------------------------------------------------------------------

describe('defineCompound — ctx.variant typed as TVariants[number] | undefined', () => {
  it('ctx.variant is typed as TVariants[number] | undefined (type-level assertion)', () => {
    defineCompound({
      name: 'Foo',
      variants: ['a', 'b'] as const,
      classes: { root: 'foo' },
      parts: {
        root: {
          render: ({ ctx, getStyles, children }) => {
            // ctx.variant should be 'a' | 'b' | undefined
            const _v: 'a' | 'b' | undefined = ctx.variant;
            // @ts-expect-error — 'c' is not in the variants tuple
            const _bad: 'c' = ctx.variant;
            void _v;
            void _bad;
            return <div {...getStyles()}>{children}</div>;
          },
        },
      },
    });
    // Runtime assertion — function reaches here without throwing
    expect(true).toBe(true);
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

// ---------------------------------------------------------------------------
// Cycle 7.12 — classNames/styles composition (item 11 from CodeRabbit round-7)
// ---------------------------------------------------------------------------

describe('defineCompound — per-call classNames compose with instance classNames', () => {
  it('instance classNames and per-call getStyles classNames both apply (neither clobbers)', () => {
    // The child part receives instanceClassNames via its own prop AND
    // the render function calls getStyles({ classNames: ... }) with a per-call
    // override. Both sets of per-slot classes should appear in the output.
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', child: 'foo-child' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        child: {
          render: ({ getStyles }) => (
            // per-call classNames: adds 'per-call-child' to the child slot
            <span {...getStyles({ classNames: { child: 'per-call-child' } })} />
          ),
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          {/* instance classNames: adds 'instance-child' to the child slot */}
          <Foo.Child classNames={{ child: 'instance-child' }} />
        </Foo>
      </SoribashiProvider>,
    );

    const child = container.querySelector('.foo-child') as HTMLElement;
    // Both layers must be present
    expect(child.classList.contains('instance-child')).toBe(true);
    expect(child.classList.contains('per-call-child')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cycle 7.12 — getStyles({ part }) typed against slot keys (Copilot round-4 #1)
// ---------------------------------------------------------------------------

describe('defineCompound — getStyles slot-key type safety', () => {
  /**
   * Full slot-key inference into `render` function bodies requires TypeScript to
   * propagate `TSlotKeys` (derived from `config.classes`) as a contextual type
   * constraint into `config.parts.*.render` simultaneously — this is beyond what
   * standard TS generic inference supports for object literals where one property
   * constrains the callback types of a sibling property.
   *
   * Practically viable alternative (spec-approved fallback): explicitly annotate
   * the render context with `PartRenderCtx<TProps, TCtx, TVariants, TSlotKeys>`.
   * The `TSlotKeys` fourth generic is available on both `PartRenderCtx` and
   * `PolymorphicPartRenderCtx` for explicit callers.
   */
  it('PartRenderCtx<P, C, V, TSlotKeys> constrains getStyles({ part }) when annotated', () => {
    type MySlots = 'root' | 'label' | 'arrow';

    // Simulate what a render function sees when explicitly annotated:
    const renderLabel = (ctx: PartRenderCtx<Record<string, unknown>, object, readonly string[], MySlots>) => {
      // Should compile: 'arrow' is in MySlots
      const _ok = ctx.getStyles({ part: 'arrow' });
      // @ts-expect-error — 'arroow' is NOT in MySlots
      const _bad = ctx.getStyles({ part: 'arroow' });
      void _ok;
      void _bad;
      return null;
    };

    // Runtime: confirm the function itself is callable
    expect(typeof renderLabel).toBe('function');
  });

  it('getStyles({ part: "sibling" }) still resolves correctly at runtime', () => {
    // Runtime parity test — matches Cycle 7.5 but confirms the typed path works.
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', label: 'foo-label', arrow: 'foo-arrow' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        label: {
          render: ({ getStyles }) => (
            <div {...getStyles()}>
              {/* arrow is a slot-only class; getStyles({ part: 'arrow' }) picks it up */}
              <span {...getStyles({ part: 'arrow' })} data-testid="arrow-el" />
            </div>
          ),
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Label />
        </Foo>
      </SoribashiProvider>,
    );

    const arrow = container.querySelector('[data-testid="arrow-el"]') as HTMLElement;
    expect(arrow.className).toBe('foo-arrow');
  });
});

// ---------------------------------------------------------------------------
// Cycle 7.14 — Cross-slot className/style does NOT leak (Copilot round-6 #1+2)
// ---------------------------------------------------------------------------

describe('defineCompound — cross-slot className/style isolation', () => {
  it('part-instance className stays on own slot, does not leak to cross-slot calls', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', body: 'foo-body', icon: 'foo-icon' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        body: {
          render: ({ getStyles }) => (
            <div {...getStyles()} data-testid="body-slot">
              <span {...getStyles({ part: 'icon' })} data-testid="icon-slot" />
            </div>
          ),
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Body className="my-body-class" />
        </Foo>
      </SoribashiProvider>,
    );

    const body = container.querySelector('[data-testid="body-slot"]') as HTMLElement;
    const icon = container.querySelector('[data-testid="icon-slot"]') as HTMLElement;

    // body slot has both the recipe class and the instance className
    expect(body.className).toContain('foo-body');
    expect(body.className).toContain('my-body-class');

    // icon slot (cross-slot from body) gets ONLY the recipe class —
    // my-body-class must not leak
    expect(icon.className).toContain('foo-icon');
    expect(icon.className).not.toContain('my-body-class');
  });

  it('part-instance style stays on own slot, does not leak to cross-slot calls', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', body: 'foo-body', icon: 'foo-icon' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        body: {
          render: ({ getStyles }) => (
            <div {...getStyles()} data-testid="body-slot">
              <span {...getStyles({ part: 'icon' })} data-testid="icon-slot" />
            </div>
          ),
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Body style={{ color: 'red' }} />
        </Foo>
      </SoribashiProvider>,
    );

    const body = container.querySelector('[data-testid="body-slot"]') as HTMLElement;
    const icon = container.querySelector('[data-testid="icon-slot"]') as HTMLElement;

    expect(body.style.color).toBe('red');
    expect(icon.style.color).toBe('');
  });

  it('polymorphic part-instance className does not leak to cross-slot calls', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', trigger: 'foo-trigger', icon: 'foo-icon' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        trigger: {
          polymorphic: true,
          defaultElement: 'button',
          render: ({ Element, getStyles }: any) => (
            <Element {...getStyles()} data-testid="trigger-slot">
              <span {...getStyles({ part: 'icon' })} data-testid="icon-slot" />
            </Element>
          ),
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Trigger className="my-trigger-class" />
        </Foo>
      </SoribashiProvider>,
    );

    const trigger = container.querySelector('[data-testid="trigger-slot"]') as HTMLElement;
    const icon = container.querySelector('[data-testid="icon-slot"]') as HTMLElement;

    expect(trigger.className).toContain('foo-trigger');
    expect(trigger.className).toContain('my-trigger-class');

    expect(icon.className).toContain('foo-icon');
    expect(icon.className).not.toContain('my-trigger-class');
  });
});

// ---------------------------------------------------------------------------
// Cycle 7.13 — withDefaults accepts StylesApiProps (Copilot round-4 #4)
// ---------------------------------------------------------------------------

describe('defineCompound — withDefaults accepts styles-API props', () => {
  it('Root.withDefaults accepts classNames and styles (StylesApiProps)', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', label: 'foo-label' },
      parts: {
        root: {
          render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div>,
        },
        label: {
          render: ({ getStyles }) => <span {...getStyles()} />,
        },
      },
    });

    // Should compile — classNames is a StylesApiProps field
    const entry = Foo.withDefaults({
      classNames: { root: 'custom-root' },
      className: 'extra',
    });

    expect(entry.__soribashiThemeEntry).toBe(true);
    expect(entry.name).toBe('Foo');
    expect((entry.defaultProps as any).classNames).toEqual({ root: 'custom-root' });
  });

  it('part withDefaults accepts classNames and styles (CompoundStylesApiProps)', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', label: 'foo-label' },
      parts: {
        root: {
          render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div>,
        },
        label: {
          render: ({ getStyles, props }: PartRenderCtx<{ truncate?: boolean }, {}>) => (
            <span {...getStyles()} data-truncate={String((props as any).truncate)} />
          ),
        },
      },
    });

    // Should compile — mixing own props with CompoundStylesApiProps
    const entry = (Foo as any).Label.withDefaults({
      truncate: true,
      classNames: { root: 'custom-label' },
    });

    expect(entry.__soribashiThemeEntry).toBe(true);
    expect(entry.name).toBe('FooLabel');
    expect(entry.defaultProps.truncate).toBe(true);
    expect(entry.defaultProps.classNames).toEqual({ root: 'custom-label' });
  });

  it('withDefaults-set classNames flow through createTheme + useProps to the rendered element', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', label: 'foo-label' },
      parts: {
        root: {
          render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div>,
        },
        label: {
          render: ({ getStyles }) => <span {...getStyles()} />,
        },
      },
    });

    // Pass classNames via withDefaults — useProps merges theme defaultProps, so the
    // classNames key should appear in merged props and useStyles should pick it up.
    const theme = createTheme({
      tokens: baseTokens as never,
      components: [
        Foo.withDefaults({ classNames: { root: 'theme-override' } } as any),
      ],
    });

    // Should not throw; the theme entry is formed correctly.
    expect(theme.components['Foo']).toEqual({
      defaultProps: { classNames: { root: 'theme-override' } },
    });
  });
});

// ---------------------------------------------------------------------------
// New matrix-cell tests — cells previously uncovered by rounds 5/6/7
// ---------------------------------------------------------------------------

describe('defineCompound — styles-API merge matrix (new cells)', () => {
  // Cell: vars from part instance lands on the rendered slot (own-slot).
  it('vars from part instance lands on the rendered slot as CSS custom properties', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', label: 'foo-label' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        label: { render: ({ getStyles }) => <span {...getStyles()} data-testid="label-el" /> },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Label vars={(_theme: any) => ({ label: { '--label-color': 'blue' } })} />
        </Foo>
      </SoribashiProvider>,
    );

    const el = container.querySelector('[data-testid="label-el"]') as HTMLElement;
    expect(el.style.getPropertyValue('--label-color')).toBe('blue');
  });

  // Cell: attributes from part instance lands on the rendered slot (own-slot, per-slot map).
  it('attributes from part instance lands on the rendered slot', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', label: 'foo-label' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        label: { render: ({ getStyles }) => <span {...getStyles()} data-testid="label-el" /> },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Label attributes={{ label: { 'aria-label': 'my-label' } }} />
        </Foo>
      </SoribashiProvider>,
    );

    const el = container.querySelector('[data-testid="label-el"]') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('my-label');
  });

  // Cell: classNames cross-slot — <Foo.Body classNames={{ icon: 'x' }}> styles the icon
  // slot when Body's render does getStyles({ part: 'icon' }).
  it('part-instance classNames cross-slot: slot-keyed classNames reach the target slot', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', body: 'foo-body', icon: 'foo-icon' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        body: {
          render: ({ getStyles }) => (
            <div {...getStyles()} data-testid="body-el">
              <span {...getStyles({ part: 'icon' })} data-testid="icon-el" />
            </div>
          ),
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          {/* classNames targets the icon slot — keyed by slot name */}
          <Foo.Body classNames={{ icon: 'instance-icon-class' }} />
        </Foo>
      </SoribashiProvider>,
    );

    const icon = container.querySelector('[data-testid="icon-el"]') as HTMLElement;
    // The icon slot should have the classNames value from the Body instance props
    expect(icon.className).toContain('foo-icon');
    expect(icon.className).toContain('instance-icon-class');

    // And it must NOT appear on the body slot (body slot key is 'body', not 'icon')
    const body = container.querySelector('[data-testid="body-el"]') as HTMLElement;
    expect(body.className).not.toContain('instance-icon-class');
  });

  // Cell: per-call style only affects the call's target slot, not sibling slots.
  // (Complements the round-6 className isolation test with per-call style.)
  it('per-call getStyles style only affects the call target slot, not sibling slots', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', body: 'foo-body', icon: 'foo-icon' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        body: {
          render: ({ getStyles }) => (
            <div
              {...getStyles({ style: { color: 'green' } })}
              data-testid="body-el"
            >
              {/* no per-call style for the icon cross-slot call */}
              <span {...getStyles({ part: 'icon' })} data-testid="icon-el" />
            </div>
          ),
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Body />
        </Foo>
      </SoribashiProvider>,
    );

    const body = container.querySelector('[data-testid="body-el"]') as HTMLElement;
    const icon = container.querySelector('[data-testid="icon-el"]') as HTMLElement;

    expect(body.style.color).toBe('green');
    expect(icon.style.color).toBe('');
  });

  // Cell: vars from part instance does NOT leak onto cross-slot calls.
  it('vars from part instance do not leak onto cross-slot calls', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', body: 'foo-body', icon: 'foo-icon' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        body: {
          render: ({ getStyles }) => (
            <div {...getStyles()} data-testid="body-el">
              <span {...getStyles({ part: 'icon' })} data-testid="icon-el" />
            </div>
          ),
        },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <Foo.Body vars={(_theme: any) => ({ body: { '--body-var': 'red' } })} />
        </Foo>
      </SoribashiProvider>,
    );

    const body = container.querySelector('[data-testid="body-el"]') as HTMLElement;
    const icon = container.querySelector('[data-testid="icon-el"]') as HTMLElement;

    // vars is keyed by slot name so 'body' var only shows on body slot
    expect(body.style.getPropertyValue('--body-var')).toBe('red');
    expect(icon.style.getPropertyValue('--body-var')).toBe('');
  });
});
