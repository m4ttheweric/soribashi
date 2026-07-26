import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Title } from './Title.tsx';

describe('Title (visual)', () => {
  it('the order 1-6 stack matches its baseline', async () => {
    await render(
      <SoribashiProvider theme={uiTheme}>
        <div
          data-testid="stack"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            padding: '1rem',
            background: 'var(--surface-canvas)',
          }}
        >
          <Title order={1}>Heading level 1</Title>
          <Title order={2}>Heading level 2</Title>
          <Title order={3}>Heading level 3</Title>
          <Title order={4}>Heading level 4</Title>
          <Title order={5}>Heading level 5</Title>
          <Title order={6}>Heading level 6</Title>
        </div>
      </SoribashiProvider>,
    );

    await expect.element(page.getByTestId('stack')).toBeVisible();
    await expect(page.getByTestId('stack')).toMatchScreenshot('title-order-stack');
  });
});
