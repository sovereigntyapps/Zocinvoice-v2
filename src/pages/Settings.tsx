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
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Settings</h1>
          <p className="text-zinc-500 text-sm mt-1">Configure your organization and app preferences</p>
        </div>
        <button
          onClick={saveSettings}
          className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-black transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>

      {status.message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
          status.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      {/* Company Profile */}
      <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
          <Building2 className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-bold text-zinc-900">Organization Profile</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-8">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Logo</label>
              <div className="flex flex-col items-center gap-4">
                {companyLogo ? (
                  <div className="relative w-32 h-32 border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50 flex items-center justify-center group">
                    <img src={companyLogo} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
                    <button 
                      onClick={() => setCompanyLogo('')}
                      className="absolute top-2 right-2 bg-white shadow-md rounded-full p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50">
                    <ImageIcon className="w-8 h-8 mb-1 opacity-20" />
                    <span className="text-[10px] font-medium">No Logo</span>
                  </div>
                )}
                <label className="cursor-pointer px-4 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">
                  <span>Change Logo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Your Business Name"
                  className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Contact Email</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={e => setCompanyEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all font-mono text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Address</label>
            <textarea
              rows={3}
              value={companyAddress}
              onChange={e => setCompanyAddress(e.target.value)}
              placeholder="Full mailing address..."
              className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all text-sm leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Tax Configuration */}
      <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
          <Percent className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-bold text-zinc-900">Tax Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Tax Label</label>
            <input
              type="text"
              value={taxName}
              onChange={e => setTaxName(e.target.value)}
              placeholder="e.g. VAT, GST"
              className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Tax Rate (%)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxRate}
                onChange={e => setTaxRate(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all font-mono"
              />
              <span className="absolute right-4 text-zinc-400 font-mono top-1/2 -translate-y-1/2">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Persistence */}
      <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
          <HardDrive className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-bold text-zinc-900">Data & Backup</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleExportData}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-all active:scale-[0.98] ${isUnlocked ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100'}`}
          >
            {isUnlocked ? <Download className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
            Export Data Backup
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
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-lg font-bold hover:bg-black transition-all active:scale-[0.98]"
            >
              <Upload className="w-5 h-5" /> Import Data
            </button>
          </div>
        </div>
        <div className="p-4 bg-zinc-50 rounded-lg flex items-start gap-4">
           <AlertCircle className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
           <p className="text-xs text-zinc-500 leading-relaxed">
             <strong>Warning:</strong> Importing data will overwrite all existing local records. Please ensure you have a backup of your current data before proceeding.
           </p>
        </div>
      </div>
    </div>
  );
}
