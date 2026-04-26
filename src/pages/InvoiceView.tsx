import React, { useState, useEffect, useRef } from "react";
import { db } from "../db";
import {
  ArrowLeft,
  Download,
  Printer,
  CheckCircle,
  Circle,
  Share2,
  Copy,
} from "lucide-react";
import { format } from "date-fns";
import { isAppUnlocked } from "../lib/license";
import { useReactToPrint } from "react-to-print";
import domtoimage from "dom-to-image";
import jsPDF from "jspdf";
import { v4 as uuidv4 } from "uuid";

export default function InvoiceView({
  navigate,
  invoiceId,
}: {
  navigate: (route: string, params?: any) => void;
  invoiceId: string;
}) {
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
    isAppUnlocked()
      .then(setIsUnlocked)
      .catch(() => setIsUnlocked(false));
    async function loadData() {
      const invRes = await db.query("SELECT * FROM invoices WHERE id = $1", [
        invoiceId,
      ]);
      if (invRes.rows.length > 0) {
        const inv = invRes.rows[0] as any;
        setInvoice(inv);

        const clientRes = await db.query(
          "SELECT * FROM clients WHERE id = $1",
          [inv.client_id],
        );
        if (clientRes.rows.length > 0) {
          setClient(clientRes.rows[0]);
        }

        const itemsRes = await db.query(
          "SELECT * FROM invoice_items WHERE invoice_id = $1",
          [invoiceId],
        );
        setItems(itemsRes.rows);

        const settingsRes = await db.query(
          "SELECT * FROM settings WHERE key IN ('company_name', 'company_email', 'company_address', 'company_logo')",
        );
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

    window.addEventListener("resize", updateScale);
    return () => {
      window.removeEventListener("resize", updateScale);
      clearTimeout(timeoutId);
    };
  }, [invoice, client, items]);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice_${invoice?.invoice_number}`,
    pageStyle: `
      @page { size: auto; margin: 0mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  const handleExportPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const node = invoiceRef.current;
      const pdfScale = 2; // High-resolution scale for PDF

      const dataUrl = await domtoimage.toPng(node, {
        bgcolor: "#ffffff",
        width: node.clientWidth * pdfScale,
        height: node.clientHeight * pdfScale,
        style: {
          transform: `scale(${pdfScale})`,
          transformOrigin: "top left",
          width: `${node.clientWidth}px`,
          height: `${node.clientHeight}px`,
        },
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [node.clientWidth, node.clientHeight],
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, node.clientWidth, node.clientHeight);
      pdf.save(`Invoice_${invoice?.invoice_number}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF");
    }
  };

  const handleMarkAsPaid = async () => {
    const isPaid = invoice.status === "paid";
    const newStatus = isPaid ? "unpaid" : "paid";
    const newPaidAmount = isPaid ? 0 : parseFloat(invoice.total);

    await db.query(
      "UPDATE invoices SET status = $1, paid_amount = $2 WHERE id = $3",
      [newStatus, newPaidAmount, invoiceId],
    );
    setInvoice({ ...invoice, status: newStatus, paid_amount: newPaidAmount });
  };

  const handleDuplicate = async () => {
    const invRes = await db.query('SELECT COUNT(*) as count FROM invoices');
    if (invRes.rows[0].count >= 5 && !isUnlocked) {
      if (confirm('You have reached the limit of 5 invoices on the free plan. Upgrade to Pro?')) {
        navigate('upgrade');
      }
      return;
    }

    const newId = uuidv4();
    const newInvoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}-COPY`;
    
    await db.query(
      `INSERT INTO invoices (id, client_id, invoice_number, date, due_date, status, subtotal, tax_name, tax_rate, tax_amount, total, notes, po_number, paid_amount) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [newId, invoice.client_id, newInvoiceNumber, invoice.date, invoice.due_date, 'unpaid', invoice.subtotal, invoice.tax_name, invoice.tax_rate, invoice.tax_amount, invoice.total, invoice.notes, invoice.po_number, 0]
    );

    for (const item of items) {
      await db.query(
        'INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount) VALUES ($1, $2, $3, $4, $5, $6)',
        [uuidv4(), newId, item.description, item.quantity, item.unit_price, item.amount]
      );
    }
    
    navigate('invoice-edit', { id: newId });
  };

  const handleShare = async () => {
    const subject = encodeURIComponent(`Invoice ${invoice.invoice_number} from ${companySettings.company_name || 'Sovereign Apps'}`);
    const body = encodeURIComponent(
      `Hi ${client.name},\n\nPlease find the details for invoice ${invoice.invoice_number} attached. The total amount is $${parseFloat(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}.\n\nThank you for your business.`
    );
    window.location.href = `mailto:${client.email || ''}?subject=${subject}&body=${body}`;
  };

  if (!invoice || !client)
    return (
      <div className="p-8 text-center text-gray-500">Loading invoice...</div>
    );

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
      {/* Left side: Invoice Content */}
      <div className="flex-1 min-w-0 space-y-6 print:m-0 print:p-0 print:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("invoices")}
              className="p-3 text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-100 rounded-xl transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
                Invoice {invoice.invoice_number}
              </h1>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-1.5 italic">
                Sovereign Node v1.0
              </p>
            </div>
          </div>
          <span
            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
              invoice.status === "paid"
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : invoice.status === "partial"
                  ? "bg-amber-50 text-amber-600 border-amber-100"
                  : "bg-zinc-50 text-zinc-400 border-zinc-200"
            }`}
          >
            {invoice.status}
          </span>
        </div>

        <div
          ref={containerRef}
          className="bg-zinc-100/30 rounded-[48px] border border-zinc-200/50 flex justify-center overflow-hidden print:bg-transparent print:border-none print:shadow-none print:rounded-none"
          style={{
            paddingTop: "3rem",
            paddingBottom: "3rem",
            height: `calc(${invoiceHeight * scale}px + 6rem)`,
          }}
        >
          <div
            className="shadow-2xl print:shadow-none print:w-full print:scale-100"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              width: "800px",
            }}
          >
            {/* The actual invoice template to be exported */}
            <div
              ref={invoiceRef}
              className="bg-white p-10 sm:p-16 mx-auto flex flex-col relative overflow-hidden w-[800px] min-h-[1131px] print:w-full print:min-h-0 print:p-12 print:shadow-none origin-top-left"
            >
              {invoice.status === "paid" && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none opacity-[0.03] z-0">
                  <div className="border-[16px] border-zinc-900 text-zinc-900 text-[180px] font-black uppercase tracking-[0.2em] p-12 rounded-[60px]">
                    PAID
                  </div>
                </div>
              )}
              <div className="flex justify-between items-start mb-20 relative z-10">
                <div>
                  <h2 className="text-4xl font-extrabold text-zinc-900 tracking-tighter mb-2">
                    INVOICE
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Invoice Number
                    </span>
                    <p className="text-zinc-600 font-bold">
                      #{invoice.invoice_number}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {companySettings.company_logo && isUnlocked ? (
                    <img
                      src={companySettings.company_logo}
                      alt="Company Logo"
                      className="h-14 object-contain ml-auto mb-4"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center text-white font-bold text-2xl ml-auto mb-4 shadow-lg uppercase">
                      {companySettings.company_name
                        ? companySettings.company_name.charAt(0)
                        : "Z"}
                    </div>
                  )}
                  <h3 className="font-extrabold text-zinc-900 text-lg tracking-tight">
                    {companySettings.company_name || "Sovereign Apps"}
                  </h3>
                  {companySettings.company_email && (
                    <p className="text-zinc-500 text-sm font-medium">
                      {companySettings.company_email}
                    </p>
                  )}
                  {companySettings.company_address && (
                    <p className="text-zinc-400 text-xs whitespace-pre-wrap mt-2 leading-relaxed">
                      {companySettings.company_address}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-16 mb-20 relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] mb-4">
                    Bill To
                  </p>
                  <div className="space-y-1">
                    <h4 className="font-black text-zinc-900 text-xl tracking-tight">
                      {client.name}
                    </h4>
                    {client.company && (
                      <p className="text-zinc-600 font-medium">
                        {client.company}
                      </p>
                    )}
                    {client.email && (
                      <p className="text-zinc-400 text-sm font-mono">
                        {client.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div className="text-zinc-400 font-medium">Issue Date:</div>
                    <div className="font-bold text-zinc-900 text-right">
                      {format(new Date(invoice.date as string), "MMM d, yyyy")}
                    </div>

                    {invoice.due_date && (
                      <>
                        <div className="text-zinc-400 font-medium">
                          Payment Due:
                        </div>
                        <div className="font-bold text-zinc-900 text-right">
                          {format(
                            new Date(invoice.due_date as string),
                            "MMM d, yyyy",
                          )}
                        </div>
                      </>
                    )}

                    {invoice.po_number && (
                      <>
                        <div className="text-zinc-400 font-medium">
                          PO Reference:
                        </div>
                        <div className="font-bold text-zinc-900 text-right">
                          {invoice.po_number}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-20 relative z-10">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-[3px] border-zinc-900">
                      <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Description
                      </th>
                      <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">
                        Qty
                      </th>
                      <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">
                        Price
                      </th>
                      <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-6 text-zinc-900 font-bold text-lg tracking-tight leading-snug pr-8">
                          {item.description}
                        </td>
                        <td className="py-6 text-zinc-500 font-mono text-sm text-right align-top pt-[27px]">
                          {item.quantity}
                        </td>
                        <td className="py-6 text-zinc-500 font-mono text-sm text-right align-top pt-[27px]">
                          $
                          {parseFloat(item.unit_price).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                        <td className="py-6 text-zinc-900 font-black text-lg text-right align-top pt-[27px]">
                          $
                          {parseFloat(item.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-20 relative z-10">
                <div className="w-80 space-y-4">
                  {invoice.tax_rate > 0 || invoice.tax_amount > 0 ? (
                    <>
                      <div className="flex justify-between items-center text-zinc-400 text-sm font-medium px-2">
                        <span>Subtotal</span>
                        <span className="text-zinc-600 font-mono">
                          $
                          {parseFloat(
                            invoice.subtotal || invoice.total,
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-400 text-sm font-medium px-2">
                        <span>
                          {invoice.tax_name || "Tax"} (
                          {parseFloat(invoice.tax_rate || 0)}%)
                        </span>
                        <span className="text-zinc-600 font-mono">
                          $
                          {parseFloat(invoice.tax_amount || 0).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </>
                  ) : null}
                  <div className="flex justify-between items-center p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                    <span className="font-extrabold text-zinc-400 text-[10px] uppercase tracking-[0.2em]">
                      Grand Total
                    </span>
                    <span className="font-black text-zinc-950 text-3xl tracking-tighter">
                      $
                      {parseFloat(invoice.total).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {parseFloat(invoice.paid_amount) > 0 && (
                    <div className="space-y-2 px-2">
                      <div className="flex justify-between items-center text-emerald-600 text-xs font-bold uppercase tracking-wider">
                        <span>Total Paid</span>
                        <span className="font-mono">
                          -$
                          {parseFloat(invoice.paid_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-900 text-sm font-black uppercase tracking-widest pt-2 border-t border-zinc-100/50">
                        <span>Balance Due</span>
                        <span className="font-mono">
                          $
                          {(
                            parseFloat(invoice.total) -
                            parseFloat(invoice.paid_amount)
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-10 pt-10 border-t-2 border-dashed border-zinc-100 relative z-10">
                  <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] mb-4">
                    Notes & Terms
                  </p>
                  <div className="p-6 bg-zinc-50/50 rounded-2xl border border-zinc-100/50">
                    <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {invoice.notes}
                    </p>
                  </div>
                </div>
              )}

              {!isUnlocked && isUnlocked !== null && (
                <div className="mt-auto pt-12 border-t border-zinc-50 text-center space-y-1 opacity-40 grayscale group">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Sovereign Invoice
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Actions Sidebar */}
      <div className="w-full lg:w-80 shrink-0 space-y-6 print:hidden">
        <div className="bg-zinc-50 border border-zinc-200/60 p-6 rounded-[32px] shadow-sm sticky top-8 space-y-8">
          <div>
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 ml-1">
              Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleMarkAsPaid}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold transition-all active:scale-[0.98] border ${
                  invoice.status === "paid"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  {invoice.status === "paid" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-300" />
                  )}
                  <span className="text-sm">Mark as Paid</span>
                </div>
                {invoice.status === "paid" && (
                   <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Done</span>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Export options
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePrint()}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-zinc-200 text-zinc-600 rounded-2xl font-bold hover:text-zinc-900 hover:border-zinc-900 transition-all active:scale-95 group"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-100 transition-colors">
                  <Printer className="w-5 h-5 opacity-60" />
                </div>
                <span className="text-[10px] uppercase tracking-widest">Print</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95 group shadow-xl shadow-zinc-900/10"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Download className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase tracking-widest">PDF</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-zinc-200/50">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Management
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 p-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold text-xs hover:text-zinc-900 hover:bg-zinc-50 transition-all"
              >
                <div className="p-1.5 bg-zinc-100 rounded-lg">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
                Send via Email
              </button>

              <button
                onClick={handleDuplicate}
                className="w-full flex items-center gap-3 p-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold text-xs hover:text-zinc-900 hover:bg-zinc-50 transition-all"
              >
                <div className="p-1.5 bg-zinc-100 rounded-lg">
                  <Copy className="w-3.5 h-3.5" />
                </div>
                Duplicate Entry
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-100/50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.1em]">
                Local Node Persistence Active
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
