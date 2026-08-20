/**
 * Task 2 (Wire style props into all four builders): jsdom-level assertions
 * for `useStyleProps` as exercised through `defineComponent`. Exercises the
 * six behaviors called out in the task brief's Step 5 via a minimal fixture
 * recipe rather than testing the hook in isolation, since its contract is
 * meant to be consumed through a builder.
 */

import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { defineComponent } from '../../../src/factory/define-component.tsx';
import { SoribashiProvider } from '../../../src/factory/provider/provider.tsx';
import { createTheme } from '../../../src/theme/index.ts';

const theme = createTheme({
  tokens: {
    colors: {},
    radius: {},
    spacing: { xs: '0.5rem', md: '0.75rem', lg: '1rem' },
    fontSize: {},
    breakpoint: { xs: '24rem', sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem' },
  },
});

interface FixtureOwnProps {
  children?: ReactNode;
}

const Fixture = defineComponent<FixtureOwnProps>({
  name: 'StylePropsFixture',
  selectors: ['root'] as const,
  render: ({ props, getStyles }) => <div {...getStyles('root')}>{props.children}</div>,
});

const wrap = (ui: ReactNode) => render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('useStyleProps (via defineComponent)', () => {
  it('(a) resolves a flat style prop into the root element inline style attr', () => {
    const { container } = wrap(<Fixture p="md" />);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.padding).toBe('var(--spacing-md)');
  });

  it('(b) style props never appear as DOM attributes', () => {
    const { container } = wrap(<Fixture p="md" hiddenFrom="md" />);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.getAttribute('p')).toBeNull();
    expect(el.outerHTML).not.toMatch(/hiddenfrom/i);
  });

  it('(c) style prop value wins over an explicit style prop on the same key (precedence pin)', () => {
    const { container } = wrap(<Fixture style={{ padding: '1px' }} p="md" />);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.padding).toBe('var(--spacing-md)');
  });

  it('(d) a responsive style prop renders a style element with the breakpoint media query', () => {
    const { container } = wrap(<Fixture p={{ base: 'xs', md: 'lg' }} />);
    const styleEl = container.querySelector('style');
    expect(styleEl).not.toBeNull();
    expect(styleEl?.innerHTML).toContain('(min-width: 48rem)');
  });

  it('(e) hiddenFrom appends the sb-hidden-from-{bp} visibility class to root', () => {
    const { container } = wrap(<Fixture hiddenFrom="md" />);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-hidden-from-md');
  });

  it('(f) zero style props: no wrapping style element is rendered', () => {
    const { container } = wrap(<Fixture>plain</Fixture>);
    expect(container.querySelector('style')).toBeNull();
    expect(container.querySelector('div')?.textContent).toBe('plain');
  });
});
