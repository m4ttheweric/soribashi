import { Divider } from '@soribashi/ui';

export function DividerPage() {
  return (
    <div>
      <h1>Divider</h1>
      <p>Both orientations, bare and labelled.</p>

      <h2>Horizontal</h2>
      <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Divider />
        <Divider label="OR" />
      </div>

      <h2>Vertical</h2>
      <div style={{ display: 'flex', gap: '2rem', height: '80px' }}>
        <Divider orientation="vertical" />
        <Divider orientation="vertical" label="OR" />
      </div>
    </div>
  );
}
