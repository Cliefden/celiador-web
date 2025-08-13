import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/profile'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get the current profile to verify ownership
    const currentProfile = await getUserProfile()
    if (!currentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    
    // Get the request body
    const body = await request.json()
    
    // Validate the request body
    const allowedFields = ['first_name', 'middle_name', 'pre_last_name', 'last_name', 'personal_id']
    const updates: Record<string, string | null> = {}
    
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field] || null
      }
    }
    
    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 