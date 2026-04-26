import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Plus, Trash2, Calendar, FileText, User, Receipt, CreditCard, Save } from 'lucide-react';

export default function InvoiceForm({ navigate, invoiceId }: { navigate: (route: string) => void, invoiceId?: string }) {
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    po_number: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'unpaid',
    notes: '',
    tax_name: 'Tax',
    tax_rate: 0,
    paid_amount: 0
  });
  const [items, setItems] = useState([{ id: uuidv4(), description: '', quantity: 1, unit_price: 0, amount: 0 }]);

  useEffect(() => {
    async function loadData() {
      const clientsRes = await db.query('SELECT * FROM clients ORDER BY name');
      setClients(clientsRes.rows);

      if (invoiceId) {
        const invRes = await db.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
        if (invRes.rows.length > 0) {
          const inv: any = invRes.rows[0];
          setFormData({
            client_id: inv.client_id as string,
            invoice_number: inv.invoice_number as string,
            po_number: inv.po_number as string || '',
            date: new Date(inv.date as string).toISOString().split('T')[0],
            due_date: inv.due_date ? new Date(inv.due_date as string).toISOString().split('T')[0] : '',
            status: inv.status as string,
            notes: inv.notes as string || '',
            tax_name: inv.tax_name as string || 'Tax',
            tax_rate: parseFloat(inv.tax_rate as string || '0'),
            paid_amount: parseFloat(inv.paid_amount as string || '0')
          });

          const itemsRes = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoiceId]);
          if (itemsRes.rows.length > 0) {
            setItems(itemsRes.rows.map((item: any) => ({
              id: item.id as string,
              description: item.description as string,
              quantity: parseFloat(item.quantity as string),
              unit_price: parseFloat(item.unit_price as string),
              amount: parseFloat(item.amount as string)
            })));
          }
        }
      } else {
        const settingsRes = await db.query('SELECT * FROM settings WHERE key IN ($1, $2)', ['tax_name', 'tax_rate']);
        const settings: any = settingsRes.rows.reduce((acc: any, row: any) => {
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
    
    // Auto-calculate status based on paid_amount
    const calculatedStatus = Number(formData.paid_amount) >= total - 0.01 ? 'paid' : (Number(formData.paid_amount) > 0 ? 'partial' : 'unpaid');

    if (invoiceId) {
      await db.query(
        'UPDATE invoices SET client_id = $1, invoice_number = $2, date = $3, due_date = $4, status = $5, subtotal = $6, tax_name = $7, tax_rate = $8, tax_amount = $9, total = $10, notes = $11, po_number = $13, paid_amount = $14 WHERE id = $12',
        [formData.client_id, formData.invoice_number, formData.date, formData.due_date, calculatedStatus, subtotal, formData.tax_name, formData.tax_rate, taxAmount, total, formData.notes, id, formData.po_number, formData.paid_amount]
      );
      await db.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
    } else {
      await db.query(
        'INSERT INTO invoices (id, client_id, invoice_number, date, due_date, status, subtotal, tax_name, tax_rate, tax_amount, total, notes, po_number, paid_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
        [id, formData.client_id, formData.invoice_number, formData.date, formData.due_date, calculatedStatus, subtotal, formData.tax_name, formData.tax_rate, taxAmount, total, formData.notes, formData.po_number, formData.paid_amount]
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
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('invoices')} 
            className="p-3 text-zinc-400 hover:text-zinc-900 bg-white hover:bg-zinc-100 rounded-2xl transition-all border border-zinc-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">
              {invoiceId ? 'Edit Invoice' : 'New Invoice'}
            </h1>
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">Invoice Details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details Card */}
        <div className="bg-white border border-zinc-200 rounded-[32px] p-8 shadow-xl shadow-zinc-200/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-zinc-50 pointer-events-none transition-transform group-hover:scale-110">
            <FileText size={100} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  <User size={12} className="text-zinc-300" /> Client
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.client_id}
                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-white">Select a client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id} className="bg-white text-zinc-900">
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <Plus size={14} className="rotate-45" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  <Receipt size={12} className="text-zinc-300" /> Invoice Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.invoice_number}
                  onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all font-mono"
                  placeholder="INV-XXXX"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  <CreditCard size={12} className="text-zinc-300" /> P.O. Number
                </label>
                <input
                  type="text"
                  value={formData.po_number}
                  onChange={e => setFormData({ ...formData, po_number: e.target.value })}
                  placeholder="Purchase Order #"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  <Calendar size={12} className="text-zinc-300" /> Invoice Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  <Calendar size={12} className="text-zinc-300" /> Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                />
              </div>

              <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl mt-4">
                <p className="text-[10px] text-zinc-400 mb-2 font-mono uppercase tracking-[0.2em]">Data Status</p>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm text-zinc-900 font-black uppercase tracking-tight">Saved Locally</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-xl shadow-zinc-200/50">
          <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
            <h2 className="text-xl font-black text-zinc-900 flex items-center gap-3 uppercase tracking-tight">
              <Receipt size={22} className="text-zinc-400" /> Invoice Items
            </h2>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="hidden md:grid grid-cols-12 gap-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pb-4 border-b border-zinc-100">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right px-4">Amount</div>
            </div>
            
            <div className="space-y-6">
              {items.map((item, index) => (
                <div key={item.id} className="flex flex-col md:grid md:grid-cols-12 gap-6 items-start md:items-center group">
                  <div className="md:col-span-6 w-full">
                    <label className="block md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Description</label>
                    <input
                      type="text"
                      placeholder="Service detail..."
                      value={item.description}
                      onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-sm text-zinc-900 font-bold focus:outline-none focus:border-zinc-900 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:contents gap-6 w-full">
                    <div className="md:col-span-2">
                      <label className="block md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Qty</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={item.quantity}
                        onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-sm text-zinc-900 font-bold focus:outline-none focus:border-zinc-900 transition-colors md:text-right font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={e => handleItemChange(item.id, 'unit_price', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-sm text-zinc-900 font-bold focus:outline-none focus:border-zinc-900 transition-colors md:text-right font-mono"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3 w-full">
                    <div className="md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total:</div>
                    <span className="font-black text-sm text-zinc-900 font-mono">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="group flex items-center gap-3 text-[10px] font-black text-zinc-950 uppercase tracking-[0.2em] transition-all hover:gap-4 py-2"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                 <Plus size={12} />
              </div> 
              Add Line Item
            </button>
          </div>

          <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="w-full md:w-auto space-y-2">
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Notes & Terms</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full md:w-96 bg-white border border-zinc-200 rounded-2xl px-5 py-4 text-sm text-zinc-600 focus:outline-none focus:border-zinc-900 transition-all shadow-inner"
                placeholder="Disclosures, terms, and conditions..."
              />
            </div>

            <div className="w-full md:w-96 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold uppercase tracking-[0.1em] text-zinc-400 text-[10px]">Subtotal</span>
                <span className="font-mono font-bold text-zinc-600">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex justify-between items-center gap-6">
                <div className="flex items-center gap-3 flex-1">
                  <input 
                    type="text" 
                    value={formData.tax_name} 
                    onChange={e => setFormData({...formData, tax_name: e.target.value})}
                    className="w-24 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-[10px] font-black text-zinc-400 focus:outline-none focus:border-zinc-900 uppercase tracking-widest"
                  />
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={formData.tax_rate} 
                      onChange={e => setFormData({...formData, tax_rate: parseFloat(e.target.value) || 0})}
                      className="w-16 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-bold focus:outline-none focus:border-zinc-900 text-right pr-5"
                    />
                    <span className="absolute right-2 text-[10px] text-zinc-300 font-bold top-1/2 -translate-y-1/2">%</span>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-zinc-600">${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="pt-6 border-t border-zinc-200 flex flex-col gap-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold uppercase tracking-[0.1em] text-zinc-400">Total Paid</span>
                  <div className="relative">
                    <span className="absolute left-3 text-zinc-400 font-mono top-1/2 -translate-y-1/2">$</span>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.paid_amount}
                      onChange={e => setFormData({...formData, paid_amount: parseFloat(e.target.value) || 0})}
                      className="w-32 bg-white border border-zinc-200 rounded-lg pl-6 pr-3 py-1.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-900 text-right font-mono"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-zinc-900 uppercase tracking-[0.2em]">Grand Total</span>
                  <span className="text-4xl font-black text-zinc-900 tracking-tighter font-sans">
                    ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8 border-t border-zinc-200">
          <button
            type="button"
            onClick={() => navigate('invoices')}
            className="px-10 py-4 bg-white border border-zinc-200 text-zinc-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-zinc-900 hover:border-zinc-900 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center justify-center gap-3 px-12 py-4 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-2xl shadow-zinc-900/20"
          >
            <Save size={16} />
            Save Invoice
          </button>
        </div>
      </form>
    </div>
  );
}

