import { makeBuilders } from '@soribashi/core';
import type { BaseTheme } from './theme/index.ts';

export const {
  defineComponent,
  definePolymorphicComponent,
  defineCompound,
  defineGenericComponent,
} = makeBuilders<BaseTheme>();
