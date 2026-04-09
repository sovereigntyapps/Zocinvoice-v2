import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { backupToGDrive, restoreFromGDrive, triggerAutoBackup } from '../lib/gdrive';
import { Save, Download, Upload, AlertCircle, Percent, Building2, Image as ImageIcon, Heart, HardDrive } from 'lucide-react';

export default function Settings() {
  const [gdriveToken, setGdriveToken] = useState('');
  const [taxName, setTaxName] = useState('Tax');
  const [taxRate, setTaxRate] = useState('0');
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const res = await db.query('SELECT * FROM settings');
      const settings = res.rows.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});
      
      setGdriveToken(settings.gdrive_token || '');
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
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['gdrive_token', gdriveToken]);
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['tax_name', taxName]);
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['tax_rate', taxRate]);
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['company_name', companyName]);
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['company_email', companyEmail]);
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['company_address', companyAddress]);
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['company_logo', companyLogo]);
    setStatus({ type: 'success', message: 'Settings saved successfully' });
    setTimeout(() => setStatus(null), 3000);
    triggerAutoBackup();
  };

  const handleConnectGDrive = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setStatus({ type: 'error', message: 'Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment.' });
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.appdata',
        callback: async (response: any) => {
          if (response.error !== undefined) {
            setStatus({ type: 'error', message: `Google Auth Error: ${response.error}` });
            return;
          }
          setGdriveToken(response.access_token);
          await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['gdrive_token', response.access_token]);
          setStatus({ type: 'success', message: 'Successfully connected to Google Drive!' });
          setTimeout(() => setStatus(null), 3000);
        },
      });
      client.requestAccessToken();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to initialize Google Auth. Is the script loaded?' });
    }
  };

  const handleBackup = async () => {
    if (!gdriveToken) {
      setStatus({ type: 'error', message: 'Please connect to Google Drive first' });
      return;
    }
    setIsLoading(true);
    setStatus({ type: 'info', message: 'Pushing backup to Google Drive...' });
    const res = await backupToGDrive(gdriveToken);
    setIsLoading(false);
    if (res.success) {
      setStatus({ type: 'success', message: 'Backup successful!' });
    } else {
      setStatus({ type: 'error', message: `Backup failed: ${res.error}` });
    }
  };

  const handleRestoreClick = () => {
    if (!gdriveToken) {
      setStatus({ type: 'error', message: 'Please connect to Google Drive first' });
      return;
    }
    setRestoreModalOpen(true);
  };

  const handleRestoreConfirm = async () => {
    setRestoreModalOpen(false);
    setIsLoading(true);
    setStatus({ type: 'info', message: 'Restoring from Google Drive...' });
    const res = await restoreFromGDrive(gdriveToken);
    setIsLoading(false);
    if (res.success) {
      setStatus({ type: 'success', message: 'Restore successful! Refreshing...' });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setStatus({ type: 'error', message: `Restore failed: ${res.error}` });
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
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Google Drive Sync</h2>
            <p className="text-sm text-gray-500">Securely backup your local database to your Google Drive.</p>
          </div>
        </div>

        <div className="space-y-4">
          {gdriveToken ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">Connected to Google Drive</span>
              </div>
              <button
                onClick={() => {
                  setGdriveToken('');
                  db.query('DELETE FROM settings WHERE key = $1', ['gdrive_token']);
                }}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-gray-600">
                Connect your Google Drive to enable one-click backups. Your data is stored in a hidden app-specific folder that only this app can access.
              </p>
              <button
                onClick={handleConnectGDrive}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <HardDrive className="w-4 h-4" /> Connect Google Drive
              </button>
            </div>
          )}
        </div>

        <div className="pt-4 flex items-center justify-between">
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-gray-900">Data Recovery</h2>
        <p className="text-sm text-gray-500">If you are logging in from a new device, or if you cleared your browser data, you can pull your latest auto-save from Google Drive to restore your invoices.</p>
        
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
            onClick={handleRestoreClick}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Restore from Google Drive
          </button>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Restore Data</h3>
                <p className="text-gray-500 text-sm mt-1">WARNING: Restoring will overwrite all local data. Are you sure you want to proceed?</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setRestoreModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Restore Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
