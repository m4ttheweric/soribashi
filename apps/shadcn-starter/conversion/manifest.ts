export interface ManifestEntry {
  component: string;
  category: 1 | 2 | 3 | 4 | 'integration';
  builder:
    | 'defineComponent'
    | 'definePolymorphicComponent'
    | 'defineCompound'
    | 'defineGenericComponent';
  selectors: readonly string[];
  propMap: Record<string, string>;
  upstream: {
    registryItem: string;
    style: 'new-york';
    registryVersion: string;
    contentHash: string;
  };
  wave: number;
}

export const manifest: ManifestEntry[] = [
  {
    component: 'button',
    category: 1,
    builder: 'definePolymorphicComponent',
    selectors: ['root'],
    propMap: {
      'variant=default': 'intent=primary variant=filled',
      'variant=secondary': 'intent=neutral variant=subtle',
      'variant=destructive': 'intent=danger variant=filled',
      'variant=outline': 'intent=neutral variant=outline',
      'variant=ghost': 'intent=neutral variant=ghost',
      'variant=link': 'intent=primary variant=link',
      'size=default': 'size=md',
      'size=icon': 'icon=true',
      asChild: 'as',
    },
    upstream: {
      registryItem: 'button',
      style: 'new-york',
      registryVersion: '2025-06-01',
      contentHash: 'TBD',
    },
    wave: 1,
  },
];
