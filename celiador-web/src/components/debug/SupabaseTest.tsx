'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function SupabaseTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results: any = {};

    try {
      console.log('Testing Supabase connection...');
      
      // Test 1: Basic connection
      const start = Date.now();
      try {
        const { error } = await Promise.race([
          supabase.from('profiles').select('count', { count: 'exact', head: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]) as any;
        
        results.profilesTest = {
          success: !error,
          error: error?.message,
          duration: Date.now() - start
        };
      } catch (err: any) {
        results.profilesTest = {
          success: false,
          error: err.message,
          duration: Date.now() - start
        };
      }

      // Test 2: Auth session
      const start2 = Date.now();
      try {
        const { data, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]) as any;
        
        results.sessionTest = {
          success: !error,
          hasSession: !!data?.session,
          error: error?.message,
          duration: Date.now() - start2
        };
      } catch (err: any) {
        results.sessionTest = {
          success: false,
          error: err.message,
          duration: Date.now() - start2
        };
      }

      // Test 3: Simple auth check
      const start3 = Date.now();
      try {
        const { data, error } = await Promise.race([
          supabase.auth.getUser(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]) as any;
        
        results.userTest = {
          success: !error,
          hasUser: !!data?.user,
          error: error?.message,
          duration: Date.now() - start3
        };
      } catch (err: any) {
        results.userTest = {
          success: false,
          error: err.message,
          duration: Date.now() - start3
        };
      }

    } catch (globalErr: any) {
      results.globalError = globalErr.message;
    }

    console.log('Supabase test results:', results);
    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Supabase Connection Test</h3>
      
      <button
        onClick={runTests}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isLoading ? 'Testing...' : 'Run Tests'}
      </button>

      {testResults && (
        <div className="mt-4">
          <h4 className="font-semibold">Results:</h4>
          <pre className="bg-white p-2 rounded text-sm overflow-auto">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}