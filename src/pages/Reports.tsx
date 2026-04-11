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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Billed</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Paid Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.paidRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">${stats.unpaidRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Over Time</h2>
        <div className="h-80">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No revenue data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
