import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { soribashiSourceResolution } from '../../scripts/source-conditions.ts';

export default defineConfig({
  ...soribashiSourceResolution(),
  plugins: [react()],
});
