import { Accordion } from '@soribashi/ui';

export function AccordionPage() {
  return (
    <div>
      <h1>Accordion</h1>
      <p>
        Single-open (default, <code>multiple=&#123;false&#125;</code>) and multiple-open, each with
        one item expanded and one collapsed to start. <code>value</code> is always an array.
      </p>

      <h2>Single open</h2>
      <div style={{ maxWidth: '20rem' }}>
        <Accordion.Root defaultValue={['a']}>
          <Accordion.Item value="a">
            <Accordion.Header>
              <Accordion.Trigger>Expanded item</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Expanded panel content.</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="b">
            <Accordion.Header>
              <Accordion.Trigger>Collapsed item</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Collapsed panel content.</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      </div>

      <h2>Multiple open</h2>
      <div style={{ maxWidth: '20rem' }}>
        <Accordion.Root multiple defaultValue={['a', 'b']}>
          <Accordion.Item value="a">
            <Accordion.Header>
              <Accordion.Trigger>Expanded item one</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Both items can stay open at once.</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="b">
            <Accordion.Header>
              <Accordion.Trigger>Expanded item two</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This panel is also expanded.</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="c">
            <Accordion.Header>
              <Accordion.Trigger>Collapsed item three</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Collapsed panel content.</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      </div>
    </div>
  );
}
