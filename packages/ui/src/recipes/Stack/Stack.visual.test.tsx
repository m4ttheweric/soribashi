import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Stack } from './Stack.tsx';

describe('Stack (visual)', () => {
  it('three-child stack at the default gap matches its baseline', async () => {
    await render(
      <SoribashiProvider theme={uiTheme}>
        <Stack data-testid="stack" style={{ background: 'var(--surface-canvas)', padding: '1rem' }}>
          <div>One</div>
          <div>Two</div>
          <div>Three</div>
        </Stack>
      </SoribashiProvider>,
    );

    await expect.element(page.getByTestId('stack')).toBeVisible();
    await expect(page.getByTestId('stack')).toMatchScreenshot('stack-default-gap');
  });
});
