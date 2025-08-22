import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Message } from './MessageList';

interface Conversation {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  userId: string;
}

interface UseConversationReturn {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
sendMessage: (content: string, messageType?: Message['messageType'], targetConversation?: Conversation) => Promise<void>;
createConversation: (title: string) => Promise<Conversation>;
  loadConversation: (conversationId: string) => Promise<void>;
  clearConversation: () => void;
}

export function useConversation(projectId?: string): UseConversationReturn {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing conversation for project
  const loadProjectConversation = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Find active conversation for this project
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
.eq('projectid', projectId)
.eq('userid', user.id)
        .eq('status', 'ACTIVE')
.order('updatedat', { ascending: false })
        .limit(1);

      if (convError) {
        throw convError;
      }

      if (conversations && conversations.length > 0) {
        setConversation(conversations[0]);
        await loadMessages(conversations[0].id);
      }
    } catch (err) {
      console.error('Error loading project conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
.eq('conversationid', conversationId)
        .order('createdat', { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      const formattedMessages: Message[] = (messagesData || []).map(msg => ({
id: msg.id,
        content: msg.content,
        role: msg.role,
        messageType: msg.messagetype,
        createdAt: msg.createdat,
        metadata: msg.metadata,
        relatedJobId: msg.relatedjobid
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  };

// Create new conversation
  const createConversation = async (title: string): Promise<Conversation> => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const conversationData = {
        title,
        projectid: projectId || null,
        userid: user.id,
        creator: user.id,
        status: 'ACTIVE'
      };

      const { data, error: createError } = await supabase
        .from('conversations')
        .insert([conversationData])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      if (!data) {
        throw new Error('No conversation data returned from insert');
      }

      setConversation(data);
      setMessages([]);
      return data; // Return the created conversation
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

// Send message
  const sendMessage = async (content: string, messageType: Message['messageType'] = 'text', targetConversation?: Conversation) => {
    const activeConversation = targetConversation || conversation;
    if (!activeConversation) {
      throw new Error('No active conversation');
    }

    try {
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Add user message to UI immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        role: 'user',
        messageType,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Save user message to database
      const { data: savedUserMessage, error: userMessageError } = await supabase
        .from('messages')
        .insert([{
conversationid: activeConversation.id,
          content,
          role: 'user',
          messagetype: messageType,
          userid: user.id,
          creator: user.id
        }])
        .select()
        .single();

      if (userMessageError) {
        throw userMessageError;
      }

// Replace temp message with saved one
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { 
              id: savedUserMessage.id,
              content: savedUserMessage.content,
              role: 'user' as const,
              messageType,
              createdAt: savedUserMessage.createdat,
              metadata: savedUserMessage.metadata,
              relatedJobId: savedUserMessage.relatedjobid
            }
          : msg
      ));

      // TODO: Add AI response logic here
      // For now, add a placeholder response
      setTimeout(async () => {
        try {
const assistantResponse = {
            conversationid: activeConversation.id,
            content: "I understand your request. This is a placeholder response while we integrate with the AI service.",
            role: 'assistant',
            messagetype: 'text',
            userid: user.id,
            creator: user.id
          };

          const { data: savedAssistantMessage, error: assistantMessageError } = await supabase
            .from('messages')
            .insert([assistantResponse])
            .select()
            .single();

          if (assistantMessageError) {
            throw assistantMessageError;
          }

setMessages(prev => [...prev, {
            id: savedAssistantMessage.id,
            content: savedAssistantMessage.content,
            role: 'assistant' as const,
            messageType: 'text' as const,
            createdAt: savedAssistantMessage.createdat,
            metadata: savedAssistantMessage.metadata,
            relatedJobId: savedAssistantMessage.relatedjobid
          }]);

        } catch (err) {
          console.error('Error adding assistant response:', err);
          setError(err instanceof Error ? err.message : 'Failed to get AI response');
        }
      }, 1000);

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      // Remove failed message from UI
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
      throw err;
    }
  };

  // Load conversation by ID
  const loadConversation = async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) {
        throw convError;
      }

      setConversation(data);
      await loadMessages(conversationId);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  // Clear current conversation
  const clearConversation = () => {
    setConversation(null);
    setMessages([]);
    setError(null);
  };

  // Load project conversation when projectId changes
  useEffect(() => {
    if (projectId) {
      loadProjectConversation();
    } else {
      // Clear conversation if no project selected
      clearConversation();
    }
  }, [projectId, loadProjectConversation]);

  // Clear conversation when projectId changes
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts or projectId changes
      setConversation(null);
      setMessages([]);
      setError(null);
    };
  }, [projectId]);

  return {
    conversation,
    messages,
    loading,
    error,
    sendMessage,
    createConversation,
    loadConversation,
    clearConversation
  };
}