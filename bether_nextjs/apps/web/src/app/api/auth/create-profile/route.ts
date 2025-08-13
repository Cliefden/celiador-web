import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create service client that bypasses RLS
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { userId, profileData } = await request.json();

    if (!userId || !profileData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create profile using service role (bypasses RLS)
    const { data, error } = await supabaseService
      .from('profiles')
      .insert([
        {
          id: userId,
          email: profileData.email,
          username: profileData.username,
          full_name: profileData.full_name,
          website: profileData.website,
          avatar_url: profileData.avatar_url,
          role: 'user', // Default role
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
