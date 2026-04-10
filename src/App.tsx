/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { initDb } from './db';
import Layout from './lib/components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceView from './pages/InvoiceView';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('landing');
  const [routeParams, setRouteParams] = useState<any>({});

  useEffect(() => {
    initDb().then(() => setIsDbReady(true)).catch(console.error);
  }, []);

  if (!isDbReady) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Initializing Database...</div>;
  }

  const navigate = (route: string, params: any = {}) => {
    setCurrentRoute(route);
    setRouteParams(params);
  };

  if (currentRoute === 'landing') {
    return <Landing navigate={navigate} />;
  }

  const renderRoute = () => {
    switch (currentRoute) {
      case 'dashboard': return <Dashboard navigate={navigate} />;
      case 'clients': return <Clients navigate={navigate} />;
      case 'invoices': return <Invoices navigate={navigate} />;
      case 'invoice-new': return <InvoiceForm navigate={navigate} />;
      case 'invoice-edit': return <InvoiceForm navigate={navigate} invoiceId={routeParams.id} />;
      case 'invoice-view': return <InvoiceView navigate={navigate} invoiceId={routeParams.id} />;
      case 'settings': return <Settings navigate={navigate} />;
      default: return <Dashboard navigate={navigate} />;
    }
  };

  return (
    <Layout currentRoute={currentRoute} navigate={navigate}>
      {renderRoute()}
    </Layout>
  );
}

