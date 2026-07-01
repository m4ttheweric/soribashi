/**
 * TabsMatrix — visual review fixture for Wave 3's Tabs recipe.
 * Renders 3 variants (default | outline | pills) plus four edge-case cells.
 */
import { useState } from 'react';
import { Tabs } from '../recipes/Tabs/Tabs.tsx';

type Variant = 'default' | 'outline' | 'pills';
const VARIANTS: Variant[] = ['default', 'outline', 'pills'];

const SAMPLE_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'usage', label: 'Usage' },
  { value: 'api', label: 'API' },
];

function VariantCell({ variant }: { variant: Variant }) {
  return (
    <section
      style={{
        padding: '1rem',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        variant=&quot;{variant}&quot;
      </h3>
      <Tabs variant={variant} defaultValue="overview">
        <Tabs.List>
          {SAMPLE_TABS.map((t) => (
            <Tabs.Trigger key={t.value} value={t.value}>
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {SAMPLE_TABS.map((t) => (
          <Tabs.Content key={t.value} value={t.value}>
            <p>
              This is the {t.label} panel for the {variant} variant.
            </p>
          </Tabs.Content>
        ))}
      </Tabs>
    </section>
  );
}

function DisabledCell() {
  return (
    <section
      style={{
        padding: '1rem',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        disabled trigger
      </h3>
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a">Enabled</Tabs.Trigger>
          <Tabs.Trigger value="b" disabled>
            Disabled
          </Tabs.Trigger>
          <Tabs.Trigger value="c">Also enabled</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A panel</Tabs.Content>
        <Tabs.Content value="b">B panel (unreachable)</Tabs.Content>
        <Tabs.Content value="c">C panel</Tabs.Content>
      </Tabs>
    </section>
  );
}

function ForceMountCell() {
  return (
    <section
      style={{
        padding: '1rem',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        forceMount panels (both stay in DOM)
      </h3>
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a">A</Tabs.Trigger>
          <Tabs.Trigger value="b">B</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a" forceMount>
          A — forceMount
        </Tabs.Content>
        <Tabs.Content value="b" forceMount>
          B — forceMount
        </Tabs.Content>
      </Tabs>
    </section>
  );
}

function PolymorphicCell() {
  return (
    <section
      style={{
        padding: '1rem',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        polymorphic trigger (one is an &lt;a&gt;)
      </h3>
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a">Button trigger</Tabs.Trigger>
          <Tabs.Trigger value="b" as="a" href="#tabs-matrix">
            Anchor trigger
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A panel</Tabs.Content>
        <Tabs.Content value="b">B panel</Tabs.Content>
      </Tabs>
    </section>
  );
}

function ControlledCell() {
  const [tab, setTab] = useState('a');
  return (
    <section
      style={{
        padding: '1rem',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        controlled (current value: <code>{tab}</code>)
      </h3>
      <Tabs value={tab} onValueChange={setTab}>
        <Tabs.List>
          <Tabs.Trigger value="a">A</Tabs.Trigger>
          <Tabs.Trigger value="b">B</Tabs.Trigger>
          <Tabs.Trigger value="c">C</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A panel</Tabs.Content>
        <Tabs.Content value="b">B panel</Tabs.Content>
        <Tabs.Content value="c">C panel</Tabs.Content>
      </Tabs>
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
        <button type="button" onClick={() => setTab('a')}>
          Set A
        </button>
        <button type="button" onClick={() => setTab('b')}>
          Set B
        </button>
        <button type="button" onClick={() => setTab('c')}>
          Set C
        </button>
      </div>
    </section>
  );
}

export function TabsMatrix() {
  return (
    <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
      <h2 id="tabs-matrix" style={{ margin: 0 }}>
        Tabs matrix
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {VARIANTS.map((v) => (
          <VariantCell key={v} variant={v} />
        ))}
      </div>

      <h3 style={{ margin: 0 }}>Edge cases</h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        <DisabledCell />
        <ForceMountCell />
        <PolymorphicCell />
        <ControlledCell />
      </div>
    </div>
  );
}
