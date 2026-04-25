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
    <div className="space-y-12 max-w-4xl mx-auto pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Settings</h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] mt-2">Node Configuration & Identity</p>
        </div>
        <div className="flex gap-4">
           <button
            onClick={saveSettings}
            className="flex items-center justify-center gap-3 px-10 py-4 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 active:scale-95 transition-all shadow-2xl shadow-zinc-900/20"
          >
            <Save className="w-5 h-5" /> Commit Changes
          </button>
        </div>
      </div>

      {status && (
        <div className={`p-6 rounded-[32px] flex items-start gap-4 animate-in slide-in-from-top-2 duration-300 border ${
          status.type === 'success' ? 'bg-zinc-950 text-white border-zinc-950 shadow-2xl shadow-zinc-900/20' : 
          status.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-zinc-50 text-zinc-600 border-zinc-200'
        }`}>
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <p className="text-sm font-bold uppercase tracking-tight leading-relaxed">{status.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-12">
        {/* Company Profile Card */}
        <div className="bg-white border border-zinc-200 p-12 rounded-[48px] shadow-2xl shadow-zinc-200/40 space-y-10 group">
          <div className="flex items-center gap-6 pb-8 border-b border-zinc-50">
            <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-3xl flex items-center justify-center text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Identity</h2>
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest mt-1">Organization Metadata</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-4 space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Brand Signature</label>
              <div className="relative group/logo">
                {companyLogo ? (
                  <div className="w-full aspect-square border border-zinc-100 rounded-[32px] overflow-hidden bg-zinc-50 flex items-center justify-center p-6 shadow-inner relative">
                    <img src={companyLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                    <button 
                      onClick={() => setCompanyLogo('')}
                      className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover/logo:opacity-100 transition-all border border-zinc-100 shadow-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full aspect-square border-2 border-dashed border-zinc-100 rounded-[32px] flex flex-col items-center justify-center text-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 transition-all group-hover/logo:border-zinc-200">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Null Logo</span>
                  </div>
                )}
                <label className="mt-4 block cursor-pointer">
                  <div className="w-full py-4 bg-white border border-zinc-200 rounded-2xl text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-900 hover:border-zinc-900 transition-all active:scale-[0.98] shadow-sm">
                    Upload Identity
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
            
            <div className="md:col-span-8 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Legal Entity Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Protocol Dynamics Ltd"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-5 text-zinc-900 font-bold focus:outline-none focus:border-zinc-900 transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Contact Protocol (Email)</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={e => setCompanyEmail(e.target.value)}
                  placeholder="hello@enclave.local"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-5 text-zinc-900 font-mono text-sm focus:outline-none focus:border-zinc-900 transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Physical Node Coordinates</label>
                <textarea
                  rows={3}
                  value={companyAddress}
                  onChange={e => setCompanyAddress(e.target.value)}
                  placeholder="123 Enclave Way&#10;Sovereign District, SWA Core"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-5 text-zinc-900 font-bold focus:outline-none focus:border-zinc-900 resize-none transition-all text-sm leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fiscal Config Card */}
        <div className="bg-white border border-zinc-200 p-12 rounded-[48px] shadow-2xl shadow-zinc-200/40 space-y-10 group">
          <div className="flex items-center gap-6 pb-8 border-b border-zinc-50">
            <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-3xl flex items-center justify-center text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-inner">
              <Percent className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Fiscal</h2>
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest mt-1">Tax Calculation Engine</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Default Tax Label</label>
              <input
                type="text"
                value={taxName}
                onChange={e => setTaxName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-5 text-zinc-900 font-black uppercase tracking-widest text-[10px] focus:outline-none focus:border-zinc-900 transition-all"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Tax Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxRate}
                  onChange={e => setTaxRate(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-5 text-zinc-900 font-mono text-lg focus:outline-none focus:border-zinc-900 transition-all"
                />
                <span className="absolute right-6 text-zinc-300 font-mono top-1/2 -translate-y-1/2 font-black">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Persistence Card */}
        <div className="bg-zinc-50 border border-zinc-100 p-12 rounded-[48px] space-y-10 group">
          <div className="flex items-center gap-6 pb-8 border-b border-zinc-200/50">
            <div className="w-16 h-16 bg-white border border-zinc-200 rounded-3xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-sm">
              <HardDrive className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Persistence</h2>
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest mt-1">Data Backup & Recovery</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <button
              onClick={handleExportData}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-4 px-8 py-6 rounded-[24px] font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] shadow-xl ${isUnlocked ? 'bg-zinc-950 text-white hover:bg-zinc-800 shadow-zinc-900/20' : 'bg-white text-amber-600 border border-amber-100 hover:bg-amber-50 shadow-amber-900/5'}`}
            >
              {isUnlocked ? <Download className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
              Export Archive
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
                className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-white border border-zinc-200 text-zinc-400 rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:text-zinc-900 hover:border-zinc-900 transition-all active:scale-[0.98] shadow-xl shadow-zinc-100"
              >
                <Upload className="w-5 h-5" /> Restore State
              </button>
            </div>
          </div>
          <div className="p-6 bg-white/50 rounded-[24px] border border-zinc-200/50 flex items-start gap-5">
             <AlertCircle className="w-6 h-6 text-zinc-300 mt-0.5 shrink-0" />
             <p className="text-[10px] text-zinc-400 font-mono leading-relaxed uppercase tracking-[0.15em]">
               Safety Protocol: State restoration is terminal. The current local IDB enclave will be purged and re-initialized with the archive payload.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
