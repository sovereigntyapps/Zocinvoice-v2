import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function InvoiceForm({ navigate, invoiceId }: { navigate: (route: string) => void, invoiceId?: string }) {
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    po_number: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    notes: '',
    tax_name: 'Tax',
    tax_rate: 0
  });
  const [items, setItems] = useState([{ id: uuidv4(), description: '', quantity: 1, unit_price: 0, amount: 0 }]);

  useEffect(() => {
    async function loadData() {
      const clientsRes = await db.query('SELECT * FROM clients ORDER BY name');
      setClients(clientsRes.rows);

      if (invoiceId) {
        const invRes = await db.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
        if (invRes.rows.length > 0) {
          const inv = invRes.rows[0];
          setFormData({
            client_id: inv.client_id as string,
            invoice_number: inv.invoice_number as string,
            po_number: inv.po_number as string || '',
            date: new Date(inv.date as string).toISOString().split('T')[0],
            due_date: inv.due_date ? new Date(inv.due_date as string).toISOString().split('T')[0] : '',
            status: inv.status as string,
            notes: inv.notes as string || '',
            tax_name: inv.tax_name as string || 'Tax',
            tax_rate: parseFloat(inv.tax_rate as string || '0')
          });

          const itemsRes = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoiceId]);
          if (itemsRes.rows.length > 0) {
            setItems(itemsRes.rows.map(item => ({
              id: item.id as string,
              description: item.description as string,
              quantity: parseFloat(item.quantity as string),
              unit_price: parseFloat(item.unit_price as string),
              amount: parseFloat(item.amount as string)
            })));
          }
        }
      } else {
        // Load default tax settings for new invoice
        const settingsRes = await db.query('SELECT * FROM settings WHERE key IN ($1, $2)', ['tax_name', 'tax_rate']);
        const settings = settingsRes.rows.reduce((acc: any, row: any) => {
          acc[row.key] = row.value;
          return acc;
        }, {});
        
        setFormData(prev => ({
          ...prev,
          tax_name: settings.tax_name || 'Tax',
          tax_rate: parseFloat(settings.tax_rate || '0')
        }));
      }
    }
    loadData();
  }, [invoiceId]);

  const handleItemChange = (id: string, field: string, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.amount = Number(updated.quantity) * Number(updated.unit_price);
        }
        return updated;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, { id: uuidv4(), description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (formData.tax_rate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      alert('Please select a client');
      return;
    }

    const id = invoiceId || uuidv4();

    if (invoiceId) {
      await db.query(
        'UPDATE invoices SET client_id = $1, invoice_number = $2, date = $3, due_date = $4, status = $5, subtotal = $6, tax_name = $7, tax_rate = $8, tax_amount = $9, total = $10, notes = $11, po_number = $13 WHERE id = $12',
        [formData.client_id, formData.invoice_number, formData.date, formData.due_date, formData.status, subtotal, formData.tax_name, formData.tax_rate, taxAmount, total, formData.notes, id, formData.po_number]
      );
      await db.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
    } else {
      await db.query(
        'INSERT INTO invoices (id, client_id, invoice_number, date, due_date, status, subtotal, tax_name, tax_rate, tax_amount, total, notes, po_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
        [id, formData.client_id, formData.invoice_number, formData.date, formData.due_date, formData.status, subtotal, formData.tax_name, formData.tax_rate, taxAmount, total, formData.notes, formData.po_number]
      );
    }

    for (const item of items) {
      if (item.description) {
        await db.query(
          'INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount) VALUES ($1, $2, $3, $4, $5, $6)',
          [uuidv4(), id, item.description, item.quantity, item.unit_price, item.amount]
        );
      }
    }

    navigate('invoices');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('invoices')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{invoiceId ? 'Edit Invoice' : 'Create Invoice'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                required
                value={formData.client_id}
                onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
              <input
                type="text"
                required
                value={formData.invoice_number}
                onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
              <input
                type="text"
                value={formData.po_number}
                onChange={e => setFormData({ ...formData, po_number: e.target.value })}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Line Items</h2>
          <div className="space-y-6 md:space-y-4">
            <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 pb-2 border-b border-gray-200">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            
            {items.map((item, index) => (
              <div key={item.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center pb-4 border-b border-gray-100 md:border-0 md:pb-0">
                <div className="md:col-span-6">
                  <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Item description"
                    value={item.description}
                    onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 md:col-span-4">
                  <div>
                    <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={item.quantity}
                      onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 md:text-right"
                    />
                  </div>
                  <div>
                    <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={e => handleItemChange(item.id, 'unit_price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 md:text-right"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2 mt-2 md:mt-0">
                  <div className="md:hidden font-medium text-gray-500">Amount:</div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900">${item.amount.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 md:bg-transparent rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center pt-4 border-t border-gray-100 gap-4">
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
            <div className="w-full md:w-64 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 items-center">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={formData.tax_name} 
                    onChange={e => setFormData({...formData, tax_name: e.target.value})}
                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.tax_rate} 
                    onChange={e => setFormData({...formData, tax_rate: parseFloat(e.target.value) || 0})}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded text-right"
                  />
                  <span>%</span>
                </div>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Terms</label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Thank you for your business!"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('invoices')}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Save Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
