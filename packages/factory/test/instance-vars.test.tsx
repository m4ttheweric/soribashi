import { createTheme } from '@soribashi/theme';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { defineComponent } from '../src/define-component.tsx';
import { defineCompound } from '../src/define-compound.tsx';
import { defineGenericComponent } from '../src/define-generic-component.tsx';
import { definePolymorphicComponent } from '../src/define-polymorphic-component.tsx';
import { SoribashiProvider } from '../src/provider/provider.tsx';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode, t = theme) =>
  render(<SoribashiProvider theme={t}>{ui}</SoribashiProvider>);

// Instance `vars` is part of StylesApiProps (types/props.ts) and must be honored
// by every builder, matching Mantine's resolveVars order: varsResolver -> theme
// component vars -> instance vars (instance highest).
// Reference: mantine/packages/@mantine/core/src/core/styles-api/use-styles/get-style/resolve-vars/resolve-vars.ts

describe('instance vars prop — defineComponent', () => {
  const Button = defineComponent<{ children?: React.ReactNode }>({
    name: 'VarsButton',
    selectors: ['root', 'label'] as const,
    classes: { root: 'vb-root', label: 'vb-label' },
    render: ({ getStyles, props }) => (
      <button {...getStyles('root')}>
        <span {...getStyles('label')}>{props.children as React.ReactNode}</span>
      </button>
    ),
  });

  it('lands instance vars on the right slot', () => {
    const { container } = wrap(
      <Button vars={() => ({ root: { '--btn-bg': 'red' }, label: { '--label-color': 'blue' } })}>
        X
      </Button>,
    );
    const root = container.querySelector('.vb-root') as HTMLElement;
    const label = container.querySelector('.vb-label') as HTMLElement;
    expect(root.style.getPropertyValue('--btn-bg')).toBe('red');
    expect(root.style.getPropertyValue('--label-color')).toBe('');
    expect(label.style.getPropertyValue('--label-color')).toBe('blue');
  });

  it('filters undefined values from instance vars', () => {
    const { container } = wrap(
      <Button vars={() => ({ root: { '--defined': 'x', '--empty': undefined as any } })}>X</Button>,
    );
    const root = container.querySelector('.vb-root') as HTMLElement;
    expect(root.style.getPropertyValue('--defined')).toBe('x');
    expect(root.getAttribute('style')).not.toContain('--empty');
  });

  it('instance vars win over theme component vars and built-in varsResolver', () => {
    const themed = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        VarsPrecedence: { vars: () => ({ root: { '--v': 'from-theme' } }) },
      },
    });
    const Precedence = defineComponent<{ children?: React.ReactNode }>({
      name: 'VarsPrecedence',
      selectors: ['root'] as const,
      classes: { root: 'vp-root' },
      vars: () => ({ root: { '--v': 'from-resolver' } }),
      render: ({ getStyles }) => <div {...getStyles('root')} />,
    });
    const { container } = wrap(
      <Precedence vars={() => ({ root: { '--v': 'from-instance' } })} />,
      themed,
    );
    const root = container.querySelector('.vp-root') as HTMLElement;
    expect(root.style.getPropertyValue('--v')).toBe('from-instance');
  });
});

describe('instance vars prop — definePolymorphicComponent', () => {
  const Text = definePolymorphicComponent<{ children?: React.ReactNode }, 'p'>({
    name: 'VarsText',
    defaultElement: 'p',
    selectors: ['root'] as const,
    classes: { root: 'vt-root' },
    render: ({ Element, getStyles }) => <Element {...getStyles('root')} />,
  });

  it('lands instance vars on the root slot', () => {
    const { container } = wrap(<Text vars={() => ({ root: { '--text-size': '14px' } })} />);
    const root = container.querySelector('.vt-root') as HTMLElement;
    expect(root.style.getPropertyValue('--text-size')).toBe('14px');
  });
});

describe('instance vars prop — defineGenericComponent', () => {
  const List = defineGenericComponent({
    name: 'VarsList',
    selectors: ['root'] as const,
    classes: { root: 'vl-root' },
    render: ({ getStyles }) => <ul {...getStyles('root')} />,
  });

  it('lands instance vars on the root slot', () => {
    const AnyList = List as any;
    const { container } = wrap(<AnyList vars={() => ({ root: { '--list-gap': '4px' } })} />);
    const root = container.querySelector('.vl-root') as HTMLElement;
    expect(root.style.getPropertyValue('--list-gap')).toBe('4px');
  });
});

describe('instance vars prop — defineCompound Root', () => {
  const Foo = defineCompound({
    name: 'VarsFoo',
    classes: { root: 'vf-root', child: 'vf-child' },
    parts: {
      root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
      child: { render: ({ getStyles }) => <span {...getStyles()} /> },
    },
  });

  it('lands Root instance vars on the right slots', () => {
    const { container } = wrap(
      <Foo
        vars={
          (() => ({
            root: { '--foo-pad': '8px' },
            child: { '--child-color': 'green' },
          })) as any
        }
      >
        <Foo.Child />
      </Foo>,
    );
    const root = container.querySelector('.vf-root') as HTMLElement;
    const child = container.querySelector('.vf-child') as HTMLElement;
    expect(root.style.getPropertyValue('--foo-pad')).toBe('8px');
    expect(child.style.getPropertyValue('--child-color')).toBe('green');
  });

  it('part instance vars stay above Root instance vars for the same key', () => {
    const { container } = wrap(
      <Foo vars={(() => ({ child: { '--child-color': 'from-root' } })) as any}>
        <Foo.Child vars={(() => ({ child: { '--child-color': 'from-part' } })) as any} />
      </Foo>,
    );
    const child = container.querySelector('.vf-child') as HTMLElement;
    expect(child.style.getPropertyValue('--child-color')).toBe('from-part');
  });
});
