import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, CloudLightning, CheckCircle2 } from 'lucide-react';

export default function SyncStatus() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleStart = () => setStatus('syncing');
    const handleSuccess = () => {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    };
    const handleError = (e: any) => {
      setStatus('error');
      setErrorMsg(e.detail || 'Sync failed');
      setTimeout(() => setStatus('idle'), 5000);
    };

    window.addEventListener('sync-start', handleStart);
    window.addEventListener('sync-success', handleSuccess);
    window.addEventListener('sync-error', handleError);

    return () => {
      window.removeEventListener('sync-start', handleStart);
      window.removeEventListener('sync-success', handleSuccess);
      window.removeEventListener('sync-error', handleError);
    };
  }, []);

  if (status === 'idle') return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-md border border-gray-200 text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-300">
      {status === 'syncing' && (
        <>
          <Cloud className="w-4 h-4 text-blue-500 animate-pulse" />
          <span className="text-gray-600">Saving to Drive...</span>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">Saved to Drive</span>
        </>
      )}
      {status === 'error' && (
        <>
          <CloudOff className="w-4 h-4 text-red-500" />
          <span className="text-red-600 max-w-[200px] truncate" title={errorMsg}>Sync Error</span>
        </>
      )}
    </div>
  );
}
