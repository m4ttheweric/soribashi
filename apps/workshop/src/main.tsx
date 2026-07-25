import { SoribashiProvider } from '@soribashi/core';
import { uiTheme } from '@soribashi/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './generated/theme.css';
import './generated/tenants.css';
import './styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('workshop: #root element not found');
}

createRoot(container).render(
  <StrictMode>
    <SoribashiProvider theme={uiTheme}>
      <App />
    </SoribashiProvider>
  </StrictMode>,
);
