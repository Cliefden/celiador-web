import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const body = await req.json()
    const { invoice, amount, date, notes, currency } = body
    if (!invoice || !amount || !date || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const { error } = await supabase.from('repayments').insert({
      invoice,
      amount,
      currency,
      notes: notes || null,
      creator: user.id,
      created_at: date
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
} 