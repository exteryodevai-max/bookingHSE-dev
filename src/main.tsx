import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'use-sync-external-store/shim';
import App from './App.tsx';
import './index.css';
import './styles/mobile-geo.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
