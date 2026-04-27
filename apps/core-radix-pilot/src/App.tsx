import { useState } from 'react';
import { SoribashiProvider } from '@soribashi/core';
import { theme } from './theme/index.ts';
import { TokenReview } from './pages/TokenReview.tsx';
import { ScreenReplica } from './pages/ScreenReplica.tsx';
import { ButtonMatrix } from './pages/ButtonMatrix.tsx';

type Page = 'tokens' | 'screen' | 'buttons';

export function App() {
  const [page, setPage] = useState<Page>('tokens');
  const [dark, setDark] = useState(false);

  return (
    <SoribashiProvider theme={theme}>
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
          <span style={{ marginLeft: 'auto' }}>
            <button onClick={() => setDark(!dark)}>{dark ? 'Light' : 'Dark'}</button>
          </span>
        </header>

        <main>
          {page === 'tokens' && <TokenReview />}
          {page === 'screen' && <ScreenReplica />}
          {page === 'buttons' && <ButtonMatrix />}
        </main>
      </div>
    </SoribashiProvider>
  );
}
