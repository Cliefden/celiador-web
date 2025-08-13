"use client"

import { useEffect, useState } from "react"
import { addDays, parseISO, format } from 'date-fns'
import type { Invoice, Org } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, DollarSign } from "lucide-react"

export function InvoiceTable({ invoices, currencySymbolMap, partyColumn }: {
  invoices: Invoice[],
  currencySymbolMap: Record<string, string>,
  partyColumn: { label: string, orgMap: Record<string, Org>, field: string }
}) {
  const [formattedInvoices, setFormattedInvoices] = useState(invoices)
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => {
    setFormattedInvoices(
      invoices.map(inv => {
        const maturity = (inv.invoice_type as { maturity?: number })?.maturity ?? inv.maturity ?? 0
        const dueDate = inv.issue_date ? format(addDays(parseISO(inv.issue_date), maturity), 'yyyy-MM-dd') : ''
        return {
          ...inv,
          issue_date: inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '',
          due_date: dueDate ? new Date(dueDate).toLocaleDateString() : '',
          approved_at: inv.approved_at ? new Date(inv.approved_at).toLocaleDateString() : '',
          paid_out_at: inv.paid_out_at ? new Date(inv.paid_out_at).toLocaleDateString() : '',
          repaid_at: inv.repaid_at ? new Date(inv.repaid_at).toLocaleDateString() : '',
        }
      })
    )
  }, [invoices])

  const handleApprove = async (invoiceId: string) => {
    setApproving(invoiceId)
    try {
      const res = await fetch('/api/invoice/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId })
      })
      if (res.ok) {
        // Optimistically update the UI
        setFormattedInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, approved_at: new Date().toLocaleDateString() } : inv))
      }
    } finally {
      setApproving(null)
    }
  }

  const getStatusBadge = (invoice: {
    repaid_at?: string;
    paid_out_at?: string;
    approved_at?: string;
  }) => {
    if (invoice.repaid_at) {
      return <Badge variant="default" className="bg-green-600">Repaid</Badge>
    } else if (invoice.paid_out_at) {
      return <Badge variant="secondary">Paid Out</Badge>
    } else if (invoice.approved_at) {
      return <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>
    } else {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>{partyColumn.label}</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Repayment</TableHead>
            {partyColumn.label === 'Supplier' && <TableHead>Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {formattedInvoices.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="font-medium">{inv.invoice_number}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  {inv.amount?.toLocaleString() ?? 0}
                </div>
              </TableCell>
              <TableCell>{currencySymbolMap[inv.currency] || inv.currency}</TableCell>
              <TableCell>{String((partyColumn.orgMap[inv[partyColumn.field] as string] as { name?: string })?.name ?? inv[partyColumn.field] ?? '')}</TableCell>
              <TableCell>{inv.issue_date}</TableCell>
              <TableCell>{inv.due_date}</TableCell>
              <TableCell>{getStatusBadge(inv)}</TableCell>
              <TableCell>
                {typeof inv.payment_sum === 'number' ? (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    {inv.payment_sum.toFixed(2)}
                  </div>
                ) : (
                  <span className="text-muted-foreground">0.00</span>
                )}
              </TableCell>
              <TableCell>
                {typeof inv.repayment_sum === 'number' ? (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    {inv.repayment_sum.toFixed(2)}
                  </div>
                ) : (
                  <span className="text-muted-foreground">0.00</span>
                )}
              </TableCell>
              {partyColumn.label === 'Supplier' && (
                <TableCell>
                  {!inv.approved_at ? (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(inv.id)}
                      disabled={!!approving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {approving === inv.id ? (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </>
                      )}
                    </Button>
                  ) : (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Approved
                    </Badge>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 