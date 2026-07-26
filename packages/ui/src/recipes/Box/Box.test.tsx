import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Box, type BoxMod } from './Box.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Box (browser)', () => {
  it('polymorphic as="section" renders a section element', async () => {
    const screen = await wrap(<Box as="section">Content</Box>);
    const el = screen.container.querySelector('section');
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe('Content');
  });

  it('mod={{ active: true }} stamps data-active', async () => {
    const screen = await wrap(<Box mod={{ active: true }}>Modded</Box>);
    const el = screen.getByText('Modded').element();
    expect(el.getAttribute('data-active')).toBe('true');
  });

  it('mod as an array recurses through its items and drops a falsy entry', async () => {
    // Exercises getBoxMod's array branch (recursing into each item, string
    // and record forms both present) and its falsy-filtering (a
    // `condition && 'literal'`-style entry, a common real-world conditional
    // mod idiom, evaluates to the boolean `false` at runtime and must
    // contribute no attribute at all). `false` sits outside BoxMod's own
    // item union (string | Record<string, unknown>) -- the type only
    // documents the two intentional forms -- so the array is cast the same
    // way a caller relying on this documented defensive runtime behavior
    // would have to.
    const mod = ['active', { open: true }, false && 'never'] as unknown as BoxMod;
    const screen = await wrap(<Box mod={mod}>Array mod</Box>);
    const el = screen.getByText('Array mod').element();
    expect(el.getAttribute('data-active')).toBe('true');
    expect(el.getAttribute('data-open')).toBe('true');
    // Nothing else got stamped for the falsy third entry: exactly the two
    // data-* attributes above, no more.
    const dataAttrNames = [...el.attributes]
      .map((a) => a.name)
      .filter((name) => name.startsWith('data-'))
      .sort();
    expect(dataAttrNames).toEqual(['data-active', 'data-open']);
  });

  it('accepts universal style props with zero recipe changes (bg/p resolve to computed background/padding)', async () => {
    // Box.tsx has no bg/p handling of its own: style props are wired into
    // every recipe at the builder level (definePolymorphicComponent), so
    // this pins that Box needed zero recipe-side code to gain them.
    const screen = await wrap(
      <Box bg="surface.raised" p="md">
        Padded
      </Box>,
    );
    const el = screen.getByText('Padded').element();
    const cs = getComputedStyle(el);
    // uiTheme's --spacing-md resolves to 12px (0.75rem at a 16px root).
    expect(cs.padding).toBe('12px');
    // 'surface.raised' resolves to var(--surface-raised), a real painted
    // colour, not the element's transparent initial value.
    expect(cs.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('the p style prop wins over an instance style prop targeting the same CSS property', async () => {
    // Re-pins wrapper-style-merge's precedence on Box: useStyles pushes
    // style-prop-derived styles onto the style stack AFTER the instance
    // `style` prop (Global Constraint 8), so p="md" must win here even
    // though style={{ padding: '1px' }} is also present.
    const screen = await wrap(
      <Box p="md" style={{ padding: '1px' }}>
        Wins
      </Box>,
    );
    const el = screen.getByText('Wins').element();
    expect(getComputedStyle(el).padding).toBe('12px');
  });

  it('extend threads defaultProps (invariant 1 stays load-bearing)', async () => {
    // Register a theme entry via Box.extend({ defaultProps: { p: 'lg' } })
    // in a locally-composed theme and assert the rendered padding reflects
    // the extended default.
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Box.extend({ defaultProps: { p: 'lg' } })],
    });
    const screen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Box>Extended</Box>
      </SoribashiProvider>,
    );
    const el = screen.getByText('Extended').element();
    // uiTheme's --spacing-lg resolves to 16px (1rem at a 16px root).
    expect(getComputedStyle(el).padding).toBe('16px');
  });
});
