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
