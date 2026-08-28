import { Button, Toast, useToast } from '@soribashi/ui';

const INTENTS = ['primary', 'success', 'warning', 'danger', 'info'] as const;

function ToastDemo() {
  const toast = useToast();
  return (
    <>
      <h2>Fire a toast</h2>
      <p>
        Each toast is created imperatively through <code>useToast().add(...)</code>; its{' '}
        <code>intent</code> colours the surface via the theme's intent resolver.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {INTENTS.map((intent) => (
          <Button
            key={intent}
            intent={intent}
            onClick={() =>
              toast.add({
                intent,
                title: `${intent} toast`,
                description: 'A short notification message.',
              })
            }
          >
            {intent}
          </Button>
        ))}
      </div>

      <h2>Neutral (no intent)</h2>
      <Button
        variant="outline"
        onClick={() => toast.add({ title: 'Saved', description: 'Your changes are live.' })}
      >
        neutral toast
      </Button>

      <h2>With an action</h2>
      <Button
        intent="warning"
        onClick={() =>
          toast.add({
            intent: 'warning',
            title: 'Item deleted',
            description: 'The item was removed from your list.',
            action: { children: 'Undo' },
          })
        }
      >
        toast with action
      </Button>
    </>
  );
}

export function ToastPage() {
  return (
    <Toast.Provider>
      <div>
        <h1>Toast</h1>
        <p>
          Imperative, auto-dismissing notifications on Base UI's toast primitive. Render{' '}
          <code>Toast.Provider</code> and <code>Toast.Viewport</code> once, then call{' '}
          <code>useToast().add(...)</code> anywhere. The Viewport owns the queue map; each toast's
          intent is dynamic and colours the surface through the same resolver Alert uses.
        </p>
        <ToastDemo />
      </div>
      <Toast.Viewport />
    </Toast.Provider>
  );
}
