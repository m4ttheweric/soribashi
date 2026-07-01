import { render } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createTheme, defineVocabulary } from '@soribashi/theme';
import { createSoribashiBuilders } from '../src/create-builders.ts';
import { resetRegistry } from '../src/vocabulary-registry.ts';
import { SoribashiProvider } from '../src/provider/provider.tsx';

const tokens = { colors: {}, radius: {}, spacing: {}, fontSize: {} };

describe('vocabulary runtime validation', () => {
  beforeEach(() => {
    resetRegistry();
  });

  it('does not warn for vocabulary values in the declared set', () => {
    const theme = createTheme({
      tokens,
      vocabulary: { size: defineVocabulary(['small', 'large']) },
    });
    const { defineComponent } = createSoribashiBuilders(theme);
    const Button = defineComponent<{ size?: string }, readonly ['root'], readonly [], readonly ['size']>({
      name: 'TestButton',
      vocabularyAxes: ['size'] as const,
      selectors: ['root'] as const,
      render: ({ props }: any) => <button data-size={props.size}>x</button>,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<SoribashiProvider theme={theme}><Button size="small">x</Button></SoribashiProvider>);
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('warns when a vocabulary-axis prop is outside the declared set', () => {
    const theme = createTheme({
      tokens,
      vocabulary: { size: defineVocabulary(['small', 'large']) },
    });
    const { defineComponent } = createSoribashiBuilders(theme);
    const Button = defineComponent<{ size?: string }, readonly ['root'], readonly [], readonly ['size']>({
      name: 'TestButton',
      vocabularyAxes: ['size'] as const,
      selectors: ['root'] as const,
      render: ({ props }: any) => <button data-size={props.size}>x</button>,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Cast past TS to simulate the runtime-only failure mode
    render(<SoribashiProvider theme={theme}><Button size="medium">x</Button></SoribashiProvider>);
    expect(errSpy).toHaveBeenCalled();
    const firstCall = errSpy.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall![0] as string).toContain('not in the declared vocabulary');
    expect(firstCall![0] as string).toContain('small');
    expect(firstCall![0] as string).toContain('large');
    errSpy.mockRestore();
  });

  // Recipe-local `variants` are the authoritative fallback for the variant
  // axis: a recipe declaring variants: ['dot', 'pill'] must not false-positive
  // against the theme's global variant vocabulary (filled/outline/...).
  it('recipe-local variant passes validation without theme registration', () => {
    const theme = createTheme({ tokens });
    const { defineComponent } = createSoribashiBuilders(theme);
    const Chip = defineComponent<{ variant?: string }, readonly ['root'], readonly ['dot', 'pill'], readonly ['variant']>({
      name: 'TestChip',
      vocabularyAxes: ['variant'] as const,
      variants: ['dot', 'pill'] as const,
      selectors: ['root'] as const,
      render: ({ props }: any) => <div data-variant={props.variant}>x</div>,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<SoribashiProvider theme={theme}><Chip variant="dot">x</Chip></SoribashiProvider>);
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('recipe-local variant from its own defaults passes validation', () => {
    const theme = createTheme({ tokens });
    const { defineComponent } = createSoribashiBuilders(theme);
    const Chip = defineComponent<{ variant?: string }, readonly ['root'], readonly ['dot', 'pill'], readonly ['variant']>({
      name: 'TestChipDefaults',
      vocabularyAxes: ['variant'] as const,
      variants: ['dot', 'pill'] as const,
      defaults: { variant: 'dot' },
      selectors: ['root'] as const,
      render: ({ props }: any) => <div data-variant={props.variant}>x</div>,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<SoribashiProvider theme={theme}><Chip>x</Chip></SoribashiProvider>);
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('value outside recipe-local variants still errors', () => {
    const theme = createTheme({ tokens });
    const { defineComponent } = createSoribashiBuilders(theme);
    const Chip = defineComponent<{ variant?: string }, readonly ['root'], readonly ['dot', 'pill'], readonly ['variant']>({
      name: 'TestChipBogus',
      vocabularyAxes: ['variant'] as const,
      variants: ['dot', 'pill'] as const,
      selectors: ['root'] as const,
      render: ({ props }: any) => <div data-variant={props.variant}>x</div>,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<SoribashiProvider theme={theme}><Chip variant={"bogus" as never}>x</Chip></SoribashiProvider>);
    expect(errSpy).toHaveBeenCalled();
    const message = errSpy.mock.calls[0]![0] as string;
    expect(message).toContain('not in the declared vocabulary');
    expect(message).toContain('dot');
    expect(message).toContain('pill');
    errSpy.mockRestore();
  });

  it('error message mentions both halves of the registration story', () => {
    const theme = createTheme({ tokens });
    const { defineComponent } = createSoribashiBuilders(theme);
    const Chip = defineComponent<{ variant?: string }, readonly ['root'], readonly ['dot'], readonly ['variant']>({
      name: 'TestChipMessage',
      vocabularyAxes: ['variant'] as const,
      variants: ['dot'] as const,
      selectors: ['root'] as const,
      render: ({ props }: any) => <div data-variant={props.variant}>x</div>,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<SoribashiProvider theme={theme}><Chip variant={"bogus" as never}>x</Chip></SoribashiProvider>);
    const message = errSpy.mock.calls[0]![0] as string;
    expect(message).toContain('.extend(');
    expect(message).toContain('createTheme');
    expect(message).toContain('registerTheme');
    errSpy.mockRestore();
  });

  it('per-component theme override wins over recipe-local variants', () => {
    const theme = createTheme({
      tokens,
      components: [{
        __soribashiThemeEntry: true,
        name: 'TestChipOverride',
        defaultProps: {},
        vocabulary: { variant: defineVocabulary(['special']) },
      }],
    });
    const { defineComponent } = createSoribashiBuilders(theme);
    const Chip = defineComponent<{ variant?: string }, readonly ['root'], readonly ['dot'], readonly ['variant']>({
      name: 'TestChipOverride',
      vocabularyAxes: ['variant'] as const,
      variants: ['dot'] as const,
      selectors: ['root'] as const,
      render: ({ props }: any) => <div data-variant={props.variant}>x</div>,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<SoribashiProvider theme={theme}><Chip variant={"special" as never}>x</Chip></SoribashiProvider>);
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockClear();
    // 'dot' is recipe-local but the theme override replaced the vocabulary
    render(<SoribashiProvider theme={theme}><Chip variant="dot">x</Chip></SoribashiProvider>);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('per-component override beats global vocab', () => {
    const buttonSize = defineVocabulary(['compact', 'jumbo']);
    const theme = createTheme({
      tokens,
      vocabulary: { size: defineVocabulary(['s', 'm', 'l']) },
      components: [{
        __soribashiThemeEntry: true,
        name: 'TestButton',
        defaultProps: {},
        vocabulary: { size: buttonSize },
      }],
    });
    const { defineComponent } = createSoribashiBuilders(theme);
    const Button = defineComponent<{ size?: string }, readonly ['root'], readonly [], readonly ['size']>({
      name: 'TestButton',
      vocabularyAxes: ['size'] as const,
      selectors: ['root'] as const,
      render: ({ props }: any) => <button data-size={props.size}>x</button>,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<SoribashiProvider theme={theme}><Button size="compact">x</Button></SoribashiProvider>);
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockClear();
    render(<SoribashiProvider theme={theme}><Button size="s">x</Button></SoribashiProvider>);
    // 's' is in global but NOT in button's override — should warn
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
