import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { DollarSign, TrendingUp, Clock } from 'lucide-react';

export default function Reports() {
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
      
      setStats({
        totalRevenue: parseFloat(statsRes.rows[0].total_revenue as string) || 0,
        paidRevenue: parseFloat(statsRes.rows[0].paid_revenue as string) || 0,
        unpaidRevenue: parseFloat(statsRes.rows[0].unpaid_revenue as string) || 0,
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
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight uppercase">Intelligence</h1>
        <p className="text-zinc-500 text-sm font-mono tracking-widest mt-1">Analytics Reporting Suite v1.0</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/40 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800/50 shadow-2xl group transition-all hover:bg-zinc-900/60">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white shadow-inner group-hover:border-zinc-700 transition-all">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Gross Billing</p>
              <p className="text-2xl font-bold text-white tracking-tight">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900/40 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800/50 shadow-2xl group transition-all hover:bg-zinc-900/60">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-emerald-400 shadow-inner group-hover:border-emerald-500/20 transition-all">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Settled Funds</p>
              <p className="text-2xl font-bold text-emerald-400 tracking-tight">${stats.paidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900/40 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800/50 shadow-2xl group transition-all hover:bg-zinc-900/60">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-amber-500 shadow-inner group-hover:border-amber-500/20 transition-all">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Pending Sync</p>
              <p className="text-2xl font-bold text-zinc-100 tracking-tight">${stats.unpaidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800/50 shadow-2xl">
        <div className="flex justify-between items-center mb-10 border-b border-zinc-800/50 pb-6">
           <h2 className="text-xl font-bold text-white tracking-tight uppercase">Revenue Trajectory</h2>
           <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest underline decoration-zinc-800 underline-offset-4">Last 12 Fiscal Epochs</span>
        </div>
        <div className="h-96">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} 
                  tickFormatter={(value) => `$${value}`} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#09090b', 
                    borderRadius: '16px', 
                    border: '1px solid #27272a', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ 
                    color: '#fff', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                  labelStyle={{ 
                    color: '#71717a', 
                    fontSize: '10px', 
                    marginBottom: '8px',
                    fontFamily: 'monospace'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Yield']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#ffffff" 
                  radius={[8, 8, 2, 2]} 
                  maxBarSize={60} 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
              <BarChart className="w-12 h-12 opacity-10 animate-pulse" />
              <p className="font-mono text-xs uppercase tracking-widest">Awaiting transaction density for visualization</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
