/**
 * Entry point for the browser-fixtures standalone page.
 * Loaded at /browser-fixtures.html by the Playwright dev-server boot.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserFixtures } from './BrowserFixtures.tsx';
import '@soribashi/blocks/style.css';
import '../generated/theme.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('workshop: browser-fixtures #root element not found');
}

createRoot(container).render(
  <StrictMode>
    <BrowserFixtures />
  </StrictMode>,
);
