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
  {
    component: 'tabs',
    category: 3,
    builder: 'defineCompound',
    // Category 3 persistent-compound template (as opposed to Category 2's
    // transient overlays): root, list, trigger, content. No portal; carries
    // a per-recipe variant vocabulary (default | outline | pills).
    selectors: ['root', 'list', 'trigger', 'content'],
    propMap: {},
    upstream: {
      registryItem: 'tabs',
      style: 'new-york',
      registryVersion: '2025-06-01',
      contentHash: 'TBD',
    },
    wave: 3,
  },
  {
    component: 'accordion',
    category: 3,
    builder: 'defineCompound',
    // Category 3 persistent-compound, same template as Tabs: root, item,
    // trigger, content. No portal, no per-recipe variant vocabulary. Root
    // threads Radix's type ('single' | 'multiple') and collapsible, defaulting
    // to type="single" collapsible={true}.
    selectors: ['root', 'item', 'trigger', 'content', 'contentInner'],
    propMap: {},
    upstream: {
      registryItem: 'accordion',
      style: 'new-york',
      registryVersion: '2025-06-01',
      contentHash: 'TBD',
    },
    wave: 3,
  },
  {
    component: 'field',
    category: 4,
    builder: 'defineComponent',
    // Category 4 form-control template: structural wrapper with multiple
    // selectors, not a compound. Composes with any form control (e.g.
    // Checkbox) via normal React children.
    selectors: ['root', 'label', 'description', 'error'],
    propMap: {},
    upstream: {
      registryItem: 'field',
      style: 'new-york',
      registryVersion: '2025-06-01',
      contentHash: 'TBD',
    },
    wave: 4,
  },
  {
    component: 'checkbox',
    category: 4,
    builder: 'defineComponent',
    // Category 4 form control: wraps @radix-ui/react-checkbox. No
    // vocabulary axes, no variants. Composes with Field via children.
    selectors: ['root', 'indicator'],
    propMap: {},
    upstream: {
      registryItem: 'checkbox',
      style: 'new-york',
      registryVersion: '2025-06-01',
      contentHash: 'TBD',
    },
    wave: 4,
  },
  {
    component: 'select',
    category: 4,
    // Spec-classified generic component (defineGenericComponent), but wraps
    // @radix-ui/react-select, which owns its own open/value context -- the
    // same shared-context need as the Category 2 overlay compounds. Phase 1
    // pragmatic call: built with defineCompound (see Select.tsx doc comment).
    // The generic call-site value typing from defineGenericComponent (see
    // apps/pilot/src/recipes/Select/Select.tsx) is a Phase 2+ upgrade.
    builder: 'defineCompound',
    selectors: [
      'root',
      'trigger',
      'value',
      'content',
      'viewport',
      'group',
      'label',
      'item',
      'separator',
      'scrollUpButton',
      'scrollDownButton',
    ],
    propMap: {},
    upstream: {
      registryItem: 'select',
      style: 'new-york',
      registryVersion: '2025-06-01',
      contentHash: 'TBD',
    },
    wave: 4,
  },
];
