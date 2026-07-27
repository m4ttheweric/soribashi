import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Skeleton } from './Skeleton.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Skeleton (browser)', () => {
  it('renders a decorative element hidden from assistive tech', async () => {
    const screen = await wrap(<Skeleton classNames={{ root: 'probe-hidden' }} />);
    const root = screen.container.querySelector('.probe-hidden')!;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.textContent).toBe('');
  });

  it('carries a running pulse animation (computed animation-name, not a class assertion)', async () => {
    const screen = await wrap(<Skeleton classNames={{ root: 'probe-skeleton' }} />);
    const name = getComputedStyle(screen.container.querySelector('.probe-skeleton')!).animationName;
    expect(name).not.toBe('none');
  });

  it('geometry comes from w/h style props, not a recipe-owned size vocabulary', async () => {
    const screen = await wrap(<Skeleton w="200px" h="16px" classNames={{ root: 'probe-geo' }} />);
    const cs = getComputedStyle(screen.container.querySelector('.probe-geo')!);
    expect(cs.width).toBe('200px');
    expect(cs.height).toBe('16px');
  });
});
