export interface TokenMapEntry {
  shadcn: string;
  soribashi: string;
  notes?: string;
}

export const tokenMap: TokenMapEntry[] = [
  // palette
  { shadcn: '--background', soribashi: 'semanticTokens.surface.canvas' },
  { shadcn: '--foreground', soribashi: 'semanticTokens.text.default' },
  { shadcn: '--card', soribashi: 'semanticTokens.surface.raised', notes: 'value slot' },
  {
    shadcn: '--card-foreground',
    soribashi: 'semanticTokens.surface.raised',
    notes: 'foreground slot',
  },
  { shadcn: '--popover', soribashi: 'semanticTokens.surface.floating', notes: 'value slot' },
  {
    shadcn: '--popover-foreground',
    soribashi: 'semanticTokens.surface.floating',
    notes: 'foreground slot',
  },
  { shadcn: '--primary', soribashi: 'tokens.colors.primary.500' },
  { shadcn: '--primary-foreground', soribashi: 'tokens.colors.primary.foreground' },
  { shadcn: '--secondary', soribashi: 'semanticTokens.accent.default' },
  { shadcn: '--secondary-foreground', soribashi: 'tokens.colors.neutral.900' },
  { shadcn: '--muted', soribashi: 'semanticTokens.accent.muted' },
  { shadcn: '--muted-foreground', soribashi: 'semanticTokens.text.muted' },
  { shadcn: '--accent', soribashi: 'semanticTokens.accent.default' },
  { shadcn: '--accent-foreground', soribashi: 'tokens.colors.neutral.900' },
  { shadcn: '--destructive', soribashi: 'tokens.colors.danger.500' },
  { shadcn: '--destructive-foreground', soribashi: 'tokens.colors.danger.foreground' },
  { shadcn: '--border', soribashi: 'semanticTokens.border.default' },
  { shadcn: '--input', soribashi: 'semanticTokens.border.input' },
  { shadcn: '--ring', soribashi: 'semanticTokens.border.focus' },
  // radius
  { shadcn: '--radius', soribashi: 'tokens.radius.lg', notes: 'anchored at 0.625rem' },
  // chart (Phase 4)
  { shadcn: '--chart-1', soribashi: 'tokens.colors.primary.500', notes: 'Phase 4 chart mapping' },
  { shadcn: '--chart-2', soribashi: 'tokens.colors.success.500', notes: 'Phase 4 chart mapping' },
  { shadcn: '--chart-3', soribashi: 'tokens.colors.warning.500', notes: 'Phase 4 chart mapping' },
  { shadcn: '--chart-4', soribashi: 'tokens.colors.info.500', notes: 'Phase 4 chart mapping' },
  { shadcn: '--chart-5', soribashi: 'tokens.colors.danger.500', notes: 'Phase 4 chart mapping' },
];
