import { useState } from 'react';
import { SoribashiProvider, Container, Group, Title } from '@soribashi/core';
import { theme } from './theme/index.ts';
import { ThemeLab } from './pages/ThemeLab.tsx';
import { BlocksDemo } from './pages/BlocksDemo.tsx';

type Page = 'theme-lab' | 'blocks';

export function App() {
  const [page, setPage] = useState<Page>('theme-lab');
  const [dark, setDark] = useState(false);

  return (
    <SoribashiProvider theme={theme}>
      <div className={dark ? 'dark' : ''}>
        <header
          style={{
            borderBottom: '1px solid var(--border-default)',
            padding: '1rem 2rem',
            background: 'var(--surface-default)',
          }}
        >
          <Container size="xl" px="none">
            <Group justify="between">
              <Title level={3}>Soribashi</Title>
              <Group>
                <button onClick={() => setPage('theme-lab')}>Theme Lab</button>
                <button onClick={() => setPage('blocks')}>Blocks</button>
                <button onClick={() => setDark(!dark)}>{dark ? '☀ Light' : '☾ Dark'}</button>
              </Group>
            </Group>
          </Container>
        </header>

        <main style={{ padding: '2rem 0' }}>
          {page === 'theme-lab' && <ThemeLab />}
          {page === 'blocks' && <BlocksDemo />}
        </main>
      </div>
    </SoribashiProvider>
  );
}
