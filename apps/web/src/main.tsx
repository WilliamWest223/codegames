import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { useAuth } from './features/auth/useAuth';
import { syncEngine } from './features/sync/engine';
import { useProgress } from './features/progress/store';
import './styles/tokens.css';
import './styles/global.css';
import './styles/theme.css';

// Initialize auth state
void useAuth.getState().initAuth();

// Initialize sync engine
syncEngine.init(
  () => useProgress.getState(),
  (data) => useProgress.setState(data)
);

// Subscribe progress changes to sync engine
useProgress.subscribe(() => {
  syncEngine.notifyChange();
});

// Installable and usable offline (production builds only; dev keeps hot reload simple).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
