import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { isAppUnlocked } from '../lib/license';
import { LayoutDashboard, DollarSign, FileText, Users, Clock } from 'lucide-react';

export default function Dashboard({ navigate }: { navigate: (route: string) => void }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalClients: 0,
    totalRevenue: 0,
    paidRevenue: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const unlocked = await isAppUnlocked();
        setIsUnlocked(unlocked);

        const invoicesRes = await db.query('SELECT COUNT(*) as count, SUM(total) as revenue, SUM(paid_amount) as paid FROM invoices');
        const clientsRes = await db.query('SELECT COUNT(*) as count FROM clients');
        
        const invoiceRow = invoicesRes.rows[0] as any;
        const clientsRow = clientsRes.rows[0] as any;

        setStats({
          totalInvoices: invoiceRow ? parseInt(invoiceRow.count) || 0 : 0,
          totalRevenue: invoiceRow ? parseFloat(invoiceRow.revenue) || 0 : 0,
          paidRevenue: invoiceRow ? parseFloat(invoiceRow.paid) || 0 : 0,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Home</h1>
          <p className="text-zinc-500 text-sm mt-1">Overview of your business</p>
        </div>
        <div className="flex gap-4">
           {!isUnlocked && isUnlocked !== null && (
             <button
               onClick={() => navigate('upgrade')}
               className="px-6 py-4 bg-amber-50 text-amber-900 border border-amber-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-100 transition-all active:scale-95 flex items-center gap-2"
             >
               <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
               Upgrade to Pro
             </button>
           )}
           <button
            onClick={() => navigate('invoice-new')}
            className="px-10 py-4 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition-all shadow-2xl shadow-zinc-900/20 active:scale-95"
           >
            New Invoice
           </button>
        </div>
      </div>
      
      {/* Central Metrics Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        <div className="bg-white border border-zinc-200 p-8 rounded-[32px] flex flex-col gap-6 group hover:border-zinc-900 transition-all shadow-xl shadow-zinc-200/40 relative overflow-hidden">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors shadow-inner">
               <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Collected Total</p>
              <p className="text-3xl font-black text-zinc-900 tracking-tight font-sans">
                ${stats.paidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
        </div>

        <div className="bg-white border border-zinc-200 p-8 rounded-[32px] flex flex-col gap-6 group hover:border-zinc-900 transition-all shadow-xl shadow-zinc-200/40 relative overflow-hidden">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors shadow-inner">
               <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Balance Due</p>
              <p className="text-3xl font-black text-zinc-900 tracking-tight font-sans">
                ${(stats.totalRevenue - stats.paidRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
        </div>
        
        <div className="bg-white border border-zinc-200 p-8 rounded-[32px] flex flex-col gap-6 group hover:border-zinc-900 transition-all shadow-xl shadow-zinc-200/40 relative overflow-hidden">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors shadow-inner">
               <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Total Invoices</p>
              <p className="text-3xl font-black text-zinc-900 tracking-tight font-sans">{stats.totalInvoices}</p>
            </div>
        </div>

        <div className="bg-white border border-zinc-200 p-8 rounded-[32px] flex flex-col gap-6 group hover:border-zinc-900 transition-all shadow-xl shadow-zinc-200/40 relative overflow-hidden">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors shadow-inner">
               <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Total Clients</p>
              <p className="text-3xl font-black text-zinc-900 tracking-tight font-sans">{stats.totalClients}</p>
            </div>
        </div>
        
      </div>
      
      {!isUnlocked && isUnlocked !== null && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-[32px] p-8 mt-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Free Plan</span>
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Expand your business potential</h3>
              </div>
              <p className="text-zinc-500 text-sm max-w-xl">
                You're currently using the free tier. Unlock unlimited invoices, unlimited clients, and professional custom branding.
              </p>
            </div>
            
            <div className="flex gap-6">
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Invoices</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-zinc-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${stats.totalInvoices >= 5 ? 'bg-red-500' : 'bg-zinc-900'}`} 
                        style={{ width: `${Math.min((stats.totalInvoices / 5) * 100, 100)}%` }} 
                      />
                    </div>
                    <span className="text-xs font-bold text-zinc-600">{stats.totalInvoices}/5</span>
                  </div>
               </div>
               
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Clients</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-zinc-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${stats.totalClients >= 1 ? 'bg-red-500' : 'bg-zinc-900'}`} 
                        style={{ width: `${Math.min((stats.totalClients / 1) * 100, 100)}%` }} 
                      />
                    </div>
                    <span className="text-xs font-bold text-zinc-600">{stats.totalClients}/1</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
