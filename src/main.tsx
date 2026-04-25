import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import VaultGate from './lib/components/VaultGate.tsx';
import './index.css';

// We wrap the entire application in the VaultGate (Security Enclave).
// The App will not mount or initialize its database until the hardware
// identity confirms authorization and derives the symmetric master key.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VaultGate onUnlocked={(key) => {
      // Key can be stored in a secure state manager or singleton here.
      // For now, we mount the App which handles the Data Enclave.
      console.log('Vault Unlocked. Key derived successfully.');
    }}>
      <App />
    </VaultGate>
  </StrictMode>,
);
