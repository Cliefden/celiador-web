'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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
  // Session tracking data
  sessionData: any;
  isSessionTracking: boolean;
  sessionActivityCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Session tracking state
  const [sessionData, setSessionData] = useState<any>(null);
  const [isSessionTracking, setIsSessionTracking] = useState(false);
  const [sessionActivityCount, setSessionActivityCount] = useState(0);
  
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  // Session tracking functions
  const generateSessionId = () => {
    return `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const getDeviceInfo = () => {
    if (typeof navigator === 'undefined') return {};
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screen = typeof window !== 'undefined' ? window.screen : null;
    
    return {
      userAgent,
      platform,
      language,
      screenResolution: screen ? `${screen.width}x${screen.height}` : 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine
    };
  };

  const getLocationInfo = () => {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
    };
  };

  const startSessionTracking = async () => {
    if (!session?.access_token || isSessionTracking) return;

    try {
      const sessionId = generateSessionId();
      const deviceInfo = getDeviceInfo();
      const locationInfo = getLocationInfo();

      console.log('[SessionTracking] Starting session:', sessionId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sessionId,
          platform: 'web',
          deviceInfo,
          locationInfo,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        sessionStartTimeRef.current = new Date();
        
        setSessionData({
          sessionId,
          platform: 'web',
          status: 'active',
          startedAt: result.session?.startedAt || new Date().toISOString(),
          duration: 0
        });
        
        setIsSessionTracking(true);
        setSessionActivityCount(0);
        
        // Start heartbeat
        startHeartbeat(sessionId);
        
        console.log('[SessionTracking] Session started successfully');
      } else {
        console.error('[SessionTracking] Failed to start session:', response.statusText);
      }
    } catch (error) {
      console.error('[SessionTracking] Error starting session:', error);
    }
  };

  const endSessionTracking = async (endReason: string = 'manual') => {
    if (!sessionData || !isSessionTracking) return;

    try {
      console.log('[SessionTracking] Ending session:', sessionData.sessionId);

      // Stop heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/sessions/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          endReason
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSessionData(prev => prev ? {
          ...prev,
          status: 'ended',
          duration: result.session.durationSeconds
        } : null);
        
        setIsSessionTracking(false);
        console.log('[SessionTracking] Session ended successfully');
      } else {
        console.error('[SessionTracking] Failed to end session:', response.statusText);
      }
    } catch (error) {
      console.error('[SessionTracking] Error ending session:', error);
    }
  };

  const sendHeartbeat = async (sessionId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/sessions/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sessionId,
          activityCount: sessionActivityCount
        }),
      });

      if (!response.ok) {
        console.error('[SessionTracking] Heartbeat failed:', response.statusText);
        if (response.status === 404) {
          // Session not found on server
          setIsSessionTracking(false);
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
        } else if (response.status === 401) {
          // Unauthorized - token expired or invalid
          console.log('[SessionTracking] Token expired, stopping heartbeat');
          setIsSessionTracking(false);
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
          // Note: We don't trigger logout here since Supabase handles token refresh automatically
          // The session will restart when the user becomes active again with a fresh token
        }
      }
    } catch (error) {
      console.error('[SessionTracking] Heartbeat error:', error);
    }
  };

  const startHeartbeat = (sessionId: string) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat(sessionId);
      
      // Update session duration
      if (sessionStartTimeRef.current) {
        const duration = Math.floor((new Date().getTime() - sessionStartTimeRef.current.getTime()) / 1000 / 60);
        setSessionData(prev => prev ? { ...prev, duration } : null);
      }
    }, 30000); // 30 seconds
  };

  const trackActivity = () => {
    lastActivityRef.current = new Date();
    setSessionActivityCount(prev => prev + 1);
  };

  // Fetch user profile from profiles table
  const fetchProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Attempting to fetch profile for userId:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('AuthContext: Error fetching profile:', error);
        console.error('AuthContext: Profile error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return null;
      }

      console.log('AuthContext: Profile data retrieved:', data);
      return data as Profile;
    } catch (error) {
      console.error('AuthContext: Unexpected error fetching profile:', error);
      return null;
    }
  };

  // Auto-start session when user is authenticated
  useEffect(() => {
    if (session && !isSessionTracking) {
      startSessionTracking();
    }
  }, [session, isSessionTracking]);

  // Auto-end session when user logs out
  useEffect(() => {
    if (!session && isSessionTracking) {
      endSessionTracking('logout');
    }
  }, [session, isSessionTracking]);

  // Set up activity listeners
  useEffect(() => {
    if (!isSessionTracking) return;

    const activityEvents = ['click', 'keydown', 'scroll', 'mousemove'];
    
    const throttledTrackActivity = (() => {
      let timeout: NodeJS.Timeout | null = null;
      return () => {
        if (timeout) return;
        timeout = setTimeout(() => {
          trackActivity();
          timeout = null;
        }, 1000); // Throttle to once per second
      };
    })();

    activityEvents.forEach(event => {
      document.addEventListener(event, throttledTrackActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledTrackActivity);
      });
    };
  }, [isSessionTracking]);

  // Handle page visibility changes
  useEffect(() => {
    if (!isSessionTracking) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - don't end session but stop heartbeat temporarily
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      } else {
        // Page is visible - resume heartbeat
        if (sessionData) {
          startHeartbeat(sessionData.sessionId);
        }
        trackActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSessionTracking, sessionData]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isSessionTracking && sessionData) {
        // Use navigator.sendBeacon for reliable delivery during page unload
        const data = JSON.stringify({
          sessionId: sessionData.sessionId,
          endReason: 'page_unload'
        });

        if (navigator.sendBeacon) {
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon(
            `${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/sessions/end`,
            blob
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSessionTracking, sessionData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Starting auth initialization...');
        console.log('AuthContext: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        
        // Test basic Supabase connectivity
        try {
          const testResponse = await supabase.from('profiles').select('count', { count: 'exact', head: true });
          console.log('AuthContext: Supabase connectivity test:', { 
            error: testResponse.error, 
            status: testResponse.status,
            statusText: testResponse.statusText 
          });
        } catch (testError) {
          console.error('AuthContext: Supabase connectivity test failed:', testError);
        }
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthContext: Got session:', !!session, 'User:', session?.user?.email, 'Error:', error);
        
        if (error) {
          console.error('AuthContext: Session error:', error);
          console.error('AuthContext: Session error details:', {
            code: error.code,
            message: error.message,
            status: error.status
          });
        }
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('AuthContext: Fetching profile for user:', session.user.id);
          const userProfile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(userProfile);
            console.log('AuthContext: Profile loaded:', !!userProfile, userProfile);
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

        // Auth initialization complete
        if (isMounted) {
          console.log('AuthContext: Auth initialization complete, setting loading to false');
          setIsLoading(false);
        }

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        if (isMounted) {
          console.log('AuthContext: Error occurred, setting loading to false');
          setIsLoading(false);
        }
      }
    };

    // Add timeout to detect auth issues
    const timeoutId = setTimeout(() => {
      console.log('AuthContext: Timeout reached, forcing loading to false');
      if (isMounted) {
        setIsLoading(false);
      }
    }, 10000); // Increased to 10 seconds for debugging

    initializeAuth().then(() => {
      clearTimeout(timeoutId);
    }).catch((error) => {
      console.error('AuthContext: initializeAuth failed:', error);
      clearTimeout(timeoutId);
    });
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: signIn called with email:', email);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('AuthContext: Supabase signIn response:', { error, user: data?.user?.email });

      if (!error) {
        console.log('AuthContext: Sign in successful, auth state listener will handle redirect');
        // Profile will be fetched by the auth state change listener
      }

      return { error };
    } catch (error) {
      console.error('AuthContext: Unexpected error in signIn:', error);
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
            // username and website are now optional and can be added later
            ...(profileData.username && { username: profileData.username }),
            ...(profileData.website && { website: profileData.website }),
            ...(profileData.avatar_url && { avatar_url: profileData.avatar_url }),
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
      
      // End session tracking before signing out
      if (isSessionTracking && sessionData) {
        console.log('Ending session tracking before logout...');
        await endSessionTracking('logout');
      }
      
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
    // Session tracking data
    sessionData,
    isSessionTracking,
    sessionActivityCount,
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
