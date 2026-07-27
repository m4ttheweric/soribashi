import type { ComponentType } from 'react';
import { useState } from 'react';
import { AccordionPage } from './pages/AccordionPage.tsx';
import { AlertPage } from './pages/AlertPage.tsx';
import { AvatarPage } from './pages/AvatarPage.tsx';
import { BadgePage } from './pages/BadgePage.tsx';
import { ButtonPage } from './pages/ButtonPage.tsx';
import { CheckboxPage } from './pages/CheckboxPage.tsx';
import { DialogPage } from './pages/DialogPage.tsx';
import { DividerPage } from './pages/DividerPage.tsx';
import { FieldPage } from './pages/FieldPage.tsx';
import { FormPage } from './pages/FormPage.tsx';
import { LayoutPage } from './pages/LayoutPage.tsx';
import { PopoverPage } from './pages/PopoverPage.tsx';
import { RadioGroupPage } from './pages/RadioGroupPage.tsx';
import { SelectPage } from './pages/SelectPage.tsx';
import { SkeletonPage } from './pages/SkeletonPage.tsx';
import { SwitchPage } from './pages/SwitchPage.tsx';
import { TabsPage } from './pages/TabsPage.tsx';
import { TenantsPage } from './pages/TenantsPage.tsx';
import { TextareaPage } from './pages/TextareaPage.tsx';
import { TextInputPage } from './pages/TextInputPage.tsx';
import { Tokens } from './pages/Tokens.tsx';
import { TooltipPage } from './pages/TooltipPage.tsx';

/**
 * Page-registration table. Each key is both the sidebar identity and the
 * displayed label's source (title-cased below); later tasks in this slice
 * add entries here as new pages arrive.
 */
const PAGES: Record<string, ComponentType> = {
  tokens: Tokens,
  button: ButtonPage,
  alert: AlertPage,
  badge: BadgePage,
  checkbox: CheckboxPage,
  tabs: TabsPage,
  select: SelectPage,
  popover: PopoverPage,
  tenants: TenantsPage,
  layout: LayoutPage,
  field: FieldPage,
  textinput: TextInputPage,
  textarea: TextareaPage,
  switch: SwitchPage,
  radiogroup: RadioGroupPage,
  tooltip: TooltipPage,
  dialog: DialogPage,
  accordion: AccordionPage,
  avatar: AvatarPage,
  skeleton: SkeletonPage,
  divider: DividerPage,
  form: FormPage,
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
