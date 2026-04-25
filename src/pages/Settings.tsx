import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Download, Upload, AlertCircle, HardDrive, Building2, Image as ImageIcon, Percent, Save, Crown, Trash2 } from 'lucide-react';
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
        const settings: any = res.rows.reduce((acc: any, row: any) => {
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
    <div className="space-y-8 max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase">Settings</h1>
          <p className="text-zinc-500 text-sm font-mono tracking-widest mt-1">Node Configuration</p>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${
          status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 
          status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        }`}>
          <AlertCircle className="w-5 h-5 auto mt-0.5" />
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      {/* Company Profile */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-3xl space-y-8 shadow-2xl">
        <div className="flex items-center gap-4 pb-6 border-b border-zinc-800/50">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-400 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Organization Profile</h2>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-0.5">Invoice Metadata Enclave</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-8">
            <div className="shrink-0 space-y-3">
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">Brand Identity</label>
              <div className="flex flex-col items-center gap-4">
                {companyLogo ? (
                  <div className="relative w-32 h-32 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950 flex items-center justify-center group shadow-2xl">
                    <img src={companyLogo} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
                    <button 
                      onClick={() => setCompanyLogo('')}
                      className="absolute top-2 right-2 bg-zinc-900/80 backdrop-blur shadow-lg rounded-full p-1.5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all border border-zinc-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-600 bg-zinc-950/50 hover:bg-zinc-950/80 hover:border-zinc-700 transition-all cursor-pointer group">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-20 group-hover:opacity-40 transition-opacity" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">No Identity</span>
                  </div>
                )}
                <label className="cursor-pointer px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:border-zinc-700 transition-all active:scale-95 shadow-lg">
                  <span>Update Logo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
            
            <div className="flex-1 space-y-6 pt-2">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">Legal Entity Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Protocol Inc"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">Public Endpoint (Email)</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={e => setCompanyEmail(e.target.value)}
                  placeholder="hello@protocol.local"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-all font-mono text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">Physical Coordinates / Address</label>
            <textarea
              rows={3}
              value={companyAddress}
              onChange={e => setCompanyAddress(e.target.value)}
              placeholder="123 Node Ave&#10;Inertia District, Web3"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-600 resize-none transition-all text-sm leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Tax Configuration */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-3xl space-y-8 shadow-2xl">
        <div className="flex items-center gap-4 pb-6 border-b border-zinc-800/50">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-400 shadow-inner">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Fiscal Rules</h2>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-0.5">Tax Calculation Logic</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">Default Tax Label</label>
            <input
              type="text"
              value={taxName}
              onChange={e => setTaxName(e.target.value)}
              placeholder="e.g. VAT, Sales Tax"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-all uppercase font-mono text-xs tracking-wider"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">Tax Rate Payload (%)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxRate}
                onChange={e => setTaxRate(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-all font-mono"
              />
              <span className="absolute right-4 text-zinc-700 font-mono top-1/2 -translate-y-1/2">%</span>
            </div>
          </div>
        </div>
        
        <div className="pt-4 flex items-center justify-end">
          <button
            onClick={saveSettings}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-zinc-950 rounded-xl font-bold hover:bg-zinc-200 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] text-sm"
          >
            <Save className="w-4 h-4" /> Commit Protocol Changes
          </button>
        </div>
      </div>

      {/* Persistence */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-3xl shadow-2xl space-y-8">
        <div className="flex items-center gap-4 pb-6 border-b border-zinc-800/50">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-400 shadow-inner">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Persistence Enclave</h2>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-0.5">IDB / OPFS Data Management</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleExportData}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 border rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg ${isUnlocked ? 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'}`}
          >
            {isUnlocked ? <Download className="w-5 h-5 opacity-50" /> : <Crown className="w-5 h-5 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
            <span className="text-sm">Export Protocol Backup</span>
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
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600/5 text-emerald-500 border border-emerald-500/10 rounded-2xl font-bold hover:bg-emerald-600/10 hover:border-emerald-500/20 transition-all active:scale-[0.98] shadow-lg"
            >
              <Upload className="w-5 h-5 opacity-50" /> 
              <span className="text-sm">Restore From Archive</span>
            </button>
          </div>
        </div>
        <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/30 flex items-start gap-4">
           <AlertCircle className="w-5 h-5 text-zinc-700 mt-0.5 shrink-0" />
           <p className="text-[10px] text-zinc-600 font-mono leading-relaxed uppercase tracking-widest">
             Critical Security Note: Restoring an archive will permanently overwrite the current local node state. Identity Enclave encryption must match archive derivation.
           </p>
        </div>
      </div>
    </div>
  );
}
