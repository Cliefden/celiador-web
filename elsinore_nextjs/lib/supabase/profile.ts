import { createClient } from '@/lib/supabase/client'
import { UserProfile, Individual } from '@/lib/types'
import { UserRole } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase/service-client'
import type { Invoice } from '@/lib/types'

/**
 * Fetches the user profile for the currently authenticated user
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return profile
}

/**
 * Fetches a user profile by ID
 */
export async function getUserProfileById(id: string): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return profile
}

/**
 * Creates or updates an individual profile
 */
export async function upsertIndividual(individual: Partial<Individual>): Promise<Individual | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('individuals')
    .upsert(individual)
    .select()
    .single()

  if (error) {
    console.error('Error upserting individual:', error)
    return null
  }

  return data
}

/**
 * Updates a user's profile
 */
export async function updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    return null
  }

  return data
}

/**
 * Fetches all user profiles (admin/super admin only)
 * @returns Array of user profiles or null if error
 */
export async function getAllUserProfiles(): Promise<UserProfile[] | null> {
  // Check if the current user is an admin or super admin
  const currentUser = await getUserProfile()
  
  if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPER)) {
    console.error('Unauthorized: User is not an admin or super admin')
    return null
  }
  
  // Use service role client to avoid infinite recursion
  const serviceClient = createServiceClient()
  
  const { data, error } = await serviceClient
    .from('profiles')
    .select('*')
  
  if (error || !data) {
    console.error('Error fetching all user profiles:', error)
    return null
  }
  
  return data.map((profile: UserProfile) => ({
    id: profile.id,
    role: profile.role as UserRole,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    first_name: profile.first_name,
    middle_name: profile.middle_name,
    pre_last_name: profile.pre_last_name,
    last_name: profile.last_name,
    personal_id: profile.personal_id,
    name_prefix: profile.name_prefix,
    name_suffix: profile.name_suffix,
    email: profile.email,
  }))
}

/**
 * Updates a user's role (super admin only)
 * @param userId The ID of the user to update
 * @param newRole The new role to assign
 * @returns True if successful, false otherwise
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
  // Check if the current user is a super admin
  const currentUser = await getUserProfile()
  
  if (!currentUser || currentUser.role !== UserRole.SUPER) {
    console.error('Unauthorized: User is not a super admin')
    return false
  }
  
  // Use service role client to avoid infinite recursion
  const serviceClient = createServiceClient()
  
  const { error } = await serviceClient
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
  
  if (error) {
    console.error('Error updating user role:', error)
    return false
  }
  
  return true
}

/**
 * Checks if the current user has a specific role
 * @param requiredRole The role to check for
 * @returns True if the user has the required role or higher
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const profile = await getUserProfile()
  
  if (!profile) {
    return false
  }
  
  // Role hierarchy: super > admin > user
  if (profile.role === UserRole.SUPER) {
    return true
  }
  
  if (profile.role === UserRole.ADMIN && requiredRole !== UserRole.SUPER) {
    return true
  }
  
  return profile.role === requiredRole
}

/**
 * Checks if the current user is a super admin
 * @returns True if the user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  return hasRole(UserRole.SUPER)
}

/**
 * Checks if the current user is an admin
 * @returns True if the user is an admin or super admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole(UserRole.ADMIN)
}

/**
 * Fetches an individual by ID (same as user/profile id)
 */
export async function getIndividualById(id: string): Promise<Individual | null> {
  const supabase = await createClient()
  const { data: individual, error } = await supabase
    .from('individuals')
    .select('*')
    .eq('id', id)
    .single()
  if (error) {
    console.error('Error fetching individual:', error)
    return null
  }
  return individual
}

/**
 * Fetches the organisation the user is connected to through the invoice_submitters table (for supplier permissions)
 */
export async function getOrganisationForSupplierSubmitter(userId: string) {
  const supabase = await createClient()
  // Find the first invoice_submitters row for this user
  const { data: supplierSubmitterRow, error: supplierSubmitterError } = await supabase
    .from('invoice_submitters')
    .select('organisation')
    .eq('submitter', userId)
    .limit(1)
    .single()
  if (supplierSubmitterError || !supplierSubmitterRow) {
    return null
  }
  // Fetch the organisation record
  const { data: organisation, error: orgError } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', supplierSubmitterRow.organisation)
    .single()
  if (orgError || !organisation) {
    return null
  }
  return organisation
}

/**
 * Fetches all invoices issued by a given organisation (where organisation.id = invoices.supplier)
 */
export async function getInvoicesForOrganisation(organisationId: string) {
  const supabase = await createClient()
  // Fetch invoices with invoice_type cash_discount and maturity
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*, invoice_type:invoice_types(id, cash_discount, maturity, for_payer)')
    .eq('supplier', organisationId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Error fetching invoices:', error)
    return []
  }

  // Get all invoice IDs
  const invoiceIds = invoices.map((inv: unknown) => (inv as Invoice).id)

  // Fetch all payments for these invoices
  const paymentSumMap: Record<string, number> = {}
  const repaymentSumMap: Record<string, number> = {}
  if (invoiceIds.length > 0) {
    // Fetch invoice_payments
    const { data: payments, error: paymentError } = await supabase
      .from('invoice_payments')
      .select('invoice, amount')
      .in('invoice', invoiceIds)
    if (!paymentError && payments) {
      for (const p of payments) {
        if (!paymentSumMap[p.invoice]) paymentSumMap[p.invoice] = 0
        paymentSumMap[p.invoice] += p.amount || 0
      }
    }
    // Fetch repayments
    const { data: repayments, error: repaymentError } = await supabase
      .from('repayments')
      .select('invoice, amount')
      .in('invoice', invoiceIds)
    if (!repaymentError && repayments) {
      for (const r of repayments) {
        if (!repaymentSumMap[r.invoice]) repaymentSumMap[r.invoice] = 0
        repaymentSumMap[r.invoice] += r.amount || 0
      }
    }
  }
  // Attach payment_sum, repayment_sum, and invoice_type to each invoice
  return invoices.map((inv: unknown) => ({
    ...(inv as Invoice),
    payment_sum: paymentSumMap[(inv as Invoice).id] || 0,
    repayment_sum: repaymentSumMap[(inv as Invoice).id] || 0,
    invoice_type: (inv as Invoice).invoice_type || {},
    cash_discount: ((inv as Invoice).invoice_type as { cash_discount?: number })?.cash_discount ?? 0,
    for_payer: ((inv as Invoice).invoice_type as { for_payer?: number })?.for_payer ?? 0,
    payments: [],
    repayments: [],
  }))
}

