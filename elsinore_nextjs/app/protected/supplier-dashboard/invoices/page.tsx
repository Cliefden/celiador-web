"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Invoice, Org } from "@/lib/types";

export default function SupplierInvoicesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientOrgMap, setClientOrgMap] = useState<Record<string, Org>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      // Get user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setError("Not logged in");
        setLoading(false);
        return;
      }
      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userData.user.id)
        .single();
      if (!profile) {
        setError("Profile not found");
        setLoading(false);
        return;
      }
      // Find all organisations for which this user is a submitter
      const { data: submitterRows } = await supabase
        .from("invoice_submitters")
        .select("organisation")
        .eq("submitter", profile.id)
        .is("deleted_at", null);
      const submitterOrgIds = submitterRows ? Array.from(new Set(submitterRows.map(row => row.organisation).filter(Boolean))) : [];
      // Find all supplier orgs for which these organisations are the supplier (from supplier_tos)
      let supplierOrgIds: string[] = [];
      if (submitterOrgIds.length > 0) {
        const { data: supplierToRows } = await supabase
          .from("supplier_tos")
          .select("supplier")
          .in("supplier", submitterOrgIds)
          .is("deleted_at", null);
        supplierOrgIds = supplierToRows ? Array.from(new Set(supplierToRows.map(row => row.supplier))) : [];
      }
      // Fetch invoices for these supplier orgs
      let fetchedInvoices: Invoice[] = [];
      if (supplierOrgIds.length > 0) {
        const { data: invData } = await supabase
          .from("invoices")
          .select("*")
          .in("supplier", supplierOrgIds)
          .order("issue_date", { ascending: false });
        if (invData) {
          fetchedInvoices = invData;
        }
      }
      setInvoices(fetchedInvoices);
      // Get client orgs for these invoices
      const clientIds = Array.from(new Set(fetchedInvoices.map(inv => inv.client).filter(Boolean)));
      const clientMap: Record<string, Org> = {};
      if (clientIds.length > 0) {
        const { data: clientOrgs } = await supabase
          .from("organisations")
          .select("id, name")
          .in("id", clientIds);
        if (clientOrgs) {
          for (const org of clientOrgs) {
            clientMap[org.id] = org;
          }
        }
      }
      setClientOrgMap(clientMap);
      setLoading(false);
    }
    fetchInvoices();
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">All Invoices</h1>
        {loading ? (
          <div className="text-gray-400 p-4">Loading...</div>
        ) : error ? (
          <div className="text-red-500 p-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="px-4 py-2 text-left">Invoice Number</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Issue Date</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-zinc-200 dark:border-zinc-700">
                    <td className="px-4 py-2">{inv.invoice_number || <span className="text-zinc-400">(none)</span>}</td>
                    <td className="px-4 py-2">{clientOrgMap[inv.client]?.name || <span className="text-zinc-400">(unknown)</span>}</td>
                    <td className="px-4 py-2">{inv.amount != null ? inv.amount : <span className="text-zinc-400">(none)</span>}</td>
                    <td className="px-4 py-2">{inv.rejected_at ? "Rejected" : inv.repaid_at ? "Repaid" : inv.paid_out_at ? "Paid" : inv.approved_at ? "Approved" : "Pending"}</td>
                    <td className="px-4 py-2">{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : <span className="text-zinc-400">(none)</span>}</td>
                    <td className="px-4 py-2">
                      {inv.pdf_path ? (
                        <a
                          href={`https://YOUR_SUPABASE_PROJECT_ID.supabase.co/storage/v1/object/public/invoices/${inv.pdf_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 underline"
                        >
                          View PDF
                        </a>
                      ) : (
                        <span className="text-zinc-400">No PDF</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invoices.length === 0 && <div className="text-zinc-500 p-4">No invoices found.</div>}
          </div>
        )}
      </div>
    </main>
  );
} 