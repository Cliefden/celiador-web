"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AnalyticsCards } from '@/components/analytics-cards';
import type { Invoice, Org, UserProfile } from '@/lib/types';

export default function SuperAdminAnalytics() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allOrgs, setAllOrgs] = useState<Org[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [totalFinanciers, setTotalFinanciers] = useState(0);
  const [currencySymbolMap, setCurrencySymbolMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const supabase = createClient();
      const { data: invoicesRaw } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      setInvoices(invoicesRaw || []);
      const { data: orgs } = await supabase.from('organisations').select('*');
      setAllOrgs(orgs || []);
      const { data: users } = await supabase.from('profiles').select('*');
      setAllUsers(users || []);
      const { data: currencies } = await supabase.from('currencies').select('id, identifier');
      const currencyMap: Record<string, string> = {};
      (currencies || []).forEach((c: { id: string; identifier: string }) => {
        if (c.id) currencyMap[c.id] = c.identifier;
      });
      setCurrencySymbolMap(currencyMap);
      const { data: supplierRows } = await supabase.from('invoice_submitters').select('organisation');
      setTotalSuppliers(new Set((supplierRows || []).map((row: { organisation: string }) => row.organisation)).size);
      const { data: clientRows } = await supabase.from('invoice_approvers').select('organisation');
      setTotalClients(new Set((clientRows || []).map((row: { organisation: string }) => row.organisation)).size);
      const { data: financierRows } = await supabase.from('financier_tos').select('financier');
      setTotalFinanciers(new Set((financierRows || []).map((row: { financier: string }) => row.financier)).size);
      setLoading(false);
    }
    fetchAll();
  }, []);

  const invoicesWithSums = invoices.map(inv => ({
    ...inv,
    payment_sum: inv.payment_sum || 0,
    repayment_sum: inv.repayment_sum || 0,
    cash_discount: (inv as Invoice).cash_discount || 0,
    for_financier: (inv as Invoice).for_financier || 0,
    financier: (inv as Invoice).financier || undefined,
    payments: Array.isArray(inv.payments) ? inv.payments : [],
    repayments: Array.isArray(inv.repayments) ? inv.repayments : [],
  }));
  const defaultCurrency = invoicesWithSums[0]?.currency || '¤';
  const currencySymbol = currencySymbolMap[defaultCurrency] || defaultCurrency || '¤';
  const totalInvoices = invoicesWithSums.length;
  const totalAmount = invoicesWithSums.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const approved = invoicesWithSums.filter(inv => inv.approved_at && !inv.rejected_at);
  const paid = invoicesWithSums.filter(inv => !inv.rejected_at && inv.payment_sum && inv.payment_sum >= (Number(inv.amount) * (1 - Number(inv.cash_discount || 0))));
  const repaid = invoicesWithSums.filter(inv => inv.repayment_sum && inv.repayment_sum >= (Number(inv.amount) * (1 - (Number(inv.cash_discount || 0) - Number(inv.for_financier || 0)))) && !inv.rejected_at);
  const rejected = invoicesWithSums.filter(inv => inv.rejected_at);
  const overdue = invoicesWithSums.filter(inv => !inv.repaid_at && !inv.rejected_at && new Date(inv.due_date) < new Date());
  const uniqueSuppliers = new Set(invoicesWithSums.map(inv => inv.supplier)).size;
  const uniqueClients = new Set(invoicesWithSums.map(inv => inv.client)).size;
  const uniqueFinanciers = new Set(invoicesWithSums.map(inv => inv.financier)).size;
  const approvalTimes = approved.map(inv => {
    if (inv.created_at && inv.approved_at) {
      const created = new Date(inv.created_at);
      const approved = new Date(inv.approved_at);
      return (approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    }
    return null;
  }).filter((n): n is number => typeof n === 'number');
  const avgApprovalTime = approvalTimes.length > 0 ? (approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length).toFixed(1) : 'N/A';

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Super Admin Analytics</h1>
        <div className="bg-zinc-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">System Metrics</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Total users</li>
            <li>Total organisations</li>
            <li>Total invoices issued</li>
            <li>Active clients, payers, financiers</li>
            <li>Recent activity logs</li>
          </ul>
        </div>
        <div className="bg-zinc-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Usage Trends</h2>
          <p className="text-gray-400">(Charts and trends coming soon...)</p>
        </div>
        {/* Analytics Metrics Section */}
        <div className="mt-10">
          {loading ? (
            <div className="text-gray-400 p-4">Loading analytics...</div>
          ) : (
            <AnalyticsCards
              metrics={{
                totalInvoices,
                totalAmount,
                approved: approved.length,
                paid: paid.length,
                repaid: repaid.length,
                rejected: rejected.length,
                overdue: overdue.length,
                allUsers: allUsers.length,
                allOrgs: allOrgs.length,
                avgApprovalTime,
                uniqueSuppliers,
                totalSuppliers,
                uniqueClients,
                totalClients,
                uniqueFinanciers,
                totalFinanciers,
              }}
              currencySymbol={currencySymbol}
            />
          )}
        </div>
      </div>
    </main>
  );
} 