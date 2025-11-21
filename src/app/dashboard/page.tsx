'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { SimpleDashboard } from '../../components/layout/SimpleDashboard';

interface Project {
  id: string;
  name: string;
  status: string;
  templatekey: string;
  repoprovider: string;
  repoowner: string;
  reponame: string;
  createdat: string;
  updatedat: string;
  creator?: string;
  updater?: string;
  deleter?: string;
  deletedAt?: string;
}

export default function DashboardPage() {
  const { user, profile, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Enhanced debugging with timestamps and stack traces
  const debugLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`🔍 [DASHBOARD ${timestamp}] ${message}`, data || '');
  };
  
  debugLog('RENDER', { 
    isLoading, 
    hasUser: !!user, 
    userEmail: user?.email,
    isMounted,
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    debugLog('AUTH_STATE_CHANGE', { 
      hasUser: !!user, 
      userEmail: user?.email,
      isLoading, 
      isMounted,
      shouldRedirect: !isLoading && !user && isMounted,
      isClientSide: typeof window !== 'undefined' 
    });
    
    // CRITICAL FIX: Only redirect on client-side after auth context has fully loaded
    // This prevents SSR redirects before authentication state is available
    if (typeof window !== 'undefined' && !isLoading && !user && isMounted) {
      debugLog('REDIRECTING_TO_HOMEPAGE', 'No user found after client auth load');
      router.push('/');
    }
  }, [user, isLoading, router, isMounted]);

  const handleLogout = async () => {
    try {
      console.log('Dashboard: Starting logout...');
      await signOut();
    } catch (error) {
      console.error('Dashboard: Logout error:', error);
      // Force refresh as fallback
      window.location.href = '/';
    }
  };

  // Prevent hydration mismatch by ensuring client-side only rendering
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Render the dashboard for authenticated users
  return (
    <SimpleDashboard
      initialUser={{
        id: user.id,
        email: user.email || '',
        name: profile?.full_name || profile?.username
      }}
      onLogout={handleLogout}
    />
  );
}