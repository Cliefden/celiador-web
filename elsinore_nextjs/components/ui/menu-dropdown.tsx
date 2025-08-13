import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

function AccountModal({ open, onClose, profile }: { open: boolean; onClose: () => void; profile: { name: string; email: string; organisation: string; role: string; memberSince: string } }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Information</DialogTitle>
          <DialogDescription>
            Your account details and organization information.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Name</span>
              <span className="text-sm">{profile.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Email</span>
              <span className="text-sm">{profile.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Organization</span>
              <span className="text-sm">{profile.organisation}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Role</span>
              <Badge variant="secondary" className="capitalize">{profile.role}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Member Since</span>
              <span className="text-sm">{profile.memberSince}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your application preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Theme</label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred theme
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={toggleTheme}
              className="w-24"
            >
              {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </Button>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MenuDropdown({ onLogout, name }: { onLogout: () => void; name: string }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; email: string; organisation: string; role: string; memberSince: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Fetch profile info for modal when Account is clicked
  const handleAccountClick = async () => {
    setAccountOpen(true);
    // Always fetch fresh profile info for accuracy
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Fetch individual's name fields
    const { data: individual } = await supabase
      .from('individuals')
      .select('name_prefix, first_name, middle_name, pre_last_name, last_name, name_suffix, email')
      .eq('id', user.id)
      .single();
    // Fetch full profile row
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    // Name logic (dashboard style)
    let fullName = '';
    if (profile) {
      fullName = [
        profile.name_prefix,
        profile.first_name,
        profile.middle_name,
        profile.pre_last_name,
        profile.last_name,
        profile.name_suffix
      ].filter(Boolean).join(' ');
    }
    if (!fullName) {
      if (individual) {
        fullName = [
          individual.name_prefix,
          individual.first_name,
          individual.middle_name,
          individual.pre_last_name,
          individual.last_name,
          individual.name_suffix
        ].filter(Boolean).join(' ') || '';
      }
      if (!fullName) {
        fullName = 'No name set';
      }
    }
    // Organisation logic (dashboard style, role aware)
    let organisationName = '';
    if (profile && profile.role) {
      try {
        if (profile.role === 'client') {
          const { getClientOrganisationsForUser } = await import('@/lib/supabase/profile');
          const orgs = await getClientOrganisationsForUser(user.id);
          if (orgs && orgs.length > 0) {
            organisationName = orgs.map((org: { name: string }) => org.name).join(', ');
          }
        } else if (profile.role === 'payer') {
          const { getPayerOrganisationsForUser } = await import('@/lib/supabase/profile');
          const orgs = await getPayerOrganisationsForUser(user.id);
          if (orgs && orgs.length > 0) {
            organisationName = orgs.map((org: { name: string }) => org.name).join(', ');
          }
        } else {
          const { getOrganisationForSupplierSubmitter } = await import('@/lib/supabase/profile');
          const organisation = await getOrganisationForSupplierSubmitter(user.id);
          if (organisation && organisation.name) {
            organisationName = organisation.name;
          }
        }
      } catch {
        organisationName = '';
      }
    }
    // Role and member since
    let role = '';
    let memberSince = '';
    if (profile) {
      role = profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : '';
      memberSince = profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '';
    }
    setProfile({
      name: fullName,
      email: individual?.email || user.email || '',
      organisation: organisationName || 'Not connected',
      role: role || 'Unknown',
      memberSince: memberSince || 'Unknown',
    });
  };

  return (
    <div ref={ref} className="flex items-center space-x-4 relative">
      <span className="font-medium text-sm text-muted-foreground max-w-[200px] truncate">
        {name}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="4" r="1.5" fill="currentColor" />
          <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          <circle cx="10" cy="16" r="1.5" fill="currentColor" />
        </svg>
      </Button>
      {open && (
        <div className="absolute right-0 top-10 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg min-w-[180px] z-50 p-1">
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-3"
            onClick={() => { setOpen(false); setSettingsOpen(true); }}
          >
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-3"
            onClick={() => { setOpen(false); handleAccountClick(); }}
          >
            Account
          </Button>
          <Separator className="my-1" />
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-3 text-destructive hover:text-destructive"
            onClick={onLogout}
          >
            Log Out
          </Button>
        </div>
      )}
      <AccountModal 
        open={accountOpen} 
        onClose={() => { setAccountOpen(false); setProfile(null); }} 
        profile={profile || { name: '', email: '', organisation: '', role: '', memberSince: '' }} 
      />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export { SettingsModal }; 