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

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('landing');
  const [routeParams, setRouteParams] = useState<any>({});

  useEffect(() => {
    // Check for Stripe callback
    const searchParams = new URLSearchParams(window.location.search);
    const unlocked = searchParams.get('unlocked');
    const sessionId = searchParams.get('session_id');

    if (unlocked === 'true' && sessionId && sessionId.startsWith('cs_')) {
      // Validate basic format of Checkout Session ID and unlock
      unlockApp()
        .then(() => {
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);
          // Navigate to dashboard or upgrade page
          setCurrentRoute('dashboard');
        })
        .catch(console.error);
    }

    initDb().then(() => setIsDbReady(true)).catch(console.error);
  }, []);

  if (!isDbReady) {
    return <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-sm uppercase tracking-widest animate-pulse">Initializing Identity Enclave & OPFS...</div>;
  }

  const navigate = (route: string, params: any = {}) => {
    setCurrentRoute(route);
    setRouteParams(params);
    window.scrollTo(0, 0);
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

  const renderRoute = () => {
    switch (currentRoute) {
      case 'dashboard': return <Dashboard navigate={navigate} />;
      case 'clients': return <Clients navigate={navigate} />;
      case 'invoices': return <Invoices navigate={navigate} />;
      case 'reports': return <Reports />;
      case 'invoice-new': return <InvoiceForm navigate={navigate} />;
      case 'invoice-edit': return <InvoiceForm navigate={navigate} invoiceId={routeParams.id} />;
      case 'invoice-view': return <InvoiceView navigate={navigate} invoiceId={routeParams.id} />;
      case 'settings': return <Settings navigate={navigate} />;
      case 'upgrade': return <Upgrade navigate={navigate} />;
      default: return <Dashboard navigate={navigate} />;
    }
  };

  return (
    <Layout currentRoute={currentRoute} navigate={navigate}>
      {renderRoute()}
    </Layout>
  );
}

