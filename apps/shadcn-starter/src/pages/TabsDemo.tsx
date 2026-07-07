import { useState } from 'react';
import { Tabs } from '../recipes/Tabs/Tabs.tsx';
import { tabsVariants as VARIANTS } from '../theme/index.ts';

export function TabsDemo() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>('default');

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Tabs</h2>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-(--text-muted)">variant:</span>
        {VARIANTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVariant(v)}
            className={`rounded-md border border-(--border-default) px-3 py-1 text-sm ${
              variant === v ? 'bg-(--accent-default) font-medium' : 'hover:bg-(--accent-muted)'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <Tabs variant={variant} defaultValue="account" className="w-[400px]">
        <Tabs.List>
          <Tabs.Trigger value="account">Account</Tabs.Trigger>
          <Tabs.Trigger value="password">Password</Tabs.Trigger>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="account">
          <p className="text-sm text-(--text-muted)">
            Make changes to your account here. Click save when you're done.
          </p>
        </Tabs.Content>
        <Tabs.Content value="password">
          <p className="text-sm text-(--text-muted)">
            Change your password here. After saving, you'll be logged out.
          </p>
        </Tabs.Content>
        <Tabs.Content value="settings">
          <p className="text-sm text-(--text-muted)">
            Manage your notification and privacy settings.
          </p>
        </Tabs.Content>
      </Tabs>
    </div>
  );
}
