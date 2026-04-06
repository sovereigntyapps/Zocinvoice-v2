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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => {
            setFormData({ id: '', name: '', email: '', company: '' });
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-4">{formData.id ? 'Edit Client' : 'New Client'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Save Client
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-4">
        {clients.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-xl border border-gray-200">
            No clients found. Add one to get started.
          </div>
        ) : (
          clients.map(client => (
            <div key={client.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900">{client.name}</div>
                  {client.company && <div className="text-sm text-gray-600">{client.company}</div>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(client)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => confirmDelete(client.id)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {client.email && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="truncate">{client.email}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No clients found. Add one to get started.
                </td>
              </tr>
            ) : (
              clients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                  <td className="px-6 py-4">{client.company || '-'}</td>
                  <td className="px-6 py-4">{client.email || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(client.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
                <h3 className="text-lg font-bold text-gray-900">Delete Client</h3>
                <p className="text-gray-500 text-sm mt-1">Are you sure you want to delete this client? This will also delete all invoices associated with this client. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setClientToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
