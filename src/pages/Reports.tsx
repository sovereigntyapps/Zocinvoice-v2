import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { DollarSign, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import ProGuard from '../lib/components/ProGuard';

export default function Reports({ navigate }: { navigate: (route: string) => void }) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidRevenue: 0,
    unpaidRevenue: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    async function loadReports() {
      // Get overall stats
      const statsRes = await db.query(`
        SELECT 
          SUM(total) as total_revenue,
          SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_revenue,
          SUM(CASE WHEN status != 'paid' THEN total ELSE 0 END) as unpaid_revenue
        FROM invoices
      `);
      
      const row = statsRes.rows[0] as any;
      setStats({
        totalRevenue: parseFloat(row.total_revenue as string) || 0,
        paidRevenue: parseFloat(row.paid_revenue as string) || 0,
        unpaidRevenue: parseFloat(row.unpaid_revenue as string) || 0,
      });

      // Get monthly revenue
      const monthlyRes = await db.query(`
        SELECT 
          to_char(date, 'YYYY-MM') as month,
          SUM(total) as revenue
        FROM invoices
        GROUP BY month
        ORDER BY month ASC
        LIMIT 12
      `);

      const formattedData = monthlyRes.rows.map((row: any) => ({
        name: format(parseISO(row.month + '-01'), 'MMM yyyy'),
        revenue: parseFloat(row.revenue as string) || 0
      }));

      setMonthlyData(formattedData);
    }
    
    loadReports();
  }, []);

  return (
      <div className="space-y-12 max-w-6xl mx-auto pb-24">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Reports</h1>
            <p className="text-zinc-500 text-sm mt-1">Business performance analytics</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-zinc-200 p-8 rounded-[32px] flex flex-col gap-6 group hover:border-zinc-900 transition-all shadow-xl shadow-zinc-200/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform">
                 <DollarSign size={80} className="text-zinc-900" />
              </div>
              <div className="w-14 h-14 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors shadow-inner">
                 <DollarSign className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Total Billing</p>
                <p className="text-3xl font-black text-zinc-900 tracking-tight transition-transform duration-500 grow font-sans">
                  ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
          </div>
          
          <div className="bg-white border border-zinc-200 p-8 rounded-[32px] flex flex-col gap-6 group hover:border-zinc-900 transition-all shadow-xl shadow-zinc-200/40 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform">
                 <TrendingUp size={80} className="text-zinc-900" />
              </div>
              <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-zinc-900/10">
                 <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Paid Revenue</p>
                <p className="text-3xl font-black text-zinc-950 tracking-tight grow font-sans underline decoration-emerald-100 underline-offset-8 decoration-4">
                  ${stats.paidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
          </div>

          <div className="bg-white border border-zinc-200 p-8 rounded-[32px] flex flex-col gap-6 group hover:border-zinc-900 transition-all shadow-xl shadow-zinc-200/40 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform">
                 <Clock size={80} className="text-zinc-900" />
              </div>
              <div className="w-14 h-14 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors shadow-inner">
                 <Clock className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Unpaid Revenue</p>
                <p className="text-3xl font-black text-zinc-900 tracking-tight grow font-sans">
                  ${stats.unpaidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[48px] border border-zinc-200 shadow-2xl shadow-zinc-200/40">
          <div className="flex justify-between items-center mb-12 border-b border-zinc-50 pb-8">
             <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Revenue Overview</h2>
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Monthly Chart</span>
          </div>
          <div className="h-[450px]">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f4f4f5" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }} 
                    dy={20} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }} 
                    tickFormatter={(value) => `$${value}`} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ 
                      backgroundColor: '#000000', 
                      borderRadius: '24px', 
                      border: 'none', 
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                      padding: '20px 24px'
                    }}
                    itemStyle={{ 
                      color: '#fff', 
                      fontSize: '14px', 
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}
                    labelStyle={{ 
                      color: '#71717a', 
                      fontSize: '10px', 
                      fontWeight: '900',
                      marginBottom: '10px',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Capture']}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#18181b" 
                    radius={[12, 12, 4, 4]} 
                    maxBarSize={80} 
                    animationDuration={2000}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-8">
                <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center animate-pulse">
                  <BarChart3 className="w-12 h-12 opacity-10" />
                </div>
                <p className="font-black text-[10px] uppercase tracking-[0.4em]">No report data found</p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
