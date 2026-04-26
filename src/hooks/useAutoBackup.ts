import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';

export function useAutoBackup() {
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(false);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'backing_up' | 'error' | 'success'>('idle');
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  
  useEffect(() => {
    async function checkExistingHandle() {
      try {
        const handle = await get('sovereignty-backup-dir-handle');
        if (handle) {
          setIsAutoBackupEnabled(true);
        }
      } catch (e) {
        console.error('Failed to check existing backup handle', e);
      }
    }
    checkExistingHandle();
  }, []);

  const enableAutoBackup = async () => {
    try {
      // @ts-ignore - showDirectoryPicker is not in standard TS lib yet
      if (!window.showDirectoryPicker) {
        throw new Error('Your browser does not support the Local File System Access API. Please use a Chromium-based browser on Desktop for continuous sync.');
      }
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await set('sovereignty-backup-dir-handle', dirHandle);
      setIsAutoBackupEnabled(true);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to enable auto backup', error);
      return { success: false, error: error.message || 'Failed to select directory' };
    }
  };

  const disableAutoBackup = async () => {
    await set('sovereignty-backup-dir-handle', null);
    setIsAutoBackupEnabled(false);
  };

  const triggerBackup = async (exportData: object) => {
    if (!isAutoBackupEnabled) return;
    
    setBackupStatus('backing_up');
    try {
      const handle = await get('sovereignty-backup-dir-handle');
      if (!handle) {
        setIsAutoBackupEnabled(false);
        throw new Error('Backup directory handle not found. Please re-enable auto-backup.');
      }

      // Verify permission
      // @ts-ignore
      if (await handle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
        // @ts-ignore
        if (await handle.requestPermission({ mode: 'readwrite' }) !== 'granted') {
            throw new Error('Permission to write to backup directory was denied.');
        }
      }

      const fileName = `sovereignty-hub-backup-latest.json`;
      // @ts-ignore
      const fileHandle = await handle.getFileHandle(fileName, { create: true });
      // @ts-ignore
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(exportData, null, 2));
      await writable.close();

      setBackupStatus('success');
      setLastBackupTime(new Date().toISOString());
      
      setTimeout(() => {
        setBackupStatus('idle');
      }, 3000);
      
    } catch (e) {
      console.error('Backup failed:', e);
      setBackupStatus('error');
    }
  };

  return {
    isAutoBackupEnabled,
    enableAutoBackup,
    disableAutoBackup,
    triggerBackup,
    backupStatus,
    lastBackupTime
  };
}
