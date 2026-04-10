import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import SyncStatus from './SyncStatus';
import { AlertTriangle } from 'lucide-react';
import { db } from '../../db';
import { triggerAutoBackup } from '../gdrive';

interface LayoutProps {
  children: React.ReactNode;
  currentRoute: string;
  navigate: (route: string, params?: any) => void;
}

export default function Layout({ children, currentRoute, navigate }: LayoutProps) {
  const [showAuthBanner, setShowAuthBanner] = useState(false);

  useEffect(() => {
    const handleAuthRequired = () => setShowAuthBanner(true);
    window.addEventListener('gdrive-auth-required', handleAuthRequired);
    return () => window.removeEventListener('gdrive-auth-required', handleAuthRequired);
  }, []);

  const handleReconnect = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    try {
      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.appdata',
        callback: async (response: any) => {
          if (response.error !== undefined) {
            console.error('Auth Error', response.error);
            return;
          }
          await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['gdrive_token', response.access_token]);
          setShowAuthBanner(false);
          triggerAutoBackup();
        },
      });
      client.requestAccessToken({ prompt: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      <Sidebar currentRoute={currentRoute} navigate={navigate} className="hidden md:flex" />
      <main className="flex-1 overflow-y-auto flex flex-col">
        {showAuthBanner && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Google Drive sync paused (session expired)</span>
            </div>
            <button
              onClick={handleReconnect}
              className="px-4 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 text-sm font-medium rounded-md transition-colors"
            >
              Reconnect
            </button>
          </div>
        )}
        <div className="p-4 md:p-8 pb-24 md:pb-8 flex flex-col flex-1">
          <div className="mx-auto max-w-5xl w-full flex-1">
            {children}
          </div>
          <footer className="mt-12 text-center text-sm text-gray-400">
            Free Invoice Generator by <span className="font-semibold text-gray-500">Sovereignty Apps</span>
          </footer>
        </div>
      </main>
      <BottomNav currentRoute={currentRoute} navigate={navigate} className="md:hidden" />
      <SyncStatus />
    </div>
  );
}
