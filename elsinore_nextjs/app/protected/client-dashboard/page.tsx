"use client";
import { createClient } from '@/lib/supabase/client'
import { InvoiceKanban } from '@/components/invoice-kanban'
import { useState, useEffect } from 'react'
import type { Invoice, Org } from '@/lib/types'
import type { Payment } from '@/lib/types'

export default function ClientDashboard() {
  const [user, setUser] = useState<unknown>(null)
  const [profile, setProfile] = useState<unknown>(null)
  const [organisationIds, setOrganisationIds] = useState<string[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [supplierOrgMap, setSupplierOrgMap] = useState<Record<string, Org>>({})
  const [currencySymbolMap, setCurrencySymbolMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  async function fetchInvoices() {
    setLoading(true)
    const supabase = createClient()
    // Get user
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) { setLoading(false); return }
    setUser(userData.user)
    // Get profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single()
    setProfile(profileData)
    // Get all approvers for all client orgs
    const { data: orgRows } = await supabase
      .from('invoice_approvers')
      .select('organisation, approver')
    // Build a map: orgId -> [approverIds]
    const orgApprovers: Record<string, string[]> = {}
    if (orgRows) {
      for (const row of orgRows) {
        if (!orgApprovers[row.organisation ?? '']) orgApprovers[row.organisation ?? ''] = []
        if (row.approver) orgApprovers[row.organisation ?? ''].push(row.approver)
      }
    }
    // Only show orgs the current user can approve for
    const userOrgRows = orgRows?.filter((row: { organisation: string; approver?: string }) => row.approver === userData.user.id) || []
    const orgIds = userOrgRows.map((row: { organisation: string }) => row.organisation)
    setOrganisationIds(orgIds)
    // DEBUG: Output user ID, orgRows, and orgIds
    if (typeof window !== 'undefined') {
      console.log('DEBUG userId:', userData.user.id)
      console.log('DEBUG orgRows:', orgRows)
      console.log('DEBUG orgIds:', orgIds)
    }
    // Get org records
    let orgs: Org[] = []
    if (orgIds.length > 0) {
      const { data: orgData } = await supabase
        .from('organisations')
        .select('*')
        .in('id', orgIds)
      orgs = orgData || []
    }
    // Build clientOrgMap for Kanban
    const clientMap: Record<string, Org> = {}
    for (const org of orgs) {
      clientMap[org.id] = org
    }
    // Get invoices
    let fetchedInvoices: Invoice[] = []
    let invoiceIds: string[] = []
    const clientIds: string[] = orgIds
    if (orgIds.length > 0) {
      const { data: invData } = await supabase
        .from('invoices')
        .select('*, invoice_type:invoice_types(id, cash_discount, maturity, for_payer)')
        .in('client', orgIds)
        .order('issue_date', { ascending: false })
      if (invData) {
        fetchedInvoices = invData
        invoiceIds = fetchedInvoices.map((inv: Invoice) => inv.id)
      }
    }
    // Payments/repayments
    const paymentSumMap: Record<string, number> = {}
    const repaymentSumMap: Record<string, number> = {}
    const paymentsByInvoice: Record<string, Payment[]> = {}
    const repaymentsByInvoice: Record<string, Payment[]> = {}
    if (invoiceIds.length > 0) {
      const { data: payments } = await supabase
        .from('invoice_payments')
        .select('invoice, amount, created_at, creator')
        .in('invoice', invoiceIds)
      if (payments) {
        for (const p of payments as Payment[]) {
          if (p.invoice) {
            if (!paymentSumMap[p.invoice]) paymentSumMap[p.invoice] = 0
            paymentSumMap[p.invoice] += p.amount || 0
          }
        }
      }
      // Group payments by invoice
      if (payments) {
        for (const p of payments as Payment[]) {
          if (p.invoice) {
            if (!paymentsByInvoice[p.invoice]) paymentsByInvoice[p.invoice] = []
            paymentsByInvoice[p.invoice].push(p)
          }
        }
      }
      const { data: repayments } = await supabase
        .from('repayments')
        .select('invoice, amount, created_at, creator')
        .in('invoice', invoiceIds)
      if (repayments) {
        for (const r of repayments as Payment[]) {
          if (r.invoice) {
            if (!repaymentSumMap[r.invoice]) repaymentSumMap[r.invoice] = 0
            repaymentSumMap[r.invoice] += r.amount || 0
          }
        }
      }
      // Group repayments by invoice
      if (repayments) {
        for (const r of repayments as Payment[]) {
          if (r.invoice) {
            if (!repaymentsByInvoice[r.invoice]) repaymentsByInvoice[r.invoice] = []
            repaymentsByInvoice[r.invoice].push(r)
          }
        }
      }
    }
    // After grouping payments and repayments by invoice:
    Object.keys(paymentsByInvoice).forEach(key => {
      paymentsByInvoice[key] = (paymentsByInvoice[key] as Payment[]);
    });
    Object.keys(repaymentsByInvoice).forEach(key => {
      repaymentsByInvoice[key] = (repaymentsByInvoice[key] as Payment[]);
    });
    // --- Fetch payer orgs for each client org ---
    const clientToPayerIds: Record<string, string[]> = {}
    const allPayerOrgIds: Set<string> = new Set()
    if (clientIds.length > 0) {
      const { data: payerRows } = await supabase
        .from('payer_tos')
        .select('client, payer')
        .in('client', clientIds)
      if (payerRows) {
        for (const row of payerRows) {
          if (!clientToPayerIds[row.client]) clientToPayerIds[row.client] = []
          clientToPayerIds[row.client].push(row.payer)
          allPayerOrgIds.add(row.payer)
        }
      }
    }
    // Fetch payer org records
    const payerMap: Record<string, Org> = {}
    if (allPayerOrgIds.size > 0) {
      const { data: payerOrgs } = await supabase
        .from('organisations')
        .select('*')
        .in('id', Array.from(allPayerOrgIds))
      if (payerOrgs) {
        for (const org of payerOrgs) {
          payerMap[org.id] = org
        }
      }
    }
    // Attach payment_sum, repayment_sum, invoice_type, and approvers to each invoice
    fetchedInvoices = fetchedInvoices.map(inv => ({
      ...inv,
      payment_sum: paymentSumMap[inv.id] || 0,
      repayment_sum: repaymentSumMap[inv.id] || 0,
      invoice_type: {
        cash_discount: inv.invoice_type?.cash_discount ?? 0,
        id: inv.invoice_type?.id,
        maturity: inv.invoice_type?.maturity,
        for_payer: inv.invoice_type?.for_payer,
        ...inv.invoice_type
      },
      cash_discount: inv.invoice_type?.cash_discount ?? 0,
      for_payer: inv.invoice_type?.for_payer ?? 0,
      payer_orgs: clientToPayerIds ? clientToPayerIds[inv.client] || [] : [],
      payments: Array.isArray(paymentsByInvoice[inv.id]) ? paymentsByInvoice[inv.id] : [],
      repayments: Array.isArray(repaymentsByInvoice[inv.id]) ? repaymentsByInvoice[inv.id] : [],
      approvers: orgApprovers[inv.client] || [],
    }))
    setInvoices(fetchedInvoices)
    // After fetching invoices, build supplierOrgMap for all unique supplier IDs
    const supplierIds = Array.from(new Set(fetchedInvoices.map(inv => inv.supplier).filter(Boolean)))
    const supplierOrgMap: Record<string, Org> = {}
    if (supplierIds.length > 0) {
      const { data: supplierOrgs } = await supabase
        .from('organisations')
        .select('*')
        .in('id', supplierIds)
      if (supplierOrgs) {
        for (const org of supplierOrgs) {
          supplierOrgMap[org.id] = org
        }
      }
    }
    setSupplierOrgMap(supplierOrgMap)
    // Currency symbol map
    const { data: currencies } = await supabase
      .from('currencies')
      .select('id, identifier')
    const currencyMap: Record<string, string> = {}
    if (currencies) {
      for (const c of currencies) {
        if (c.id) currencyMap[c.id] = c.identifier
      }
    }
    setCurrencySymbolMap(currencyMap)
    
    // Collect all unique user IDs and fetch user names
    const userIds = new Set<string>()
    fetchedInvoices.forEach(inv => {
      if (typeof inv.creator === 'string') userIds.add(inv.creator)
      if (Array.isArray(inv.approvers)) inv.approvers.forEach((id: string) => userIds.add(id))
      if (Array.isArray(inv.payments)) inv.payments.forEach((p: unknown) => { const payment = p as { creator?: string }; if (typeof payment.creator === 'string') userIds.add(payment.creator) })
      if (Array.isArray(inv.repayments)) inv.repayments.forEach((r: unknown) => { const repayment = r as { creator?: string }; if (typeof repayment.creator === 'string') userIds.add(repayment.creator) })
    })
    
    // Fetch all user names
    const userNamesMap: Record<string, string> = {}
    for (const id of userIds) {
      const { data: individual } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', id)
        .single()
      if (individual) {
        const name = [individual.first_name, individual.last_name].filter(Boolean).join(' ')
        userNamesMap[id] = name || individual.email || 'Unknown'
      } else {
        userNamesMap[id] = 'Unknown'
      }
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime:invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchInvoices();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <div className="text-gray-400 p-4">Loading...</div>
  if (!user || !profile) return <div className="text-red-400 p-4">Not logged in or profile missing.</div>

  let fullName = [
    (profile as { name_prefix?: string }).name_prefix,
    (profile as { first_name?: string }).first_name,
    (profile as { middle_name?: string }).middle_name,
    (profile as { pre_last_name?: string }).pre_last_name,
    (profile as { last_name?: string }).last_name,
    (profile as { name_suffix?: string }).name_suffix
  ].filter(Boolean).join(' ')
  if (!fullName || fullName === 'No name set') fullName = 'No name set'

  // --- Metrics calculation ---

  // Pick a default currency symbol for metrics (first found in invoices, fallback to '¤')

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-4">
        <div className="grid gap-6">
        </div>
      </div>
      <div className="container mx-auto p-4 mt-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Received Invoices</h2>
          {organisationIds.length === 0 ? (
            <div className="text-center text-zinc-500 dark:text-zinc-400 py-8">You are not an approver for any client organizations.</div>
          ) : invoices.length === 0 ? (
            <div className="text-center text-zinc-500 dark:text-zinc-400 py-8">No invoices found for your organizations.</div>
          ) : (
            <InvoiceKanban
              invoices={invoices as (Invoice & { payments: Payment[]; repayments: Payment[] })[]}
              currencySymbolMap={currencySymbolMap}
              partyLabel="Issuer"
              partyOrgMap={supplierOrgMap}
              partyField="supplier"
              showRepaidColumn={true}
              canApprove={true}
              canPay={false}
            />
          )}
        </div>
      </div>
    </main>
  )
} 