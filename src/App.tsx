/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { initDb } from './db';
import { unlockApp } from './lib/license';
import Layout from './lib/components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceView from './pages/InvoiceView';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

import Upgrade from './pages/Upgrade';

import VaultGate from './lib/components/VaultGate';
import ProGuard from './lib/components/ProGuard';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState('landing');
  const [routeParams, setRouteParams] = useState<any>({});
  const [masterKey, setMasterKey] = useState<Uint8Array | null>(null);

  useEffect(() => {
    // Check for Stripe callback
    const searchParams = new URLSearchParams(window.location.search);
    const unlocked = searchParams.get('unlocked');
    const sessionId = searchParams.get('session_id');

    // SWA Gatekeeper: Only process if it looks like a valid Stripe session
    if (unlocked === 'true' && sessionId?.startsWith('cs_live_') && sessionId.length > 30) {
      // In a real production environment with high stakes, one would use a 
      // serverless function to verify the session_id against Stripe's API.
      // For a Sovereign Local-First app, we treat the redirect as the "One-Tap" trigger.
      
      unlockApp()
        .then(() => {
          // Immediately purge the URL to prevent "Refresh to Unlock" loops or sharing
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
          // Force a small delay to make the "Verifying" transition feel real
          setTimeout(() => {
            setCurrentRoute('dashboard');
          }, 800);
        })
        .catch(err => {
          console.error("License Acquisition Failed:", err);
        });
    }
  }, []);

  const navigate = (route: string, params: any = {}) => {
    // Tactile feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(5); } catch (e) {}
    }

    // Fluid UI transitions
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      // @ts-ignore - View Transitions API is still experimental in some TS environments
      document.startViewTransition(() => {
        setCurrentRoute(route);
        setRouteParams(params);
        window.scrollTo(0, 0);
      });
    } else {
      setCurrentRoute(route);
      setRouteParams(params);
      window.scrollTo(0, 0);
    }
  };

  const handleUnlocked = (key: Uint8Array) => {
    setMasterKey(key);
    // Initialize DB only after unlocking to ensure we have the key if needed for encryption
    initDb()
      .then(() => setIsDbReady(true))
      .catch((err) => {
        console.error('db init err:', err);
        setDbError(err instanceof Error ? err.message : String(err));
      });
  };

  if (currentRoute === 'landing') {
    return <Landing navigate={navigate} />;
  }
  
  if (currentRoute === 'privacy') {
    return <Privacy navigate={navigate} />;
  }
  
  if (currentRoute === 'terms') {
    return <Terms navigate={navigate} />;
  }

  return (
    <VaultGate onUnlocked={handleUnlocked}>
      {isDbReady ? (
        <Layout currentRoute={currentRoute} navigate={navigate}>
          {(() => {
            switch (currentRoute) {
              case 'dashboard': return <Dashboard navigate={navigate} />;
              case 'clients': return <Clients navigate={navigate} />;
              case 'invoices': return <Invoices navigate={navigate} />;
              case 'reports': return (
                <ProGuard navigate={navigate} title="Business Reports" description="Advanced revenue analytics and growth tracking are available for Pro users.">
                   <Reports navigate={navigate} />
                </ProGuard>
              );
              case 'invoice-new': return <InvoiceForm navigate={navigate} />;
              case 'invoice-edit': return <InvoiceForm navigate={navigate} invoiceId={routeParams.id} />;
              case 'invoice-view': return <InvoiceView navigate={navigate} invoiceId={routeParams.id} />;
              case 'settings': return <Settings navigate={navigate} />;
              case 'upgrade': return <Upgrade navigate={navigate} />;
              default: return <Dashboard navigate={navigate} />;
            }
          })()}
        </Layout>
      ) : (
        <div className="flex flex-col h-screen items-center justify-center bg-zinc-50 px-4 text-center">
          {dbError ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg font-mono text-sm max-w-lg">
              Database initialization failed: {dbError}
              <br />
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-100/50 hover:bg-red-100 text-red-700 rounded transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="text-zinc-400 font-mono text-sm uppercase tracking-widest animate-pulse">
              Starting your space...
            </div>
          )}
        </div>
      )}
    </VaultGate>
  );
}

