import { Octokit } from 'octokit';
import { db } from '../db';

export async function backupToGithub(token: string, repoOwner: string, repoName: string) {
  const octokit = new Octokit({ auth: token });
  
  // Dump data
  const clients = await db.query('SELECT * FROM clients');
  const invoices = await db.query('SELECT * FROM invoices');
  const invoiceItems = await db.query('SELECT * FROM invoice_items');
  
  const backupData = JSON.stringify({
    clients: clients.rows,
    invoices: invoices.rows,
    invoiceItems: invoiceItems.rows,
    timestamp: new Date().toISOString()
  }, null, 2);

  const path = 'invoice-backup.json';
  const message = `Backup ${new Date().toISOString()}`;

  try {
    // Check if file exists to get its SHA
    let sha: string | undefined;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: repoOwner,
        repo: repoName,
        path,
      });
      if (!Array.isArray(data) && data.type === 'file') {
        sha = data.sha;
      }
    } catch (e: any) {
      if (e.status !== 404) throw e;
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: repoOwner,
      repo: repoName,
      path,
      message,
      content: btoa(unescape(encodeURIComponent(backupData))),
      sha,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('GitHub backup failed:', error);
    return { success: false, error: error.message };
  }
}

export async function restoreFromGithub(token: string, repoOwner: string, repoName: string) {
  const octokit = new Octokit({ auth: token });
  const path = 'invoice-backup.json';

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: repoOwner,
      repo: repoName,
      path,
    });

    if (!Array.isArray(data) && data.type === 'file' && data.content) {
      const backupData = JSON.parse(decodeURIComponent(escape(atob(data.content))));
      
      // Clear existing data
      await db.exec('TRUNCATE invoice_items, invoices, clients CASCADE');
      
      // Insert clients
      for (const client of backupData.clients) {
        await db.query(
          'INSERT INTO clients (id, name, email, company, created_at) VALUES ($1, $2, $3, $4, $5)',
          [client.id, client.name, client.email, client.company, client.created_at]
        );
      }
      
      // Insert invoices
      for (const inv of backupData.invoices) {
        await db.query(
          'INSERT INTO invoices (id, client_id, invoice_number, date, due_date, status, total, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [inv.id, inv.client_id, inv.invoice_number, inv.date, inv.due_date, inv.status, inv.total, inv.notes, inv.created_at]
        );
      }
      
      // Insert invoice items
      for (const item of backupData.invoiceItems) {
        await db.query(
          'INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount) VALUES ($1, $2, $3, $4, $5, $6)',
          [item.id, item.invoice_id, item.description, item.quantity, item.unit_price, item.amount]
        );
      }
      
      return { success: true };
    }
    return { success: false, error: 'Backup file not found or invalid' };
  } catch (error: any) {
    console.error('GitHub restore failed:', error);
    return { success: false, error: error.message };
  }
}
