import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with service role for admin operations
 * This should only be used in server-side code
 * @returns A Supabase client with service role
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or service role key')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Fetches all user profiles using the service role client
 * This should only be used in server-side code
 * @returns Array of user profiles or null if error
 */
export async function getAllProfilesWithServiceRole() {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
  
  if (error) {
    console.error('Error fetching all profiles with service role:', error)
    return null
  }
  
  return data
}

/**
 * Updates a user's role using the service role client
 * This should only be used in server-side code
 * @param userId The ID of the user to update
 * @param newRole The new role to assign
 * @returns True if successful, false otherwise
 */
export async function updateUserRoleWithServiceRole(userId: string, newRole: string) {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
  
  if (error) {
    console.error('Error updating user role with service role:', error)
    return false
  }
  
  return true
} 