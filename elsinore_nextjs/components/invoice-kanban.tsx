"use client"

import { useEffect, useState } from "react"
// import { AddPaymentForm } from "@/components/add-payment-form"
import { addDays, parseISO, format } from 'date-fns'
// import { Button } from "@/components/ui/button"
import type { Invoice, Org, Payment } from '@/lib/types'

type InvoiceWithPayments = Invoice & { payments: Payment[]; repayments: Payment[] };

export function InvoiceKanban({
  invoices,
  currencySymbolMap,
  partyLabel = 'Client',
  partyOrgMap,
  partyField = 'client',
  showRepaidColumn = false,
  canApprove = false,
  canPay = false,
}: {
  invoices: InvoiceWithPayments[],
  currencySymbolMap: Record<string, string>,
  partyLabel?: string,
  partyOrgMap: Record<string, Org>,
  partyField?: string,
  showRepaidColumn?: boolean,
  canApprove?: boolean,
  canPay?: boolean,
}) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatDate = (dateStr: string | null | undefined) => {
    if (!isClient || !dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return ''
    }
  }

  const formattedInvoices = invoices.map((inv: Invoice) => {
    const maturity = Number(inv.invoice_type?.maturity ?? inv.maturity ?? 0)
    const issueDateString = typeof inv.issue_date === 'string' ? inv.issue_date : '';
    const dueDate = issueDateString ? format(addDays(parseISO(issueDateString), maturity), 'yyyy-MM-dd') : '';
    const dueDateStr = typeof dueDate === 'string' ? dueDate : '';
    return {
      ...inv,
      issue_date_display: formatDate(inv.issue_date),
      due_date_display: formatDate(dueDateStr),
      approved_at_display: formatDate(inv.approved_at),
      paid_out_at_display: formatDate(inv.paid_out_at),
    }
  })

  const pending = formattedInvoices.filter(inv => !inv.approved_at && !inv.rejected_at)
  const approved = formattedInvoices.filter(inv => inv.approved_at && !inv.rejected_at)
  const paid = formattedInvoices.filter(inv =>
    !inv.rejected_at &&
    inv.payment_sum &&
    inv.payment_sum >= (inv.amount * (1 - (inv.cash_discount || 0)))
  )
  const rejected = formattedInvoices.filter(inv => inv.rejected_at)
  const repaid = showRepaidColumn ? formattedInvoices.filter(inv =>
    typeof inv.repayment_sum === 'number' &&
    inv.repayment_sum >= (Number(inv.amount ?? 0) * (1 - Number(inv.invoice_type?.for_financier ?? 0))) &&
    !inv.rejected_at
  ) : []

  const columns = [
    { key: 'to_approve', title: 'To Be Approved', invoices: pending },
    { key: 'approved', title: 'Approved', invoices: approved },
    { key: 'paid', title: 'Paid', invoices: paid },
    ...(showRepaidColumn ? [{ key: 'repaid', title: 'Repaid', invoices: repaid }] : []),
    { key: 'rejected', title: 'Rejected', invoices: rejected },
  ]

  return (
    <div className="flex gap-6 overflow-x-auto">
      {columns.map(col => (
        <div key={String(col.key)} className="flex-1 min-w-[320px]">
          <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200 text-center">{col.title}</h3>
          <div className="flex flex-col gap-4">
            {col.invoices && col.invoices.length > 0 ? (
              col.invoices.map(inv => {
                let partyValue = '';
                if (partyField && partyOrgMap) {
                  const key = String((typeof partyField === 'string' && partyField in inv ? (inv as Record<string, unknown>)[partyField] : undefined));
                  partyValue = partyOrgMap[key]?.name || key || '';
                }
                return (
                  <div key={String(inv.id)} className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow border border-zinc-200 dark:border-zinc-700 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-black dark:text-white">{inv.invoice_number ?? inv.id}</span>
                      <span className="text-xs text-gray-500">{col.title}</span>
                    </div>
                    <div className="text-sm text-zinc-800 dark:text-zinc-200">
                      Amount: {currencySymbolMap[inv.currency] || inv.currency} {typeof inv.amount === 'number' ? inv.amount.toFixed(2) : '0.00'}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-300">
                      Issue: {inv.issue_date_display || inv.issue_date || ''}<br />
                      Due: {inv.due_date_display || inv.due_date || ''}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-300">{partyLabel}: {partyValue}</div>
                    {typeof inv.payment_sum === 'number' && (
                      <div className="text-xs text-blue-600 dark:text-blue-300">Paid: {currencySymbolMap[inv.currency] || inv.currency} {inv.payment_sum.toFixed(2)}</div>
                    )}
                    {showRepaidColumn && typeof inv.repayment_sum === 'number' && (
                      <div className="text-xs text-green-600 dark:text-green-300">Repaid: {currencySymbolMap[inv.currency] || inv.currency} {inv.repayment_sum.toFixed(2)}</div>
                    )}
                    {inv.rejection_reason && (
                      <div className="text-xs text-red-600 dark:text-red-300">Reason: {inv.rejection_reason}</div>
                    )}
                    {canApprove && col.key === 'to_approve' && (
                      <button className="mt-2 px-3 py-1 rounded bg-green-600 text-white text-xs font-semibold">Approve</button>
                    )}
                    {canPay && col.key === 'approved' && (
                      <button className="mt-2 px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold">Pay</button>
                    )}
                  </div>
                )
              })
            ) : (
              <div>No invoices in this column.</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// function InvoicePDFModal({ pdfPath }: { pdfPath: string }) {
//   const [open, setOpen] = useState(false);
//   const [pdfUrl, setPdfUrl] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleOpen = async () => {
//     setLoading(true);
//     setError(null);
//     setOpen(true);
//     const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
//     const { data, error } = await supabase.storage.from('invoices').download(pdfPath);
//     setLoading(false);
//     if (error || !data) {
//       setError('PDF not available');
//       setPdfUrl(null);
//     } else {
//       const url = URL.createObjectURL(data);
//       setPdfUrl(url);
//     }
//   };

//   const handleClose = () => {
//     setOpen(false);
//     if (pdfUrl) {
//       URL.revokeObjectURL(pdfUrl);
//       setPdfUrl(null);
//     }
//   };

//   return (
//     <>
//       <button
//         className="text-blue-600 dark:text-blue-300 underline text-xs mb-2"
//         onClick={handleOpen}
//         disabled={loading}
//         type="button"
//       >
//         {loading ? 'Loading PDF...' : 'View PDF'}
//       </button>
//       {open && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
//           <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 max-w-2xl w-full relative">
//             <button className="absolute top-2 right-2 text-lg" onClick={handleClose}>×</button>
//             {error && <div className="text-red-500">{error}</div>}
//             {pdfUrl && (
//               <iframe
//                 src={pdfUrl}
//                 title="Invoice PDF"
//                 className="w-full h-[70vh] border rounded"
//               />
//             )}
//             {loading && <div>Loading PDF...</div>}
//           </div>
//         </div>
//       )}
//     </>
//   );
// } 