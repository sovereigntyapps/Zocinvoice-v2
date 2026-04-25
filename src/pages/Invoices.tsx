import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Plus, Eye, Edit2, Trash2, AlertTriangle, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { isAppUnlocked } from '../lib/license';

export default function Invoices({ navigate }: { navigate: (route: string, params?: any) => void }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(true);

  const loadInvoices = async () => {
    const res = await db.query(`
      SELECT i.*, c.name as client_name 
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id 
      ORDER BY i.created_at DESC
    `);
    setInvoices(res.rows);
  };

  useEffect(() => {
    loadInvoices();
    isAppUnlocked().then(setIsUnlocked);
  }, []);

  const confirmDelete = (id: string) => {
    setInvoiceToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (invoiceToDelete) {
      await db.query('DELETE FROM invoices WHERE id = $1', [invoiceToDelete]);
      setDeleteModalOpen(false);
      setInvoiceToDelete(null);
      loadInvoices();
    }
  };

  const handleCreate = () => {
    if (!isUnlocked && invoices.length >= 3) {
      navigate('upgrade');
      return;
    }
    navigate('invoice-new');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {!isUnlocked && invoices.length >= 3 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-900/10">
           <div>
             <h3 className="text-amber-500 font-extrabold mb-1 flex items-center gap-2">
                <Crown className="w-5 h-5" /> Trial Limit Reached
             </h3>
             <p className="text-zinc-400 text-sm">You have reached the maximum of 3 invoices permitted on the free preview. Upgrade to unlock unlimited native hardware invoicing.</p>
           </div>
           <button 
              onClick={() => navigate('upgrade')}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-amber-900/20 shrink-0"
           >
              Upgrade Protocol
           </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase">Invoices</h1>
          <p className="text-zinc-500 text-sm font-mono tracking-widest mt-1">Transaction Ledger v3.0</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-950 rounded-xl font-bold hover:bg-zinc-200 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <Plus className="w-5 h-5" /> Create Transaction
        </button>
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-4">
        {invoices.length === 0 ? (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-12 text-center text-zinc-500 rounded-2xl shadow-xl flex flex-col items-center gap-4">
            <AlertTriangle className="w-12 h-12 opacity-20" />
            <p className="text-lg font-medium lowercase tracking-tight">no transactions registered in local enclave</p>
          </div>
        ) : (
          invoices.map(invoice => (
            <div key={invoice.id} className="bg-zinc-900/40 backdrop-blur-xl p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-4 group active:scale-[0.98] transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Invoice ID</div>
                  <div className="font-bold text-white tracking-tight">{invoice.invoice_number}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-widest border transition-all ${
                  invoice.status === 'paid' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-zinc-800/50 text-zinc-400 border-zinc-700'
                }`}>
                  {invoice.status}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Counterparty</div>
                <div className="text-zinc-100 font-medium">{invoice.client_name || 'Anonymous Node'}</div>
              </div>

              <div className="flex justify-between items-end pt-2">
                <div className="space-y-1">
                   <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Amount & Date</div>
                   <div className="text-zinc-300 text-sm">
                      <span className="text-white font-bold text-lg">${parseFloat(invoice.total as string).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="mx-2 text-zinc-700">/</span>
                      <span className="text-zinc-400 font-mono text-xs">{format(new Date(invoice.date as string), 'yyyy-MM-dd')}</span>
                   </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate('invoice-view', { id: invoice.id })} className="p-2.5 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-zinc-700 shadow-lg">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => navigate('invoice-edit', { id: invoice.id })} className="p-2.5 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-zinc-700 shadow-lg">
                      <Edit2 className="w-5 h-5" />
                    </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden group">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/20">
              <th className="px-6 py-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Transaction ID</th>
              <th className="px-6 py-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Counterparty</th>
              <th className="px-6 py-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Value</th>
              <th className="px-6 py-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-center">Protocol Status</th>
              <th className="px-6 py-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-24 text-center text-zinc-500 flex flex-col items-center gap-4">
                  <div className="p-4 bg-zinc-950 rounded-full border border-zinc-800 animate-pulse">
                     <FileText className="w-8 h-8 opacity-20" />
                  </div>
                  <span className="font-mono text-xs tracking-widest uppercase">Null transaction state detected</span>
                </td>
              </tr>
            ) : (
              invoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-zinc-800/20 transition-colors group/row">
                  <td className="px-6 py-5 font-bold text-white tracking-tight">{invoice.invoice_number}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono text-[10px]">
                          {invoice.client_name?.charAt(0) || '?'}
                       </div>
                       <span className="text-zinc-300 font-medium">{invoice.client_name || 'Anonymous node'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-zinc-500 font-mono text-xs">
                    {format(new Date(invoice.date as string), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-5 font-bold text-zinc-100 font-mono">
                    ${parseFloat(invoice.total as string).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-mono uppercase tracking-widest border transition-all ${
                      invoice.status === 'paid' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover/row:shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                      : 'bg-zinc-800/50 text-zinc-500 border-zinc-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1.5 translate-x-2 opacity-40 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-300">
                      <button
                        onClick={() => navigate('invoice-view', { id: invoice.id })}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all border border-transparent hover:border-zinc-700"
                        title="View Protocol State"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate('invoice-edit', { id: invoice.id })}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all border border-transparent hover:border-zinc-700"
                        title="Modify Transaction"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(invoice.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all border border-transparent hover:border-red-900/30"
                        title="Purge From Ledger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Purge Protocol Record</h3>
                <p className="text-zinc-500 text-sm leading-relaxed underline decoration-red-500/20 underline-offset-4">
                  Warning: Deleting transaction ID <span className="text-red-400 font-mono">{invoiceToDelete?.slice(0,8)}</span> will permanently sever the link in the hardware-rooted ledger. This action is irreversible. 
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-500 transition-all shadow-xl shadow-red-900/20 active:scale-[0.98]"
              >
                Confirm Ledger Purge
              </button>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setInvoiceToDelete(null);
                }}
                className="w-full py-3 text-zinc-500 hover:text-white font-medium transition-colors"
              >
                Abort Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
