import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Download, Upload, AlertCircle, HardDrive, Building2, Image as ImageIcon, Percent, Save, Crown, Trash2, ShieldCheck, FolderSync, Network, Copy, CheckCircle2 } from 'lucide-react';
import { isAppUnlocked } from '../lib/license';
import { useAutoBackup } from '../hooks/useAutoBackup';
import { useMeshSync } from '../hooks/useMeshSync';

export default function Settings({ navigate }: { navigate: (route: string) => void }) {
  const [taxName, setTaxName] = useState('Tax');
  const [taxRate, setTaxRate] = useState('0');
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [vaultEnabledSetting, setVaultEnabledSetting] = useState<boolean>(() => {
    const saved = localStorage.getItem('SOVEREIGN_VAULT_ENABLED');
    return saved === null ? true : saved === 'true';
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [targetPeerId, setTargetPeerId] = useState('');
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAutoBackupEnabled, enableAutoBackup, disableAutoBackup, triggerBackup, backupStatus, lastBackupTime } = useAutoBackup();
  
  const handleMeshImport = async (data: any) => {
    try {
      if (!data || data.version !== 1) throw new Error('Invalid version');
      setIsLoading(true);
      setStatus({ type: 'info', message: 'Importing data via Mesh...' });
       
      await db.exec('BEGIN');
      try {
        await db.query('DELETE FROM invoice_items');
        await db.query('DELETE FROM invoices');
        await db.query('DELETE FROM clients');
        await db.query('DELETE FROM settings');
        
        for (const s of data.data.settings || []) {
          await db.query('INSERT INTO settings (key, value) VALUES ($1, $2)', [s.key, s.value]);
        }
        
        for (const c of data.data.clients || []) {
          await db.query('INSERT INTO clients (id, name, email, company, created_at) VALUES ($1, $2, $3, $4, $5)', 
            [c.id, c.name, c.email, c.company, c.created_at]);
        }
        
        for (const i of data.data.invoices || []) {
          await db.query(`
            INSERT INTO invoices (id, client_id, invoice_number, po_number, date, due_date, status, subtotal, tax_name, tax_rate, tax_amount, total, notes, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `, [i.id, i.client_id, i.invoice_number, i.po_number, i.date, i.due_date, i.status, i.subtotal, i.tax_name, i.tax_rate, i.tax_amount, i.total, i.notes, i.created_at]);
        }
        
        for (const item of data.data.invoice_items || []) {
          await db.query(`
            INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [item.id, item.invoice_id, item.description, item.quantity, item.unit_price, item.amount]);
        }
        
        await db.exec('COMMIT');
        setStatus({ type: 'success', message: 'Mesh Data Sync Complete! Refreshing...' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (innerError) {
        await db.exec('ROLLBACK');
        throw innerError;
      }
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', message: 'Mesh Sync Failed.' });
      setIsLoading(false);
    }
  };

  const { initPeer, peerId, status: meshStatus, connectToPeer, sendToAll, connections } = useMeshSync(handleMeshImport);

  useEffect(() => {
    isAppUnlocked().then(setIsUnlocked).catch(() => setIsUnlocked(false));
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
    
    localStorage.setItem('SOVEREIGN_VAULT_ENABLED', vaultEnabledSetting.toString());
    
    setStatus({ type: 'success', message: 'Settings saved successfully' });
    setTimeout(() => setStatus(null), 3000);
  };

  const getExportDataPayload = async () => {
    const clients = await db.query('SELECT * FROM clients');
    const invoices = await db.query('SELECT * FROM invoices');
    const items = await db.query('SELECT * FROM invoice_items');
    const settings = await db.query('SELECT * FROM settings');
    
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      data: {
        clients: clients.rows,
        invoices: invoices.rows,
        invoice_items: items.rows,
        settings: settings.rows
      }
    };
  };

  const handleExportData = async () => {
    if (!isUnlocked) {
      navigate('upgrade');
      return;
    }

    try {
      setIsLoading(true);
      setStatus({ type: 'info', message: 'Preparing export...' });
      
      const exportData = await getExportDataPayload();
      
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

  const handleTestBackup = async () => {
    try {
      const exportData = await getExportDataPayload();
      await triggerBackup(exportData);
    } catch (e) {
      console.error(e);
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
        
        // Execute Import within a Transaction for Atomic Resilience
        await db.exec('BEGIN');
        
        try {
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
          
          await db.exec('COMMIT');
          setStatus({ type: 'success', message: 'Data imported! Refreshing...' });
          setTimeout(() => window.location.reload(), 1500);
        } catch (innerError) {
          await db.exec('ROLLBACK');
          throw innerError;
        }
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

      {!isUnlocked && isUnlocked !== null && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-8 rounded-[32px] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-amber-500 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
            <Crown size={120} />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                   <Crown className="w-4 h-4" />
                 </div>
                 <span className="text-amber-900 font-black uppercase tracking-widest text-[10px]">Premium Feature</span>
              </div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">Go Pro for full control</h2>
              <p className="text-zinc-600 text-sm max-w-md">
                Unlock custom organization branding, unlimited data export/backups, and remove limits on invoices and clients.
              </p>
            </div>
            <button
              onClick={() => navigate('upgrade')}
              className="px-8 py-4 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20 active:scale-95"
            >
              Get Pro Version
            </button>
          </div>
        </div>
      )}

      {status && status.message && (
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
          <div className="flex flex-col sm:flex-row items-start gap-8">
            <div className="space-y-3 w-full sm:w-auto">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Logo</label>
              <div className="flex flex-col items-center gap-4">
                {companyLogo && isUnlocked ? (
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
                  <div className="w-32 h-32 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50 group relative">
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-xl">
                         <Crown className="w-6 h-6 text-amber-500 fill-amber-500 animate-bounce" />
                      </div>
                    )}
                    <ImageIcon className="w-8 h-8 mb-1 opacity-20" />
                    <span className="text-[10px] font-medium">No Logo</span>
                  </div>
                )}
                {isUnlocked ? (
                  <label className="cursor-pointer px-4 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">
                    <span>Change Logo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                ) : (
                  <button 
                    onClick={() => navigate('upgrade')}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors"
                  >
                    <Crown className="w-3 h-3 fill-amber-500" /> Unlock Branding
                  </button>
                )}
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

      {/* Security Preferences */}
      <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
          <ShieldCheck className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-bold text-zinc-900">Security Preferences</h2>
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100 group">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
               Vault Protection Gate
               <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest ${vaultEnabledSetting ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-600'}`}>
                 {vaultEnabledSetting ? 'Enabled' : 'Disabled'}
               </span>
            </h3>
            <p className="text-xs text-zinc-500">Require biometric or passphrase unlock on every application launch.</p>
          </div>
          <button
            onClick={() => setVaultEnabledSetting(!vaultEnabledSetting)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${vaultEnabledSetting ? 'bg-zinc-900' : 'bg-zinc-200'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${vaultEnabledSetting ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
        
        {!vaultEnabledSetting && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 italic">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              <strong>Note:</strong> Disabling the vault simplifies access but removes the hardware-derived local encryption layer. Your data remains stored in your browser's IndexedDB.
            </p>
          </div>
        )}
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
        
        <div className="mt-8 pt-6 border-t border-zinc-100 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <FolderSync className="w-5 h-5 text-zinc-400" />
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Continuous Local Backup</h3>
              <p className="text-xs text-zinc-500">Automatically syncs a live copy of your database to a folder on your device.</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {isAutoBackupEnabled ? (
              <>
                <div className="flex-1 w-full bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-emerald-700">
                    <ShieldCheck className="w-5 h-5" />
                    <div className="text-xs font-medium">
                      Continuous Backup Active
                      {lastBackupTime && <span className="block text-[10px] opacity-70">Last backed up: {new Date(lastBackupTime).toLocaleTimeString()}</span>}
                    </div>
                  </div>
                  <button onClick={disableAutoBackup} className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider hover:text-emerald-900 underline underline-offset-2">Disconnect</button>
                </div>
                <button
                  onClick={handleTestBackup}
                  className="px-6 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-lg font-bold text-sm shadow-sm hover:bg-zinc-50 transition-all shrink-0 w-full sm:w-auto"
                >
                  {backupStatus === 'backing_up' ? 'Syncing...' : 'Force Sync Now'}
                </button>
              </>
            ) : (
              <button
                onClick={enableAutoBackup}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-sm ${isUnlocked ? 'bg-zinc-900 text-white hover:bg-black' : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100'}`}
              >
                {isUnlocked ? <FolderSync className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                Select Backup Folder
              </button>
            )}
          </div>
        </div>
        
        {/* Device Mesh Sync Section */}
        <div className="mt-8 pt-6 border-t border-zinc-100 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <Network className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Device Mesh Sync (P2P)</h3>
              <p className="text-xs text-zinc-500">Securely sync data directly between your devices over a WebRTC peer-to-peer connection.</p>
            </div>
          </div>
          
          {meshStatus === 'disconnected' && (
            <button
               onClick={initPeer}
               className="w-full sm:w-auto px-6 py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg font-bold text-sm hover:bg-indigo-100 transition-all shadow-sm"
            >
               Enable Secure Mesh Sync
            </button>
          )}

          {meshStatus === 'connecting' && (
            <div className="text-sm font-medium animate-pulse text-indigo-600">Connecting to sovereign signaling server...</div>
          )}
          
          {(meshStatus === 'ready' || meshStatus === 'error') && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-indigo-400">Your Device Identity</label>
                 <div className="flex items-center gap-2">
                    <code className="text-sm font-black tracking-wider bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm grow text-center select-all">{peerId}</code>
                    <button 
                       onClick={() => { navigator.clipboard.writeText(peerId); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                       className="p-2 bg-white rounded-lg border border-indigo-100 hover:bg-indigo-50 text-indigo-600"
                    >
                       {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                 <input 
                   type="text"
                   value={targetPeerId}
                   onChange={e => setTargetPeerId(e.target.value)}
                   placeholder="Enter Remote Device ID"
                   className="flex-1 bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm"
                 />
                 <button
                   onClick={() => connectToPeer(targetPeerId)}
                   disabled={!targetPeerId}
                   className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all text-sm"
                 >
                   Connect to Target
                 </button>
              </div>

              {connections.length > 0 && (
                <div className="p-4 border border-zinc-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-sm font-bold text-emerald-600 flex items-center gap-2"><Network className="w-4 h-4" /> Connected to {connections.length} device(s)</span>
                  </div>
                  <button
                    onClick={async () => {
                      const payload = await getExportDataPayload();
                      sendToAll(payload);
                      setStatus({ type: 'success', message: 'Data pushed to mesh devices!' });
                      setTimeout(() => setStatus(null), 3000);
                    }}
                    className="w-full py-3 bg-zinc-900 text-white rounded-lg font-bold hover:bg-black transition-all shadow-xl"
                  >
                    Push Database to Mesh Devices (Overwrite)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
