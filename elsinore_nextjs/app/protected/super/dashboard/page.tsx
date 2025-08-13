"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserRole, UserProfile } from '@/lib/types';
import { SuperAdminKanbanClient } from '@/components/super-admin-kanban-client';
import type { User } from '@supabase/supabase-js';

export default function SuperAdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const supabase = createClient();
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user) {
        router.replace('/auth/login');
        return;
      }
      setUser(userData.user);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();
      if (!profileData || (profileData.role !== UserRole.SUPER && profileData.role !== UserRole.ADMIN)) {
        router.replace('/unauthorized');
        return;
      }
      setProfile(profileData);
      setLoading(false);
    }
    fetchUser();
  }, [router]);

  if (loading) return <div className="text-gray-400 p-4">Loading...</div>;
  if (!user || !profile) return null;

  // Render the client Kanban component
  return <SuperAdminKanbanClient />;
} 