import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Download, Upload, AlertCircle, HardDrive, Building2, Image as ImageIcon, Heart, Percent, Save, Crown } from 'lucide-react';
import { isAppUnlocked } from '../lib/license';

export default function Settings({ navigate }: { navigate: (route: string) => void }) {
  const [taxName, setTaxName] = useState('Tax');
  const [taxRate, setTaxRate] = useState('0');
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isAppUnlocked().then(setIsUnlocked);
    async function loadSettings() {
      try {
        const res = await db.query('SELECT * FROM settings');
        const settings = res.rows.reduce((acc: any, row: any) => {
          acc[row.key] = row.value;
          return acc;
        }, {});
        
        setTaxName(settings.tax_name || 'Tax');
        setTaxRate(settings.tax_rate || '0');
        setCompanyName(settings.company_name || '');
        setCompanyEmail(settings.company_email || '');
        setCompanyAddress(settings.company_address || '');
        setCompanyLogo(settings.company_logo || '');
      } catch (e) {
        console.error(e);
      }
    }
    loadSettings();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        setStatus({ type: 'error', message: 'Logo file size must be less than 1MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['tax_name', taxName]);
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['tax_rate', taxRate]);
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['company_name', companyName]);
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['company_email', companyEmail]);
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['company_address', companyAddress]);
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['company_logo', companyLogo]);
    setStatus({ type: 'success', message: 'Settings saved successfully' });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleExportData = async () => {
    if (!isUnlocked) {
      navigate('upgrade');
      return;
    }

    try {
      setIsLoading(true);
      setStatus({ type: 'info', message: 'Preparing export...' });
      
      const clients = await db.query('SELECT * FROM clients');
      const invoices = await db.query('SELECT * FROM invoices');
      const items = await db.query('SELECT * FROM invoice_items');
      const settings = await db.query('SELECT * FROM settings');
      
      const exportData = {
        version: 1,
        timestamp: new Date().toISOString(),
        data: {
          clients: clients.rows,
          invoices: invoices.rows,
          invoice_items: items.rows,
          settings: settings.rows
        }
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sovereignty-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatus({ type: 'success', message: 'Data exported successfully!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setStatus({ type: 'error', message: 'Failed to export data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setStatus({ type: 'info', message: 'Importing data...' });
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!parsed.data) {
          throw new Error('Invalid backup file format');
        }
        
        await db.query('DELETE FROM invoice_items');
        await db.query('DELETE FROM invoices');
        await db.query('DELETE FROM clients');
        await db.query('DELETE FROM settings');
        
        for (const s of parsed.data.settings || []) {
          await db.query('INSERT INTO settings (key, value) VALUES ($1, $2)', [s.key, s.value]);
        }
        
        for (const c of parsed.data.clients || []) {
          await db.query('INSERT INTO clients (id, name, email, company, created_at) VALUES ($1, $2, $3, $4, $5)', 
            [c.id, c.name, c.email, c.company, c.created_at]);
        }
        
        for (const i of parsed.data.invoices || []) {
          await db.query(`
            INSERT INTO invoices (id, client_id, invoice_number, po_number, date, due_date, status, subtotal, tax_name, tax_rate, tax_amount, total, notes, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `, [i.id, i.client_id, i.invoice_number, i.po_number, i.date, i.due_date, i.status, i.subtotal, i.tax_name, i.tax_rate, i.tax_amount, i.total, i.notes, i.created_at]);
        }
        
        for (const item of parsed.data.invoice_items || []) {
          await db.query(`
            INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [item.id, item.invoice_id, item.description, item.quantity, item.unit_price, item.amount]);
        }
        
        setStatus({ type: 'success', message: 'Data imported! Refreshing...' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error('Import failed:', error);
        setStatus({ type: 'error', message: 'Failed to import data. Invalid file format.' });
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Settings</h1>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
          <div className="p-2 bg-zinc-800 rounded-lg text-zinc-300">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Company Profile</h2>
            <p className="text-sm text-zinc-500">These details will appear on your invoices.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="shrink-0">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Company Logo</label>
              <div className="flex flex-col items-center gap-3">
                {companyLogo ? (
                  <div className="relative w-24 h-24 border border-zinc-700 rounded-lg overflow-hidden bg-zinc-950 flex items-center justify-center">
                    <img src={companyLogo} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                    <button 
                      onClick={() => setCompanyLogo('')}
                      className="absolute top-1 right-1 bg-zinc-900 rounded-full p-1 shadow-sm text-zinc-400 hover:text-red-500"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center text-zinc-500 bg-zinc-950/50">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">No logo</span>
                  </div>
                )}
                <label className="cursor-pointer px-3 py-1.5 border border-zinc-700 rounded-md text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
                  <span>Upload Logo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Protocol Inc"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={e => setCompanyEmail(e.target.value)}
                  placeholder="hello@company.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Address / Details</label>
            <textarea
              rows={3}
              value={companyAddress}
              onChange={e => setCompanyAddress(e.target.value)}
              placeholder="123 Business Rd&#10;City, State 12345"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-zinc-600 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
          <div className="p-2 bg-zinc-800 text-zinc-300 rounded-lg">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Tax Configuration</h2>
            <p className="text-sm text-zinc-500">Set a default tax to be applied to new invoices.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Tax Name</label>
            <input
              type="text"
              value={taxName}
              onChange={e => setTaxName(e.target.value)}
              placeholder="e.g. VAT, Sales Tax"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={taxRate}
              onChange={e => setTaxRate(e.target.value)}
              placeholder="0.00"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>
        
        <div className="pt-4 flex items-center justify-end">
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-zinc-950 rounded-lg font-bold hover:bg-zinc-200 transition-colors"
          >
            <Save className="w-4 h-4" /> Save Profile
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
          <div className="p-3 bg-zinc-800 text-zinc-300 rounded-xl">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Data Management</h2>
            <p className="text-sm text-zinc-500">Export your local WASM database to a file, or restore from a backup.</p>
          </div>
        </div>
        
        {status && (
          <div className={`p-4 rounded-xl flex items-start gap-3 ${
            status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
            status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}>
            <AlertCircle className="w-5 h-5 auto mt-0.5" />
            <p className="text-sm font-medium">{status.message}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleExportData}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-xl font-medium transition-colors disabled:opacity-50 ${isUnlocked ? 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'}`}
          >
            {isUnlocked ? <Download className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
            Export DB Backup
          </button>
          
          <div className="flex-1">
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImportData}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-xl font-medium hover:bg-emerald-600/20 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> Restore Backup
            </button>
          </div>
        </div>
        <p className="text-xs text-zinc-600 mt-2">
          <strong>Note:</strong> Restoring a backup will overwrite the current OPFS state.
        </p>
      </div>

    </div>
  );
}
