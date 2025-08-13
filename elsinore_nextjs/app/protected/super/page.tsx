import { redirect } from 'next/navigation'
import { UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function SuperAdminPage() {
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
  if (profile.role !== UserRole.SUPER) {
    redirect('/unauthorized');
  }
  return (
    <div className="flex flex-col min-h-svh w-full p-6 md:p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Admin Management</h2>
          <p className="text-muted-foreground mb-4">
            Manage admin accounts and permissions.
          </p>
          <Button variant="outline">Manage Admins</Button>
        </div>
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">System Configuration</h2>
          <p className="text-muted-foreground mb-4">
            Configure advanced system settings and features.
          </p>
          <Button variant="outline">Configure System</Button>
        </div>
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
          <p className="text-muted-foreground mb-4">
            View detailed system audit logs and activity.
          </p>
          <Button variant="outline">View Logs</Button>
        </div>
      </div>
    </div>
  )
} 