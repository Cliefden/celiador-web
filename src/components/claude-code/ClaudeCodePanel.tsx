'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { 
  Terminal, 
  Send, 
  Loader2,
  Code,
  FileText,
  Play
} from 'lucide-react';

interface ClaudeCodePanelProps {
  projectId: string;
  className?: string;
}

interface ClaudeCodeConversation {
  id: string;
  project_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ClaudeCodeMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  input_method?: string;
  device_type?: string;
  files_modified?: string[];
  commands_executed?: string[];
  error_message?: string;
}

export function ClaudeCodePanel({ projectId, className = '' }: ClaudeCodePanelProps) {
  const [conversation, setConversation] = useState<ClaudeCodeConversation | null>(null);
  const [messages, setMessages] = useState<ClaudeCodeMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation and messages for the project
  useEffect(() => {
    if (projectId) {
      loadConversationAndMessages();
    }
  }, [projectId]);

  const loadConversationAndMessages = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      // Find or create conversation for this project
      let { data: existingConversation } = await supabase
        .from('claude_conversations')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .single();

      if (!existingConversation) {
        // Create new conversation
        const { data: newConversation } = await supabase
          .from('claude_conversations')
          .insert({
            project_id: projectId,
            creator: authSession.user.id
          })
          .select('*')
          .single();
        
        existingConversation = newConversation;
      }

      setConversation(existingConversation);

      // Load messages for this conversation
      if (existingConversation) {
        const { data: conversationMessages } = await supabase
          .from('claude_messages')
          .select('*')
          .eq('conversation_id', existingConversation.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        setMessages(conversationMessages || []);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const sendCommand = async () => {
    if (!input.trim() || isProcessing || !conversation) return;

    const userMessage: ClaudeCodeMessage = {
      id: `user-${Date.now()}`,
      conversation_id: conversation.id,
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
      device_type: 'web',
      input_method: 'text'
    };

    // Add user message immediately to UI
    setMessages(prev => [...prev, userMessage]);

    setInput('');
    setIsProcessing(true);

    try {
      // Get auth session for API call
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        throw new Error('Not authenticated');
      }

      // Call Claude Code API
      const response = await fetch(`/api/projects/${projectId}/claude-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          message: userMessage.content
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Claude Code request failed');
      }

      const assistantMessage: ClaudeCodeMessage = {
        id: `assistant-${Date.now()}`,
        conversation_id: conversation.id,
        role: 'assistant',
        content: responseData.response,
        created_at: responseData.timestamp,
        device_type: 'web',
        files_modified: responseData.files_modified || [],
        commands_executed: responseData.commands_executed || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      setIsProcessing(false);
    } catch (error) {
      console.error('Claude Code error:', error);
      
      // Add error message to chat
      const errorMessage: ClaudeCodeMessage = {
        id: `error-${Date.now()}`,
        conversation_id: conversation?.id || '',
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        created_at: new Date().toISOString(),
        device_type: 'web',
        error_message: error instanceof Error ? error.message : 'Unknown error occurred'
      };

      setMessages(prev => [...prev, errorMessage]);

      setIsProcessing(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center space-x-2 mb-3">
          <Terminal className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Claude Code</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500">Ready</span>
          </div>
        </div>
        
        {/* Command Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Claude Code to help with your project..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && sendCommand()}
            disabled={isProcessing}
          />
          <Button
            onClick={sendCommand}
            disabled={!input.trim() || isProcessing}
            size="sm"
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Terminal className="w-12 h-12 mx-auto mb-4 text-purple-300" />
              <p className="text-gray-500 font-medium">Claude Code ready!</p>
              <p className="text-sm text-gray-400 mt-1">Ask me to help with coding tasks, file operations, or project analysis.</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-purple-50 border-l-4 border-purple-500 ml-8'
                  : 'bg-gray-50 border-l-4 border-gray-400 mr-8'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Terminal className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  {(message.files_modified || message.commands_executed) && (
                    <div className="mt-2 text-xs text-gray-500">
                      {message.files_modified && message.files_modified.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>Modified: {message.files_modified.join(', ')}</span>
                        </div>
                      )}
                      {message.commands_executed && message.commands_executed.length > 0 && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Play className="w-3 h-3" />
                          <span>Executed: {message.commands_executed.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 mt-0.5">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        
        {isProcessing && (
          <div className="p-3 rounded-lg bg-gray-50 border-l-4 border-gray-400 mr-8">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-purple-600" />
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span className="text-sm text-gray-600">Claude Code is thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}