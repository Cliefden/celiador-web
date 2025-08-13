import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      .select('id, client, approved_at')
      .eq('id', invoiceId)
      .single()
    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    if (invoice.approved_at) {
      return NextResponse.json({ error: 'Invoice already approved' }, { status: 400 })
    }
    // Check if user is an approver for the client org
    const { data: approver, error: approverError } = await supabase
      .from('invoice_approvers')
      .select('id')
      .eq('approver', user.id)
      .eq('organisation', invoice.client)
      .single()
    if (approverError || !approver) {
      return NextResponse.json({ error: 'Not allowed to approve this invoice' }, { status: 403 })
    }
    // Approve the invoice
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ approved_at: new Date().toISOString() })
      .eq('id', invoiceId)
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'An error occurred' }, { status: 500 })
  }
} 