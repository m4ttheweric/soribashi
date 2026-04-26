/**
 * Entry point for the browser-fixtures standalone page.
 * Loaded at /browser-fixtures.html by the Playwright dev-server boot.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserFixtures } from './BrowserFixtures.tsx';
import '../styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserFixtures />
  </React.StrictMode>,
);
