import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Text } from './Text.tsx';

describe('Text (visual)', () => {
  it('the size stack (xs through xl) matches its baseline', async () => {
    await render(
      <SoribashiProvider theme={uiTheme}>
        <div
          data-testid="stack"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '1rem',
            background: 'var(--surface-canvas)',
          }}
        >
          <Text size="xs">Extra small body copy</Text>
          <Text size="sm">Small body copy</Text>
          <Text size="md">Medium body copy</Text>
          <Text size="lg">Large body copy</Text>
          <Text size="xl">Extra large body copy</Text>
          <Text dimmed>Dimmed body copy</Text>
        </div>
      </SoribashiProvider>,
    );

    await expect.element(page.getByTestId('stack')).toBeVisible();
    await expect(page.getByTestId('stack')).toMatchScreenshot('text-sizes');
  });
});
