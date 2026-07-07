import { SoribashiProvider } from '@soribashi/core';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { AccordionDemo } from './pages/AccordionDemo.tsx';
import { BadgeMatrix } from './pages/BadgeMatrix.tsx';
import { ButtonMatrix } from './pages/ButtonMatrix.tsx';
import { CardDemo } from './pages/CardDemo.tsx';
import { CheckboxDemo } from './pages/CheckboxDemo.tsx';
import { DialogDemo } from './pages/DialogDemo.tsx';
import { DropdownMenuDemo } from './pages/DropdownMenuDemo.tsx';
import { TabsDemo } from './pages/TabsDemo.tsx';
import { TooltipDemo } from './pages/TooltipDemo.tsx';
import { theme } from './theme/index.ts';

interface PageEntry {
  label: string;
  component: () => ReactElement;
}

/** Gallery routing table. Each subsequent conversion task adds its entry here. */
const pages: Record<string, PageEntry> = {
  button: { label: 'Button', component: ButtonMatrix },
  badge: { label: 'Badge', component: BadgeMatrix },
  card: { label: 'Card', component: CardDemo },
  tooltip: { label: 'Tooltip', component: TooltipDemo },
  dialog: { label: 'Dialog', component: DialogDemo },
  dropdownMenu: { label: 'DropdownMenu', component: DropdownMenuDemo },
  tabs: { label: 'Tabs', component: TabsDemo },
  accordion: { label: 'Accordion', component: AccordionDemo },
  checkbox: { label: 'Checkbox', component: CheckboxDemo },
};

export function App() {
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState('button');
  const Page = pages[page]?.component ?? ButtonMatrix;

  return (
    <SoribashiProvider theme={theme}>
      <div className={dark ? 'dark' : undefined} data-testid="starter-main">
        <div className="flex min-h-screen bg-(--surface-canvas) text-(--text-default)">
          <nav className="w-56 shrink-0 space-y-1 border-(--border-default) border-r p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-sm">shadcn-starter</span>
              <button
                type="button"
                onClick={() => setDark((d) => !d)}
                className="rounded border border-(--border-default) px-2 py-1 text-xs"
              >
                {dark ? 'Light' : 'Dark'}
              </button>
            </div>
            {Object.entries(pages).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPage(key)}
                className={`block w-full rounded px-2 py-1.5 text-left text-sm ${
                  page === key ? 'bg-(--accent-default) font-medium' : 'hover:bg-(--accent-muted)'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <main className="flex-1 overflow-auto p-8">
            <Page />
          </main>
        </div>
      </div>
    </SoribashiProvider>
  );
}
