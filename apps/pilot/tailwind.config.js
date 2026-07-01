const generated = require('./src/generated/tailwind.config.generated.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...generated,
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // Wave 1 default; the host library's `.dark .app-scope` deferred to north-star A
  corePlugins: {
    preflight: false, // mirror host: no global reset
  },
  plugins: [...(generated.plugins ?? []), require('tailwindcss-animate')],
};