// Define Org interface at the top if not present
export interface Org {
  id: string;
  name: string;
  // Add other fields as needed
}

/**
 * Fetches multiple organisations by an array of IDs and returns a map from id to organisation
 */
export async function getOrganisationsByIds(ids: string[]): Promise<Record<string, Org>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .in('id', ids)
  if (error || !data) {
    console.error('Error fetching organisations:', error)
    return {}
  }
  const orgMap: Record<string, Org> = {}
  for (const org of data) {
    orgMap[org.id] = org
  }
  return orgMap
}

/**
 * Fetches all organisations
 */
export async function getAllOrganisations() {
  const supabase = await createClient()
  const { data: orgs, error } = await supabase
    .from('organisations')
    .select('*')
  if (error || !orgs) {
    console.error('Error fetching all organisations:', error)
    return []
  }
  return orgs
}

/**
 * Fetches all currencies and returns a map from id (UUID) to symbol
 */
export async function getCurrencySymbolMap(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data: currencies, error } = await supabase
    .from('currencies')
    .select('id, identifier')
  if (error || !currencies) {
    console.error('Error fetching currencies:', error)
    return {}
  }
  const map: Record<string, string> = {}
  for (const c of currencies) {
    if (c.id) map[c.id] = c.identifier
  }
  return map
}

/**
 * Fetches all currencies (id and identifier)
 */
export async function getAllCurrencies() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('currencies')
    .select('id, identifier')
  if (error || !data) {
    console.error('Error fetching currencies:', error)
    return []
  }
  return data
}

/**
 * Fetches all organisations for a user via the invoice_disbursers table (for client permissions)
 */
export async function getClientOrganisationsForUser(userId: string) {
  const supabase = await createClient()
  // Get all invoice_disbursers rows for this user
  const { data: clientDisburserRows, error: clientDisburserError } = await supabase
    .from('invoice_disbursers')
    .select('*')
    .eq('disburser', userId)
    .is('deleted_at', null);
  if (clientDisburserError || !clientDisburserRows || clientDisburserRows.length === 0) {
    return [];
  }
  const orgIds = clientDisburserRows.map((row: unknown) => (row as Row).organisation)
  // Fetch the organisation records
  const { data: organisations, error: orgError } = await supabase
    .from('organisations')
    .select('*')
    .in('id', orgIds)
  if (orgError || !organisations) {
    return []
  }
  return organisations
}

/**
 * Fetches all organisations for a user via the invoice_payers table (for payer permissions)
 */
export async function getPayerOrganisationsForUser(userId: string) {
  const supabase = await createClient()
  // Get all invoice_payers rows for this user
  const { data: payerOrgRows, error: payerOrgError } = await supabase
    .from('invoice_payers')
    .select('organisation')
    .eq('payer', userId)
  if (payerOrgError || !payerOrgRows || payerOrgRows.length === 0) {
    return []
  }
  const orgIds = payerOrgRows.map((row: unknown) => (row as Row).organisation)
  // Fetch the organisation records
  const { data: organisations, error: orgError } = await supabase
    .from('organisations')
    .select('*')
    .in('id', orgIds)
  if (orgError || !organisations) {
    return []
  }
  return organisations
}

// Define interfaces for Invoice and Row
interface Row {
  organisation: string;
  [key: string]: unknown;
}

interface ClientInvoiceTypeRow {
  invoice_type:
    | {
        id?: string;
        cash_discount?: number;
        maturity?: number;
        maturity_request?: number;
        for_payer?: number;
      }
    | null
    | Array<{
        id?: string;
        cash_discount?: number;
        maturity?: number;
        maturity_request?: number;
        for_payer?: number;
      }>;
}

/**
 * Fetches allowed invoice types for a client (by client org id)
 */
export async function getAllowedInvoiceTypesForClient(clientId: string) {
  const supabase = await createClient()
  // Join clients_invoice_types and invoice_types
  const { data, error } = await supabase
    .from('clients_invoice_types')
    .select('invoice_type:invoice_types(id, cash_discount, maturity, maturity_request, for_payer)')
    .eq('client', clientId)
  if (error || !data) {
    console.error('Error fetching allowed invoice types:', error)
    return []
  }
  // Correctly map the joined invoice_type object
  return data.map((row: ClientInvoiceTypeRow) => {
    const t = Array.isArray(row.invoice_type)
      ? row.invoice_type[0] || {}
      : row.invoice_type || {};
    return {
      id: t.id,
      cash_discount: t.cash_discount,
      maturity: t.maturity,
      for_payer: t.for_payer,
      display_name: `${t.maturity ?? ''} days${t.cash_discount ? `, ${t.cash_discount * 100}% discount` : ''}${t.for_payer ? ', for payer' : ''}`,
    }
  })
} 