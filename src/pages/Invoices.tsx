import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Plus, Eye, Edit2, Trash2, AlertTriangle, Crown, FileText, Search, Filter, ArrowRight, Calendar, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { isAppUnlocked } from '../lib/license';

export default function Invoices({ navigate }: { navigate: (route: string, params?: any) => void }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);

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
    isAppUnlocked().then(setIsUnlocked).catch(() => setIsUnlocked(false));
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Invoices</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your business invoices</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-3 px-10 py-4 bg-zinc-950 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-800 active:scale-95 transition-all shadow-2xl shadow-zinc-900/20"
        >
          <Plus className="w-5 h-5" /> New Invoice
        </button>
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-6">
        {invoices.length === 0 ? (
          <div className="bg-white border border-zinc-200 p-16 text-center text-zinc-400 rounded-[32px] shadow-xl shadow-zinc-100 flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.2em]">No invoices recorded yet</p>
          </div>
        ) : (
          invoices.map(invoice => (
            <div key={invoice.id} className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-xl shadow-zinc-200/40 space-y-6 group active:scale-[0.98] transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Invoice #</div>
                  <div className="font-black text-zinc-900 tracking-tight text-xl">{invoice.invoice_number}</div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                  invoice.status === 'paid' 
                  ? 'bg-zinc-950 text-white border-zinc-950' 
                  : invoice.status === 'partial'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                }`}>
                  {invoice.status}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Client</div>
                <div className="text-zinc-900 font-bold text-lg leading-tight">{invoice.client_name || 'No Client'}</div>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-zinc-50">
                <div className="space-y-1">
                   <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Amount & Date</div>
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
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] w-48">Invoice #</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Client</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Date</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Amount</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-32 text-center text-zinc-400 flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-zinc-50 rounded-full border border-zinc-100 flex items-center justify-center animate-pulse">
                     <FileText className="w-10 h-10 opacity-20" />
                  </div>
                  <span className="font-black text-[10px] tracking-[0.3em] uppercase">No Invoices Found</span>
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
                       <span className="text-zinc-900 font-bold uppercase tracking-tight">{invoice.client_name || 'No client'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-7 text-zinc-400 font-mono text-[10px] uppercase tracking-widest">
                    {formatSafeDate(invoice.date as string)}
                  </td>
                  <td className="px-8 py-7 font-black text-zinc-900 tracking-tighter text-lg">
                    <div className="flex flex-col">
                      <span>${parseFloat(invoice.total as string).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      {parseFloat(invoice.paid_amount as string) > 0 && parseFloat(invoice.paid_amount as string) < parseFloat(invoice.total as string) && (
                        <span className="text-[10px] text-emerald-600 tracking-normal font-bold">
                          Paid: ${parseFloat(invoice.paid_amount as string).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-7 text-center">
                    <span className={`inline-flex px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                      invoice.status === 'paid' 
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xl shadow-zinc-950/10' 
                      : invoice.status === 'partial'
                      ? 'bg-amber-50 text-amber-700 border-amber-100 shadow-xl shadow-amber-500/5'
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
                        title="View Invoice"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate('invoice-edit', { id: invoice.id })}
                        className="p-3 text-zinc-400 hover:text-zinc-900 bg-white hover:bg-zinc-50 rounded-xl transition-all border border-zinc-200 shadow-sm"
                        title="Edit Invoice"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(invoice.id)}
                        className="p-3 text-zinc-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl transition-all border border-zinc-200 shadow-sm"
                        title="Delete Invoice"
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
                <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Delete Invoice</h3>
                <p className="text-zinc-500 text-sm leading-relaxed px-4">
                  Are you sure you want to delete invoice <span className="text-red-600 font-bold font-mono">{invoices.find(i => i.id === invoiceToDelete)?.invoice_number}</span>? This action cannot be undone.
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
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
