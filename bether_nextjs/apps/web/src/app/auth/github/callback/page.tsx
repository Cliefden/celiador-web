'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function GitHubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const error_description = searchParams.get('error_description');
      
      if (error) {
        // OAuth error
        if (window.opener) {
          window.opener.postMessage({
            type: 'GITHUB_OAUTH_ERROR',
            error: error_description || error
          }, window.location.origin);
        }
        window.close();
        return;
      }
      
      if (!code || !state) {
        // Missing required parameters
        if (window.opener) {
          window.opener.postMessage({
            type: 'GITHUB_OAUTH_ERROR',
            error: 'Missing authorization code or state'
          }, window.location.origin);
        }
        window.close();
        return;
      }
      
      try {
        // Call the orchestrator callback endpoint
        const response = await fetch('/api/orchestrator/auth/github/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Success - notify parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'GITHUB_OAUTH_SUCCESS',
              username: data.username || 'User'
            }, window.location.origin);
          }
        } else {
          const errorData = await response.json();
          
          // API error
          if (window.opener) {
            window.opener.postMessage({
              type: 'GITHUB_OAUTH_ERROR',
              error: errorData.error || 'Authentication failed'
            }, window.location.origin);
          }
        }
      } catch (error) {
        console.error('Callback processing error:', error);
        
        // Network or processing error
        if (window.opener) {
          window.opener.postMessage({
            type: 'GITHUB_OAUTH_ERROR',
            error: 'Network error during authentication'
          }, window.location.origin);
        }
      }
      
      // Close the popup
      window.close();
    };
    
    handleCallback();
  }, [searchParams]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
        <h2 className="text-lg font-semibold mb-2">Completing GitHub Connection</h2>
        <p className="text-gray-600">
          Please wait while we complete your GitHub authentication...
        </p>
      </div>
    </div>
  );
}