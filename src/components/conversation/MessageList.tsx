'use client';

import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { MessageBubble } from './MessageBubble';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  messageType: 'text' | 'command' | 'file_reference' | 'job_result';
  createdAt: string;
  metadata?: any;
  relatedJobId?: string;
}

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  className?: string;
}

export function MessageList({ messages, loading, className }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    const shouldScroll = messages.length > lastMessageCountRef.current || loading;
    lastMessageCountRef.current = messages.length;
    
    if (shouldScroll && bottomRef.current) {
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [messages, loading]);

  if (loading && messages.length === 0) {
    return (
      <div className={clsx('flex items-center justify-center p-8', className)}>
        <div className="text-center text-muted-foreground">
          <div className="animate-pulse">💭</div>
          <p className="mt-2 text-sm">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={clsx('flex items-center justify-center p-8', className)}>
        <div className="text-center text-muted-foreground">
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="font-medium">Start a conversation</h3>
          <p className="text-sm mt-1">
            Ask me about your project, request code changes, or get help with development tasks.
          </p>
          <div className="mt-4 text-xs space-y-1">
            <p>Try asking:</p>
            <p className="text-primary">"Add a dark mode toggle"</p>
            <p className="text-primary">"Explain the project structure"</p>
            <p className="text-primary">"Create a new component"</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className={clsx('overflow-y-auto p-4 space-y-4', className)}
    >
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isLastMessage={index === messages.length - 1}
        />
      ))}
      
      {loading && (
        <MessageBubble
          message={{
            id: 'loading',
            content: '...',
            role: 'assistant',
            messageType: 'text',
            createdAt: new Date().toISOString()
          }}
          isLoading
        />
      )}
      
      <div ref={bottomRef} />
    </div>
  );
}