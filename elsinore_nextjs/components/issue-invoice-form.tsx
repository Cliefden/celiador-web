"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addDays, parseISO, format } from 'date-fns'

export function IssueInvoiceForm({ supplierId, clients, currencies, allowedInvoiceTypes, onSuccess, onCancel }: {
  supplierId: string,
  clients: { id: string, name: string }[],
  currencies: { id: string, identifier: string }[],
  allowedInvoiceTypes: { id: string, name: string, cash_discount: number, maturity: number }[],
  onSuccess?: () => void,
  onCancel?: () => void
}) {
  // Set default dates
  const today = new Date().toISOString().split('T')[0]
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const dueDateDefault = nextMonth.toISOString().split('T')[0]

  const [form, setForm] = useState({
    amount: "",
    issue_date: today,
    due_date: dueDateDefault,
    invoice_number: "",
    client: clients[0]?.id || "",
    currency: currencies[0]?.id || "",
    invoice_type: allowedInvoiceTypes[0]?.id || ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update due_date automatically when issue_date or invoice_type changes
  useEffect(() => {
    const selectedType = allowedInvoiceTypes.find(t => t.id === form.invoice_type)
    if (selectedType && form.issue_date) {
      const newDueDate = format(addDays(parseISO(form.issue_date), selectedType.maturity || 0), 'yyyy-MM-dd')
      setForm(f => ({ ...f, due_date: newDueDate }))
    }
  }, [form.issue_date, form.invoice_type, allowedInvoiceTypes])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          supplier: supplierId
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to issue invoice")
      }
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = form.invoice_number.trim() !== '' && form.amount.trim() !== '' && parseFloat(form.amount) > 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoice_number">Invoice Number</Label>
          <Input 
            id="invoice_number" 
            name="invoice_number" 
            value={form.invoice_number} 
            onChange={handleChange} 
            placeholder="Enter invoice number"
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input 
            id="amount" 
            name="amount" 
            type="number" 
            step="0.01" 
            value={form.amount} 
            onChange={handleChange} 
            placeholder="0.00"
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="issue_date">Issue Date</Label>
          <Input 
            id="issue_date" 
            name="issue_date" 
            type="date" 
            value={form.issue_date} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input 
            id="due_date" 
            name="due_date" 
            type="date" 
            value={form.due_date} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">Client</Label>
          <Select value={form.client} onValueChange={(value) => handleSelectChange('client', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={form.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map(currency => (
                <SelectItem key={currency.id} value={currency.id}>
                  {currency.identifier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {allowedInvoiceTypes.length > 0 && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="invoice_type">Invoice Type</Label>
            <Select value={form.invoice_type} onValueChange={(value) => handleSelectChange('invoice_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select invoice type" />
              </SelectTrigger>
              <SelectContent>
                {allowedInvoiceTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !isFormValid}>
          {loading ? "Issuing..." : "Issue Invoice"}
        </Button>
      </div>
    </form>
  )
} 