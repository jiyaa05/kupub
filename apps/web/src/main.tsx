// =============================================================================
// KUPUB Frontend Entry Point
// =============================================================================

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRoutes } from './app/routes';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoutes />
  </StrictMode>
);
