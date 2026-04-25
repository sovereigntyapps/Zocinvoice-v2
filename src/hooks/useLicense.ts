import { useState, useEffect } from 'react';
import { isAppUnlocked } from '../lib/license';

export function useLicense() {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    isAppUnlocked().then(unlocked => {
      if (mounted) setIsUnlocked(unlocked);
    }).catch(() => {
      if (mounted) setIsUnlocked(false);
    });
    return () => { mounted = false; };
  }, []);

  return { isUnlocked };
}
