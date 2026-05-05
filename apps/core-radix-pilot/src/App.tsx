import { useState } from 'react';
import { SoribashiProvider } from '@soribashi/core';
import { theme } from './theme/index.ts';
import { TokenReview } from './pages/TokenReview.tsx';
import { ScreenReplica } from './pages/ScreenReplica.tsx';
import { ButtonMatrix } from './pages/ButtonMatrix.tsx';
import { TooltipMatrix } from './pages/TooltipMatrix.tsx';
import { Tooltip } from './recipes/Tooltip/Tooltip.tsx';

type Page = 'tokens' | 'screen' | 'buttons' | 'tooltips';

export function App() {
  const [page, setPage] = useState<Page>('tokens');
  const [dark, setDark] = useState(false);

  return (
    <SoribashiProvider theme={theme}>
      <Tooltip.Provider>
        <div className={dark ? 'dark' : ''}>
          <header
            style={{
              borderBottom: '1px solid var(--border-default)',
              padding: '0.75rem 1.5rem',
              background: 'var(--surface-default)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            <strong style={{ fontFamily: 'var(--font-family-sans)' }}>core-radix pilot</strong>
            <button onClick={() => setPage('tokens')} aria-current={page === 'tokens' ? 'page' : undefined}>
              Tokens
            </button>
            <button onClick={() => setPage('screen')} aria-current={page === 'screen' ? 'page' : undefined}>
              Screen replica
            </button>
            <button onClick={() => setPage('buttons')} aria-current={page === 'buttons' ? 'page' : undefined}>
              Button matrix
            </button>
            <button onClick={() => setPage('tooltips')} aria-current={page === 'tooltips' ? 'page' : undefined}>
              Tooltip matrix
            </button>
            <span style={{ marginLeft: 'auto' }}>
              <button onClick={() => setDark(!dark)}>{dark ? 'Light' : 'Dark'}</button>
            </span>
          </header>

          <main>
            {page === 'tokens' && <TokenReview />}
            {page === 'screen' && <ScreenReplica />}
            {page === 'buttons' && <ButtonMatrix />}
            {page === 'tooltips' && <TooltipMatrix />}
          </main>
        </div>
      </Tooltip.Provider>
    </SoribashiProvider>
  );
}
