'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { MessageList } from './MessageList';
import { ConversationHeader } from './ConversationHeader';
import { useConversation } from './useConversation';

interface Project {
  id: string;
  name: string;
}

interface ConversationPanelProps {
  selectedProject?: Project | null;
  projectId?: string;
  className?: string;
  onToggle?: (isOpen: boolean) => void;
  onFileOperation?: () => void;
  embedded?: boolean; // New prop to control embedded vs floating mode
  conversationHook?: any; // Optional shared conversation hook
}

export function ConversationPanel({ 
  selectedProject,
  projectId, 
  className = '',
  onToggle,
  onFileOperation,
  embedded = false,
  conversationHook
}: ConversationPanelProps) {
  const [isOpen, setIsOpen] = useState(embedded ? true : false); // Start open if embedded
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultConversationHook = useConversation(selectedProject?.id || projectId);
  const {
    conversation,
    messages,
    sendMessage,
    createConversation,
    loading: conversationLoading,
    shouldScrollToBottom
  } = conversationHook || defaultConversationHook;

  // Debug logging
  useEffect(() => {
    console.log('[ConversationPanel] Props:', {
      selectedProject: selectedProject?.id,
      projectId,
      embedded
    });
    console.log('[ConversationPanel] State:', {
      conversation: conversation?.id,
      messagesCount: messages.length,
      isOpen,
      conversationLoading
    });
  }, [selectedProject, projectId, conversation, messages, isOpen, conversationLoading, embedded]);

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
    console.log('[ConversationPanel] Sending message:', messageText);
    console.log('[ConversationPanel] Current conversation:', conversation?.id);
    console.log('[ConversationPanel] Project ID:', selectedProject?.id || projectId);
    
    setMessage('');
    setIsLoading(true);

    try {
      let currentConversation = conversation;
      
      // Create conversation if none exists
      if (!currentConversation) {
        console.log('[ConversationPanel] Creating new conversation...');
        currentConversation = await createConversation(
          projectId ? `Project Discussion` : 'General Chat'
        );
        console.log('[ConversationPanel] Created conversation:', currentConversation?.id);
      }

      // Send the message
      console.log('[ConversationPanel] Sending message to conversation:', currentConversation?.id);
      console.log('[ConversationPanel] About to call sendMessage function...');
      await sendMessage(messageText, 'text', currentConversation);
      console.log('[ConversationPanel] Message sent successfully');
      
      // Focus input after message is sent for better UX
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      // Trigger file refresh after sending message (in case AI actions were executed)
      setTimeout(() => {
        onFileOperation?.();
      }, 2000); // Wait 2 seconds for AI actions to complete
    } catch (error) {
      console.error('[ConversationPanel] Failed to send message:', error);
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

  // For embedded mode, always show the content
  if (embedded) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MessageList
            messages={messages}
            loading={conversationLoading}
            shouldScrollToBottom={shouldScrollToBottom}
            className="flex-1 overflow-y-auto"
          />
          
          <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4 bg-gray-800/30 backdrop-blur-sm">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about your project..."
                disabled={isLoading}
                className="flex-1 bg-gray-800/80 border-gray-600 hover:border-teal-500/50 text-white placeholder-gray-400 transition-all duration-300 focus:border-teal-400 focus:shadow-teal-400/20 backdrop-blur-sm"
              />
              <Button 
                type="submit" 
                disabled={!message.trim() || isLoading}
                size="icon"
                className="bg-teal-600 hover:bg-teal-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-teal-500/30"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  '→'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Floating mode (original behavior)
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
          shouldScrollToBottom={shouldScrollToBottom}
          className="flex-1"
        />
        
        <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4 bg-gray-800/30 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about your project..."
              disabled={isLoading}
              className="flex-1 bg-gray-800/80 border-gray-600 hover:border-teal-500/50 text-white placeholder-gray-400 transition-all duration-300 focus:border-teal-400 focus:shadow-teal-400/20 backdrop-blur-sm"
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || isLoading}
              size="icon"
              className="bg-teal-600 hover:bg-teal-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-teal-500/30"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '→'
              )}
            </Button>
          </div>
          <div className="text-xs text-gray-400 mt-2 text-center">
            Press Ctrl+/ to toggle • Enter to send
          </div>
        </form>
      </div>
    </Card>
  );
}