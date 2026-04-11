import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Save, Download, Upload, AlertCircle, Percent, Building2, Image as ImageIcon, Heart, HardDrive } from 'lucide-react';

export default function Settings() {
  const [taxName, setTaxName] = useState('Tax');
  const [taxRate, setTaxRate] = useState('0');
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
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
    try {
      setIsLoading(true);
      setStatus({ type: 'info', message: 'Preparing export...' });
      
      // Dump all tables
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
      a.download = `sovereignty-invoices-backup-${new Date().toISOString().split('T')[0]}.json`;
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
        
        if (!parsed.data || !parsed.data.clients) {
          throw new Error('Invalid backup file format');
        }
        
        // Clear existing data
        await db.query('DELETE FROM invoice_items');
        await db.query('DELETE FROM invoices');
        await db.query('DELETE FROM clients');
        await db.query('DELETE FROM settings');
        
        // Import Settings
        for (const s of parsed.data.settings || []) {
          await db.query('INSERT INTO settings (key, value) VALUES ($1, $2)', [s.key, s.value]);
        }
        
        // Import Clients
        for (const c of parsed.data.clients || []) {
          await db.query('INSERT INTO clients (id, name, email, company, created_at) VALUES ($1, $2, $3, $4, $5)', 
            [c.id, c.name, c.email, c.company, c.created_at]);
        }
        
        // Import Invoices
        for (const i of parsed.data.invoices || []) {
          await db.query(`
            INSERT INTO invoices (id, client_id, invoice_number, po_number, date, due_date, status, subtotal, tax_name, tax_rate, tax_amount, total, notes, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `, [i.id, i.client_id, i.invoice_number, i.po_number, i.date, i.due_date, i.status, i.subtotal, i.tax_name, i.tax_rate, i.tax_amount, i.total, i.notes, i.created_at]);
        }
        
        // Import Items
        for (const item of parsed.data.invoice_items || []) {
          await db.query(`
            INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [item.id, item.invoice_id, item.description, item.quantity, item.unit_price, item.amount]);
        }
        
        setStatus({ type: 'success', message: 'Data imported successfully! Refreshing...' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error('Import failed:', error);
        setStatus({ type: 'error', message: 'Failed to import data. Invalid file format.' });
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl pb-12">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-gray-100 rounded-lg text-gray-900">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Company Profile</h2>
            <p className="text-sm text-gray-500">These details will appear on your invoices.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
              <div className="flex flex-col items-center gap-3">
                {companyLogo ? (
                  <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img src={companyLogo} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                    <button 
                      onClick={() => setCompanyLogo('')}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm text-gray-500 hover:text-red-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">No logo</span>
                  </div>
                )}
                <label className="cursor-pointer px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span>Upload Logo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. ZOC Solutions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={e => setCompanyEmail(e.target.value)}
                  placeholder="hello@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address / Details</label>
            <textarea
              rows={3}
              value={companyAddress}
              onChange={e => setCompanyAddress(e.target.value)}
              placeholder="123 Business Rd&#10;City, State 12345"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-pink-50 text-pink-600 rounded-lg shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Support the Developer</h2>
            <p className="text-sm text-gray-500">Keep this tool free and private for everyone.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-sm text-gray-600 flex-1">
            This invoicing app uses a Zero-Operating-Cost architecture, meaning your data stays completely private on your device. If this tool saves your business time and money, consider supporting its continued development!
          </p>
          <a
            href="https://buymeacoffee.com/YOUR_USERNAME_HERE"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 px-6 py-2.5 bg-[#FFDD00] text-gray-900 font-bold rounded-lg hover:bg-[#FFD000] transition-colors shadow-sm"
          >
            ☕ Buy me a coffee
          </a>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-gray-100 rounded-lg text-gray-900">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Tax Configuration</h2>
            <p className="text-sm text-gray-500">Set a default tax to be applied to new invoices.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Name</label>
            <input
              type="text"
              value={taxName}
              onChange={e => setTaxName(e.target.value)}
              placeholder="e.g. VAT, Sales Tax"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={taxRate}
              onChange={e => setTaxRate(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="pt-4 flex items-center justify-end">
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Data Management</h2>
            <p className="text-sm text-gray-500">Export your data to a file, or restore from a previous backup.</p>
          </div>
        </div>
        
        {status && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            status.type === 'success' ? 'bg-green-50 text-green-800' : 
            status.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{status.message}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleExportData}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export Backup
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> Restore Backup
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          <strong>Note:</strong> Restoring a backup will overwrite all current data on this device.
        </p>
      </div>
    </div>
  );
}
