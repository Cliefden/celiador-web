import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function SuperAdminSettings() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile || profile.role !== UserRole.SUPER) {
    console.error('Access denied - User role:', profile?.role)
    redirect('/unauthorized')
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-4">
        <div className="grid gap-6">
          <section className="p-6 bg-zinc-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Application Settings</h2>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800 rounded-lg">
                <h3 className="font-medium mb-2 text-white">Invoice Configuration</h3>
                <p className="text-gray-400 text-sm mb-3">Configure default invoice settings and approval workflows.</p>
                <Button variant="outline" disabled>
                  Configure Invoice Settings
                </Button>
              </div>
              
              <div className="p-4 bg-zinc-800 rounded-lg">
                <h3 className="font-medium mb-2 text-white">Currency Management</h3>
                <p className="text-gray-400 text-sm mb-3">Manage supported currencies and exchange rates.</p>
                <Button variant="outline" disabled>
                  Manage Currencies
                </Button>
              </div>
              
              <div className="p-4 bg-zinc-800 rounded-lg">
                <h3 className="font-medium mb-2 text-white">Organization Settings</h3>
                <p className="text-gray-400 text-sm mb-3">Configure organization registration and approval processes.</p>
                <Button variant="outline" disabled>
                  Configure Organizations
                </Button>
              </div>
            </div>
          </section>

          <section className="p-6 bg-zinc-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Security Settings</h2>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800 rounded-lg">
                <h3 className="font-medium mb-2 text-white">User Access Control</h3>
                <p className="text-gray-400 text-sm mb-3">Manage user roles and permissions across the platform.</p>
                <Link href="/protected/admin/users">
                  <Button variant="outline">
                    Manage User Access
                  </Button>
                </Link>
              </div>
              
              <div className="p-4 bg-zinc-800 rounded-lg">
                <h3 className="font-medium mb-2 text-white">API Configuration</h3>
                <p className="text-gray-400 text-sm mb-3">Configure API rate limits and access controls.</p>
                <Button variant="outline" disabled>
                  Configure API Settings
                </Button>
              </div>
              
              <div className="p-4 bg-zinc-800 rounded-lg">
                <h3 className="font-medium mb-2 text-white">Audit Logging</h3>
                <p className="text-gray-400 text-sm mb-3">Configure system audit logging and retention policies.</p>
                <Button variant="outline" disabled>
                  Configure Audit Settings
                </Button>
              </div>
            </div>
          </section>

          <section className="p-6 bg-zinc-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">System Information</h2>
            <div className="space-y-3 text-gray-300">
              <p className="flex items-center">
                <span className="font-medium w-32 text-gray-400">Version:</span>
                <span>1.0.0</span>
              </p>
              <p className="flex items-center">
                <span className="font-medium w-32 text-gray-400">Environment:</span>
                <span>Development</span>
              </p>
              <p className="flex items-center">
                <span className="font-medium w-32 text-gray-400">Database:</span>
                <span>Supabase PostgreSQL</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
} 