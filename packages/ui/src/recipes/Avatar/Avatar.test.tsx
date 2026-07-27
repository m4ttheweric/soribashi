import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Avatar } from './Avatar.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

// A real, tiny, always-decodable image: a 1x1 transparent PNG inlined as a
// data: URI. Decodes locally with no network round trip, so "the image
// loads" is deterministic in a headless browser test with no fixture server.
const ONE_PX_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

// Port 0 is not a valid TCP port, so a browser rejects a request to it
// immediately, without ever reaching the network -- a real `onerror` event
// fires on the underlying `Image`, deterministically and fast, which is what
// "real error event, not a prop flag" requires: Base UI's own load/error
// state machine reacts to a genuine failed load, not a recipe-invented
// `hasError` prop overriding the rendered output.
const GUARANTEED_ERROR_SRC = 'http://localhost:0/never.png';

describe('Avatar (browser)', () => {
  it('renders the image once it loads', async () => {
    const screen = await wrap(
      <Avatar src={ONE_PX_PNG} alt="User" fallback="AB" classNames={{ root: 'probe-loaded' }} />,
    );
    const root = screen.container.querySelector('.probe-loaded')!;

    await vi.waitFor(() => {
      expect(root.querySelector('img')).not.toBeNull();
    });
    // The fallback unmounts once the image has genuinely loaded (Base UI's
    // own `imageLoadingStatus === 'loaded'` gate on `Avatar.Fallback`), so no
    // "AB" text should remain once the image is present.
    expect(root.textContent).toBe('');
  });

  it('falls back to initials when the image errors (real error event)', async () => {
    const screen = await wrap(
      <Avatar
        src={GUARANTEED_ERROR_SRC}
        alt="User"
        fallback="AB"
        classNames={{ root: 'probe-errored' }}
      />,
    );
    const root = screen.container.querySelector('.probe-errored')!;

    await vi.waitFor(
      () => {
        expect(root.textContent).toBe('AB');
      },
      { timeout: 2000, interval: 20 },
    );
    expect(root.querySelector('img')).toBeNull();
  });

  it('grows across the size vocabulary (computed)', async () => {
    const screen = await wrap(
      <>
        <Avatar fallback="A" size="xs" classNames={{ root: 'probe-xs' }} />
        <Avatar fallback="A" size="xl" classNames={{ root: 'probe-xl' }} />
      </>,
    );
    const xs = parseFloat(getComputedStyle(screen.container.querySelector('.probe-xs')!).width);
    const xl = parseFloat(getComputedStyle(screen.container.querySelector('.probe-xl')!).width);
    expect(xl).toBeGreaterThan(xs);
  });

  it('threads a size default through Recipe.extend (invariant 1)', async () => {
    // Same shape as Badge.test.tsx's identical case: if `.extend({
    // defaultProps })` stopped threading, `Big` would fall back to Avatar's
    // own built-in default size ('md'), and this equality would fail rather
    // than the two widths matching by coincidence ('md' and 'xl' resolve to
    // different AVATAR_SIZES entries).
    const Big = Avatar.extend({ defaultProps: { size: 'xl' } });
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Big],
    });

    const extendedScreen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Avatar fallback="A" classNames={{ root: 'probe-extended' }} />
      </SoribashiProvider>,
    );
    const explicitScreen = await wrap(
      <Avatar fallback="A" size="xl" classNames={{ root: 'probe-explicit-xl' }} />,
    );

    const extendedWidth = getComputedStyle(
      extendedScreen.container.querySelector('.probe-extended')!,
    ).width;
    const explicitWidth = getComputedStyle(
      explicitScreen.container.querySelector('.probe-explicit-xl')!,
    ).width;
    expect(extendedWidth).toBe(explicitWidth);
  });
});
