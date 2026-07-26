import { Tabs } from '@soribashi/ui';

const VARIANTS = ['line', 'pill', 'enclosed'] as const;
const ORIENTATIONS = ['horizontal', 'vertical'] as const;

function ThreeTabDemo({
  variant,
  orientation,
}: {
  variant: (typeof VARIANTS)[number];
  orientation: (typeof ORIENTATIONS)[number];
}) {
  return (
    <Tabs.Root defaultValue="a" variant={variant} orientation={orientation}>
      <Tabs.List>
        <Tabs.Tab value="a">First</Tabs.Tab>
        <Tabs.Tab value="b">Second</Tabs.Tab>
        <Tabs.Tab value="c">Third</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="a">First panel content.</Tabs.Panel>
      <Tabs.Panel value="b">Second panel content.</Tabs.Panel>
      <Tabs.Panel value="c">Third panel content.</Tabs.Panel>
    </Tabs.Root>
  );
}

export function TabsPage() {
  return (
    <div>
      <h1>Tabs</h1>
      <p>The three variants (line, pill, enclosed), each in both orientations.</p>

      {VARIANTS.map((variant) => (
        <div key={variant}>
          <h2>{variant}</h2>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ minWidth: '18rem' }}>
              <h3>horizontal</h3>
              <ThreeTabDemo variant={variant} orientation="horizontal" />
            </div>
            <div style={{ minWidth: '18rem' }}>
              <h3>vertical</h3>
              <ThreeTabDemo variant={variant} orientation="vertical" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
