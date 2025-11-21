'use client';

import { clsx } from 'clsx';
import { Message } from './MessageList';
import { useJobMonitor } from './useJobMonitor';
import { useEffect } from 'react';

interface MessageBubbleProps {
  message: Message;
  isLastMessage?: boolean;
  isLoading?: boolean;
}

export function MessageBubble({ 
  message, 
  isLastMessage, 
  isLoading 
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const { getJobStatus, getJobResult, startMonitoring, jobs } = useJobMonitor();

  // Start monitoring job if this message has one
  useEffect(() => {
    if (message.relatedJobId && !jobs[message.relatedJobId]) {
      console.log(`[MessageBubble] Starting to monitor job: ${message.relatedJobId}`);
      startMonitoring(message.relatedJobId);
    }
  }, [message.relatedJobId, startMonitoring, jobs]);

  const jobStatus = message.relatedJobId ? getJobStatus(message.relatedJobId) : null;
  const jobResult = message.relatedJobId ? getJobResult(message.relatedJobId) : null;
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getMessageIcon = () => {
    if (isLoading) return '⏳';
    if (isSystem) return '⚙️';
    if (message.messageType === 'command') return '⚡';
    if (message.messageType === 'file_reference') return '📄';
    if (message.messageType === 'job_result') return '✅';
    if (isUser) return '👤';
    return '🤖';
  };

  const getMessageTypeLabel = () => {
    switch (message.messageType) {
      case 'command': return 'Command';
      case 'file_reference': return 'File Reference';
      case 'job_result': return 'Job Result';
      default: return null;
    }
  };

  return (
    <div className="w-full mb-3">
      {/* Message Content - Clean and minimal */}
      <div className={clsx(
        "prose prose-sm max-w-none dark:prose-invert",
        "whitespace-pre-wrap break-words leading-relaxed",
        isUser 
          ? "text-gray-900 dark:text-white font-medium bg-teal-100 dark:bg-teal-900/40 px-3 py-2 rounded-lg" 
          : isSystem
          ? "text-amber-800 dark:text-amber-200 bg-amber-50/40 dark:bg-amber-950/20 px-3 py-2 rounded text-sm italic"
          : "text-gray-200 dark:text-gray-200 leading-relaxed",
        isLoading && "animate-pulse"
      )}>
        {isLoading ? (
          <span className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            <span className="ml-2">AI analyzing your input...</span>
          </span>
        ) : (
          message.content
        )}
      </div>
      
      {/* Related job indicator - only if needed */}
      {message.relatedJobId && jobStatus && jobStatus !== 'COMPLETED' && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded p-2">
          <span className="inline-flex items-center gap-1.5">
            {jobStatus === 'PENDING' && '⏳ Task Pending'}
            {jobStatus === 'RUNNING' && '🔄 Task Running'}
            {jobStatus === 'FAILED' && '❌ Task Failed'}
            {jobStatus === 'CANCELLED' && '🚫 Task Cancelled'}
          </span>
          
          {jobStatus === 'FAILED' && jobs[message.relatedJobId]?.error && (
            <div className="mt-1 text-red-600 dark:text-red-400 text-xs">
              Error: {jobs[message.relatedJobId].error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}