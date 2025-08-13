import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/auth/login')
  }
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (profileError || !profile) {
    redirect('/auth/login')
  }
  return (
    <div className="flex flex-col min-h-svh w-full items-center justify-center gap-6 p-8">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <Button asChild variant="outline">
            <Link href="/protected">Back to Dashboard</Link>
          </Button>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <ProfileForm profile={profile} />
        </div>
      </div>
    </div>
  )
} 