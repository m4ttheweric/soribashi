import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Container } from './Container.tsx';

describe('Container (visual)', () => {
  it('the default-size container matches its baseline', async () => {
    await render(
      <SoribashiProvider theme={uiTheme}>
        <div style={{ width: '900px', background: 'var(--surface-canvas)' }}>
          <Container data-testid="container" style={{ background: 'var(--surface-raised)' }}>
            Content
          </Container>
        </div>
      </SoribashiProvider>,
    );

    await expect.element(page.getByTestId('container')).toBeVisible();
    await expect(page.getByTestId('container')).toMatchScreenshot('container-default-size');
  });
});
