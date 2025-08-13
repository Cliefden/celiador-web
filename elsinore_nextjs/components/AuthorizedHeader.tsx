"use client";

import Link from "next/link";
import { MenuDropdown } from "@/components/ui/menu-dropdown";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AuthorizedHeader = () => {
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

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/protected" className="flex items-center space-x-2">
            <img 
              src="/elsinore_logo.png" 
              alt="Elsinore Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold text-foreground">elsinore</span>
          </Link>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <MenuDropdown onLogout={handleLogout} name={name} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AuthorizedHeader; 