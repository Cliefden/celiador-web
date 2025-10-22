import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SessionData {
  sessionId: string;
  platform: string;
  status: 'active' | 'ended';
  startedAt: string;
  duration: number;
}

interface SessionTrackingOptions {
  heartbeatInterval?: number; // in milliseconds, default 30 seconds
  platform?: string;
  enableHeartbeat?: boolean;
  autoStart?: boolean;
}

export function useSessionTracking(options: SessionTrackingOptions = {}) {
  const {
    heartbeatInterval = 30000, // 30 seconds
    platform = 'web',
    enableHeartbeat = true,
    autoStart = true
  } = options;

  const { session } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [activityCount, setActivityCount] = useState(0);
  
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  // Generate unique session ID
  const generateSessionId = () => {
    return `${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get device information
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screen = window.screen;
    
    return {
      userAgent,
      platform,
      language,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine
    };
  };

  // Get location information (basic)
  const getLocationInfo = () => {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      // Note: For actual geolocation, you'd need user permission and geolocation API
    };
  };

  // Start session tracking
  const startSession = async () => {
    if (!session?.access_token || isTracking) return;

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
          platform,
          deviceInfo,
          locationInfo,
          userAgent: navigator.userAgent
        }),
      });

      if (response.ok) {
        const result = await response.json();
        sessionStartTimeRef.current = new Date();
        
        setSessionData({
          sessionId,
          platform,
          status: 'active',
          startedAt: result.session.startedAt,
          duration: 0
        });
        
        setIsTracking(true);
        setActivityCount(0);
        
        // Start heartbeat if enabled
        if (enableHeartbeat) {
          startHeartbeat(sessionId);
        }
        
        console.log('[SessionTracking] Session started successfully');
      } else {
        console.error('[SessionTracking] Failed to start session:', response.statusText);
      }
    } catch (error) {
      console.error('[SessionTracking] Error starting session:', error);
    }
  };

  // End session tracking
  const endSession = async (endReason: string = 'manual') => {
    if (!sessionData || !isTracking) return;

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
        
        setIsTracking(false);
        console.log('[SessionTracking] Session ended successfully');
      } else {
        console.error('[SessionTracking] Failed to end session:', response.statusText);
      }
    } catch (error) {
      console.error('[SessionTracking] Error ending session:', error);
    }
  };

  // Send heartbeat
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
          activityCount
        }),
      });

      if (!response.ok) {
        console.error('[SessionTracking] Heartbeat failed:', response.statusText);
        // If heartbeat fails, session might be invalid, stop tracking
        if (response.status === 404) {
          setIsTracking(false);
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
        }
      }
    } catch (error) {
      console.error('[SessionTracking] Heartbeat error:', error);
    }
  };

  // Start heartbeat interval
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
    }, heartbeatInterval);
  };

  // Track user activity
  const trackActivity = () => {
    lastActivityRef.current = new Date();
    setActivityCount(prev => prev + 1);
  };

  // Auto-start session when user is authenticated
  useEffect(() => {
    if (session && autoStart && !isTracking) {
      startSession();
    }
  }, [session, autoStart, isTracking]);

  // Auto-end session when user logs out
  useEffect(() => {
    if (!session && isTracking) {
      endSession('logout');
    }
  }, [session, isTracking]);

  // Set up activity listeners
  useEffect(() => {
    if (!isTracking) return;

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
  }, [isTracking]);

  // Handle page visibility changes
  useEffect(() => {
    if (!isTracking) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - don't end session but stop heartbeat temporarily
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      } else {
        // Page is visible - resume heartbeat
        if (sessionData && enableHeartbeat) {
          startHeartbeat(sessionData.sessionId);
        }
        trackActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking, sessionData, enableHeartbeat]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isTracking && sessionData) {
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
  }, [isTracking, sessionData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  return {
    sessionData,
    isTracking,
    activityCount,
    startSession,
    endSession,
    trackActivity
  };
}