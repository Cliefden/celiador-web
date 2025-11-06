'use client';

import { useAuth } from '../contexts/AuthContext';
import { useCallback } from 'react';

/**
 * Custom hook for making authenticated API requests with automatic token refresh
 * Handles 401 errors by refreshing authentication and retrying the request
 */
export function useAuthenticatedFetch() {
  const { session, refreshAuth } = useAuth();

  const authenticatedFetch = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    if (!session?.access_token) {
      throw new Error('No authentication session available');
    }

    // Add authorization header
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${session.access_token}`
      }
    };

    try {
      // First attempt
      const response = await fetch(url, requestOptions);
      
      // If not a 401 error, return the response (success or other error)
      if (response.status !== 401) {
        return response;
      }

      console.log('[useAuthenticatedFetch] 401 error, attempting token refresh...');
      
      // Attempt to refresh authentication
      await refreshAuth();
      
      // Get the fresh session (we need to get it again after refresh)
      const { data: { session: freshSession } } = await (await import('../lib/supabase')).supabase.auth.getSession();
      
      if (!freshSession?.access_token) {
        throw new Error('Failed to refresh authentication - no valid session after refresh');
      }

      console.log('[useAuthenticatedFetch] Token refreshed, retrying request...');
      
      // Retry with fresh token
      const retryOptions: RequestInit = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${freshSession.access_token}`
        }
      };

      const retryResponse = await fetch(url, retryOptions);
      
      if (retryResponse.status === 401) {
        throw new Error('Authentication failed even after token refresh - user may need to sign in again');
      }

      return retryResponse;

    } catch (error) {
      console.error('[useAuthenticatedFetch] Request failed:', error);
      throw error;
    }
  }, [session, refreshAuth]);

  return authenticatedFetch;
}