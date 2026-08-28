import { createTheme } from '../../src/theme/index.ts';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineCompound, SoribashiProvider } from '../../src/factory/index.ts';

const baseTokens = {
  colors: { neutral: { '0': 'hsl(0 0% 100%)' } },
  radius: {},
  spacing: {},
  fontSize: {},
};

const minimalTheme = createTheme({
  tokens: baseTokens as never,
});

/**
 * Base UI components accept a `render` prop that swaps the rendered element.
 * Soribashi's compound parts do not expose it publicly, and until now every
 * recipe stripped it by hand per part (see Popover's stripFrameworkKeys).
 * These tests pin the factory-level strip: an incoming `render` prop must
 * never reach the part's render callback (and therefore can never be spread
 * into Base UI or onto a DOM element).
 */
describe('defineCompound — render prop strip', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a plain compound part silently drops a render prop instead of forwarding it to Base UI', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let receivedRender: unknown = 'not-captured';

    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', leaf: 'foo-leaf' },
      parts: {
        root: {
          render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div>,
        },
        leaf: {
          // Spreading props mirrors how real recipes forward part props into
          // Base UI / the DOM element.
          render: ({ props, getStyles }) => {
            receivedRender = (props as Record<string, unknown>).render;
            return <div {...getStyles()} {...(props as object)} />;
          },
        },
      },
    });

    const LeafAny = Foo.Leaf as React.ComponentType<Record<string, unknown>>;
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <LeafAny render={<span data-sentinel="" />} />
        </Foo>
      </SoribashiProvider>,
    );

    expect(receivedRender).toBeUndefined();
    expect(container.querySelector('[data-sentinel]')).toBeNull();
    // No React unknown-prop / invalid-attribute warning from the spread.
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('a polymorphic compound part silently drops a render prop instead of forwarding it to Base UI', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let receivedRender: unknown = 'not-captured';

    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', trigger: 'foo-trigger' },
      parts: {
        root: {
          render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div>,
        },
        trigger: {
          polymorphic: true,
          defaultElement: 'button',
          render: ({ Element, props, getStyles }: any) => {
            receivedRender = (props as Record<string, unknown>).render;
            return <Element {...getStyles()} {...(props as object)} />;
          },
        },
      },
    });

    const TriggerAny = Foo.Trigger as React.ComponentType<Record<string, unknown>>;
    const { container } = render(
      <SoribashiProvider theme={minimalTheme}>
        <Foo>
          <TriggerAny render={<span data-sentinel="" />} />
        </Foo>
      </SoribashiProvider>,
    );

    expect(receivedRender).toBeUndefined();
    expect(container.querySelector('[data-sentinel]')).toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
