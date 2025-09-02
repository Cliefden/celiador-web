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
    if (!projectId) {
      console.log('[useConversation] No projectId provided');
      return;
    }

    try {
      console.log('[useConversation] Loading conversation for project:', projectId);
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[useConversation] No user authenticated');
        throw new Error('User not authenticated');
      }

      console.log('[useConversation] User authenticated:', user.id);

      // Find active conversation for this project
      // First try to get conversations with messages (prefer conversations with content)
      const { data: conversationsWithMessages, error: convError1 } = await supabase
        .from('conversations')
        .select('*, messages!inner(id)')
        .eq('projectid', projectId)
        .eq('userid', user.id)
        .eq('status', 'ACTIVE')
        .order('updatedat', { ascending: false })
        .limit(1);

      let conversations = conversationsWithMessages;

      // If no conversations with messages, fall back to any conversation
      if (!conversations || conversations.length === 0) {
        const { data: allConversations, error: convError2 } = await supabase
          .from('conversations')
          .select('*')
          .eq('projectid', projectId)
          .eq('userid', user.id)
          .eq('status', 'ACTIVE')
          .order('updatedat', { ascending: false })
          .limit(1);
        
        conversations = allConversations;
        if (convError2) {
          throw convError2;
        }
      }

      if (convError1 && !conversations) {
        throw convError1;
      }

      console.log('[useConversation] Found conversations:', conversations?.length || 0);

      if (conversations && conversations.length > 0) {
        console.log('[useConversation] Setting conversation:', conversations[0].id);
        setConversation(conversations[0]);
        await loadMessages(conversations[0].id);
      } else {
        console.log('[useConversation] No conversations found for project');
        setConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('[useConversation] Error loading project conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    try {
      console.log('[useConversation] Loading messages for conversation:', conversationId);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversationid', conversationId)
        .order('createdat', { ascending: true });

      if (messagesError) {
        console.error('[useConversation] Error querying messages:', messagesError);
        throw messagesError;
      }

      console.log('[useConversation] Found messages:', messagesData?.length || 0);

      const formattedMessages: Message[] = (messagesData || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        messageType: msg.messagetype,
        createdAt: msg.createdat,
        metadata: msg.metadata,
        relatedJobId: msg.relatedjobid
      }));

      console.log('[useConversation] Setting', formattedMessages.length, 'messages');
      setMessages(formattedMessages);
    } catch (err) {
      console.error('[useConversation] Error loading messages:', err);
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
    console.log('[useConversation] sendMessage called with:', { content, messageType, hasTargetConversation: !!targetConversation });
    
    const activeConversation = targetConversation || conversation;
    console.log('[useConversation] Active conversation:', activeConversation?.id);
    
    if (!activeConversation) {
      console.error('[useConversation] No active conversation found');
      throw new Error('No active conversation');
    }

    try {
      console.log('[useConversation] Starting message send process...');
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
      console.log('[useConversation] Saving user message to database...');
      console.log('[useConversation] User message data:', {
        conversationid: activeConversation.id,
        content,
        role: 'user',
        messagetype: messageType,
        userid: user.id,
        creator: user.id
      });

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
        console.error('[useConversation] Error saving user message:', userMessageError);
        throw userMessageError;
      }

      console.log('[useConversation] User message saved successfully:', savedUserMessage.id);

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

      // Get AI response from orchestrator
      try {
        // Call orchestrator AI endpoint
        console.log('[useConversation] Getting auth session for AI API call...');
        const sessionResult = await supabase.auth.getSession();
        const authToken = sessionResult.data.session?.access_token;
        
        if (!authToken) {
          console.error('[useConversation] No auth token available');
          throw new Error('No auth token available - user may need to log in again');
        }
        
        if (sessionResult.error) {
          console.error('[useConversation] Session error:', sessionResult.error);
          throw new Error(`Session error: ${sessionResult.error.message}`);
        }

        // Include conversation history for context
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        console.log('[useConversation] Making AI API call to:', `http://localhost:4000/projects/${activeConversation.projectId}/chat`);
        console.log('[useConversation] Auth token length:', authToken.length);
        console.log('[useConversation] Request body:', {
          message: content,
          conversationId: activeConversation.id,
          historyLength: conversationHistory.length,
          provider: 'openai'
        });

        const aiResponse = await fetch(`http://localhost:4000/projects/${activeConversation.projectId}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            message: content,
            conversationId: activeConversation.id,
            history: conversationHistory, // Include conversation history
            provider: 'openai' // Default to OpenAI, could be made configurable
          })
        });

        console.log('[useConversation] AI API response status:', aiResponse.status, aiResponse.statusText);

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('[useConversation] AI API error response:', errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || 'AI service unavailable' };
          }
          
          throw new Error(errorData.error || `AI API error: ${aiResponse.status} ${aiResponse.statusText}`);
        }

        const responseData = await aiResponse.json();
        console.log('[useConversation] AI API response data:', responseData);
        const { response: aiContent, actions } = responseData;

        // Save AI response to database
        console.log('[useConversation] Saving AI response to database...');
        const assistantResponse = {
          conversationid: activeConversation.id,
          content: aiContent,
          role: 'assistant',
          messagetype: actions ? 'command' : 'text', // Mark as command if actions detected
          userid: user.id,
          creator: user.id,
          relatedjobid: actions?.jobId || null,
          metadata: actions ? { actionsDetected: actions.detected } : null
        };

        console.log('[useConversation] AI response object:', assistantResponse);

        const { data: savedAssistantMessage, error: assistantMessageError } = await supabase
          .from('messages')
          .insert([assistantResponse])
          .select()
          .single();

        if (assistantMessageError) {
          console.error('[useConversation] Error saving AI message:', assistantMessageError);
          throw assistantMessageError;
        }

        console.log('[useConversation] AI message saved successfully:', savedAssistantMessage.id);

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
        console.error('Error getting AI response:', err);
        
        // Fall back to placeholder response if AI fails
        const fallbackResponse = {
          conversationid: activeConversation.id,
          content: `I'm having trouble connecting to the AI service right now. Error: ${err instanceof Error ? err.message : 'Unknown error'}. Please check that your API keys are configured.`,
          role: 'assistant',
          messagetype: 'text',
          userid: user.id,
          creator: user.id
        };

        try {
          const { data: savedFallbackMessage, error: fallbackError } = await supabase
            .from('messages')
            .insert([fallbackResponse])
            .select()
            .single();

          if (!fallbackError) {
            setMessages(prev => [...prev, {
              id: savedFallbackMessage.id,
              content: savedFallbackMessage.content,
              role: 'assistant' as const,
              messageType: 'text' as const,
              createdAt: savedFallbackMessage.createdat,
              metadata: savedFallbackMessage.metadata,
              relatedJobId: savedFallbackMessage.relatedjobid
            }]);
          }
        } catch (fallbackErr) {
          console.error('Error saving fallback message:', fallbackErr);
        }

        setError(err instanceof Error ? err.message : 'Failed to get AI response');
      }

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
      console.log('[useConversation] Loading conversation for project:', projectId);
      loadProjectConversation();
    } else {
      // Clear conversation if no project selected
      console.log('[useConversation] Clearing conversation (no project)');
      clearConversation();
    }
  }, [projectId, loadProjectConversation]);

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