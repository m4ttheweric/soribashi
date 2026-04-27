const generated = require('./src/generated/tailwind.config.generated.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...generated,
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '!./src/reference/**',
  ],
  darkMode: 'class', // Wave 1 default; CVI's `.dark .claim-view-islands` deferred to north-star A
  corePlugins: {
    preflight: false, // mirror CVI: no global reset
  },
  plugins: [
    ...(generated.plugins ?? []),
    require('tailwindcss-animate'),
  ],
};
