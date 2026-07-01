import { createTheme } from '@soribashi/theme';
import { render } from '@testing-library/react';
// packages/factory/test/with-defaults-e2e.test.tsx
import { describe, expect, it } from 'vitest';
import { SoribashiProvider, defineComponent } from '../src/index.ts';

describe('extend() end-to-end through createTheme + useProps', () => {
  interface FooProps {
    label?: string;
    [key: string]: unknown;
  }

  const Foo = defineComponent<FooProps, readonly ['root'], readonly []>({
    name: 'Foo',
    selectors: ['root'] as const,
    defaults: { label: 'recipe-default' },
    render: ({ props, getStyles }) => (
      <div {...getStyles('root')} data-label={(props as FooProps).label} />
    ),
  });

  const baseTokens = {
    colors: {},
    radius: {},
    spacing: {},
    fontSize: {},
  };

  it('theme-set defaults override recipe defaults', () => {
    const theme = createTheme({
      tokens: baseTokens as never,
      components: [(Foo as any).extend({ defaultProps: { label: 'theme-default' } })],
    });

    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Foo />
      </SoribashiProvider>,
    );

    const el = container.querySelector('[data-label]') as HTMLElement;
    expect(el.dataset.label).toBe('theme-default');
  });

  it('instance props override theme defaults', () => {
    const theme = createTheme({
      tokens: baseTokens as never,
      components: [(Foo as any).extend({ defaultProps: { label: 'theme-default' } })],
    });

    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Foo label="instance-prop" />
      </SoribashiProvider>,
    );

    const el = container.querySelector('[data-label]') as HTMLElement;
    expect(el.dataset.label).toBe('instance-prop');
  });

  it('falls back to recipe defaults when theme has no override', () => {
    const theme = createTheme({
      tokens: baseTokens as never,
    });

    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Foo />
      </SoribashiProvider>,
    );

    const el = container.querySelector('[data-label]') as HTMLElement;
    expect(el.dataset.label).toBe('recipe-default');
  });
});
