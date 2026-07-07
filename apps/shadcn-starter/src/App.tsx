import { SoribashiProvider } from '@soribashi/core';
import { useState } from 'react';
import { ButtonMatrix } from './pages/ButtonMatrix.tsx';
import { theme } from './theme/index.ts';

export function App() {
  const [dark, setDark] = useState(false);

  return (
    <SoribashiProvider theme={theme}>
      <div className={dark ? 'dark' : undefined}>
        <div className="min-h-screen bg-(--surface-canvas) p-8 text-(--text-default)">
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-xl font-semibold">shadcn starter</h1>
            <button
              type="button"
              className="rounded-md border px-3 py-1 text-sm"
              onClick={() => setDark((d) => !d)}
            >
              {dark ? 'Light' : 'Dark'} mode
            </button>
          </header>
          <main data-testid="starter-main">
            <ButtonMatrix />
          </main>
        </div>
      </div>
    </SoribashiProvider>
  );
}
