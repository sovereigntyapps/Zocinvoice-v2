import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { isAppUnlocked } from '../lib/license';
import { LayoutDashboard, Crown, LogOut, DollarSign, FileText, Users, ArrowRight } from 'lucide-react';

export default function Dashboard({ navigate }: { navigate: (route: string) => void }) {
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalClients: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    isAppUnlocked().then(setIsUnlocked);
    async function loadStats() {
      try {
        const invoicesRes = await db.query('SELECT COUNT(*) as count, SUM(total) as revenue FROM invoices');
        const clientsRes = await db.query('SELECT COUNT(*) as count FROM clients');
        
        const invoiceRow = invoicesRes.rows[0] as any;
        const clientsRow = clientsRes.rows[0] as any;

        setStats({
          totalInvoices: invoiceRow ? parseInt(invoiceRow.count) || 0 : 0,
          totalRevenue: invoiceRow ? parseFloat(invoiceRow.revenue) || 0 : 0,
          totalClients: clientsRow ? parseInt(clientsRow.count) || 0 : 0,
        });
      } catch (e) {
        // Table might not be ready yet
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {!isUnlocked && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-center justify-between">
           <div>
             <h3 className="text-amber-500 font-bold mb-1 flex items-center gap-2">
                <Crown className="w-5 h-5" /> Trial Mode Active
             </h3>
             <p className="text-amber-500/80 text-sm">You are using the free preview of Sovereignty Apps. Upgrade to secure your OPFS lifetime license.</p>
           </div>
           <button 
              onClick={() => navigate('upgrade')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-colors shrink-0"
           >
              Upgrade Now
           </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 mt-1 text-sm">Hardware-Rooted Local Protocol</p>
        </div>
        <div className="flex gap-4">
           <button
            onClick={() => navigate('invoice-new')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors"
           >
            Create Invoice
          </button>
        </div>
      </div>
      
      {/* Central Metrics Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-6 rounded-2xl flex items-center gap-4 group hover:border-zinc-700/50 transition-all shadow-xl">
            <div className="p-3.5 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-white tracking-tight">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
        </div>
        
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-6 rounded-2xl flex items-center gap-4 group hover:border-zinc-700/50 transition-all shadow-xl">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Invoices</p>
              <p className="text-3xl font-bold text-white tracking-tight">{stats.totalInvoices}</p>
            </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-6 rounded-2xl flex items-center gap-4 group hover:border-zinc-700/50 transition-all shadow-xl">
            <div className="p-3.5 bg-purple-500/10 text-purple-500 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Clients</p>
              <p className="text-3xl font-bold text-white tracking-tight">{stats.totalClients}</p>
            </div>
        </div>
        
      </div>

    </div>
  );
}
