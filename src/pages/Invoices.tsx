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
    <div className="space-y-6">
      {!isUnlocked && invoices.length >= 3 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div>
             <h3 className="text-amber-600 font-bold mb-1 flex items-center gap-2">
                <Crown className="w-5 h-5" /> Trial Limit Reached
             </h3>
             <p className="text-amber-700/80 text-sm">You have reached the maximum of 3 invoices permitted on the free preview. Upgrade to unlock unlimited native hardware invoicing.</p>
           </div>
           <button 
              onClick={() => navigate('upgrade')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-colors shrink-0"
           >
              Upgrade Now
           </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-4">
        {invoices.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-xl border border-gray-200">
            No invoices found. Create one to get started.
          </div>
        ) : (
          invoices.map(invoice => (
            <div key={invoice.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900">{invoice.invoice_number}</div>
                  <div className="text-sm text-gray-600">{invoice.client_name || 'Unknown Client'}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                  {invoice.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-500">{format(new Date(invoice.date as string), 'MMM d, yyyy')}</div>
                <div className="font-bold text-gray-900">${parseFloat(invoice.total as string).toFixed(2)}</div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                <button onClick={() => navigate('invoice-view', { id: invoice.id })} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => navigate('invoice-edit', { id: invoice.id })} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => confirmDelete(invoice.id)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Invoice #</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No invoices found. Create one to get started.
                </td>
              </tr>
            ) : (
              invoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{invoice.invoice_number}</td>
                  <td className="px-6 py-4">{invoice.client_name || 'Unknown Client'}</td>
                  <td className="px-6 py-4">{format(new Date(invoice.date as string), 'MMM d, yyyy')}</td>
                  <td className="px-6 py-4 font-medium">${parseFloat(invoice.total as string).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate('invoice-view', { id: invoice.id })}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View & Export"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate('invoice-edit', { id: invoice.id })}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(invoice.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Invoice</h3>
                <p className="text-gray-500 text-sm mt-1">Are you sure you want to delete this invoice? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setInvoiceToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
