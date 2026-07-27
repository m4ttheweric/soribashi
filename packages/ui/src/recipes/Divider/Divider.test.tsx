import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Divider } from './Divider.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Divider (browser)', () => {
  it('exposes role="separator" with the right aria-orientation both ways', async () => {
    const horizontalScreen = await wrap(<Divider classNames={{ root: 'probe-h' }} />);
    const horizontal = horizontalScreen.container.querySelector('.probe-h')!;
    expect(horizontal.getAttribute('role')).toBe('separator');
    expect(horizontal.getAttribute('aria-orientation')).toBe('horizontal');

    const verticalScreen = await wrap(
      <Divider orientation="vertical" classNames={{ root: 'probe-v' }} />,
    );
    const vertical = verticalScreen.container.querySelector('.probe-v')!;
    expect(vertical.getAttribute('role')).toBe('separator');
    expect(vertical.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('renders a centred label between two rule segments when given one (computed layout, text present)', async () => {
    const screen = await wrap(
      <div style={{ width: '300px' }}>
        <Divider label="OR" classNames={{ root: 'probe-root', label: 'probe-label' }} />
      </div>,
    );
    const root = screen.container.querySelector('.probe-root')!;
    const label = screen.container.querySelector('.probe-label')!;
    expect(label.textContent).toBe('OR');

    // Structural, not class-based: the label sits as the middle child of
    // exactly three, flanked by the two rule segments (line, label, line).
    const children = Array.from(root.children) as HTMLElement[];
    expect(children).toHaveLength(3);
    const [before, labelEl, after] = children as [HTMLElement, HTMLElement, HTMLElement];
    expect(labelEl).toBe(label);

    const beforeRect = before.getBoundingClientRect();
    const afterRect = after.getBoundingClientRect();
    const labelRect = labelEl.getBoundingClientRect();
    expect(beforeRect.right).toBeLessThanOrEqual(labelRect.left);
    expect(afterRect.left).toBeGreaterThanOrEqual(labelRect.right);
  });

  it('renders a single continuous rule with no label element when no label is given', async () => {
    const screen = await wrap(<Divider classNames={{ root: 'probe-bare' }} />);
    const root = screen.container.querySelector('.probe-bare')!;
    expect(root.children).toHaveLength(1);
    expect(root.textContent).toBe('');
  });
});
