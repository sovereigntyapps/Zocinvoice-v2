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
    <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto pb-24">
      {!isUnlocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
           <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <Crown className="w-8 h-8 text-amber-500" />
             </div>
             <div>
               <h3 className="text-zinc-900 font-black uppercase tracking-tight text-xl mb-1">
                  Enclave Upgrade Required
               </h3>
               <p className="text-zinc-500 text-sm leading-relaxed max-w-lg italic">
                  You are auditing the Sovereignty Protocol in trial mode. Secure your hardware-rooted <code>license.bin</code> to ensure permanent device persistence.
               </p>
             </div>
           </div>
           <button 
              onClick={() => navigate('upgrade')}
              className="px-8 py-3.5 bg-zinc-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl shadow-zinc-900/20 shrink-0 transform active:scale-95"
           >
              Initialize Purchase
           </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Dashboard</h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] mt-2">Personal Billing Dynamics</p>
        </div>
        <div className="flex gap-4">
           <button
            onClick={() => navigate('invoice-new')}
            className="px-10 py-4 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition-all shadow-2xl shadow-zinc-900/20 active:scale-95"
           >
            New Ledger Entry
          </button>
        </div>
      </div>
      
      {/* Central Metrics Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="bg-white border border-zinc-200 p-8 rounded-[32px] flex flex-col gap-6 group hover:border-zinc-900 transition-all shadow-xl shadow-zinc-200/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform">
               <DollarSign size={80} className="text-zinc-900" />
            </div>
            <div className="w-14 h-14 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors shadow-inner">
               <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Total Yield</p>
              <p className="text-4xl font-black text-zinc-900 tracking-tight transition-transform duration-500 grow font-sans">
                ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
        </div>
        
        <div className="bg-white border border-zinc-200 p-8 rounded-[32px] flex flex-col gap-6 group hover:border-zinc-900 transition-all shadow-xl shadow-zinc-200/40 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform">
               <FileText size={80} className="text-zinc-900" />
            </div>
            <div className="w-14 h-14 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors shadow-inner">
               <FileText className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Committed Docs</p>
              <p className="text-4xl font-black text-zinc-900 tracking-tight grow font-sans">{stats.totalInvoices}</p>
            </div>
        </div>

        <div className="bg-white border border-zinc-200 p-8 rounded-[32px] flex flex-col gap-6 group hover:border-zinc-900 transition-all shadow-xl shadow-zinc-200/40 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform">
               <Users size={80} className="text-zinc-900" />
            </div>
            <div className="w-14 h-14 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors shadow-inner">
               <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Verified Counterparties</p>
              <p className="text-4xl font-black text-zinc-900 tracking-tight grow font-sans">{stats.totalClients}</p>
            </div>
        </div>
        
      </div>

    </div>
  );
}
