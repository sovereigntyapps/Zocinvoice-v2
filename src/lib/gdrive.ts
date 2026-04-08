import { db } from '../db';

const FILE_NAME = 'zoc-invoice-backup.json';

export async function triggerAutoBackup() {
  try {
    const res = await db.query("SELECT value FROM settings WHERE key = 'gdrive_token'");
    if (res.rows.length === 0) return; // Not connected
    
    const token = res.rows[0].value as string;
    if (!token) return;

    window.dispatchEvent(new CustomEvent('sync-start'));
    const backupRes = await backupToGDrive(token);
    
    if (backupRes.success) {
      window.dispatchEvent(new CustomEvent('sync-success'));
    } else {
      window.dispatchEvent(new CustomEvent('sync-error', { detail: backupRes.error }));
    }
  } catch (err) {
    console.error('Auto-backup failed:', err);
    window.dispatchEvent(new CustomEvent('sync-error', { detail: String(err) }));
  }
}

export async function backupToGDrive(accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get all data from PGlite
    const tablesRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const backupData: Record<string, any[]> = {};
    
    for (const row of tablesRes.rows) {
      const tableName = row.table_name as string;
      const dataRes = await db.query(`SELECT * FROM ${tableName}`);
      backupData[tableName] = dataRes.rows;
    }

    const fileContent = JSON.stringify(backupData);
    const file = new Blob([fileContent], { type: 'application/json' });
    
    // 2. Check if file already exists in appDataFolder
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!searchRes.ok) throw new Error('Failed to search Drive');
    const searchData = await searchRes.json();
    const existingFile = searchData.files?.[0];

    // 3. Upload file
    const metadata = {
      name: FILE_NAME,
      parents: ['appDataFolder']
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';

    if (existingFile) {
      uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
      method = 'PATCH';
    }

    const uploadRes = await fetch(uploadUrl, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: form
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Upload failed: ${err}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('GDrive Backup Error:', err);
    return { success: false, error: err.message };
  }
}

export async function restoreFromGDrive(accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Find the file
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!searchRes.ok) throw new Error('Failed to search Drive');
    const searchData = await searchRes.json();
    const existingFile = searchData.files?.[0];

    if (!existingFile) {
      throw new Error('No backup found in Google Drive');
    }

    // 2. Download the file
    const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!downloadRes.ok) throw new Error('Failed to download backup');
    const backupData = await downloadRes.json();

    // 3. Restore to PGlite
    await db.query('BEGIN');
    
    for (const [tableName, rows] of Object.entries(backupData)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;
      
      await db.query(`TRUNCATE TABLE ${tableName} CASCADE`);
      
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        await db.query(
          `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
      }
    }
    
    await db.query('COMMIT');
    return { success: true };
  } catch (err: any) {
    await db.query('ROLLBACK');
    console.error('GDrive Restore Error:', err);
    return { success: false, error: err.message };
  }
}
