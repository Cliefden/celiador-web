"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { InvoiceKanban } from "@/components/invoice-kanban";
import type { Invoice, Org } from "@/lib/types";
import type { Payment } from '@/lib/types'

export function SuperAdminKanbanClient() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currencySymbolMap, setCurrencySymbolMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [clientOrgMap, setClientOrgMap] = useState<Record<string, Org>>({});

  async function fetchAll() {
    setLoading(true);
    const supabase = createClient();
    // Fetch all invoices
    const { data: invoicesRaw } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    const invoices: Invoice[] = invoicesRaw || [];
    setInvoices(invoices);
    // Build clientOrgMap from all unique client IDs
    const clientIds = Array.from(new Set(invoices.map(inv => inv.client).filter(Boolean)));
    const orgMapToSet: Record<string, Org> = {};
    if (clientIds.length > 0) {
      const { data: clientOrgs } = await supabase
        .from("organisations")
        .select("*")
        .in("id", clientIds);
      if (clientOrgs) {
        for (const org of clientOrgs) {
          orgMapToSet[org.id] = org;
        }
      }
    }
    setClientOrgMap(orgMapToSet);
    // Fetch currency symbols
    const { data: currencies } = await supabase.from("currencies").select("id, identifier");
    const currencyMap: Record<string, string> = {};
    (currencies || []).forEach((c: { id: string; identifier: string }) => {
      if (c.id) currencyMap[c.id] = c.identifier;
    });
    setCurrencySymbolMap(currencyMap);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
    const supabase = createClient();
    const channel = supabase
      .channel("realtime:invoices")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        () => {
          fetchAll();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Metrics calculations (same as before)
  const invoicesWithSums = invoices.map(inv => ({
    ...inv,
    payment_sum: inv.payment_sum || 0,
    repayment_sum: inv.repayment_sum || 0,
    cash_discount: (inv as Invoice).cash_discount || 0, // fallback if not joined
    for_financier: (inv as Invoice).for_financier || 0, // fallback if not joined
    financier: (inv as Invoice).financier || undefined, // fallback if not present
    payments: Array.isArray(inv.payments) ? inv.payments : [],
    repayments: Array.isArray(inv.repayments) ? inv.repayments : [],
  }));

  if (loading) return <div className="text-gray-400 p-4">Loading...</div>;

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-4 mt-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
        {/* Kanban Section */}
        <section className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 mb-8 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">All Invoices (Kanban)</h2>
          <InvoiceKanban
            invoices={invoicesWithSums as (Invoice & { payments: Payment[]; repayments: Payment[] })[]}
            currencySymbolMap={currencySymbolMap}
            partyLabel="Client"
            partyOrgMap={clientOrgMap}
            partyField="client"
            showRepaidColumn={true}
            canApprove={false}
            canPay={false}
          />
        </section>
      </div>
    </main>
  );
} 