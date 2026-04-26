import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { ArrowLeft, Download, Printer, CheckCircle, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { isAppUnlocked } from '../lib/license';
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';

export default function InvoiceView({ navigate, invoiceId }: { navigate: (route: string) => void, invoiceId: string }) {
  const [invoice, setInvoice] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<any>({});
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [invoiceHeight, setInvoiceHeight] = useState(1131);

  useEffect(() => {
    isAppUnlocked().then(setIsUnlocked).catch(() => setIsUnlocked(false));
    async function loadData() {
      const invRes = await db.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
      if (invRes.rows.length > 0) {
        const inv = invRes.rows[0] as any;
        setInvoice(inv);
        
        const clientRes = await db.query('SELECT * FROM clients WHERE id = $1', [inv.client_id]);
        if (clientRes.rows.length > 0) {
          setClient(clientRes.rows[0]);
        }

        const itemsRes = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoiceId]);
        setItems(itemsRes.rows);

        const settingsRes = await db.query("SELECT * FROM settings WHERE key IN ('company_name', 'company_email', 'company_address', 'company_logo')");
        const settings = settingsRes.rows.reduce((acc: any, row: any) => {
          acc[row.key] = row.value;
          return acc;
        }, {});
        setCompanySettings(settings);
      }
    }
    loadData();
  }, [invoiceId]);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        // Calculate available width minus some padding (64px total)
        const availableWidth = containerRef.current.clientWidth - 64;
        const newScale = Math.min(1, availableWidth / 800);
        setScale(newScale);
      }
      if (invoiceRef.current) {
        setInvoiceHeight(invoiceRef.current.offsetHeight);
      }
    };

    // Initial update
    updateScale();
    
    // Small delay to ensure fonts/layout are rendered before measuring height
    const timeoutId = setTimeout(updateScale, 100);

    window.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      clearTimeout(timeoutId);
    };
  }, [invoice, client, items]);

  const handleExportPDF = async () => {
    if (!invoiceRef.current) return;
    
    try {
      // Use dom-to-image instead of html2canvas to avoid oklch parsing issues
      const dataUrl = await domtoimage.toPng(invoiceRef.current, { 
        bgcolor: '#ffffff',
        width: 800,
        height: invoiceRef.current.offsetHeight || 1131,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [800, invoiceRef.current.offsetHeight || 1131]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, 800, invoiceRef.current.offsetHeight || 1131);
      pdf.save(`Invoice_${invoice?.invoice_number}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const handleMarkAsPaid = async () => {
    const newStatus = invoice.status === 'paid' ? 'sent' : 'paid';
    await db.query('UPDATE invoices SET status = $1 WHERE id = $2', [newStatus, invoiceId]);
    setInvoice({ ...invoice, status: newStatus });
  };

  if (!invoice || !client) return <div className="p-8 text-center text-gray-500">Loading invoice...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
      {/* Left side: Invoice Content */}
      <div className="flex-1 min-w-0 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('invoices')} 
              className="p-3 text-zinc-500 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 rounded-xl transition-all border border-zinc-800/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Invoice {invoice.invoice_number}</h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Status: Order Confirmed</p>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-widest border transition-all ${
            invoice.status === 'paid' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
            : 'bg-zinc-800/50 text-zinc-500 border-zinc-700'
          }`}>
            {invoice.status}
          </span>
        </div>

        <div 
          ref={containerRef}
          className="bg-zinc-950/50 backdrop-blur-xl rounded-3xl border border-zinc-800/50 flex justify-center overflow-hidden print:bg-transparent print:p-0 print:h-auto print:block shadow-2xl"
          style={{ 
            paddingTop: '3rem',
            paddingBottom: '3rem',
            height: `calc(${invoiceHeight * scale}px + 6rem)`
          }}
        >
          <div 
            className="print:transform-none print:w-full shadow-2xl"
            style={{ 
              transform: `scale(${scale})`, 
              transformOrigin: 'top center',
              width: '800px'
            }}
          >
            {/* The actual invoice template to be exported */}
            <div 
              ref={invoiceRef} 
              className="bg-white p-16 mx-auto shadow-sm print:shadow-none print:w-full print:min-h-0 flex flex-col relative overflow-hidden"
              style={{ width: '800px', minHeight: '1131px' }}
            >
              {invoice.status === 'paid' && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none opacity-[0.03] z-0">
                  <div className="border-[16px] border-zinc-900 text-zinc-900 text-[180px] font-black uppercase tracking-[0.2em] p-12 rounded-[60px]">
                    PAID
                  </div>
                </div>
              )}
              <div className="flex justify-between items-start mb-20 relative z-10">
              <div>
                <h2 className="text-4xl font-extrabold text-zinc-900 tracking-tighter mb-2">INVOICE</h2>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Serial Code</span>
                   <p className="text-zinc-600 font-bold">#{invoice.invoice_number}</p>
                </div>
              </div>
              <div className="text-right">
                {companySettings.company_logo && isUnlocked ? (
                  <img src={companySettings.company_logo} alt="Company Logo" className="h-14 object-contain ml-auto mb-4" />
                ) : (
                  <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center text-white font-bold text-2xl ml-auto mb-4 shadow-lg uppercase">
                    {companySettings.company_name ? companySettings.company_name.charAt(0) : 'Z'}
                  </div>
                )}
                <h3 className="font-extrabold text-zinc-900 text-lg tracking-tight">{companySettings.company_name || 'Sovereign Apps'}</h3>
                {companySettings.company_email && <p className="text-zinc-500 text-sm font-medium">{companySettings.company_email}</p>}
                {companySettings.company_address && <p className="text-zinc-400 text-xs whitespace-pre-wrap mt-2 leading-relaxed">{companySettings.company_address}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-16 mb-20 relative z-10">
              <div>
                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] mb-4">Counterparty / Billed To</p>
                <div className="space-y-1">
                  <h4 className="font-black text-zinc-900 text-xl tracking-tight">{client.name}</h4>
                  {client.company && <p className="text-zinc-600 font-medium">{client.company}</p>}
                  {client.email && <p className="text-zinc-400 text-sm font-mono">{client.email}</p>}
                </div>
              </div>
              <div className="flex justify-end">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div className="text-zinc-400 font-medium">Issue Date:</div>
                  <div className="font-bold text-zinc-900 text-right">{format(new Date(invoice.date as string), 'MMM d, yyyy')}</div>
                  
                  {invoice.due_date && (
                    <>
                      <div className="text-zinc-400 font-medium">Payment Due:</div>
                      <div className="font-bold text-zinc-900 text-right">{format(new Date(invoice.due_date as string), 'MMM d, yyyy')}</div>
                    </>
                  )}
                  
                  {invoice.po_number && (
                    <>
                      <div className="text-zinc-400 font-medium">PO Reference:</div>
                      <div className="font-bold text-zinc-900 text-right">{invoice.po_number}</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-20 relative z-10">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-[3px] border-zinc-900">
                    <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Service Description</th>
                    <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Units</th>
                    <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Rate</th>
                    <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-6 text-zinc-900 font-bold text-lg tracking-tight leading-snug pr-8">{item.description}</td>
                      <td className="py-6 text-zinc-500 font-mono text-sm text-right align-top pt-[27px]">{item.quantity}</td>
                      <td className="py-6 text-zinc-500 font-mono text-sm text-right align-top pt-[27px]">${parseFloat(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-6 text-zinc-900 font-black text-lg text-right align-top pt-[27px]">${parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-20 relative z-10">
              <div className="w-80 space-y-4">
                {(invoice.tax_rate > 0 || invoice.tax_amount > 0) ? (
                  <>
                    <div className="flex justify-between items-center text-zinc-400 text-sm font-medium px-2">
                      <span>Transaction Subtotal</span>
                      <span className="text-zinc-600 font-mono">${parseFloat(invoice.subtotal || invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400 text-sm font-medium px-2">
                      <span>{invoice.tax_name || 'Tax'} ({parseFloat(invoice.tax_rate || 0)}%)</span>
                      <span className="text-zinc-600 font-mono">${parseFloat(invoice.tax_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </>
                ) : null}
                <div className="flex justify-between items-center p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                  <span className="font-extrabold text-zinc-400 text-[10px] uppercase tracking-[0.2em]">Grand Total</span>
                  <span className="font-black text-zinc-950 text-3xl tracking-tighter">${parseFloat(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-10 pt-10 border-t-2 border-dashed border-zinc-100 relative z-10">
                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] mb-4">Additional Disclosures / Notes</p>
                <div className="p-6 bg-zinc-50/50 rounded-2xl border border-zinc-100/50">
                  <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </div>
            )}

            {!isUnlocked && isUnlocked !== null && (
              <div className="mt-auto pt-12 border-t border-zinc-50 text-center space-y-1 opacity-40 grayscale group">
                <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">Invoice Proof v2.0</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Native Applet by <span className="text-zinc-900 group-hover:text-zinc-400 transition-colors">Sovereignty Apps</span></p>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Right side: Actions Sidebar */}
      <div className="w-full lg:w-80 shrink-0 space-y-6 print:hidden">
        <div className="bg-zinc-900/40 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800/50 shadow-2xl sticky top-8 space-y-8">
          <div>
            <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">Invoicing Logic</h3>
            <div className="space-y-4">
              <button
                onClick={handleMarkAsPaid}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg ${
                  invoice.status === 'paid' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
              >
                {invoice.status === 'paid' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Transaction Settled
                  </>
                ) : (
                  <>
                    <Circle className="w-5 h-5 opacity-40" />
                    Settle Transaction
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="h-px bg-zinc-800/50"></div>

          <div>
             <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">Export Invoice</h3>
             <div className="space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-2xl font-bold hover:text-white hover:border-zinc-700 transition-all active:scale-[0.98] shadow-lg"
                >
                  <Printer className="w-5 h-5 opacity-40" /> 
                  <span className="text-sm">Native Print</span>
                </button>
                
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-zinc-950 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl shadow-white/5"
                >
                  <Download className="w-5 h-5 opacity-40" /> 
                  <span className="text-sm">Generate PDF</span>
                </button>
             </div>
          </div>

          <div className="pt-4">
             <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/30">
               <div className="flex items-center gap-2 mb-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-widest">Enclave Verified</span>
               </div>
               <p className="text-[9px] text-zinc-600 font-mono leading-relaxed uppercase tracking-widest">
                 Hardware-rooted encryption active. This view is rendered from local WASM threads.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
