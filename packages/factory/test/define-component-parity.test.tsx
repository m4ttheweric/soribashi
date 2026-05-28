/**
 * Batch T2-C parity tests for define-component.tsx
 *
 * Verifies that defineComponent correctly composes its underlying primitives
 * (useProps, autoVars/config.vars, useStyles) and exposes the expected statics.
 *
 * Mantine reference: factory.tsx + useProps + useStyles (commit 63dafbbf).
 * defineComponent has no direct Mantine analog — these tests document soribashi's
 * constructor-model semantics.
 */

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { defineComponent } from '../src/define-component.tsx';

interface ButtonProps {
  intent?: 'primary' | 'danger';
  variant?: 'filled' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

// ────────────────────────────────────────────────────────────
// DC-7: displayName
// ────────────────────────────────────────────────────────────

describe('DC-7: displayName is set to config.name', () => {
  it('displayName matches the name passed to defineComponent', () => {
    const Foo = defineComponent({
      name: 'Foo',
      selectors: ['root'] as const,
      classes: { root: 'sb-Foo-root' },
      render: ({ getStyles }) => <div {...getStyles('root')} />,
    });
    expect(Foo.displayName).toBe('Foo');
  });
});

// ────────────────────────────────────────────────────────────
// DC-8: classes static
// ────────────────────────────────────────────────────────────

describe('DC-8: classes static is accessible', () => {
  it('Component.classes exposes configured class names', () => {
    const Bar = defineComponent({
      name: 'Bar',
      selectors: ['root', 'label'] as const,
      classes: { root: 'sb-Bar-root', label: 'sb-Bar-label' },
      render: ({ getStyles }) => <div {...getStyles('root')} />,
    });
    expect(Bar.classes).toBeDefined();
    expect(Bar.classes?.root).toBe('sb-Bar-root');
    expect(Bar.classes?.label).toBe('sb-Bar-label');
  });

  it('Component.classes is undefined when not configured', () => {
    const Baz = defineComponent({
      name: 'Baz',
      selectors: ['root'] as const,
      render: ({ getStyles }) => <div {...getStyles('root')} />,
    });
    expect(Baz.classes).toBeUndefined();
  });
});

// ────────────────────────────────────────────────────────────
// DC-9: extend static — returns ThemeComponentEntry
// ────────────────────────────────────────────────────────────

describe('DC-9: extend static returns a ThemeComponentEntry', () => {
  it('Component.extend is callable and returns a tagged entry', () => {
    const C = defineComponent({
      name: 'TestDC9',
      selectors: ['root'] as const,
      render: ({ getStyles }) => <div {...getStyles('root')} />,
    });
    const entry = (C as any).extend({ defaultProps: { size: 'sm' } });
    // extend now returns a ThemeComponentEntry, not an identity
    expect(entry.__soribashiThemeEntry).toBe(true);
    expect(entry.name).toBe('TestDC9');
    expect(entry.defaultProps).toEqual({ size: 'sm' });
  });
});

// ────────────────────────────────────────────────────────────
// DC-10: withProps static — preset application
// ────────────────────────────────────────────────────────────

describe('DC-10: withProps static — preset application', () => {
  const Button = defineComponent<ButtonProps>({
    name: 'DCButton',
    selectors: ['root'] as const,
    classes: { root: 'sb-DCButton-root' },
    render: ({ props, getStyles }) => (
      <button {...getStyles('root')} data-size={props.size}>
        {props.children as any}
      </button>
    ),
  });

  it('withProps result renders with presets applied', () => {
    const MdButton = Button.withProps({ size: 'md' });
    const { container } = wrap(<MdButton>X</MdButton>);
    const btn = container.querySelector('button');
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute('data-size')).toBe('md');
  });

  it('instance props override withProps presets', () => {
    const MdButton = Button.withProps({ size: 'md' });
    const { container } = wrap(<MdButton size="lg">X</MdButton>);
    const btn = container.querySelector('button');
    expect(btn?.getAttribute('data-size')).toBe('lg');
  });

  it('withProps result still has withProps method (double-wrap)', () => {
    const MdButton = Button.withProps({ size: 'md' });
    // After Task 1.4 fix: makeWithProps propagates withProps recursively
    expect(typeof (MdButton as any).withProps).toBe('function');
  });

  it('double-wrapped withProps works correctly', () => {
    const MdButton = Button.withProps({ size: 'md' });
    const LgMdButton = (MdButton as any).withProps({ size: 'lg' });
    const { container } = wrap(<LgMdButton>X</LgMdButton>);
    const btn = container.querySelector('button');
    // Second withProps overrides first
    expect(btn?.getAttribute('data-size')).toBe('lg');
  });

  it('withProps result has extend method (propagated from original)', () => {
    const MdButton = Button.withProps({ size: 'md' });
    // After Task 1.4 fix: makeWithProps copies Base.extend to Wrapped.extend
    expect(typeof (MdButton as any).extend).toBe('function');
  });
});

