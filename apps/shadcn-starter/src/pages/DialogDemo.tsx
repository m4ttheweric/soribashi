import { Dialog } from '../recipes/Dialog/Dialog.tsx';

export function DialogDemo() {
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Dialog</h2>
      <div className="flex flex-wrap items-center gap-6">
        <Dialog>
          <Dialog.Trigger>
            <button
              type="button"
              className="rounded-md border border-(--border-default) bg-(--surface-raised) px-4 py-2 text-sm"
            >
              Edit profile
            </button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Edit profile</Dialog.Title>
              <Dialog.Description>
                Make changes to your profile here. Click save when you're done.
              </Dialog.Description>
            </Dialog.Header>
            <div className="grid gap-4 py-4">
              <p className="text-sm text-(--text-muted)">Dialog body content goes here.</p>
            </div>
            <Dialog.Footer>
              {/* className="static" overrides the recipe's `close` slot corner
                  positioning (shared with Content's built-in X button) since
                  Dialog.Close here is a footer action, not a corner icon. */}
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="static rounded-md border border-(--border-default) px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                className="rounded-md bg-(--surface-floating) px-4 py-2 text-sm text-(--surface-floating-foreground)"
              >
                Save changes
              </button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      </div>
    </div>
  );
}
