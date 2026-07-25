// The style-prop engine (and these theme-value getters) moved to
// @soribashi/factory; re-exported here so blocks-internal imports of
// '../utils/index.ts' keep working unchanged.
export {
  getFontSize,
  getLineHeight,
  getRadius,
  getShadow,
  getSize,
  getSpacing,
  getThemeColor,
  isDev,
  isRawCss,
  rem,
} from '@soribashi/factory';
