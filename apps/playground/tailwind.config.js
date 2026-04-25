const generated = require('./src/generated/tailwind.config.generated.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...generated,
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/blocks/src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
};
