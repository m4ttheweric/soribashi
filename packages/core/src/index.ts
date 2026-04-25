// @soribashi/core — public barrel package

// Authoring API
export {
  defineComponent,
  defineGenericComponent,
  definePolymorphicComponent,
  cn,
} from '@soribashi/factory';

export type {
  StylesApiProps,
  PolymorphicProps,
  PolymorphicRef,
} from '@soribashi/factory';

// Theme
export { createTheme, defaultIntentResolver, defaultTokens, defaultDarkTokens } from '@soribashi/theme';

export type { ResolvedTheme, ThemeDefinition, IntentResolver } from '@soribashi/theme';

// Provider
export { SoribashiProvider, useTheme } from '@soribashi/factory';

// Layout blocks
export {
  Box,
  Flex,
  Stack,
  Group,
  Grid,
  SimpleGrid,
  Container,
  Center,
  AspectRatio,
  Space,
  Paper,
  Text,
  Title,
} from '@soribashi/blocks';
