import { Dialog } from '@soribashi/ui';

export function DialogPage() {
  return (
    <div>
      <h1>Dialog</h1>
      <p>
        A compound recipe over Base UI's Dialog: portal, backdrop, and popup, with modal focus-trap
        and focus-return owned entirely by Base UI.
      </p>

      <h2>Basic</h2>
      <Dialog.Root>
        <Dialog.Trigger>Open dialog</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Dialog title</Dialog.Title>
          <Dialog.Description>A short description of what this dialog shows.</Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>

      <h2>Non-modal</h2>
      <Dialog.Root modal={false}>
        <Dialog.Trigger>Open non-modal dialog</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Non-modal dialog</Dialog.Title>
          <Dialog.Description>
            Rendered with <code>modal=&#123;false&#125;</code>: no backdrop focus-trap, and the rest
            of the page stays interactive.
          </Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}
