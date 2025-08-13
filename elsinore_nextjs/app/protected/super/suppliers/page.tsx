"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Org as OrgBase } from "@/lib/types";

type Org = OrgBase & { org_nr?: string };

export default function SuperSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Org[]>([]);
  const [invoiceCounts, setInvoiceCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSuppliers() {
      setLoading(true);
      const supabase = createClient();
      // Get all supplier org IDs from invoice_submitters
      const { data: submitters } = await supabase.from("invoice_submitters").select("organisation");
      const supplierOrgIds = Array.from(new Set((submitters || []).map((row: { organisation: string }) => row.organisation)));
      if (supplierOrgIds.length === 0) {
        setSuppliers([]);
        setInvoiceCounts({});
        setLoading(false);
        return;
      }
      // Fetch org data
      const { data: orgs } = await supabase.from("organisations").select("*").in("id", supplierOrgIds);
      setSuppliers(orgs || []);
      // Fetch invoice counts
      const { data: invoicesRaw } = await supabase
        .from("invoices")
        .select("supplier")
        .in("supplier", supplierOrgIds);
      const counts: Record<string, number> = {};
      (invoicesRaw || []).forEach((row: { supplier: string }) => {
        if (row.supplier) {
          counts[row.supplier] = (counts[row.supplier] || 0) + 1;
        }
      });
      setInvoiceCounts(counts);
      setLoading(false);
    }
    fetchSuppliers();
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-8">
      <h1 className="text-2xl font-bold mb-6">All Suppliers</h1>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : suppliers.length === 0 ? (
        <div className="text-gray-400">No suppliers found.</div>
      ) : (
        <table className="min-w-full border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Org. Number</th>
              <th className="p-3 text-left">Invoices Issued</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((org) => (
              <tr key={org.id} className="border-t border-zinc-200 dark:border-zinc-700">
                <td className="p-3">{org.name}</td>
                <td className="p-3">{org.org_nr || org.id}</td>
                <td className="p-3">{invoiceCounts[org.id] || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
} 