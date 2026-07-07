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
  {
    component: 'badge',
    category: 1,
    builder: 'definePolymorphicComponent',
    selectors: ['root'],
    propMap: {
      'variant=default': 'intent=primary variant=filled',
      'variant=secondary': 'intent=neutral variant=subtle',
      'variant=destructive': 'intent=danger variant=filled',
      'variant=outline': 'intent=neutral variant=outline',
      asChild: 'as',
    },
    upstream: {
      registryItem: 'badge',
      style: 'new-york',
      registryVersion: '2025-06-01',
      contentHash: 'TBD',
    },
    wave: 1,
  },
  {
    component: 'card',
    category: 1,
    builder: 'defineComponent',
    // Part-family namespace (spec section 10): one selector per independent
    // part, each with its own single 'root' selector internally.
    selectors: ['Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter'],
    propMap: {},
    upstream: {
      registryItem: 'card',
      style: 'new-york',
      registryVersion: '2025-06-01',
      contentHash: 'TBD',
    },
    wave: 1,
  },
  {
    component: 'tooltip',
    category: 2,
    builder: 'defineCompound',
    // First compound in shadcn-starter: root (Provider+Root), trigger,
    // content, plus arrow as a style-addressable (non-consumer-facing) slot.
    selectors: ['root', 'trigger', 'content', 'arrow'],
    propMap: {},
    upstream: {
      registryItem: 'tooltip',
      style: 'new-york',
      registryVersion: '2025-06-01',
      contentHash: 'TBD',
    },
    wave: 2,
  },
  {
    component: 'dialog',
    category: 2,
    builder: 'defineCompound',
    // Overlay compound following Tooltip's template: root, trigger, header,
    // footer, title, description, close (consumer-facing), plus content
    // (which internally renders the overlay backdrop and built-in X close
    // button as style-addressable, non-consumer-facing slots).
    selectors: [
      'root',
      'trigger',
      'overlay',
      'content',
      'header',
      'footer',
      'title',
      'description',
      'close',
    ],
    propMap: {},
    upstream: {
      registryItem: 'dialog',
      style: 'new-york',
      registryVersion: '2025-06-01',
      contentHash: 'TBD',
    },
    wave: 2,
  },
  {
    component: 'dropdown-menu',
    category: 2,
    builder: 'defineCompound',
    // Most complex compound in Phase 1: root, trigger, content, item,
    // checkboxItem, radioItem, radioGroup, label, separator, sub, subTrigger,
    // subContent, plus shortcut as a style-addressable (non-consumer-facing)
    // slot rendered internally by item/subTrigger.
    selectors: [
      'root',
      'trigger',
      'content',
      'item',
      'checkboxItem',
      'radioItem',
      'radioGroup',
      'label',
      'separator',
      'sub',
      'subTrigger',
      'subContent',
      'shortcut',
    ],
    propMap: {},
    upstream: {
      registryItem: 'dropdown-menu',
      style: 'new-york',
      registryVersion: '2025-06-01',
      contentHash: 'TBD',
    },
    wave: 2,
  },
];
