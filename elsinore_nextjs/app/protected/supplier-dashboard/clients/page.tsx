"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Org {
  id: string;
  name: string;
  email?: string;
  org_nr: string;
}

export default function SupplierClientsPage() {
  const [clients, setClients] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [pendingStats, setPendingStats] = useState<Record<string, { count: number, total: number }>>({});

  useEffect(() => {
    async function fetchClients() {
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
      if (profile.role !== "supplier") {
        setError(`Not authorized: your role is '${profile.role ?? 'none'}' (must be 'supplier')`);
        setLoading(false);
        return;
      }
      // Find all supplier orgs for which this user is a submitter
      const { data: submitterRows } = await supabase
        .from("invoice_submitters")
        .select("organisation, submitter, id, deleted_at")
        .eq("submitter", profile.id);
      const supplierOrgIds = submitterRows ? Array.from(new Set(submitterRows.map(row => row.organisation).filter(Boolean))) : [];
      // Find all clients for these supplier orgs using supplier_tos
      let clientIds: string[] = [];
      if (supplierOrgIds.length > 0) {
        const { data: supplierToRows } = await supabase
          .from("supplier_tos")
          .select("client")
          .in("supplier", supplierOrgIds)
          .is("deleted_at", null);
        clientIds = supplierToRows ? Array.from(new Set(supplierToRows.map(row => row.client).filter(Boolean))) : [];
      }
      // Fetch client org details
      let clientOrgs: Org[] = [];
      if (clientIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organisations")
          .select("id, name, org_nr")
          .in("id", clientIds);
        clientOrgs = orgs || [];
      }
      setClients(clientOrgs);
      // Fetch pending invoice stats for each client
      const stats: Record<string, { count: number, total: number }> = {};
      if (clientOrgs.length > 0 && supplierOrgIds.length > 0) {
        const { data: invoices } = await supabase
          .from("invoices")
          .select("client, amount, rejected_at, repaid_at, supplier")
          .in("client", clientOrgs.map(c => c.id))
          .in("supplier", supplierOrgIds);
        for (const client of clientOrgs) {
          const clientInvoices = (invoices || []).filter(inv => inv.client === client.id && !inv.rejected_at && !inv.repaid_at);
          stats[client.id] = {
            count: clientInvoices.length,
            total: clientInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
          };
        }
      }
      setPendingStats(stats);
      setDebugInfo(
        `User ID: ${userData.user.id}\nProfile ID: ${profile.id}\nInvoice Submitters: ${JSON.stringify(submitterRows, null, 2)}\nSupplier Org IDs: ${JSON.stringify(supplierOrgIds)}\nClient IDs: ${JSON.stringify(clientIds)}`
      );
      setLoading(false);
    }
    fetchClients();
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Clients</h1>
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
                {clients.map((client) => (
                  <tr key={client.id} className="border-t border-zinc-200 dark:border-zinc-700">
                    <td className="px-4 py-2">{client.name}</td>
                    <td className="px-4 py-2">{client.org_nr}</td>
                    <td className="px-4 py-2">{pendingStats[client.id]?.count ?? 0}</td>
                    <td className="px-4 py-2">{pendingStats[client.id]?.total?.toLocaleString() ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clients.length === 0 && (
              <div className="text-zinc-500 p-4">
                No clients found.<br />
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 