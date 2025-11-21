'use client';

import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
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
  shouldScrollToBottom?: boolean;
  className?: string;
}

export function MessageList({ messages, loading, shouldScrollToBottom, className }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);
  const lastMessageIdRef = useRef<string | null>(null);
  const isUserNearBottomRef = useRef(true);
  const hasScrolledToBottomRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const forceScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if user is near the bottom of the scroll area
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom
    isUserNearBottomRef.current = isNearBottom;
  };

  // Robust scroll to bottom function
  const scrollToBottom = (force = false) => {
    if (!bottomRef.current || !scrollRef.current) {
      console.log('[MessageList] Missing refs for scroll:', { 
        bottomRef: !!bottomRef.current, 
        scrollRef: !!scrollRef.current 
      });
      return;
    }
    
    // Only auto-scroll if user is near bottom or if forced
    if (force || isUserNearBottomRef.current) {
      console.log(`[MessageList] Attempting scroll: force=${force}, userNearBottom=${isUserNearBottomRef.current}`);
      
      const container = scrollRef.current;
      const bottom = bottomRef.current;
      
      // Wait for next paint to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            // Method 1: Direct scroll - most reliable
            container.scrollTop = container.scrollHeight;
            console.log(`[MessageList] Direct scroll applied: scrollTop=${container.scrollTop}, scrollHeight=${container.scrollHeight}`);
            
            // Method 2: Also use scrollIntoView as backup
            bottom.scrollIntoView({ 
              behavior: 'auto', // Always use auto for reliability
              block: 'end',
              inline: 'nearest'
            });
            
            // Verify scroll worked
            setTimeout(() => {
              const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 5;
              console.log(`[MessageList] Scroll verification: isAtBottom=${isAtBottom}, diff=${container.scrollHeight - container.scrollTop - container.clientHeight}`);
            }, 100);
            
          } catch (error) {
            console.error('[MessageList] Scroll error:', error);
          }
        });
      });
    }
  };

  // Setup MutationObserver to detect DOM changes and scroll immediately
  useEffect(() => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    let scrollTimeout: NodeJS.Timeout;
    
    const observer = new MutationObserver((mutations) => {
      // Check if child nodes were added (new messages)
      const hasAdditions = mutations.some(mutation => 
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      );
      
      if (hasAdditions) {
        console.log('[MessageList] DOM mutation detected - scrolling immediately');
        clearTimeout(scrollTimeout);
        
        // Immediate scroll
        scrollToBottom(true);
        
        // Also try again after a short delay for safety
        scrollTimeout = setTimeout(() => {
          scrollToBottom(true);
        }, 100);
      }
    });
    
    observer.observe(container, {
      childList: true,
      subtree: true
    });
    
    observerRef.current = observer;
    
    return () => {
      observer.disconnect();
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Setup IntersectionObserver to force scroll when bottom element is not visible
  useEffect(() => {
    if (!bottomRef.current || !scrollRef.current) return;
    
    const bottom = bottomRef.current;
    const container = scrollRef.current;
    
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.log('[MessageList] Bottom element intersection:', {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          messagesCount: messages.length
        });
        
        // If bottom element is not visible and we have messages, force scroll
        if (!entry.isIntersecting && messages.length > 0) {
          console.log('[MessageList] Bottom not visible - forcing scroll');
          
          // Clear any existing timeout
          if (forceScrollTimeoutRef.current) {
            clearTimeout(forceScrollTimeoutRef.current);
          }
          
          // Force scroll immediately and repeatedly
          scrollToBottom(true);
          
          forceScrollTimeoutRef.current = setTimeout(() => {
            console.log('[MessageList] Delayed force scroll attempt');
            scrollToBottom(true);
          }, 100);
        }
      },
      {
        root: container,
        threshold: 0.1
      }
    );
    
    intersectionObserver.observe(bottom);
    intersectionObserverRef.current = intersectionObserver;
    
    return () => {
      intersectionObserver.disconnect();
      if (forceScrollTimeoutRef.current) {
        clearTimeout(forceScrollTimeoutRef.current);
      }
    };
  }, [messages.length]);

  // Single effect to handle all scroll scenarios
  useEffect(() => {
    const hasNewMessages = messages.length > lastMessageCountRef.current;
    const lastMessage = messages[messages.length - 1];
    const hasNewContent = lastMessage && lastMessage.id !== lastMessageIdRef.current;
    const isInitialLoad = messages.length > 0 && !hasScrolledToBottomRef.current;
    
    console.log('[MessageList] Scroll conditions:', {
      messagesCount: messages.length,
      hasNewMessages,
      hasNewContent,
      isInitialLoad,
      loading,
      shouldScrollToBottom
    });
    
    // Reset scroll tracking if messages array changed significantly (new conversation)
    if (messages.length < lastMessageCountRef.current) {
      hasScrolledToBottomRef.current = false;
    }
    
    // Update refs
    lastMessageCountRef.current = messages.length;
    if (lastMessage) {
      lastMessageIdRef.current = lastMessage.id;
    }
    
    // Determine if we should scroll
    const shouldScroll = isInitialLoad || hasNewMessages || hasNewContent || loading || shouldScrollToBottom;
    
    if (shouldScroll) {
      console.log('[MessageList] Triggering scroll due to:', {
        isInitialLoad,
        hasNewMessages,
        hasNewContent,
        loading,
        shouldScrollToBottom
      });
      
      // Immediate scroll
      scrollToBottom(true);
      
      // Additional attempts with timing for safety
      const delays = [10, 50, 150];
      delays.forEach(delay => {
        setTimeout(() => {
          scrollToBottom(true);
        }, delay);
      });
      
      if (isInitialLoad) {
        hasScrolledToBottomRef.current = true;
      }
    }
  }, [messages, loading, shouldScrollToBottom]);

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
      className={clsx('overflow-y-auto px-3 py-4', className)}
      onScroll={handleScroll}
      style={{ 
        scrollBehavior: 'auto'
      }}
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
      
      <div 
        ref={bottomRef} 
        id="conversation-bottom"
        style={{ 
          height: '1px', 
          width: '100%', 
          scrollSnapAlign: 'end',
          scrollSnapStop: 'always'
        }}
      />
    </div>
  );
}