'use client';

import { useEffect, useState } from 'react';
import { useWebSocketEntity } from '../../lib/websocket/useWebSocketEntity';

export default function WebSocketTestPage() {
  const { 
    fetchJob, 
    fetchJobs, 
    isReady, 
    isConnected, 
    connectionState 
  } = useWebSocketEntity();
  
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testJobId, setTestJobId] = useState('');
  const [testProjectId, setTestProjectId] = useState('875aaf30-0349-40a5-91cb-2716179a3703');

  const addResult = (message: string) => {
    setTestResults(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 19)]);
  };

  const testEntityFetch = async () => {
    if (!testJobId.trim()) {
      addResult('❌ Please enter a job ID');
      return;
    }

    addResult('🧪 Testing single job fetch...');
    try {
      const job = await fetchJob(testJobId);
      addResult(`✅ Job fetch successful: ${JSON.stringify(job, null, 2)}`);
    } catch (error) {
      addResult(`❌ Job fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testEntitiesFetch = async () => {
    if (!testProjectId.trim()) {
      addResult('❌ Please enter a project ID');
      return;
    }

    addResult('🧪 Testing jobs list fetch...');
    try {
      const jobs = await fetchJobs(testProjectId);
      addResult(`✅ Jobs fetch successful: Found ${jobs.length} jobs`);
      if (jobs.length > 0) {
        addResult(`First job: ${JSON.stringify(jobs[0], null, 2)}`);
      }
    } catch (error) {
      addResult(`❌ Jobs fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    addResult(`WebSocket state - Ready: ${isReady}, Connected: ${isConnected}`);
    addResult(`Connection status: ${connectionState.connectionStatus}`);
    if (connectionState.error) {
      addResult(`Connection error: ${connectionState.error}`);
    }
  }, [isReady, isConnected, connectionState]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">WebSocket Entity System Test</h1>
      
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Ready:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${isReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isReady ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Connected:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isConnected ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Status:</span>
              <span className="ml-2">{connectionState.connectionStatus}</span>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Test Job ID:</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={testJobId}
                  onChange={(e) => setTestJobId(e.target.value)}
                  placeholder="Enter job ID to test fetch"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={testEntityFetch}
                  disabled={!isReady}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Job Fetch
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">Test Project ID:</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={testProjectId}
                  onChange={(e) => setTestProjectId(e.target.value)}
                  placeholder="Enter project ID to test jobs fetch"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={testEntitiesFetch}
                  disabled={!isReady}
                  className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Jobs Fetch
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <button
              onClick={() => setTestResults([])}
              className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm"
            >
              Clear
            </button>
          </div>
          
          <div className="bg-black text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <div className="text-gray-500">No test results yet...</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}