'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { MessageList } from './MessageList';
import { ConversationHeader } from './ConversationHeader';
import { useConversation } from './useConversation';

interface ConversationPanelProps {
  projectId?: string;
  className?: string;
  onToggle?: (isOpen: boolean) => void;
}

export function ConversationPanel({ 
  projectId, 
  className = '',
  onToggle 
}: ConversationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    conversation,
    messages,
    sendMessage,
    createConversation,
    loading: conversationLoading
  } = useConversation(projectId);

  // Handle panel toggle
  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    onToggle?.(newIsOpen);
    
    // Focus input when opening
    if (newIsOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

// Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const messageText = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      let currentConversation = conversation;
      
      // Create conversation if none exists
      if (!currentConversation) {
        currentConversation = await createConversation(
          projectId ? `Project Discussion` : 'General Chat'
        );
      }

      // Send the message
      await sendMessage(messageText, 'text', currentConversation);
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Add toast notification for errors
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + / to toggle panel
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        handleToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={handleToggle}
          className="rounded-full h-12 w-12 shadow-lg"
          size="icon"
        >
          💬
        </Button>
      </div>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-96 h-[500px] z-50 flex flex-col shadow-xl ${className}`}>
      <ConversationHeader
        title={conversation?.title || 'New Conversation'}
        onClose={handleToggle}
        onMinimize={handleToggle}
      />
      
      <div className="flex-1 flex flex-col min-h-0">
        <MessageList
          messages={messages}
          loading={conversationLoading}
          className="flex-1"
        />
        
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about your project..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || isLoading}
              size="icon"
            >
              {isLoading ? '⏳' : '→'}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Press Ctrl+/ to toggle • Enter to send
          </div>
        </form>
      </div>
    </Card>
  );
}