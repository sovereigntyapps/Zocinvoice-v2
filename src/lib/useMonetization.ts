import { useEffect } from 'react';
import { db } from '../db';

export function useMonetization() {
  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;

    async function checkAndLoadSDK() {
      try {
        // 1. Check if the user opted in
        const res = await db.query("SELECT value FROM settings WHERE key = 'monetization_enabled'");
        const isEnabled = res.rows.length > 0 && res.rows[0].value === 'true';

        if (isEnabled) {
          // 2. Inject the EarnFM/Infatica SDK script
          scriptElement = document.createElement('script');
          
          // TODO: Replace with the actual SDK URL provided by your monetization partner
          scriptElement.src = 'https://cdn.example-sdk.com/bandwidth-worker.js'; 
          scriptElement.async = true;
          
          // TODO: Replace with your actual publisher/account ID
          scriptElement.setAttribute('data-account-id', 'YOUR_ACCOUNT_ID'); 
          
          document.body.appendChild(scriptElement);
          
          console.log('Passive monetization SDK loaded.');
        }
      } catch (error) {
        console.error('Failed to check monetization settings:', error);
      }
    }

    checkAndLoadSDK();

    // Cleanup function
    return () => {
      if (scriptElement && document.body.contains(scriptElement)) {
        document.body.removeChild(scriptElement);
        console.log('Passive monetization SDK removed.');
      }
    };
  }, []);
}
