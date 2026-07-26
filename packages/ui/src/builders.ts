/**
 * The package's themed builders: the four raw builders from
 * @soribashi/factory, cast (not reimplemented) so recipes' PUBLIC size/intent
 * props narrow to uiTheme's vocabulary literals instead of bare string.
 * Type-only theme import: no runtime edge, no import cycle, and deliberately
 * NO registerTheme call anywhere in this package. Runtime behaviour is
 * byte-identical to importing the builders from @soribashi/core; only the
 * declared types change. Recipes import their builder function from here;
 * everything else (autoVars, PartRenderCtx, ...) still comes from
 * @soribashi/core.
 *
 * Registry note: this file is package-local. generate-registry.ts rewrites
 * each embedded recipe's builders import to the consumer-side location
 * ('../builders.ts' relative to components/soribashi/<Name>/<Name>.tsx),
 * because a vendoring consumer owns their own theme and therefore their own
 * builders module; see rewriteBuildersImport there.
 */
import { makeBuilders } from '@soribashi/core';
import type { uiTheme } from './theme.ts';

export const {
  defineComponent,
  definePolymorphicComponent,
  defineCompound,
  defineGenericComponent,
} = makeBuilders<typeof uiTheme>();
