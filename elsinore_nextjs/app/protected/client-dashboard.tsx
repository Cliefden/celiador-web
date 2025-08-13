import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase/server'
import { getIndividualById, getOrganisationForSupplierSubmitter, getOrganisationsByIds, getCurrencySymbolMap } from '@/lib/supabase/profile'
import { InvoiceTable } from '@/components/invoice-table'
import { MemberSince } from '@/components/member-since'
import type { Invoice, Org } from '@/lib/types'

export default async function ClientDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null // This should never happen due to middleware protection
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error('Error fetching profile:', error)
    return null // This should never happen due to middleware protection
  }
  const nonNullProfile = profile;

  const individual = await getIndividualById(user.id)

  let fullName = [
    nonNullProfile.name_prefix,
    nonNullProfile.first_name,
    nonNullProfile.middle_name,
    nonNullProfile.pre_last_name,
    nonNullProfile.last_name,
    nonNullProfile.name_suffix
  ].filter((x): x is string => Boolean(x)).join(' ') || ''

  if (!fullName) {
    if (individual) {
      fullName = [
        (individual as { name_prefix?: string }).name_prefix,
        (individual as { first_name?: string }).first_name,
        (individual as { middle_name?: string }).middle_name,
        (individual as { pre_last_name?: string }).pre_last_name,
        (individual as { last_name?: string }).last_name,
        (individual as { name_suffix?: string }).name_suffix
      ].filter((x): x is string => Boolean(x)).join(' ') || ''
    }
    if (!fullName) {
      fullName = 'No name set'
    }
  }
  
  let organisationName = ''
  const organisation = await getOrganisationForSupplierSubmitter(user.id)
  if (organisation) {
    organisationName = (organisation as { name?: string }).name ?? "undefined"
  }

  // Fetch invoices where this organisation is the client
  let invoices: Invoice[] = []
  if (organisation) {
    const supabaseClient = await createClient()
    const { data, error } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('client', (organisation as { id?: string }).id)
      .order('issue_date', { ascending: false })
    if (!error && data) {
      invoices = data
    }
  }

  let supplierOrgMap: Record<string, Org> = {}
  if (invoices.length > 0) {
    const supplierIds = Array.from(new Set((invoices as Invoice[]).map(inv => (inv as { supplier?: string }).supplier).filter((x): x is string => Boolean(x))))
    supplierOrgMap = await getOrganisationsByIds(supplierIds)
  }

  let currencySymbolMap: Record<string, string> = {}
  currencySymbolMap = await getCurrencySymbolMap()

  const createdAt = nonNullProfile.created_at ?? "";

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-8 bg-zinc-900 p-4 rounded-lg">
          <h1 className="text-2xl font-bold text-white">Welcome to Your Client Dashboard</h1>
          <LogoutButton />
        </header>
        <div className="grid gap-6">
          <section className="p-6 bg-zinc-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Your Profile</h2>
            <div className="space-y-3 text-gray-300">
              <p className="flex items-center">
                <span className="font-medium w-32 text-gray-400">Name:</span>
                <span>{fullName}</span>
              </p>
              <p className="flex items-center">
                <span className="font-medium w-32 text-gray-400">Email:</span>
                <span>{user.email}</span>
              </p>
              <p className="flex items-center">
                <span className="font-medium w-32 text-gray-400">Organisation:</span>
                <span>{organisationName || 'Not connected'}</span>
              </p>
              <p className="flex items-center">
                <span className="font-medium w-32 text-gray-400">Role:</span>
                <span>{nonNullProfile.role?.charAt(0).toUpperCase() + nonNullProfile.role?.slice(1) || ''}</span>
              </p>
              <p className="flex items-center">
                <span className="font-medium w-32 text-gray-400">Member since:</span>
                <span><MemberSince date={createdAt} /></span>
              </p>
            </div>
          </section>
        </div>
      </div>
      {organisation && invoices.length > 0 && (
        <div className="container mx-auto p-4 mt-6">
          <div className="bg-zinc-900 rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4 text-white">Received Invoices</h2>
            <InvoiceTable invoices={invoices as Invoice[]} currencySymbolMap={currencySymbolMap} partyColumn={{ label: 'Supplier', orgMap: supplierOrgMap, field: 'supplier' }} />
          </div>
        </div>
      )}
    </main>
  )
} 