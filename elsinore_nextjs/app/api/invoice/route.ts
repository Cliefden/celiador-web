import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, issue_date, due_date, invoice_number, client, supplier, currency, invoice_type } = body
    if (!amount || !issue_date || !due_date || !invoice_number || !client || !supplier || !currency || !invoice_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('invoices')
      .insert([
        {
          amount,
          issue_date,
          due_date,
          invoice_number,
          client,
          supplier,
          currency,
          invoice_type,
          creator: user?.id || null
        }
      ])
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'An unknown error occurred' }, { status: 500 })
  }
} 