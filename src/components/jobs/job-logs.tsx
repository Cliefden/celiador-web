'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Terminal, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface JobLogsProps {
  projectId: string;
  jobId: string;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function JobLogs({ projectId, jobId, isRunning, onStart, onStop }: JobLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isRunning) {
      const eventSource = new EventSource(
        `http://localhost:4000/projects/${projectId}/jobs/${jobId}/logs`
      );

      eventSource.onmessage = (event) => {
        setLogs(prev => [...prev, event.data]);
      };

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    }
  }, [projectId, jobId, isRunning]);

  const clearLogs = () => {
    setLogs([]);
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (isRunning) return <Play className="w-4 h-4 text-green-500" />;
    return <Square className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Terminal className="w-5 h-5 mr-2 text-green-500" />
              Job Logs
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLogs}
                className="text-gray-600 hover:text-gray-900"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={isRunning ? onStop : onStart}
                className={isRunning ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
              >
                {getStatusIcon()}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="bg-gray-900 rounded-lg m-4 h-full overflow-auto">
            <div className="p-4">
              {logs.length > 0 ? (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-gray-100 text-sm font-mono">
                      <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Terminal className="w-8 h-8 mx-auto mb-2" />
                  <p>No logs yet</p>
                  <p className="text-sm">Start a job to see live logs</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
