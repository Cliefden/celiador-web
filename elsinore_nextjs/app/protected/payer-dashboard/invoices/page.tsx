"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Invoice, Org } from "@/lib/types";

export default function PayerInvoicesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [supplierOrgMap, setSupplierOrgMap] = useState<Record<string, Org>>({});
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
      // Get payer orgs for this user
      const { data: payerRows } = await supabase
        .from("invoice_disbursers")
        .select("organisation")
        .eq("disburser", userData.user.id);
      const payerOrgIds = payerRows ? payerRows.map((row: { organisation: string }) => row.organisation) : [];
      // Find all client orgs for which any payer org is a payer (from payer_tos)
      let clientIds: string[] = [];
      if (payerOrgIds.length > 0) {
        const { data: payerToRows } = await supabase
          .from("payer_tos")
          .select("client")
          .in("payer", payerOrgIds);
        clientIds = payerToRows ? payerToRows.map((row: { client: string }) => row.client) : [];
      }
      // Fetch invoices where client is in these client org ids
      let fetchedInvoices: Invoice[] = [];
      if (clientIds.length > 0) {
        const { data: invData } = await supabase
          .from("invoices")
          .select("*")
          .in("client", clientIds)
          .order("issue_date", { ascending: false });
        if (invData) {
          fetchedInvoices = invData;
        }
      }
      setInvoices(fetchedInvoices);
      // Get supplier orgs for these invoices
      const supplierIds = Array.from(new Set(fetchedInvoices.map(inv => inv.supplier).filter(Boolean)));
      const supplierMap: Record<string, Org> = {};
      if (supplierIds.length > 0) {
        const { data: supplierOrgs } = await supabase
          .from("organisations")
          .select("id, name")
          .in("id", supplierIds);
        if (supplierOrgs) {
          for (const org of supplierOrgs) {
            supplierMap[org.id] = org;
          }
        }
      }
      setSupplierOrgMap(supplierMap);
      // Get client orgs for these invoices
      const clientOrgIds = Array.from(new Set(fetchedInvoices.map(inv => inv.client).filter(Boolean)));
      const clientMap: Record<string, Org> = {};
      if (clientOrgIds.length > 0) {
        const { data: clientOrgs } = await supabase
          .from("organisations")
          .select("id, name")
          .in("id", clientOrgIds);
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
                  <th className="px-4 py-2 text-left">Supplier</th>
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
                    <td className="px-4 py-2">{supplierOrgMap[inv.supplier]?.name || <span className="text-zinc-400">(unknown)</span>}</td>
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