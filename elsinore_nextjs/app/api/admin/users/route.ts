import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/profile'
import { UserRole } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase/service-client'

// GET /api/admin/users - Get all users (admin/super admin only)
export async function GET() {
  // Check if the user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check if the user is an admin or super admin
  const profile = await getUserProfile()
  
  if (!profile || (profile.role !== UserRole.ADMIN && profile.role !== UserRole.SUPER)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Get all profiles using the service role client
  const serviceClient = createServiceClient()
  
  const { data, error } = await serviceClient
    .from('profiles')
    .select('*')
  
  if (error || !data) {
    console.error('Error fetching all profiles:', error)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }
  
  return NextResponse.json({ profiles: data })
}

// PATCH /api/admin/users/:id - Update a user's role (super admin only)
export async function PATCH(request: NextRequest) {
  // Check if the user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check if the user is a super admin
  const profile = await getUserProfile()
  
  if (!profile || profile.role !== UserRole.SUPER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Get the user ID and new role from the request
  const { userId, newRole } = await request.json()
  
  if (!userId || !newRole) {
    return NextResponse.json({ error: 'Missing userId or newRole' }, { status: 400 })
  }
  
  // Validate the new role
  if (!Object.values(UserRole).includes(newRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  
  // Update the user's role using the service role client
  const serviceClient = createServiceClient()
  
  const { error } = await serviceClient
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
  
  if (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
} 