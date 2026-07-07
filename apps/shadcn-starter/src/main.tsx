import { configureClassNameMerge } from '@soribashi/core';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { twMerge } from 'tailwind-merge';
import { App } from './App.tsx';
import './styles.css';

// Tailwind substrate: opt in to conflict-aware class merging (spec A12).
configureClassNameMerge(twMerge);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
