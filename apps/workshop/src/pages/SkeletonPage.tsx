import { Skeleton } from '@soribashi/ui';

export function SkeletonPage() {
  return (
    <div>
      <h1>Skeleton</h1>
      <p>
        A pure geometry primitive: <code>w</code>/<code>h</code> style props stand in for whatever
        real content is still loading.
      </p>

      <h2>Text-line stack</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '220px' }}>
        <Skeleton w="100%" h="1rem" />
        <Skeleton w="80%" h="1rem" />
        <Skeleton w="60%" h="1rem" />
      </div>

      <h2>Avatar-shaped</h2>
      <Skeleton w="2.5rem" h="2.5rem" style={{ borderRadius: '50%' }} />

      <h2>Card-shaped</h2>
      <Skeleton w="16rem" h="8rem" />
    </div>
  );
}
