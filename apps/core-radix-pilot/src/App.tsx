import { useEffect, useState } from 'react';
import { SoribashiProvider } from '@soribashi/core';
import { theme } from './theme/index.ts';
import { TokenReview } from './pages/TokenReview.tsx';
import { ScreenReplica } from './pages/ScreenReplica.tsx';
import { ButtonMatrix } from './pages/ButtonMatrix.tsx';
import { TooltipMatrix } from './pages/TooltipMatrix.tsx';
import { TabsMatrix } from './pages/TabsMatrix.tsx';
import { SelectMatrix } from './pages/SelectMatrix.tsx';
import { Tooltip } from './recipes/Tooltip/Tooltip.tsx';

type Page = 'tokens' | 'screen' | 'buttons' | 'tooltips' | 'tabs' | 'selects';

export function App() {
  const [page, setPage] = useState<Page>('tokens');
  const [dark, setDark] = useState(false);

  // Toggle .dark on <html> so the dark-scoped token overrides apply to the
  // page-level background paint (`html { background: var(--surface-default) }`
  // in styles.css) AND to any portalled content (e.g. RadixTooltip.Portal,
  // which renders into document.body — outside any in-tree dark wrapper).
  // Matches the contract Playwright parity tests use.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [dark]);

  return (
    <SoribashiProvider theme={theme}>
      <Tooltip.Provider>
        <div>
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
            <button onClick={() => setPage('tabs')} aria-current={page === 'tabs' ? 'page' : undefined}>
              Tabs matrix
            </button>
            <button onClick={() => setPage('selects')} aria-current={page === 'selects' ? 'page' : undefined}>
              Select matrix
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
            {page === 'tabs' && <TabsMatrix />}
            {page === 'selects' && <SelectMatrix />}
          </main>
        </div>
      </Tooltip.Provider>
    </SoribashiProvider>
  );
}
