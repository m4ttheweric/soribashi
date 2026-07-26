import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { uiTheme, uiVocabulary } from '../../theme.ts';
import { Alert } from './Alert.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult>; `wrap`
// awaits it so callers get the real result object (see Button.test.tsx).
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Alert (browser)', () => {
  it('exposes role="alert" so assistive tech announces it', async () => {
    const screen = await wrap(<Alert title="Heads up">Body copy</Alert>);
    await expect.element(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders the title and the body in distinct slots', async () => {
    const screen = await wrap(<Alert title="Heads up">Body copy</Alert>);
    await expect.element(screen.getByText('Heads up')).toBeInTheDocument();
    await expect.element(screen.getByText('Body copy')).toBeInTheDocument();
  });

  it('omits the close button unless withCloseButton is set', async () => {
    const screen = await wrap(<Alert title="t">b</Alert>);
    expect(screen.container.querySelector('button')).toBeNull();
  });

  it('calls onClose when the close button is activated, and the button has an accessible name', async () => {
    const onClose = vi.fn();
    const screen = await wrap(
      <Alert title="t" withCloseButton onClose={onClose}>
        b
      </Alert>,
    );
    const close = screen.getByRole('button', { name: /close/i });
    await close.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('changes rendered colour with intent (computed, not attribute)', async () => {
    const screen = await wrap(
      <>
        <Alert intent="danger" classNames={{ root: 'probe-danger' }}>
          x
        </Alert>
        <Alert intent="success" classNames={{ root: 'probe-success' }}>
          x
        </Alert>
      </>,
    );
    const danger = getComputedStyle(
      screen.container.querySelector('.probe-danger')!,
    ).backgroundColor;
    const success = getComputedStyle(
      screen.container.querySelector('.probe-success')!,
    ).backgroundColor;
    expect(danger).not.toBe(success);
  });

  it('accepts style props from the builder with no recipe wiring', async () => {
    const screen = await wrap(
      <Alert classNames={{ root: 'probe-sp' }} p="xl">
        x
      </Alert>,
    );
    const padding = getComputedStyle(screen.container.querySelector('.probe-sp')!).padding;
    expect(padding).not.toBe('0px');
  });

  it('renders an icon in its own slot alongside the title and body', async () => {
    const screen = await wrap(
      <Alert title="t" icon={<span data-testid="icon-probe">!</span>}>
        b
      </Alert>,
    );
    await expect.element(screen.getByTestId('icon-probe')).toBeInTheDocument();
  });

  it('has zero axe violations across its showcase states (intent x variant, with/without close button)', async () => {
    const intents = uiVocabulary.intent.values;
    const variants = ['filled', 'outline', 'subtle'] as const;

    const screen = await wrap(
      <div>
        {intents.map((intent) =>
          variants.map((variant) => (
            <Alert key={`${intent}-${variant}`} intent={intent} variant={variant} title={intent}>
              Sample body copy for {intent}/{variant}.
            </Alert>
          )),
        )}
        <Alert withCloseButton onClose={() => {}} title="Closable">
          Body copy
        </Alert>
      </div>,
    );

    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
