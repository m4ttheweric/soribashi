import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Multi-page build: the workshop app itself, plus the standalone
      // fixture page the Playwright browser-parity suite (tests/browser-parity)
      // renders the 14 soribashi blocks against.
      input: {
        main: 'index.html',
        browserFixtures: 'browser-fixtures.html',
      },
    },
  },
});
