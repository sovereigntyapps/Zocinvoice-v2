import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit2, Trash2, AlertTriangle, Users, Search, ArrowRight, UserPlus, Mail, Phone, MapPin, Building2, Globe } from 'lucide-react';

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
    <div className="space-y-12 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Clients</h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] mt-2">Verified Identity Registry</p>
        </div>
        <button
          onClick={() => {
            setFormData({ id: '', name: '', email: '', company: '' });
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center gap-3 px-10 py-4 bg-zinc-950 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-800 active:scale-95 transition-all shadow-2xl shadow-zinc-900/20"
        >
          <Plus className="w-5 h-5" /> Register Identity
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-2xl shadow-zinc-200/50 space-y-8 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 text-zinc-50 pointer-events-none">
            <Plus size={100} className="rotate-45" />
          </div>
          <div className="flex justify-between items-center border-b border-zinc-100 pb-6 relative z-10">
             <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase leading-none">{formData.id ? 'Modify Identity' : 'New Registration'}</h2>
             <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Enclave Buffer</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Legal Name / Pseudonym</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                  placeholder="e.g. Satoshi Nakamoto"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Communication Endpoint</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                  placeholder="email@protocol.com"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Associated Entity / DAO</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                  placeholder="The Genesis Block Ltd."
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-10 py-4 bg-white border border-zinc-200 text-zinc-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-zinc-900 hover:border-zinc-900 transition-all shadow-sm"
              >
                Abort
              </button>
              <button
                type="submit"
                className="px-12 py-4 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-2xl shadow-zinc-900/20"
              >
                Commit Identity
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-6">
        {clients.length === 0 ? (
          <div className="bg-white border border-zinc-200 p-16 text-center text-zinc-400 rounded-[32px] shadow-xl shadow-zinc-100 italic">
            Zero counterparties detected in local node.
          </div>
        ) : (
          clients.map(client => (
            <div key={client.id} className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-xl shadow-zinc-200/40 space-y-6 group active:scale-[0.98] transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Protocol Identity</div>
                  <div className="font-black text-zinc-900 tracking-tight text-2xl leading-none">{client.name}</div>
                  {client.company && <div className="text-xs text-zinc-500 font-bold uppercase tracking-tight mt-1">{client.company}</div>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleEdit(client)} className="p-4 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-all border border-zinc-200 shadow-sm">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => confirmDelete(client.id)} className="p-4 text-zinc-400 hover:text-red-900 bg-zinc-50 hover:bg-red-50 rounded-2xl transition-all border border-zinc-200 shadow-sm">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {client.email && (
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-50 p-3 rounded-xl truncate border border-zinc-100">
                  {client.email}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-[40px] border border-zinc-200 shadow-2xl shadow-zinc-200/40 overflow-hidden group">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50">
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Validated Name</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Organization Detail</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Contact Vector</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Ops</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-32 text-center text-zinc-400 flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-zinc-50 rounded-full border border-zinc-100 flex items-center justify-center animate-pulse">
                     <Users className="w-10 h-10 opacity-20" />
                  </div>
                  <span className="font-black text-[10px] tracking-[0.3em] uppercase">Null Identity Enclave</span>
                </td>
              </tr>
            ) : (
              clients.map(client => (
                <tr key={client.id} className="hover:bg-zinc-50/50 transition-colors group/row">
                  <td className="px-8 py-7">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-black text-[10px] uppercase shadow-lg shadow-zinc-900/10">
                           {client.name.charAt(0)}
                        </div>
                        <span className="font-black text-zinc-900 uppercase tracking-tight">{client.name}</span>
                     </div>
                  </td>
                  <td className="px-8 py-7 text-zinc-600 font-bold uppercase tracking-tight text-xs">{client.company || 'Private Entity'}</td>
                  <td className="px-8 py-7">
                    <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest">{client.email || 'Air-gapped'}</span>
                  </td>
                  <td className="px-8 py-7 text-right">
                    <div className="flex justify-end gap-2 translate-x-4 opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-500">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-3 text-zinc-400 hover:text-zinc-900 bg-white hover:bg-zinc-50 rounded-xl transition-all border border-zinc-200 shadow-sm"
                        title="Edit Identity"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(client.id)}
                        className="p-3 text-zinc-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl transition-all border border-zinc-200 shadow-sm"
                        title="Purge Identity"
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
                <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Purge Identity</h3>
                <p className="text-zinc-500 text-sm leading-relaxed px-4 underline decoration-red-100 underline-offset-8">
                  Warning: Purging this identity will also delete all associated ledger entries. This action is terminal.
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
                  setClientToDelete(null);
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
