'use client';

import { clsx } from 'clsx';
import { Message } from './MessageList';

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
    <div
      className={clsx(
        'flex gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
          {getMessageIcon()}
        </div>
      )}
      
      <div
        className={clsx(
          'max-w-[80%] rounded-lg px-4 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : isSystem
            ? 'bg-muted text-muted-foreground border border-border'
            : 'bg-accent text-accent-foreground border border-border',
          isLoading && 'animate-pulse'
        )}
      >
        {/* Message type label */}
        {getMessageTypeLabel() && (
          <div className="text-xs opacity-75 mb-1">
            {getMessageTypeLabel()}
          </div>
        )}
        
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {isLoading ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </span>
          ) : (
            message.content
          )}
        </div>
        
        {/* Related job indicator */}
        {message.relatedJobId && (
          <div className="text-xs mt-2 pt-2 border-t border-current/20 opacity-75">
            <span className="inline-flex items-center gap-1">
              🔗 Job linked
            </span>
          </div>
        )}
        
        {/* Timestamp */}
        {!isLoading && (
          <div className={clsx(
            'text-xs mt-2 opacity-75',
            isUser ? 'text-right' : 'text-left'
          )}>
            {formatTime(message.createdAt)}
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
          {getMessageIcon()}
        </div>
      )}
    </div>
  );
}