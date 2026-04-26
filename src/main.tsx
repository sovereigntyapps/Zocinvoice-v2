import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import VaultGate from './lib/components/VaultGate.tsx';
import './index.css';

// Resilience: Safari Watchdog storage persistence lock
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

// We wrap the entire application in the VaultGate (Security layer).
// The App will not mount or initialize its database until the hardware
// identity confirms authorization and derives the symmetric master key.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
