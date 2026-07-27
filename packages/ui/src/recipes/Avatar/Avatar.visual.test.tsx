import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Avatar } from './Avatar.tsx';

/**
 * Same rationale as Badge.visual.test.tsx/Switch.visual.test.tsx: baselines
 * here are for geometry (the circular crop, the fallback glyph's size) and
 * typography, not colour correctness (that's a11y/contrast-matrix.test.tsx's
 * job). The no-transition wrapper is kept for the same reason Badge's is:
 * Avatar.module.css has no transitions today, but a future one can't
 * silently introduce a mid-animation capture here without anyone noticing
 * the class was already there to prevent it.
 */
const NO_TRANSITION_CLASS = 'sb-visual-no-transition';
const noTransitionStyle = document.createElement('style');
noTransitionStyle.textContent = `
  .${NO_TRANSITION_CLASS},
  .${NO_TRANSITION_CLASS} * { transition: none !important; }
`;
document.head.appendChild(noTransitionStyle);

const ONE_PX_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

/**
 * Mounts `ui` inside a fresh container appended to `document.body` before
 * render, with the `dark` class (when requested) already present on the
 * container pre-mount so the very first paint is dark. See
 * Badge.visual.test.tsx's identical helper for the full rationale.
 */
async function renderFixture(ui: React.ReactNode, { dark = false } = {}) {
  await page.viewport(900, 700);

  const container = document.createElement('div');
  container.className = NO_TRANSITION_CLASS;
  if (dark) container.classList.add('dark');
  document.body.appendChild(container);
  const screen = await render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>, {
    container,
  });
  await document.fonts.ready;
  return screen;
}

/**
 * Fallback and loaded-image states side by side. The loaded avatar uses a
 * real, locally-decoded data: URI (no network round trip, so no flake risk)
 * and the test waits for the `<img>` to actually mount before screenshotting,
 * the same settle-before-capture idiom every other visual test in this
 * package uses for async mount states (Dialog.visual.test.tsx, etc.).
 */
function FallbackAndLoadedRow() {
  return (
    <div
      data-testid="avatar-row"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem',
        background: 'var(--surface-canvas)',
      }}
    >
      <Avatar fallback="AB" data-testid="avatar-fallback" />
      <Avatar src={ONE_PX_PNG} alt="User" fallback="CD" data-testid="avatar-loaded" />
    </div>
  );
}

describe('Avatar (visual)', () => {
  it('fallback and loaded-image states row matches its baseline in light mode', async () => {
    const screen = await renderFixture(<FallbackAndLoadedRow />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('avatar-loaded').element().querySelector('img')).not.toBeNull();
    });

    await expect(page.getByTestId('avatar-row')).toMatchScreenshot('avatar-row-light');
  });

  it('fallback and loaded-image states row matches its baseline in dark mode', async () => {
    const screen = await renderFixture(<FallbackAndLoadedRow />, { dark: true });
    await vi.waitFor(() => {
      expect(screen.getByTestId('avatar-loaded').element().querySelector('img')).not.toBeNull();
    });

    await expect(page.getByTestId('avatar-row')).toMatchScreenshot('avatar-row-dark');
  });
});
