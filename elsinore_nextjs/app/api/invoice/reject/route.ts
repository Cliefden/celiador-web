import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invoiceId, reason } = body
    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from('invoices')
      .update({ rejected_at: new Date().toISOString(), rejection_reason: reason || null })
      .eq('id', invoiceId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'An unknown error occurred' }, { status: 500 })
  }
} 