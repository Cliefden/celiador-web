"use client";
import { createClient } from '@/lib/supabase/client'
import { InvoiceKanban } from '@/components/invoice-kanban'
import { useState, useEffect } from 'react'
import type { Invoice, Org } from '@/lib/types'
import { IssueInvoiceButton } from '@/components/issue-invoice-button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { v4 as uuidv4 } from 'uuid'
import type { Payment } from '@/lib/types'

export default function SupplierDashboard() {
  const [user, setUser] = useState<unknown>(null)
  const [profile, setProfile] = useState<unknown>(null)
  const [organisation, setOrganisation] = useState<Org | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [currencySymbolMap, setCurrencySymbolMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [allOrgs, setAllOrgs] = useState<{ id: string, name: string }[]>([])
  const [currencies, setCurrencies] = useState<{ id: string, identifier: string }[]>([])
  const [allowedInvoiceTypes, setAllowedInvoiceTypes] = useState<{ id: string, name: string, cash_discount: number, maturity: number, for_financier: number }[]>([])
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfMeta, setPdfMeta] = useState({ client: '', amount: '', invoice_number: '', issue_date: '', invoice_type: '', currency: '' })
  const [allowedClients, setAllowedClients] = useState<{ id: string, name: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [clientOrgMap, setClientOrgMap] = useState<Record<string, Org>>({});

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
    // Find all organisations for which this user is a submitter
    const { data: submitterRows } = await supabase
      .from('invoice_submitters')
      .select('organisation')
      .eq('submitter', profileData.id)
      .is('deleted_at', null)
    const submitterOrgIds = submitterRows ? Array.from(new Set(submitterRows.map(row => row.organisation).filter(Boolean))) : []
    // Find all supplier orgs for which these organisations are the supplier (from supplier_tos)
    let supplierOrgIds: string[] = []
    if (submitterOrgIds.length > 0) {
      const { data: supplierToRows } = await supabase
        .from('supplier_tos')
        .select('supplier')
        .in('supplier', submitterOrgIds)
        .is('deleted_at', null)
      supplierOrgIds = supplierToRows ? Array.from(new Set(supplierToRows.map(row => row.supplier))) : []
    }
    // Fetch organisation records for these supplier orgs
    let orgData = null
    if (supplierOrgIds.length > 0) {
      const { data: orgs } = await supabase
        .from('organisations')
        .select('*')
        .in('id', supplierOrgIds)
      orgData = orgs && orgs.length > 0 ? orgs[0] : null
    }
    setOrganisation(orgData)
    // Fetch invoices for these supplier orgs
    let fetchedInvoices: Invoice[] = []
    let invoiceIds: string[] = []
    if (supplierOrgIds.length > 0) {
      const { data: invData } = await supabase
        .from('invoices')
        .select('*, invoice_type:invoice_types(id, cash_discount, maturity, for_payer)')
        .in('supplier', supplierOrgIds)
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
    // Get client orgs for these invoices
    const clientIds = Array.from(new Set(fetchedInvoices.map(inv => inv.client).filter(Boolean)))
    const orgMapToSet: Record<string, Org> = {}
    if (clientIds.length > 0) {
      const { data: clientOrgs } = await supabase
        .from('organisations')
        .select('*')
        .in('id', clientIds)
      if (clientOrgs) {
        for (const org of clientOrgs) {
          orgMapToSet[org.id] = org
        }
      }
    }
    setClientOrgMap(orgMapToSet);
    // Attach payment_sum, repayment_sum, invoice_type, etc. to each invoice
    fetchedInvoices = fetchedInvoices.map(inv => ({
      ...inv,
      payment_sum: paymentSumMap[inv.id] || 0,
      repayment_sum: repaymentSumMap[inv.id] || 0,
      invoice_type: {
        cash_discount: inv.invoice_type?.cash_discount ?? 0,
        id: inv.invoice_type?.id,
        maturity: inv.invoice_type?.maturity,
        for_financier: inv.invoice_type?.for_financier,
        ...inv.invoice_type
      },
      cash_discount: inv.invoice_type?.cash_discount ?? 0,
      for_payer: inv.invoice_type?.for_payer ?? 0,
      payments: Array.isArray(paymentsByInvoice[inv.id]) ? paymentsByInvoice[inv.id] : [],
      repayments: Array.isArray(repaymentsByInvoice[inv.id]) ? repaymentsByInvoice[inv.id] : [],
    }))
    setInvoices(fetchedInvoices)
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
      if (Array.isArray(inv.payments)) inv.payments.forEach((p: Payment) => { if (typeof p.creator === 'string') userIds.add(p.creator) })
      if (Array.isArray(inv.repayments)) inv.repayments.forEach((r: Payment) => { if (typeof r.creator === 'string') userIds.add(r.creator) })
    })
    // Fetch all user names
    const userNamesMap: Record<string, string> = {}
    for (const id of userIds) {
      if (!id) continue; // skip null/undefined/empty
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
    // Fetch all client orgs for dropdown
    const { data: orgs } = await supabase
      .from('organisations')
      .select('id, name')
    setAllOrgs(orgs || [])
    // Fetch all currencies
    const { data: currencyRows } = await supabase
      .from('currencies')
      .select('id, identifier')
    setCurrencies(currencyRows || [])
    // Fetch allowed invoice types for the first client (if any)
    const orgArray = Array.isArray(orgs) ? orgs : [];
    let types: { id: string, name: string, cash_discount: number, maturity: number, for_financier: number }[] = []
    if (orgArray.length > 0) {
      const { data: typeRows } = await supabase
        .from('invoice_types')
        .select('id, display_name, cash_discount, maturity, for_financier')
        .eq('client', orgArray[0].id)
      types = (typeRows || []).map(t => ({
        id: t.id,
        name: typeof t.display_name === 'string' ? t.display_name : '',
        cash_discount: t.cash_discount ?? 0,
        maturity: t.maturity ?? 0,
        for_financier: t.for_financier ?? 0,
      }))
    }
    setAllowedInvoiceTypes(types)
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
  }, [organisation?.id]);

  // Fetch allowed clients for this supplier when modal opens
  useEffect(() => {
    if (showPdfModal && organisation?.id) {
      (async () => {
        const supabase = createClient()
        const { data: supplierToRows } = await supabase
          .from('supplier_tos')
          .select('client')
          .eq('supplier', organisation.id)
          .is('deleted_at', null)
        const clientIds = supplierToRows ? Array.from(new Set(supplierToRows.map(row => row.client).filter(Boolean))) : []
        let clients: { id: string, name: string }[] = []
        if (clientIds.length > 0) {
          const { data: orgs } = await supabase
            .from('organisations')
            .select('id, name')
            .in('id', clientIds)
          clients = orgs || []
        }
        setAllowedClients(clients)
      })()
    }
  }, [showPdfModal, organisation?.id])

  // Fetch allowed invoice types for the selected client
  useEffect(() => {
    if (pdfMeta.client) {
      (async () => {
        const supabase = createClient();
        console.log('Fetching invoice types for client:', pdfMeta.client);
        // Step 1: Get all invoice_type UUIDs for this client
        const { data: clientTypeRows } = await supabase
          .from('clients_invoice_types')
          .select('invoice_type')
          .eq('client', pdfMeta.client)
          .is('deleted_at', null);
        console.log('clientTypeRows', clientTypeRows);
        const invoiceTypeIds = (clientTypeRows || []).map(row => row.invoice_type).filter(Boolean);
        console.log('invoiceTypeIds', invoiceTypeIds);
        // Test: fetch just the first ID
        if (invoiceTypeIds.length > 0) {
          const { data: singleType, error: singleTypeError } = await supabase
            .from('invoice_types')
            .select('id, display_name, cash_discount, maturity, for_financier')
            .eq('id', invoiceTypeIds[0]);
          console.log('singleType', singleType, 'singleTypeError', singleTypeError);
        }
        let types: { id: string, name: string, cash_discount: number, maturity: number, for_financier: number }[] = [];
        if (invoiceTypeIds.length > 0) {
          // Step 2: Fetch details for those invoice_type UUIDs
          const { data: typeRows } = await supabase
            .from('invoice_types')
            .select('id, maturity, maturity_request, cash_discount, for_financier')
            .in('id', invoiceTypeIds);
          console.log('typeRows', typeRows);
          types = (typeRows || []).map(t => ({
            id: t.id,
            name: `${t.maturity || 0} days, req: ${t.maturity_request || 0}, discount: ${(t.cash_discount * 100).toFixed(1)}%, financier: ${(t.for_financier * 100).toFixed(1)}%`,
            cash_discount: t.cash_discount ?? 0,
            maturity: t.maturity ?? 0,
            for_financier: t.for_financier ?? 0,
          }));
        }
        setAllowedInvoiceTypes(types);
      })();
    } else {
      setAllowedInvoiceTypes([]);
    }
  }, [pdfMeta.client]);

  // Set default client when modal opens and allowedClients changes
  useEffect(() => {
    if (showPdfModal && allowedClients.length > 0 && !pdfMeta.client) {
      setPdfMeta(m => ({ ...m, client: allowedClients[0].id }));
    }
  }, [showPdfModal, allowedClients, pdfMeta.client]);

  // Set default invoice type when allowedInvoiceTypes changes
  useEffect(() => {
    if (allowedInvoiceTypes.length > 0 && !pdfMeta.invoice_type) {
      setPdfMeta(m => ({ ...m, invoice_type: allowedInvoiceTypes[0].id }));
    }
  }, [allowedInvoiceTypes, pdfMeta.invoice_type]);

  async function handleSubmitInvoicePDF() {
    if (!pdfFile || !pdfMeta.client || !organisation) return
    setUploading(true)
    setUploadError(null)
    try {
      const supabase = createClient()
      const uuid = (window.crypto?.randomUUID?.() || uuidv4?.() || Math.random().toString(36).slice(2))
      // Sanitize the original filename
      const originalName = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileName = `${uuid}-${originalName}`
      const filePath = fileName // Upload directly to the root of the bucket
      // 1. Upload PDF
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, pdfFile, { upsert: false, contentType: 'application/pdf' })
      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw uploadError
      }
      // 2. Get user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Not authenticated')
      // 3. Insert invoice
      const { error: insertError } = await supabase
        .from('invoices')
        .insert([{
          creator: userData.user.id,
          client: pdfMeta.client,
          amount: pdfMeta.amount ? Number(pdfMeta.amount) : null,
          invoice_number: pdfMeta.invoice_number || null,
          issue_date: pdfMeta.issue_date || null,
          supplier: organisation.id,
          pdf_path: fileName, // Store only the file name
          invoice_type: pdfMeta.invoice_type || null,
          currency: pdfMeta.currency || (currencies[0]?.id || null),
        }])
      if (insertError) {
        console.error('DB insert error:', insertError)
        throw insertError
      }
      // Success: reset modal and show success message
      setShowPdfModal(false)
      setPdfFile(null)
      setPdfMeta({ client: '', amount: '', invoice_number: '', issue_date: '', invoice_type: '', currency: '' })
      setSuccessMessage('Invoice PDF submitted successfully!')
    } catch (err: unknown) {
      setUploadError((err as Error).message || 'Unknown error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="text-gray-400 p-4">Loading...</div>
  if (!user || !profile) return <div className="text-red-400 p-4">Not logged in or profile missing.</div>

  // Debug output before render
  // --- Metrics calculation ---
  const {
  } = (() => {
    return {
    }
  })()

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4">
          <span>{successMessage}</span>
          <button className="ml-4 text-white hover:text-zinc-200" onClick={() => setSuccessMessage(null)}>&times;</button>
        </div>
      )}
      <div className="container mx-auto p-4">
        <div className="grid gap-6">
        </div>
      </div>
      {organisation && (
        <div className="container mx-auto p-4 mt-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
          {/* Kanban Section - always visible, even if empty */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 mt-8">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Issued Invoices</h2>
            <InvoiceKanban
              invoices={invoices as (Invoice & { payments: Payment[]; repayments: Payment[] })[]}
              currencySymbolMap={currencySymbolMap}
              partyLabel="Client"
              partyOrgMap={clientOrgMap}
              partyField="client"
              showRepaidColumn={true}
              canApprove={false}
              canPay={false}
            />
            {/* Always show the invoice submission buttons */}
            <IssueInvoiceButton
              supplierId={organisation.id}
              clients={allOrgs}
              currencies={currencies}
              allowedInvoiceTypes={allowedInvoiceTypes}
            />
            <Button className="mt-6 w-full max-w-xs font-bold text-base py-3 rounded-xl shadow border border-zinc-200 dark:border-zinc-700 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700" onClick={() => setShowPdfModal(true)}>
              Submit Invoice PDF
            </Button>
            <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Invoice PDF</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                  <Select value={pdfMeta.client} onValueChange={val => setPdfMeta(m => ({ ...m, client: val, invoice_type: '', currency: '' }))}>
                    {allowedClients.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </Select>
                  <Select value={pdfMeta.invoice_type} onValueChange={val => setPdfMeta(m => ({ ...m, invoice_type: val, currency: '' }))}>
                    {Array.isArray(allowedInvoiceTypes) && allowedInvoiceTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name ? type.name : `${type.maturity} days, ${((type.cash_discount ?? 0) * 100).toFixed(1)}% discount`}
                      </option>
                    ))}
                  </Select>
                  {/* Currency select */}
                  <Select value={pdfMeta.currency || (currencies[0]?.id || '')} onValueChange={val => setPdfMeta(m => ({ ...m, currency: val }))}>
                    <option value="">Select currency...</option>
                    {currencies.map(c => (
                      <option key={c.id} value={c.id}>{c.identifier}</option>
                    ))}
                  </Select>
                  <Input placeholder="Amount" type="number" value={pdfMeta.amount} onChange={e => setPdfMeta(m => ({ ...m, amount: e.target.value }))} />
                  <Input placeholder="Invoice Number" value={pdfMeta.invoice_number} onChange={e => setPdfMeta(m => ({ ...m, invoice_number: e.target.value }))} />
                  <Input placeholder="Issue Date" type="date" value={pdfMeta.issue_date} onChange={e => setPdfMeta(m => ({ ...m, issue_date: e.target.value }))} />
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowPdfModal(false)} variant="outline" disabled={uploading}>Cancel</Button>
                  <Button onClick={handleSubmitInvoicePDF} disabled={!pdfFile || !pdfMeta.client || uploading}>
                    {uploading ? 'Submitting...' : 'Submit'}
                  </Button>
                </DialogFooter>
                {uploadError && <div className="text-red-500 text-sm mt-2">{uploadError}</div>}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </main>
  )
} 