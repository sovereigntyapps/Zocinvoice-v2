import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';

export default function Clients({ navigate }: { navigate: (route: string) => void }) {
  const [clients, setClients] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', email: '', company: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const loadClients = async () => {
    const res = await db.query('SELECT * FROM clients ORDER BY created_at DESC');
    setClients(res.rows);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      await db.query(
        'UPDATE clients SET name = $1, email = $2, company = $3 WHERE id = $4',
        [formData.name, formData.email, formData.company, formData.id]
      );
    } else {
      await db.query(
        'INSERT INTO clients (id, name, email, company) VALUES ($1, $2, $3, $4)',
        [uuidv4(), formData.name, formData.email, formData.company]
      );
    }
    setIsFormOpen(false);
    setFormData({ id: '', name: '', email: '', company: '' });
    loadClients();
  };

  const handleEdit = (client: any) => {
    setFormData(client);
    setIsFormOpen(true);
  };

  const confirmDelete = (id: string) => {
    setClientToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (clientToDelete) {
      try {
        // Delete associated invoices first to avoid foreign key constraint violation
        await db.query('DELETE FROM invoices WHERE client_id = $1', [clientToDelete]);
        await db.query('DELETE FROM clients WHERE id = $1', [clientToDelete]);
        setDeleteModalOpen(false);
        setClientToDelete(null);
        loadClients();
      } catch (error) {
        console.error('Failed to delete client:', error);
        alert('Failed to delete client. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase">Clients</h1>
          <p className="text-zinc-500 text-sm font-mono tracking-widest mt-1">Counterparty Directory</p>
        </div>
        <button
          onClick={() => {
            setFormData({ id: '', name: '', email: '', company: '' });
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-950 rounded-xl font-bold hover:bg-zinc-200 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <Plus className="w-5 h-5" /> Register Client
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-zinc-900/40 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800 shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
             <h2 className="text-xl font-bold text-white tracking-tight">{formData.id ? 'Modify Identity' : 'New Identity Registration'}</h2>
             <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Client Enclave</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-all"
                  placeholder="e.g. Satoshi Nakamoto"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-all"
                  placeholder="email@protocol.com"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">Company / Organization</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-all"
                  placeholder="The Genesis Block Ltd."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-2.5 text-zinc-500 hover:text-white font-medium transition-colors"
              >
                Abort
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 bg-zinc-100 text-zinc-950 rounded-xl font-bold hover:bg-white transition-all shadow-lg active:scale-95"
              >
                Commit Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-4">
        {clients.length === 0 ? (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-12 text-center text-zinc-500 rounded-3xl">
            No clients registered in current node.
          </div>
        ) : (
          clients.map(client => (
            <div key={client.id} className="bg-zinc-900/40 backdrop-blur-xl p-5 rounded-2xl border border-zinc-800 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Protocol Name</div>
                  <div className="font-bold text-white tracking-tight">{client.name}</div>
                  {client.company && <div className="text-xs text-zinc-400 font-medium">{client.company}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(client)} className="p-2.5 text-zinc-400 hover:text-white bg-zinc-800/40 rounded-xl transition-all border border-transparent hover:border-zinc-700">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => confirmDelete(client.id)} className="p-2.5 text-zinc-400 hover:text-red-400 bg-zinc-800/40 rounded-xl transition-all border border-transparent hover:border-red-900/30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {client.email && (
                <div className="text-xs text-zinc-500 font-mono bg-zinc-950/30 p-2 rounded-lg truncate border border-zinc-800/50">
                  {client.email}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden group">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/20">
              <th className="px-6 py-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Counterparty Name</th>
              <th className="px-6 py-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Organization</th>
              <th className="px-6 py-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Communication Channel</th>
              <th className="px-6 py-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-24 text-center text-zinc-500 flex flex-col items-center gap-4">
                  <Users className="w-8 h-8 opacity-20" />
                  <span className="font-mono text-xs uppercase tracking-widest">Empty Identity Registry</span>
                </td>
              </tr>
            ) : (
              clients.map(client => (
                <tr key={client.id} className="hover:bg-zinc-800/20 transition-colors group/row">
                  <td className="px-6 py-5">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white font-mono text-xs">
                           {client.name.charAt(0)}
                        </div>
                        <span className="font-bold text-white tracking-tight">{client.name}</span>
                     </div>
                  </td>
                  <td className="px-6 py-5 text-zinc-300 font-medium">{client.company || 'Private Entity'}</td>
                  <td className="px-6 py-5">
                    <span className="text-zinc-500 font-mono text-xs underline decoration-zinc-800 underline-offset-4">{client.email || 'Air-gapped'}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1.5 translate-x-2 opacity-40 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-300">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all border border-transparent hover:border-zinc-700"
                        title="Edit Identity"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(client.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all border border-transparent hover:border-red-900/30"
                        title="Purge Identity"
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
                <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Purge Identity</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Warning: Purging this identity will also delete all associated transactions from the ledger. This action is terminal and irreversible.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-500 transition-all shadow-xl shadow-red-900/20 active:scale-[0.98]"
              >
                Delete Client & Records
              </button>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setClientToDelete(null);
                }}
                className="w-full py-3 text-zinc-500 hover:text-white font-medium transition-colors"
              >
                Cancel Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
