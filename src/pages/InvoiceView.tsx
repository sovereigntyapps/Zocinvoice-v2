import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';

export default function InvoiceView({ navigate, invoiceId }: { navigate: (route: string) => void, invoiceId: string }) {
  const [invoice, setInvoice] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<any>({});
  const invoiceRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [invoiceHeight, setInvoiceHeight] = useState(1131);

  useEffect(() => {
    async function loadData() {
      const invRes = await db.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
      if (invRes.rows.length > 0) {
        const inv = invRes.rows[0];
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

  if (!invoice || !client) return <div className="p-8 text-center text-gray-500">Loading invoice...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('invoices')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoice_number}</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="bg-gray-100 rounded-xl flex justify-center overflow-hidden print:bg-transparent print:p-0 print:h-auto print:block"
        style={{ 
          paddingTop: '2rem',
          paddingBottom: '2rem',
          height: `calc(${invoiceHeight * scale}px + 4rem)`
        }}
      >
        <div 
          className="print:transform-none print:w-full"
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top center',
            width: '800px'
          }}
        >
          {/* The actual invoice template to be exported */}
          <div 
            ref={invoiceRef} 
            className="bg-white p-12 mx-auto shadow-sm print:shadow-none print:w-full print:min-h-0 flex flex-col"
            style={{ width: '800px', minHeight: '1131px' }}
          >
            <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">INVOICE</h2>
              <p className="text-gray-500 mt-1">#{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              {companySettings.company_logo ? (
                <img src={companySettings.company_logo} alt="Company Logo" className="h-12 object-contain ml-auto mb-2" />
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl ml-auto mb-2">
                  {companySettings.company_name ? companySettings.company_name.charAt(0).toUpperCase() : 'Z'}
                </div>
              )}
              <h3 className="font-bold text-gray-900">{companySettings.company_name || 'ZOC Solutions'}</h3>
              {companySettings.company_email && <p className="text-gray-500 text-sm">{companySettings.company_email}</p>}
              {companySettings.company_address && <p className="text-gray-500 text-sm whitespace-pre-wrap mt-1">{companySettings.company_address}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
              <h4 className="font-bold text-gray-900 text-lg">{client.name}</h4>
              {client.company && <p className="text-gray-700">{client.company}</p>}
              {client.email && <p className="text-gray-500">{client.email}</p>}
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-gray-500">Date Issued:</div>
                <div className="font-medium text-gray-900">{format(new Date(invoice.date as string), 'MMM d, yyyy')}</div>
                
                {invoice.due_date && (
                  <>
                    <div className="text-gray-500">Due Date:</div>
                    <div className="font-medium text-gray-900">{format(new Date(invoice.due_date as string), 'MMM d, yyyy')}</div>
                  </>
                )}
                
                {invoice.po_number && (
                  <>
                    <div className="text-gray-500">PO Number:</div>
                    <div className="font-medium text-gray-900">{invoice.po_number}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          <table className="w-full text-left mb-12">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-3 font-bold text-gray-900">Description</th>
                <th className="py-3 font-bold text-gray-900 text-right">Qty</th>
                <th className="py-3 font-bold text-gray-900 text-right">Price</th>
                <th className="py-3 font-bold text-gray-900 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 text-gray-900">{item.description}</td>
                  <td className="py-4 text-gray-700 text-right">{item.quantity}</td>
                  <td className="py-4 text-gray-700 text-right">${parseFloat(item.unit_price).toFixed(2)}</td>
                  <td className="py-4 text-gray-900 font-medium text-right">${parseFloat(item.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-12">
            <div className="w-64 space-y-3">
              {(invoice.tax_rate > 0 || invoice.tax_amount > 0) ? (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${parseFloat(invoice.subtotal || invoice.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{invoice.tax_name || 'Tax'} ({parseFloat(invoice.tax_rate || 0)}%)</span>
                    <span>${parseFloat(invoice.tax_amount || 0).toFixed(2)}</span>
                  </div>
                </>
              ) : null}
              <div className="flex justify-between py-3 border-t-2 border-gray-900">
                <span className="font-bold text-gray-900 text-lg">Total</span>
                <span className="font-bold text-blue-600 text-xl">${parseFloat(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="border-t border-gray-200 pt-8 mb-8">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          <div className="mt-auto pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
            Free Invoice Generator by <span className="font-semibold text-gray-500">Sovereignty Apps</span>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
