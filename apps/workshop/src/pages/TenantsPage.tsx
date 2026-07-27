import { Button, Dialog, Popover, Select } from '@soribashi/ui';
import { useRef } from 'react';

/**
 * The load-bearing demo of scoped theming: one page rendering multiple brand
 * themes simultaneously, including scoped dark mode. Each tenant's tokens are
 * emitted under a class selector (`.tenant-acme`, `.tenant-contoso`) by
 * `scripts/codegen-tenants.ts` instead of `:root`, so wrapping content in
 * that class is enough to pick up the tenant's brand -- no provider swap, no
 * remount. The third card layers an extra `.dark` div on top of the same
 * `.tenant-contoso` scope: colour tokens are emitted as `light-dark()` pairs
 * that resolve at the point of use, so a scoped `color-scheme: dark` flip
 * changes only that subtree while its siblings stay light.
 */

const INTENTS = ['primary', 'neutral', 'danger'] as const;
const VARIANTS = ['filled', 'outline'] as const;

interface TenantSelectItem {
  label: string;
  value: string;
}

const TENANT_SELECT_ITEMS: TenantSelectItem[] = [
  { label: 'Option one', value: 'one' },
  { label: 'Option two', value: 'two' },
  { label: 'Option three', value: 'three' },
];

interface TenantCardConfig {
  id: string;
  label: string;
  description: string;
  scopeClassName: string;
  dark?: boolean;
}

const TENANT_CARDS: TenantCardConfig[] = [
  {
    id: 'acme',
    label: 'Acme',
    description: 'Orange primary, softer corners. Tokens scoped under .tenant-acme.',
    scopeClassName: 'tenant-acme',
  },
  {
    id: 'contoso',
    label: 'Contoso',
    description: 'Violet primary, sharper corners. Tokens scoped under .tenant-contoso.',
    scopeClassName: 'tenant-contoso',
  },
  {
    id: 'contoso-dark',
    label: 'Contoso -- dark-scoped proof',
    description:
      'The same .tenant-contoso tokens, wrapped in an extra .dark div. Only this card goes dark; its siblings are unaffected.',
    scopeClassName: 'tenant-contoso',
    dark: true,
  },
];

function TenantCard({ config }: { config: TenantCardConfig }) {
  // The container ref must point to an element INSIDE the tenant's scope div
  // (and inside the .dark wrapper, for the dark-proof card). Popover.Content,
  // Select's Portal, and Dialog.Content all default to portalling onto
  // document.body, which sits outside every scoped theme wrapper and would
  // render with the base uiTheme instead of this tenant's tokens.
  const containerRef = useRef<HTMLDivElement>(null);

  const body = (
    <div ref={containerRef} className="tenant-card-body">
      <div className="tenant-card-buttons">
        {INTENTS.flatMap((intent) =>
          VARIANTS.map((variant) => (
            <Button key={`${intent}-${variant}`} intent={intent} variant={variant} size="sm">
              {intent} {variant}
            </Button>
          )),
        )}
      </div>

      <Popover.Root>
        <Popover.Trigger>Open popover</Popover.Trigger>
        <Popover.Content container={containerRef}>
          <Popover.Title>{config.label}</Popover.Title>
          <Popover.Description>
            Portalled into this card's own container, so it renders with {config.label}'s scoped
            tokens instead of the page default.
          </Popover.Description>
          <Popover.Close>Close</Popover.Close>
        </Popover.Content>
      </Popover.Root>

      {/*
        Same portal-escape proof as the Popover above, exercised through
        Select's own `container` prop instead. Without it, this Select's
        popup would portal onto document.body and render with the default
        uiTheme's colours despite sitting visually inside this tenant's
        scoped card.
      */}
      <Select
        items={TENANT_SELECT_ITEMS}
        placeholder={`${config.label} select`}
        container={containerRef}
      />

      {/*
        Same portal-escape proof, exercised through Dialog's own `container`
        prop: a THIRD overlay family (Popover/Select above), pointed at this
        card's own containerRef so its backdrop and popup render with
        this tenant's scoped tokens instead of the page default.
      */}
      <Dialog.Root>
        <Dialog.Trigger>Open {config.label} dialog</Dialog.Trigger>
        <Dialog.Content container={containerRef}>
          <Dialog.Title>{config.label}</Dialog.Title>
          <Dialog.Description>
            Portalled into this card's own container, so it renders with {config.label}'s scoped
            tokens instead of the page default.
          </Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );

  return (
    <div className="tenants-page-card">
      <h2>{config.label}</h2>
      <p>{config.description}</p>
      <div className={config.scopeClassName}>
        {config.dark ? <div className="dark">{body}</div> : body}
      </div>
    </div>
  );
}

export function TenantsPage() {
  return (
    <div>
      <h1>Tenants</h1>
      <p>
        One Button, one Popover, one Select, and one Dialog, rendered three times under different
        scoped-theme wrappers. Each card's primary colour and corner radius come from{' '}
        <code>createTheme(&#123; scope: '.tenant-…' &#125;)</code> + <code>emitCss</code>, written
        by <code>scripts/codegen-tenants.ts</code> into <code>generated/tenants.css</code>.
      </p>

      <div className="tenants-page-grid">
        {TENANT_CARDS.map((config) => (
          <TenantCard key={config.id} config={config} />
        ))}
      </div>
    </div>
  );
}
