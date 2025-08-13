"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AnalyticsCards } from '@/components/analytics-cards';
import type { Invoice } from '@/lib/types';

export default function PayerAnalytics() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currencySymbolMap, setCurrencySymbolMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      const supabase = createClient();
      // Get user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setLoading(false); return; }
      // Get payer orgs for this user
      const { data: payerRows } = await supabase
        .from('invoice_disbursers')
        .select('organisation')
        .eq('disburser', userData.user.id);
      const payerOrgIds = payerRows ? payerRows.map((row: { organisation: string }) => row.organisation) : [];
      // Find all client orgs for which any payer org is a payer (from payer_tos)
      let clientIds: string[] = [];
      if (payerOrgIds.length > 0) {
        const { data: payerToRows } = await supabase
          .from('payer_tos')
          .select('client')
          .in('payer', payerOrgIds);
        clientIds = payerToRows ? payerToRows.map((row: { client: string }) => row.client) : [];
      }
      // Fetch invoices where client is in these client org ids
      let fetchedInvoices: Invoice[] = [];
      if (clientIds.length > 0) {
        const { data: invData } = await supabase
          .from('invoices')
          .select('*, invoice_type:invoice_types(id, cash_discount, maturity, for_payer)')
          .in('client', clientIds)
          .order('issue_date', { ascending: false });
        if (invData) {
          fetchedInvoices = invData;
        }
      }
      setInvoices(fetchedInvoices);
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
      setLoading(false);
    }
    fetchInvoices();
  }, []);

  // --- Metrics calculation ---
  const metrics = (() => {
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalOutstanding = invoices.filter(inv => !inv.repaid_at && !inv.rejected_at).reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const approved = invoices.filter(inv => inv.approved_at && !inv.rejected_at);
    const paid = invoices.filter(inv => inv.paid_out_at && !inv.rejected_at);
    const repaid = invoices.filter(inv =>
      inv.repayment_sum &&
      inv.repayment_sum >= (inv.amount * (1 - ((inv.invoice_type?.cash_discount ?? 0) - (inv.invoice_type?.for_payer ?? 0)))) &&
      !inv.rejected_at
    );
    const rejected = invoices.filter(inv => inv.rejected_at);
    const approvedAmount = approved.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paidAmount = paid.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const repaidAmount = repaid.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const rejectedAmount = rejected.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    // Average approval time (in days)
    const approvalTimes = approved.map(inv => {
      if (inv.created_at && inv.approved_at) {
        const created = new Date(inv.created_at);
        const approved = new Date(inv.approved_at);
        return (approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      }
      return null;
    }).filter((n): n is number => typeof n === 'number');
    const avgApprovalTime = approvalTimes.length > 0 ? (approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length).toFixed(1) : 'N/A';
    return {
      totalInvoices,
      totalAmount,
      totalOutstanding,
      approved: approved.length,
      approvedAmount,
      paid: paid.length,
      paidAmount,
      repaid: repaid.length,
      repaidAmount,
      rejected: rejected.length,
      rejectedAmount,
      avgApprovalTime
    };
  })();

  // Pick a default currency symbol for metrics (first found in invoices, fallback to '¤')
  const defaultCurrency = invoices[0]?.currency || '¤';
  const currencySymbol = currencySymbolMap[defaultCurrency] || defaultCurrency || '¤';

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-zinc-800 dark:text-zinc-200">Analytics</h1>
        {loading ? (
          <div className="text-gray-400 p-4">Loading...</div>
        ) : (
          <AnalyticsCards metrics={metrics} currencySymbol={currencySymbol} />
        )}
      </div>
    </main>
  );
} 