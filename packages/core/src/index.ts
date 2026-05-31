// @soribashi/core — public barrel package

// Authoring API
export {
  defineComponent,
  defineGenericComponent,
  definePolymorphicComponent,
  defineCompound,
  createSoribashiBuilders,
  makeBuilders,
  registerTheme,
  cn,
} from '@soribashi/factory';

export type {
  StylesApiProps,
  PolymorphicProps,
  PolymorphicRef,
  DefineCompoundConfig,
  PartConfig,
  StandardPartConfig,
  PolymorphicPartConfig,
  PartRenderCtx,
  PolymorphicPartRenderCtx,
  PolymorphicRenderCtx,
  ComponentExtendConfig,
  VocabularyOverride,
} from '@soribashi/factory';

// Theme
export { createTheme, defaultIntentResolver, defaultTokens, defaultDarkTokens, defineVocabulary } from '@soribashi/theme';

export type { ResolvedTheme, ThemeDefinition, IntentResolver, Vocabulary } from '@soribashi/theme';

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
