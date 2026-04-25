import { PGlite } from '@electric-sql/pglite';

export async function unlockApp() {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle('license.bin', { create: true });
    
    // In Chromium and modern browsers, createWritable is available for OPFS
    // However, some TS definitions might not have it or it might be slightly different.
    // Let's use the standard File System Access API
    if ('createWritable' in handle) {
        const writable = await (handle as any).createWritable();
        await writable.write(new Uint8Array([0x13, 0x37, 0xBE, 0xEF]));
        await writable.close();
    } else {
        // Fallback for missing createWritable? We just need the file to exist.
        // Actually OPFS file creation alone is enough proof for our isAppUnlocked.
    }
  } catch (err) {
    console.error("Failed to write license.bin to OPFS", err);
    throw err;
  }
}

export async function isAppUnlocked() {
  try {
    const root = await navigator.storage.getDirectory();
    await root.getFileHandle('license.bin');
    return true;
  } catch {
    return false;
  }
}
