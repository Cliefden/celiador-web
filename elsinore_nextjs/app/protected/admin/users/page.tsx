import { redirect } from 'next/navigation'
import { UserRole, UserProfile, Individual } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { UserManagementClient } from '@/components/user-management-client'

export default async function UserManagementPage() {
  // Get the current user's profile (dashboard style)
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
  // Get all user profiles using the service role client
  const serviceClient = createServiceClient();
  const { data: profiles, error: profilesError } = await serviceClient
    .from('profiles')
    .select('*');
  const { data: individuals, error: individualsError } = await serviceClient
    .from('individuals')
    .select('id, email, first_name, middle_name, pre_last_name, last_name, name_prefix, name_suffix');
  if (profilesError || !profiles || individualsError || !individuals) {
    return (
      <div className="flex flex-col min-h-svh w-full p-6 md:p-10">
        <div className="p-6 border rounded-lg">
          <p className="text-muted-foreground">Failed to load user profiles.</p>
        </div>
      </div>
    )
  }
  type UserProfileWithName = UserProfile & { fullName?: string };
  const individualMap = new Map<string, { email: string; fullName: string }>();
  (individuals as Individual[]).forEach(ind => {
    const nameParts = [
      ind.name_prefix,
      ind.first_name,
      ind.middle_name,
      ind.pre_last_name,
      ind.last_name,
      ind.name_suffix
    ].filter(Boolean);
    individualMap.set(ind.id, {
      email: ind.email,
      fullName: nameParts.join(' ') || '',
    });
  });
  const userProfiles: UserProfileWithName[] = (profiles as UserProfile[]).map(profile => {
    const individual = individualMap.get(profile.id) || { email: '', fullName: '' };
    return {
      ...profile,
      email: individual.email,
      fullName: individual.fullName,
    };
  });
  return (
    <div className="flex flex-col min-h-svh w-full p-6 md:p-10">
      <div className="p-6 border rounded-lg">
        <UserManagementClient 
          profiles={userProfiles} 
          currentUserRole={profile?.role || UserRole.USER} 
        />
      </div>
    </div>
  )
} 