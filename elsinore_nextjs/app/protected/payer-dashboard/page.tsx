"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InvoiceKanban } from '@/components/invoice-kanban';
import type { Invoice, Org, Payment } from '@/lib/types';

export default function PayerDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currencySymbolMap, setCurrencySymbolMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientOrgMap, setClientOrgMap] = useState<Record<string, Org>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      // Get user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setError('No user found');
        setLoading(false);
        return;
      }
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();
      if (profileError || !profileData) {
        setError('No profile found');
        setLoading(false);
        return;
      }
      // Fetch payer organisations for this user
      const { data: payerRows } = await supabase
        .from('invoice_disbursers')
        .select('organisation')
        .eq('disburser', userData.user.id);
      const payerOrgIds = payerRows ? payerRows.map((row: { organisation: string }) => row.organisation) : [];
      // Fetch all client orgs for which any payer org is a payer (from payer_tos)
      let payerClientIds: string[] = [];
      if (payerOrgIds.length > 0) {
        const { data: payerToRows } = await supabase
          .from('payer_tos')
          .select('client')
          .in('payer', payerOrgIds);
        payerClientIds = payerToRows ? payerToRows.map((row: { client: string }) => row.client) : [];
      }
      // Fetch invoices where client is in these client org ids
      let fetchedInvoices: Invoice[] = [];
      let invoiceIds: string[] = [];
      if (payerClientIds.length > 0) {
        const { data: invData } = await supabase
          .from('invoices')
          .select('*, invoice_type:invoice_types(id, cash_discount, maturity, for_payer)')
          .in('client', payerClientIds)
          .order('issue_date', { ascending: false });
        if (invData) {
          fetchedInvoices = invData;
          invoiceIds = fetchedInvoices.map((inv: Invoice) => inv.id);
        }
      }
      // Payments/repayments
      const paymentSumMap: Record<string, number> = {};
      const repaymentSumMap: Record<string, number> = {};
      if (invoiceIds.length > 0) {
        const { data: payments } = await supabase
          .from('invoice_payments')
          .select('invoice, amount')
          .in('invoice', invoiceIds);
        if (payments) {
          for (const p of payments) {
            if (!paymentSumMap[p.invoice]) paymentSumMap[p.invoice] = 0;
            paymentSumMap[p.invoice] += p.amount ?? 0;
          }
        }
        const { data: repayments } = await supabase
          .from('repayments')
          .select('invoice, amount')
          .in('invoice', invoiceIds);
        if (repayments) {
          for (const r of repayments) {
            if (!repaymentSumMap[r.invoice]) repaymentSumMap[r.invoice] = 0;
            repaymentSumMap[r.invoice] += r.amount ?? 0;
          }
        }
      }
      // Attach payment_sum, repayment_sum, and invoice_type to each invoice
      fetchedInvoices = fetchedInvoices.map(inv => ({
        ...inv,
        payment_sum: paymentSumMap[inv.id] ?? 0,
        repayment_sum: repaymentSumMap[inv.id] ?? 0,
        invoice_type: {
          cash_discount: inv.invoice_type?.cash_discount ?? 0,
          id: inv.invoice_type?.id,
          maturity: inv.invoice_type?.maturity,
          for_payer: inv.invoice_type?.for_payer,
          ...inv.invoice_type
        },
        cash_discount: inv.invoice_type?.cash_discount ?? 0,
        for_payer: inv.invoice_type?.for_payer ?? 0,
        payments: [],
        repayments: [],
      }));
      setInvoices(fetchedInvoices);
      if (typeof window !== 'undefined') {
        console.log('DEBUG fetchedInvoices:', fetchedInvoices);
      }
      // Currency symbol map
      const { data: currencies } = await supabase
        .from('currencies')
        .select('id, identifier');
      const currencyMap: Record<string, string> = {};
      if (currencies) {
        for (const c of currencies) {
          if (c.id) currencyMap[c.id] = c.identifier;
        }
      }
      setCurrencySymbolMap(currencyMap);

      // After fetching invoices, build clientOrgMap for all unique client IDs
      const uniqueClientIds = Array.from(new Set(fetchedInvoices.map(inv => inv.client).filter(Boolean)))
      const orgMapToSet: Record<string, Org> = {}
      if (uniqueClientIds.length > 0) {
        const { data: clientOrgs } = await supabase
          .from('organisations')
          .select('*')
          .in('id', uniqueClientIds)
        if (clientOrgs) {
          for (const org of clientOrgs) {
            orgMapToSet[org.id] = org
          }
        }
      }
      setClientOrgMap(orgMapToSet);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-gray-400 p-4">Loading...</div>;
  if (error) return <div className="bg-red-900 text-red-200 p-2 mb-4 rounded">{error}</div>;

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Payer Dashboard</h1>
        {/* Render metrics, kanban, etc. here */}
        <InvoiceKanban
          invoices={invoices as (Invoice & { payments: Payment[]; repayments: Payment[] })[]}
          currencySymbolMap={currencySymbolMap}
          partyLabel="Client"
          partyOrgMap={clientOrgMap}
          partyField="client"
          showRepaidColumn={true}
          canApprove={true}
          canPay={true}
        />
      </div>
    </main>
  );
} 