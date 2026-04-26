import { useState } from 'react';
import { SoribashiProvider, Container, Group, Title } from '@soribashi/core';
import { theme } from './theme/index.ts';
import { ThemeLab } from './pages/ThemeLab.tsx';
import { BlocksDemo } from './pages/BlocksDemo.tsx';
import { Tenants } from './pages/Tenants.tsx';
import { Button } from './components/Button/Button.tsx';

type Page = 'theme-lab' | 'blocks' | 'tenants';

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
              <Title order={3}>Soribashi</Title>
              <Group>
                <Button
                  size="sm"
                  intent="neutral"
                  variant={page === 'theme-lab' ? 'filled' : 'subtle'}
                  aria-current={page === 'theme-lab' ? 'page' : undefined}
                  onClick={() => setPage('theme-lab')}
                >
                  Theme Lab
                </Button>
                <Button
                  size="sm"
                  intent="neutral"
                  variant={page === 'blocks' ? 'filled' : 'subtle'}
                  aria-current={page === 'blocks' ? 'page' : undefined}
                  onClick={() => setPage('blocks')}
                >
                  Blocks
                </Button>
                <Button
                  size="sm"
                  intent="neutral"
                  variant={page === 'tenants' ? 'filled' : 'subtle'}
                  aria-current={page === 'tenants' ? 'page' : undefined}
                  onClick={() => setPage('tenants')}
                >
                  Tenants
                </Button>
                <Button
                  size="sm"
                  intent="neutral"
                  variant="outline"
                  aria-pressed={dark}
                  onClick={() => setDark(!dark)}
                >
                  {dark ? '☀ Light' : '☾ Dark'}
                </Button>
              </Group>
            </Group>
          </Container>
        </header>

        <main style={{ padding: '2rem 0' }}>
          {page === 'theme-lab' && <ThemeLab />}
          {page === 'blocks' && <BlocksDemo />}
          {page === 'tenants' && <Tenants />}
        </main>
      </div>
    </SoribashiProvider>
  );
}
