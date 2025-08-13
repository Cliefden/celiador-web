"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MenuDropdown } from './menu-dropdown';

export default function MenuBar() {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setName(null);
        return;
      }
      // Fetch individual's name fields
      const { data: individual } = await supabase
        .from('individuals')
        .select('name_prefix, first_name, middle_name, pre_last_name, last_name, name_suffix, email')
        .eq('id', user.id)
        .single();
      let fullName = '';
      if (individual) {
        const nameParts = [
          individual.name_prefix,
          individual.first_name,
          individual.middle_name,
          individual.pre_last_name,
          individual.last_name,
          individual.name_suffix,
        ];
        fullName = nameParts.filter(Boolean).join(' ');
      }
      setName(fullName || individual?.email || user.email || '');
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading || !name) return null;
  return <MenuDropdown onLogout={handleLogout} name={name} />;
} 