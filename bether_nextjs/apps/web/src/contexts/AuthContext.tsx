'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  website?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'super';
  creator?: string;
  updater?: string;
  updatedAt: string;
  deleter?: string;
  deletedAt?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, profileData: Partial<Profile>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from profiles table
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Starting auth initialization...');
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthContext: Got session:', !!session, 'Error:', error);
        
        if (error) {
          console.error('AuthContext: Session error:', error);
        }
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('AuthContext: Fetching profile for user:', session.user.id);
          const userProfile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(userProfile);
            console.log('AuthContext: Profile loaded:', !!userProfile);
          }
        }

        // Listen for auth changes
        console.log('AuthContext: Setting up auth state listener...');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('AuthContext: Auth state changed:', event, !!session);
            if (!isMounted) return;
            
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
              const userProfile = await fetchProfile(session.user.id);
              if (isMounted) {
                setProfile(userProfile);
              }
            } else {
              setProfile(null);
            }
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
      } finally {
        if (isMounted) {
          console.log('AuthContext: Auth initialization complete, setting loading to false');
          setIsLoading(false);
        }
      }
    };

    // Add shorter timeout to detect auth issues faster
    const timeoutId = setTimeout(() => {
      console.log('AuthContext: Timeout reached, forcing loading to false');
      if (isMounted) {
        setIsLoading(false);
      }
    }, 3000); // Reduced from 5000 to 3000

    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        // Profile will be fetched by the auth state change listener
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Sign up function with profile creation
  const signUp = async (email: string, password: string, profileData: Partial<Profile>) => {
    try {
      // Include profile data in user metadata so the trigger can create the profile
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: profileData.full_name,
            username: profileData.username,
            website: profileData.website,
            avatar_url: profileData.avatar_url,
          }
        }
      });

      if (error) {
        return { error };
      }

      // The trigger will automatically create the profile
      // But let's also try to create it manually as a fallback using our API route
      if (data.user) {
        try {
          const response = await fetch('/api/auth/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: data.user.id,
              profileData: {
                email: data.user.email,
                username: profileData.username,
                full_name: profileData.full_name,
                website: profileData.website,
                avatar_url: profileData.avatar_url,
              }
            })
          });

          if (response.ok) {
            console.log('Profile created successfully via API fallback');
          } else {
            console.log('Profile creation API fallback failed (trigger should handle it)');
          }
        } catch (fallbackError) {
          console.log('Profile creation API fallback error (trigger should handle it):', fallbackError);
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      // Clear local state first
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
        // Even if Supabase fails, we've cleared local state
      } else {
        console.log('Sign out successful');
      }
      
      // Force a page refresh to clear any stale state
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error signing out:', error);
      // Force refresh even on error to ensure clean state
      window.location.href = '/';
    }
  };

  // Update profile function
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error) {
        // Refresh profile data
        await refreshProfile();
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Refresh profile function
  const refreshProfile = async () => {
    if (!user) return;

    const userProfile = await fetchProfile(user.id);
    setProfile(userProfile);
  };

  // Refresh authentication state
  const refreshAuth = async () => {
    try {
      console.log('Refreshing authentication state...');
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
