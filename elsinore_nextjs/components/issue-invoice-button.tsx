"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { IssueInvoiceForm } from "@/components/issue-invoice-form"
import { Plus } from "lucide-react"

export function IssueInvoiceButton({ supplierId, clients, currencies, allowedInvoiceTypes }: {
  supplierId: string,
  clients: { id: string, name: string }[],
  currencies: { id: string, identifier: string }[],
  allowedInvoiceTypes: { id: string, name: string, cash_discount: number, maturity: number }[],
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full max-w-xs font-bold text-base py-3"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Issue Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Issue New Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice for your client. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <IssueInvoiceForm
            supplierId={supplierId}
            clients={clients}
            currencies={currencies}
            allowedInvoiceTypes={allowedInvoiceTypes}
            onSuccess={() => {
              setOpen(false)
              window.location.reload()
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 