// ────────────────────────────────────────────────────────────
// DC-2: useProps integration — theme defaults work
// ────────────────────────────────────────────────────────────

describe('DC-2: useProps integration — theme component defaults are applied', () => {
  it('theme defaultProps override component defaults', () => {
    const themedTheme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        DCButtonThemed: { defaultProps: { size: 'lg' } },
      },
    });

    const Btn = defineComponent<ButtonProps>({
      name: 'DCButtonThemed',
      selectors: ['root'] as const,
      render: ({ props, getStyles }) => (
        <button {...getStyles('root')} data-size={props.size}>
          X
        </button>
      ),
    });

    const { container } = render(
      <SoribashiProvider theme={themedTheme}>
        <Btn />
      </SoribashiProvider>,
    );
    expect(container.querySelector('button')?.getAttribute('data-size')).toBe('lg');
  });
});

// ────────────────────────────────────────────────────────────
// DC-3: varsResolver selection — explicit config.vars overrides autoVars
// ────────────────────────────────────────────────────────────

describe('DC-3: varsResolver — explicit config.vars overrides autoVars', () => {
  it('explicit vars resolver result appears on root element style', () => {
    interface WithVarsProps {
      intent?: 'primary';
      variant?: 'filled';
    }
    const WithVars = defineComponent<WithVarsProps>({
      name: 'WithVars',
      selectors: ['root'] as const,
      variants: ['filled'] as const,
      classes: { root: 'sb-WithVars-root' },
      vars: () => ({
        root: { '--with-vars-custom': 'magenta' },
      }),
      render: ({ getStyles }) => <div {...getStyles('root')} />,
    });

    const { container } = wrap(
      <WithVars intent="primary" variant="filled" />,
    );
    const style = (container.querySelector('div') as HTMLElement).style;
    expect(style.getPropertyValue('--with-vars-custom')).toBe('magenta');
  });
});

// ────────────────────────────────────────────────────────────
// DC-4: autoVars fallback — correct root-selector vars when no config.vars
// ────────────────────────────────────────────────────────────

describe('DC-4: autoVars fallback — intent/variant vars on root', () => {
  const AutoBtn = defineComponent<ButtonProps>({
    name: 'AutoBtn',
    selectors: ['root'] as const,
    variants: ['filled', 'outline'] as const,
    classes: { root: 'sb-AutoBtn-root' },
    render: ({ getStyles }) => <button {...getStyles('root')}>X</button>,
  });

  it('produces --autobtn-bg on root when intent and variant are set', () => {
    const { container } = wrap(
      <AutoBtn intent="primary" variant="filled" />,
    );
    const style = (container.querySelector('button') as HTMLElement).style;
    expect(style.getPropertyValue('--autobtn-bg')).toBe('var(--color-primary-500)');
  });

  it('produces no vars when hasVariants is false (no variants declared)', () => {
    const Paper = defineComponent({
      name: 'Paper',
      selectors: ['root'] as const,
      classes: { root: 'sb-Paper-root' },
      render: ({ getStyles }) => <div {...getStyles('root')} />,
    });
    const { container } = wrap(<Paper />);
    const style = (container.querySelector('div') as HTMLElement).style;
    expect(style.getPropertyValue('--paper-bg')).toBe('');
  });
});

// ────────────────────────────────────────────────────────────
// DC-5: useStyles integration — classNames/styles flow through
// ────────────────────────────────────────────────────────────

describe('DC-5: useStyles integration — Styles API props flow through', () => {
  const Styled = defineComponent<Record<string, unknown>>({
    name: 'Styled',
    selectors: ['root', 'inner'] as const,
    classes: { root: 'sb-Styled-root', inner: 'sb-Styled-inner' },
    render: ({ getStyles }) => (
      <div {...getStyles('root')}>
        <span {...getStyles('inner')}>x</span>
      </div>
    ),
  });

  it('instance classNames override adds extra class to the target selector', () => {
    const { container } = wrap(
      <Styled classNames={{ root: 'extra-root' }} />,
    );
    expect(container.querySelector('div')?.className).toContain('extra-root');
  });

  it('instance styles are applied inline to the target selector', () => {
    const { container } = wrap(
      <Styled styles={{ root: { color: 'red' } as any }} />,
    );
    const div = container.querySelector('div') as HTMLElement;
    expect(div.style.color).toBe('red');
  });

  it('unstyled removes built-in classes', () => {
    const { container } = wrap(<Styled unstyled />);
    expect(container.querySelector('div')?.className).not.toContain('sb-Styled-root');
  });
});
