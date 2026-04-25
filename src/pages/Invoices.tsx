import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Plus, Eye, Edit2, Trash2, AlertTriangle, Crown, FileText, Search, Filter, ArrowRight, Calendar, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
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

  const formatSafeDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return format(d, 'yyyy.MM.dd');
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-24">
      {!isUnlocked && invoices.length >= 3 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[32px] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
           <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <Crown className="w-8 h-8 text-amber-500" />
             </div>
             <div>
               <h3 className="text-zinc-900 font-black uppercase tracking-tight text-xl mb-1">
                  Protocol Threshold Reached
               </h3>
               <p className="text-zinc-500 text-sm leading-relaxed max-w-lg italic">
                  You have reached the free-tier limit of 3 commits on the Sovereignty Protocol. Upgrade your hardware license for unlimited biometric ledger access.
               </p>
             </div>
           </div>
           <button 
              onClick={() => navigate('upgrade')}
              className="px-10 py-4 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition-all shadow-2xl shadow-zinc-900/20 active:scale-95 shrink-0"
           >
              Upgrade Protocol
           </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Invoices</h1>
          <p className="text-zinc-500 text-sm mt-1">History of all transactions</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-3 px-10 py-4 bg-zinc-950 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-800 active:scale-95 transition-all shadow-2xl shadow-zinc-900/20"
        >
          <Plus className="w-5 h-5" /> New Transaction
        </button>
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-6">
        {invoices.length === 0 ? (
          <div className="bg-white border border-zinc-200 p-16 text-center text-zinc-400 rounded-[32px] shadow-xl shadow-zinc-100 flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.2em]">Zero Data Enclave Depth</p>
          </div>
        ) : (
          invoices.map(invoice => (
            <div key={invoice.id} className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-xl shadow-zinc-200/40 space-y-6 group active:scale-[0.98] transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Serial #</div>
                  <div className="font-black text-zinc-900 tracking-tight text-xl">{invoice.invoice_number}</div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                  invoice.status === 'paid' 
                  ? 'bg-zinc-950 text-white border-zinc-950' 
                  : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                }`}>
                  {invoice.status}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Counterparty</div>
                <div className="text-zinc-900 font-bold text-lg leading-tight">{invoice.client_name || 'Anonymous Node'}</div>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-zinc-50">
                <div className="space-y-1">
                   <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Yield & Timestamp</div>
                   <div className="flex items-baseline gap-3">
                      <span className="text-zinc-900 font-black text-2xl tracking-tighter">${parseFloat(invoice.total as string).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-zinc-300 font-mono text-[10px] uppercase">{formatSafeDate(invoice.date as string)}</span>
                   </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('invoice-view', { id: invoice.id })} className="p-4 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-all border border-zinc-200 shadow-sm">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => navigate('invoice-edit', { id: invoice.id })} className="p-4 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-all border border-zinc-200 shadow-sm">
                      <Edit2 className="w-5 h-5" />
                    </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-[40px] border border-zinc-200 shadow-2xl shadow-zinc-200/40 overflow-hidden group">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50">
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] w-48">Serial ID</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Counterparty</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Timestamp</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Yield</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Ops</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-32 text-center text-zinc-400 flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-zinc-50 rounded-full border border-zinc-100 flex items-center justify-center animate-pulse">
                     <FileText className="w-10 h-10 opacity-20" />
                  </div>
                  <span className="font-black text-[10px] tracking-[0.3em] uppercase">Null Transaction State</span>
                </td>
              </tr>
            ) : (
              invoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-zinc-50/50 transition-colors group/row">
                  <td className="px-8 py-7 font-black text-zinc-900 tracking-tight font-mono">{invoice.invoice_number}</td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-black text-[10px] uppercase shadow-lg shadow-zinc-900/10">
                          {invoice.client_name?.charAt(0) || '?'}
                       </div>
                       <span className="text-zinc-900 font-bold uppercase tracking-tight">{invoice.client_name || 'Anonymous node'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-7 text-zinc-400 font-mono text-[10px] uppercase tracking-widest">
                    {formatSafeDate(invoice.date as string)}
                  </td>
                  <td className="px-8 py-7 font-black text-zinc-900 tracking-tighter text-lg">
                    ${parseFloat(invoice.total as string).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-7 text-center">
                    <span className={`inline-flex px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                      invoice.status === 'paid' 
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xl shadow-zinc-950/10' 
                      : 'bg-white text-zinc-400 border-zinc-200'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-8 py-7 text-right">
                    <div className="flex justify-end gap-2 translate-x-4 opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-500">
                      <button
                        onClick={() => navigate('invoice-view', { id: invoice.id })}
                        className="p-3 text-zinc-400 hover:text-zinc-900 bg-white hover:bg-zinc-50 rounded-xl transition-all border border-zinc-200 shadow-sm"
                        title="View Protocol State"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate('invoice-edit', { id: invoice.id })}
                        className="p-3 text-zinc-400 hover:text-zinc-900 bg-white hover:bg-zinc-50 rounded-xl transition-all border border-zinc-200 shadow-sm"
                        title="Modify Transaction"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(invoice.id)}
                        className="p-3 text-zinc-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl transition-all border border-zinc-200 shadow-sm"
                        title="Purge From Ledger"
                      >
                        <Trash2 className="w-5 h-5" />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white border border-zinc-200 rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] max-w-md w-full p-12 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center text-center gap-8 mb-10">
              <div className="w-24 h-24 rounded-full bg-red-50 border border-red-100 flex items-center justify-center group">
                <AlertTriangle className="w-12 h-12 text-red-500 transition-transform group-hover:scale-110" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Purge Ledger</h3>
                <p className="text-zinc-500 text-sm leading-relaxed px-4">
                  Confirmed: Purging serial <span className="text-red-600 font-bold font-mono">{invoiceToDelete?.slice(0,8)}</span> from the hardware node. This is a final cryptographic deletion.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleDelete}
                className="w-full py-5 bg-zinc-950 text-white rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition-all shadow-2xl shadow-zinc-900/20 active:scale-[0.98]"
              >
                Confirm Deletion
              </button>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setInvoiceToDelete(null);
                }}
                className="w-full py-4 text-zinc-400 hover:text-zinc-900 font-black uppercase tracking-[0.2em] text-[10px] transition-colors"
              >
                Abort Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
