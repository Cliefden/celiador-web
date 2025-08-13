"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AddPaymentForm({ invoiceId, invoiceAmount, invoiceCurrency, onSuccess, onCancel, type = 'payment' }: {
  invoiceId: string,
  invoiceAmount: number,
  invoiceCurrency: string,
  onSuccess?: () => void,
  onCancel?: () => void,
  type?: 'payment' | 'repayment',
}) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    amount: invoiceAmount.toString(),
    date: today,
    notes: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(type === 'repayment' ? "/api/repayment" : "/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: invoiceId,
          amount: parseFloat(form.amount),
          date: form.date,
          notes: form.notes,
          currency: invoiceCurrency
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed to add ${type}`)
      }
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-6">
      <CardHeader>
        <CardTitle>{type === 'repayment' ? 'Add Repayment' : 'Add Payment'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" step="0.01" value={form.amount} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} className="w-full p-2 rounded border bg-zinc-900 text-white min-h-[60px]" placeholder="Optional notes..." />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? `Adding...` : (type === 'repayment' ? 'Add Repayment' : 'Add Payment')}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 