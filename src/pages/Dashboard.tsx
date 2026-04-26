import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { isAppUnlocked } from '../lib/license';
import { LayoutDashboard, DollarSign, FileText, Users, Clock } from 'lucide-react';

export default function Dashboard({ navigate }: { navigate: (route: string) => void }) {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalClients: 0,
    totalRevenue: 0,
    paidRevenue: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
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
    </div>
  );
}
