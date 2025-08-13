"use client";
import { MenuDropdown } from './menu-dropdown';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function MenuBarUserAreaClient({ name }: { name: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return <MenuDropdown onLogout={handleLogout} name={name} />;
} 