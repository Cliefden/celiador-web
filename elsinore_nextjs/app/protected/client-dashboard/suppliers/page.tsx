"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Org {
  id: string;
  name: string;
  org_nr?: string;
  [key: string]: unknown;
}

export default function ClientSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [pendingStats, setPendingStats] = useState<Record<string, { count: number, total: number }>>({});

  useEffect(() => {
    async function fetchSuppliers() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      // Get user and profile
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setError("Not logged in");
        setLoading(false);
        return;
      }
      const { data: profile, error: profileError, ...profileRest } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", userData.user.id)
        .single();
      if (!profile) {
        setError(`Profile not found for user id: ${userData.user.id}\nSupabase response: ${JSON.stringify({ profile, profileError, ...profileRest })}`);
        setLoading(false);
        return;
      }
      if (profile.role !== "client") {
        setError(`Not authorized: your role is '${profile.role ?? 'none'}' (must be 'client')`);
        setLoading(false);
        return;
      }
      // Find all client orgs for which this user is an approver
      const { data: approverRows } = await supabase
        .from("invoice_approvers")
        .select("organisation, approver, id")
        .eq("approver", profile.id);
      const clientOrgIds = approverRows ? Array.from(new Set(approverRows.map(row => row.organisation).filter(Boolean))) : [];
      // Find all suppliers for these client orgs using invoices
      let supplierIds: string[] = [];
      if (clientOrgIds.length > 0) {
        const { data: invoiceRows } = await supabase
          .from("invoices")
          .select("supplier, client")
          .in("client", clientOrgIds);
        supplierIds = invoiceRows ? Array.from(new Set(invoiceRows.map(row => row.supplier).filter(Boolean))) : [];
      }
      // Fetch supplier org details
      let supplierOrgs: Org[] = [];
      if (supplierIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organisations")
          .select("id, name, org_nr")
          .in("id", supplierIds);
        supplierOrgs = orgs || [];
      }
      setSuppliers(supplierOrgs);
      // Fetch pending invoice stats for each supplier
      const stats: Record<string, { count: number, total: number }> = {};
      if (supplierOrgs.length > 0 && clientOrgIds.length > 0) {
        const { data: invoices } = await supabase
          .from("invoices")
          .select("supplier, amount, rejected_at, repaid_at, client")
          .in("supplier", supplierOrgs.map(s => s.id))
          .in("client", clientOrgIds);
        for (const supplier of supplierOrgs) {
          const supplierInvoices = (invoices || []).filter(inv => inv.supplier === supplier.id && !inv.rejected_at && !inv.repaid_at);
          stats[supplier.id] = {
            count: supplierInvoices.length,
            total: supplierInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
          };
        }
      }
      setPendingStats(stats);
      setDebugInfo(
        `User ID: ${userData.user.id}\nProfile ID: ${profile.id}\nInvoice Approvers: ${JSON.stringify(approverRows, null, 2)}\nClient Org IDs: ${JSON.stringify(clientOrgIds)}\nSupplier IDs: ${JSON.stringify(supplierIds)}`
      );
      setLoading(false);
    }
    fetchSuppliers();
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Suppliers</h1>
        {loading ? (
          <div className="text-gray-400 p-4">Loading...</div>
        ) : error ? (
          <div className="text-red-500 p-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Org Number</th>
                  <th className="px-4 py-2 text-left">Pending Invoices</th>
                  <th className="px-4 py-2 text-left">Pending Amount</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-t border-zinc-200 dark:border-zinc-700">
                    <td className="px-4 py-2">{supplier.name}</td>
                    <td className="px-4 py-2">{supplier.org_nr}</td>
                    <td className="px-4 py-2">{pendingStats[supplier.id]?.count ?? 0}</td>
                    <td className="px-4 py-2">{pendingStats[supplier.id]?.total?.toLocaleString() ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {suppliers.length === 0 && (
              <div className="text-zinc-500 p-4">
                No suppliers found.<br />
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 