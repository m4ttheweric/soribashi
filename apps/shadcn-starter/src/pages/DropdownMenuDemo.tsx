import { useState } from 'react';
import { DropdownMenu } from '../recipes/DropdownMenu/DropdownMenu.tsx';

export function DropdownMenuDemo() {
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [showActivityBar, setShowActivityBar] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [position, setPosition] = useState('bottom');

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">DropdownMenu</h2>
      <div className="flex flex-wrap items-center gap-6">
        <DropdownMenu>
          <DropdownMenu.Trigger>
            <button
              type="button"
              className="rounded-md border border-(--border-default) bg-(--surface-raised) px-4 py-2 text-sm"
            >
              Open menu
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="w-56">
            <DropdownMenu.Label>My Account</DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Item shortcut="⇧⌘P">Profile</DropdownMenu.Item>
            <DropdownMenu.Item shortcut="⌘B">Billing</DropdownMenu.Item>
            <DropdownMenu.Item shortcut="⌘S">Settings</DropdownMenu.Item>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>Invite users</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <DropdownMenu.Item>Email</DropdownMenu.Item>
                <DropdownMenu.Item>Message</DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Separator />
            <DropdownMenu.CheckboxItem checked={showStatusBar} onCheckedChange={setShowStatusBar}>
              Status Bar
            </DropdownMenu.CheckboxItem>
            <DropdownMenu.CheckboxItem
              checked={showActivityBar}
              onCheckedChange={setShowActivityBar}
              disabled
            >
              Activity Bar
            </DropdownMenu.CheckboxItem>
            <DropdownMenu.CheckboxItem checked={showPanel} onCheckedChange={setShowPanel}>
              Panel
            </DropdownMenu.CheckboxItem>
            <DropdownMenu.Separator />
            <DropdownMenu.Label>Panel position</DropdownMenu.Label>
            <DropdownMenu.RadioGroup value={position} onValueChange={setPosition}>
              <DropdownMenu.RadioItem value="top">Top</DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value="bottom">Bottom</DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value="right">Right</DropdownMenu.RadioItem>
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </div>
  );
}
