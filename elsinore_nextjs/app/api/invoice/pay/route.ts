import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId } = body
    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    }
    const supabase = await createClient()
    // Get the logged-in user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    // Fetch the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, client, paid_out_at, approved_at')
      .eq('id', invoiceId)
      .single()
    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    if (!invoice.approved_at) {
      return NextResponse.json({ error: 'Invoice not approved yet' }, { status: 400 })
    }
    if (invoice.paid_out_at) {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
    }
    // Get all payer orgs for this user
    const { data: payerRows, error: payerError } = await supabase
      .from('invoice_payers')
      .select('organisation')
      .eq('payer', user.id)
    if (payerError || !payerRows || payerRows.length === 0) {
      return NextResponse.json({ error: 'Not allowed to pay this invoice' }, { status: 403 })
    }
    const payerOrgIds = payerRows.map((row: unknown) => (row as { organisation: string }).organisation)
    // Check if any of these orgs is a financier to the invoice's client
    const { data: financierRows, error: financierError } = await supabase
      .from('financier_tos')
      .select('id')
      .in('financier', payerOrgIds)
      .eq('client', invoice.client)
    if (financierError || !financierRows || financierRows.length === 0) {
      return NextResponse.json({ error: 'Not allowed to pay this invoice' }, { status: 403 })
    }
    // Mark the invoice as paid
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ paid_out_at: new Date().toISOString() })
      .eq('id', invoiceId)
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
} 