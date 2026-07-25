import type { ComponentType } from 'react';
import { useState } from 'react';
import { ButtonPage } from './pages/ButtonPage.tsx';
import { Tokens } from './pages/Tokens.tsx';

/**
 * Page-registration table. Each key is both the sidebar identity and the
 * displayed label's source (title-cased below); later tasks in this slice
 * add entries here as new pages arrive.
 */
const PAGES: Record<string, ComponentType> = {
  tokens: Tokens,
  button: ButtonPage,
};

function pageLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function App() {
  const [activeKey, setActiveKey] = useState<string>(Object.keys(PAGES)[0] ?? 'tokens');
  const [dark, setDark] = useState(false);
  const ActivePage = PAGES[activeKey];

  function toggleDark() {
    document.documentElement.classList.toggle('dark');
    setDark((value) => !value);
  }

  return (
    <div className="workshop-shell">
      <nav className="workshop-sidebar">
        <div className="workshop-sidebar-header">
          <span className="workshop-title">soribashi workshop</span>
          <button type="button" onClick={toggleDark}>
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>
        {Object.keys(PAGES).map((key) => (
          <button
            key={key}
            type="button"
            className={key === activeKey ? 'workshop-nav-active' : undefined}
            onClick={() => setActiveKey(key)}
          >
            {pageLabel(key)}
          </button>
        ))}
      </nav>
      <main className="workshop-main">{ActivePage ? <ActivePage /> : null}</main>
    </div>
  );
}
