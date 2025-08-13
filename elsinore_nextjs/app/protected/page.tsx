import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getIndividualById } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import type { Invoice } from '@/lib/types'
import type { Payment } from '@/lib/types'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null // This should never happen due to middleware protection
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error('Error fetching profile:', error)
    return null // This should never happen due to middleware protection
  }

  // Redirect to client dashboard if user is a client
  if (profile.role === 'client') {
    redirect('/protected/client-dashboard')
  }

  // Redirect to payer dashboard if user is a payer
  if (profile.role === 'payer') {
    redirect('/protected/payer-dashboard')
  }

  // Redirect to supplier dashboard if user is a supplier
  if (profile.role === 'supplier') {
    redirect('/protected/supplier-dashboard')
  }

  // Redirect to super dashboard if user is a super
  if (profile.role === 'super') {
    redirect('/protected/super/dashboard')
  }

  // Redirect to super dashboard if user is an admin
  if (profile.role === 'admin') {
    redirect('/protected/super/dashboard')
  }

  let fullName = [
    (profile as { name_prefix?: string }).name_prefix,
    (profile as { first_name?: string }).first_name,
    (profile as { middle_name?: string }).middle_name,
    (profile as { pre_last_name?: string }).pre_last_name,
    (profile as { last_name?: string }).last_name,
    (profile as { name_suffix?: string }).name_suffix
  ].filter(Boolean).join(' ') || ''

  if (!fullName) {
    const individual = await getIndividualById(user.id)
    if (individual) {
      fullName = [
        (individual as { name_prefix?: string }).name_prefix,
        (individual as { first_name?: string }).first_name,
        (individual as { middle_name?: string }).middle_name,
        (individual as { pre_last_name?: string }).pre_last_name,
        (individual as { last_name?: string }).last_name,
        (individual as { name_suffix?: string }).name_suffix
      ].filter(Boolean).join(' ') || ''
    }
    if (!fullName) {
      fullName = 'No name set'
    }
  }
  
  let invoices: Invoice[] = []
  const invoiceIds: string[] = []
  if (profile.role === 'submitter') {
    // const organisation = await getOrganisationForSubmitter(user.id)
    // if (organisation) {
    //   invoices = await getInvoicesForOrganisation(organisation.id)
    //   invoiceIds = invoices.map((inv: Invoice) => inv.id)
    // }
  }

  // Fetch all payments for these invoices and sum per invoice
  const paymentSumMap: Record<string, number> = {}
  const repaymentSumMap: Record<string, number> = {}
  if (invoiceIds.length > 0) {
    const supabaseClient = await createClient()
    // Fetch invoice_payments
    const { data: payments, error: paymentError } = await supabaseClient
      .from('invoice_payments')
      .select('invoice, amount')
      .in('invoice', invoiceIds)
    if (!paymentError && payments) {
      for (const p of payments) {
        if (!paymentSumMap[p.invoice]) paymentSumMap[p.invoice] = 0
        paymentSumMap[p.invoice] += p.amount ?? 0
      }
    }
    // Fetch repayments
    const { data: repayments, error: repaymentError } = await supabaseClient
      .from('repayments')
      .select('invoice, amount')
      .in('invoice', invoiceIds)
    if (!repaymentError && repayments) {
      for (const r of repayments) {
        if (!repaymentSumMap[r.invoice]) repaymentSumMap[r.invoice] = 0
        repaymentSumMap[r.invoice] += r.amount ?? 0
      }
    }
  }
  // Attach payment_sum and repayment_sum to each invoice
  invoices = invoices.map(inv => ({
    ...inv,
    payment_sum: paymentSumMap[inv.id] || 0,
    repayment_sum: repaymentSumMap[inv.id] || 0,
    cash_discount: inv.invoice_type?.cash_discount || 0,
    for_financier: inv.invoice_type?.for_financier || 0,
    payments: [],
    repayments: [],
  }))
  
  // Get all organisations for client dropdown (except supplier)
  if (profile.role === 'submitter') {
    // Fetch all client org ids from clients_invoice_types
  }

  // After fetching invoices and before rendering, collect all unique user IDs
  const userIds = new Set<string>()
  invoices.forEach(inv => {
    if (typeof inv.creator === 'string') userIds.add(inv.creator)
    if (Array.isArray(inv.approvers)) inv.approvers.forEach((id: string) => userIds.add(id))
    if (Array.isArray(inv.payments)) inv.payments
      .filter((p): p is Payment =>
        typeof p === 'object' &&
        p !== null &&
        typeof p.creator === 'string' &&
        typeof p.amount === 'number' &&
        typeof p.created_at === 'string'
      )
      .forEach((p) => { userIds.add(p.creator) });

    if (Array.isArray(inv.repayments)) inv.repayments
      .filter((r): r is Payment =>
        typeof r === 'object' &&
        r !== null &&
        typeof r.creator === 'string' &&
        typeof r.amount === 'number' &&
        typeof r.created_at === 'string'
      )
      .forEach((r) => { userIds.add(r.creator) });
  })
  // Fetch all user names on the server
  const userNames: Record<string, string> = {}
  for (const id of userIds) {
    const individual = await getIndividualById(id)
    if (individual) {
      const name = [individual.name_prefix, individual.first_name, individual.middle_name, individual.pre_last_name, individual.last_name, individual.name_suffix].filter(Boolean).join(' ')
      userNames[id] = name || individual.email || 'Unknown'
    } else {
      userNames[id] = 'Unknown'
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-4">
        <div className="grid gap-6">
          {profile.role === UserRole.ADMIN && (
            <section className="p-6 bg-zinc-900 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">Admin Features</h2>
              <div className="space-y-4">
                <Link href="/protected/super/dashboard">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    Admin Dashboard
                  </Button>
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
