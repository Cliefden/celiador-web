'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  Building2,
  UserCheck,
  Shield,
  ChevronRight
} from 'lucide-react';
import AuthorizedHeader from '@/components/AuthorizedHeader';

function Sidebar() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setRole(profile?.role || null);
    }
    fetchRole();
  }, []);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'supplier': return 'Supplier';
      case 'client': return 'Client';
      case 'payer': return 'Payer';
      case 'super': return 'Super Admin';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'supplier': return 'default';
      case 'client': return 'secondary';
      case 'payer': return 'outline';
      case 'super': return 'destructive';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  const renderSidebarContent = () => {
    if (role === 'supplier') {
      return (
        <nav className="flex-1 p-6 space-y-3">
          <Link href="/protected/supplier-dashboard">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-all duration-200">
              <LayoutDashboard className="mr-4 h-5 w-5 text-blue-600 group-hover:text-blue-700" />
              <span className="font-medium">Dashboard</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/supplier-dashboard/invoices">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-all duration-200">
              <FileText className="mr-4 h-5 w-5 text-blue-600 group-hover:text-blue-700" />
              <span className="font-medium">Invoices</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/supplier-dashboard/clients">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-all duration-200">
              <Users className="mr-4 h-5 w-5 text-blue-600 group-hover:text-blue-700" />
              <span className="font-medium">Clients</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/supplier-dashboard/analytics">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-all duration-200">
              <BarChart3 className="mr-4 h-5 w-5 text-blue-600 group-hover:text-blue-700" />
              <span className="font-medium">Analytics</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
        </nav>
      );
    }
    
    if (role === 'client') {
      return (
        <nav className="flex-1 p-6 space-y-3">
          <Link href="/protected/client-dashboard">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/20 dark:hover:to-green-800/20 transition-all duration-200">
              <LayoutDashboard className="mr-4 h-5 w-5 text-green-600 group-hover:text-green-700" />
              <span className="font-medium">Dashboard</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/invoices">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/20 dark:hover:to-green-800/20 transition-all duration-200">
              <FileText className="mr-4 h-5 w-5 text-green-600 group-hover:text-green-700" />
              <span className="font-medium">Invoices</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/client-dashboard/suppliers">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/20 dark:hover:to-green-800/20 transition-all duration-200">
              <Building2 className="mr-4 h-5 w-5 text-green-600 group-hover:text-green-700" />
              <span className="font-medium">Suppliers</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/client-dashboard/analytics">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/20 dark:hover:to-green-800/20 transition-all duration-200">
              <BarChart3 className="mr-4 h-5 w-5 text-green-600 group-hover:text-green-700" />
              <span className="font-medium">Analytics</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
        </nav>
      );
    }
    
    if (role === 'payer') {
      return (
        <nav className="flex-1 p-6 space-y-3">
          <Link href="/protected/payer-dashboard">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 dark:hover:from-purple-900/20 dark:hover:to-purple-800/20 transition-all duration-200">
              <LayoutDashboard className="mr-4 h-5 w-5 text-purple-600 group-hover:text-purple-700" />
              <span className="font-medium">Dashboard</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/payer-dashboard/invoices">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 dark:hover:from-purple-900/20 dark:hover:to-purple-800/20 transition-all duration-200">
              <FileText className="mr-4 h-5 w-5 text-purple-600 group-hover:text-purple-700" />
              <span className="font-medium">Invoices</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/payer-dashboard/clients">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 dark:hover:from-purple-900/20 dark:hover:to-purple-800/20 transition-all duration-200">
              <Users className="mr-4 h-5 w-5 text-purple-600 group-hover:text-purple-700" />
              <span className="font-medium">Clients</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/payer-dashboard/analytics">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 dark:hover:from-purple-900/20 dark:hover:to-purple-800/20 transition-all duration-200">
              <BarChart3 className="mr-4 h-5 w-5 text-purple-600 group-hover:text-purple-700" />
              <span className="font-medium">Analytics</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
        </nav>
      );
    }
    
    if (role === 'super') {
      return (
        <nav className="flex-1 p-6 space-y-3">
          <Link href="/protected/super/dashboard">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-200">
              <LayoutDashboard className="mr-4 h-5 w-5 text-red-600 group-hover:text-red-700" />
              <span className="font-medium">Dashboard</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/super/suppliers">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-200">
              <Building2 className="mr-4 h-5 w-5 text-red-600 group-hover:text-red-700" />
              <span className="font-medium">Suppliers</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/super/clients">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-200">
              <Users className="mr-4 h-5 w-5 text-red-600 group-hover:text-red-700" />
              <span className="font-medium">Clients</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/super/payers">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-200">
              <UserCheck className="mr-4 h-5 w-5 text-red-600 group-hover:text-red-700" />
              <span className="font-medium">Payers</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Separator className="my-4 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600" />
          <Link href="/protected/admin/users">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-200">
              <Shield className="mr-4 h-5 w-5 text-red-600 group-hover:text-red-700" />
              <span className="font-medium">Manage Users</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/super/settings">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-200">
              <Settings className="mr-4 h-5 w-5 text-red-600 group-hover:text-red-700" />
              <span className="font-medium">System Settings</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/super/analytics">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-200">
              <BarChart3 className="mr-4 h-5 w-5 text-red-600 group-hover:text-red-700" />
              <span className="font-medium">Analytics</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
        </nav>
      );
    }
    
    if (role === 'admin') {
      return (
        <nav className="flex-1 p-6 space-y-3">
          <Link href="/protected">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
              <LayoutDashboard className="mr-4 h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
              <span className="font-medium">Dashboard</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/super/suppliers">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
              <Building2 className="mr-4 h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
              <span className="font-medium">Suppliers</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/super/clients">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
              <Users className="mr-4 h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
              <span className="font-medium">Clients</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/super/payers">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
              <UserCheck className="mr-4 h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
              <span className="font-medium">Payers</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Separator className="my-4 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600" />
          <Link href="/protected/admin/users">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
              <Shield className="mr-4 h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
              <span className="font-medium">Manage Users</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
          <Link href="/protected/admin/analytics">
            <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
              <BarChart3 className="mr-4 h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
              <span className="font-medium">Analytics</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
        </nav>
      );
    }
    
    // Default sidebar for other roles
    return (
      <nav className="flex-1 p-6 space-y-3">
        <Link href="/protected">
          <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-900/20 dark:hover:to-gray-800/20 transition-all duration-200">
            <LayoutDashboard className="mr-4 h-5 w-5 text-gray-600 group-hover:text-gray-700" />
            <span className="font-medium">Dashboard</span>
            <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </Link>
        <Link href="/protected/invoices">
          <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-900/20 dark:hover:to-gray-800/20 transition-all duration-200">
            <FileText className="mr-4 h-5 w-5 text-gray-600 group-hover:text-gray-700" />
            <span className="font-medium">Invoices</span>
            <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </Link>
        <Link href="/protected/analytics">
          <Button variant="ghost" className="w-full justify-start h-12 text-left group hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-900/20 dark:hover:to-gray-800/20 transition-all duration-200">
            <BarChart3 className="mr-4 h-5 w-5 text-gray-600 group-hover:text-gray-700" />
            <span className="font-medium">Analytics</span>
            <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </Link>
      </nav>
    );
  };

  return (
    <aside className="fixed left-0 w-72 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 text-sidebar-foreground border-r border-gray-200 dark:border-gray-700 shadow-xl z-30" style={{ top: '4rem', height: 'calc(100vh - 4rem)' }}>
      <div className="flex flex-col h-full">
        <div className="p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Elsinore
              </h2>
              <Badge variant={getRoleBadgeVariant(role || 'default')} className="mt-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 border-0">
                {getRoleDisplayName(role || 'default')}
              </Badge>
            </div>
          </div>
        </div>
        {renderSidebarContent()}
      </div>
    </aside>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AuthorizedHeader />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-72 min-h-screen bg-transparent text-foreground">
          <div className="container mx-auto p-8">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 