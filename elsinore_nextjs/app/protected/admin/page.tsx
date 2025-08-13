import { redirect } from 'next/navigation'
import { UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error || !profile) {
    redirect('/auth/login');
  }
  if (profile.role !== UserRole.ADMIN && profile.role !== UserRole.SUPER) {
    redirect('/unauthorized');
  }
  return (
    <div className="flex flex-col min-h-svh w-full p-6 md:p-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button asChild>
          <Link href="/protected">Back to Dashboard</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="text-muted-foreground mb-4">
            Manage user accounts, roles, and permissions.
          </p>
          <Button asChild variant="outline">
            <Link href="/protected/admin/users">Manage Users</Link>
          </Button>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">System Settings</h2>
          <p className="text-muted-foreground mb-4">
            Configure system-wide settings and preferences.
          </p>
          <Button variant="outline">Configure Settings</Button>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <p className="text-muted-foreground mb-4">
            View system usage statistics and reports.
          </p>
          <Button variant="outline">View Analytics</Button>
        </div>
      </div>
    </div>
  )
} 