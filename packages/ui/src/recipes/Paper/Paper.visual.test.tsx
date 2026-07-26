import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Paper } from './Paper.tsx';

describe('Paper (visual)', () => {
  it('an elevation row (flat, shadow, bordered) matches its baseline', async () => {
    await render(
      <SoribashiProvider theme={uiTheme}>
        <div
          data-testid="row"
          style={{
            display: 'flex',
            gap: '1rem',
            padding: '1rem',
            background: 'var(--surface-canvas)',
          }}
        >
          <Paper style={{ width: '120px', height: '80px', padding: '0.5rem' }}>Flat</Paper>
          <Paper shadow="md" style={{ width: '120px', height: '80px', padding: '0.5rem' }}>
            Elevated
          </Paper>
          <Paper withBorder style={{ width: '120px', height: '80px', padding: '0.5rem' }}>
            Bordered
          </Paper>
        </div>
      </SoribashiProvider>,
    );

    await expect.element(page.getByTestId('row')).toBeVisible();
    await expect(page.getByTestId('row')).toMatchScreenshot('paper-elevation-scenario');
  });
});
