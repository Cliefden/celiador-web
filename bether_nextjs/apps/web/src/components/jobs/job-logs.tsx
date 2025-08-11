'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: any;
}

interface JobLogsProps {
  projectId: string;
  jobId: string;
  isRunning: boolean;
  onStart?: () => void;
  onStop?: () => void;
}

export function JobLogs({ projectId, jobId, isRunning, onStart, onStop }: JobLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  useEffect(() => {
    if (!isRunning) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Connect to SSE endpoint
    const eventSource = new EventSource(
      `http://localhost:4000/projects/${projectId}/jobs/${jobId}/logs`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
      setLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Connected to log stream'
      }]);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: data.line || 'Log entry received'
        }]);
      } catch (error) {
        console.error('Failed to parse log entry:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
      setLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Connection lost'
      }]);
    };

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
    };
  }, [projectId, jobId, isRunning]);

  const clearLogs = () => {
    setLogs([]);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'debug': return 'text-gray-500';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-medium">Job Logs</h3>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={clearLogs}
            disabled={logs.length === 0}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </Button>
          {isRunning ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={onStop}
            >
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onStart}
            >
              <Play className="w-4 h-4 mr-1" />
              Start
            </Button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-3 py-1 bg-muted/50 border-b">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-auto bg-black text-green-400 font-mono text-sm p-3">
        {logs.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            No logs yet. Start a job to see output.
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="flex">
                <span className="text-gray-500 mr-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`${getLevelColor(log.level)}`}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
