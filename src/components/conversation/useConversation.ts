import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useSimpleWebSocket } from '../../hooks/useSimpleWebSocket';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';
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

interface FileOperationPreview {
  operations: Array<{
    type: 'create_file' | 'update_file' | 'delete_file';
    path: string;
    content?: string;
  }>;
  aiResponse: string;
  conversationId: string;
}

interface UseConversationReturn {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  pendingFileOperations: FileOperationPreview | null;
  sendMessage: (content: string, messageType?: Message['messageType'], targetConversation?: Conversation) => Promise<void>;
  createConversation: (title: string) => Promise<Conversation>;
  loadConversation: (conversationId: string) => Promise<void>;
  clearConversation: () => void;
  approveFileOperations: (operations: any[]) => Promise<void>;
  rejectFileOperations: () => void;
  shouldScrollToBottom: boolean; // Flag to trigger scrolling
}

// Helper function to get WebSocket URL
const getWebSocketUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
  
  if (baseUrl.startsWith('https://')) {
    return baseUrl.replace('https://', 'wss://').replace(/\/+$/, '');
  } else {
    return baseUrl.replace('http://', 'ws://').replace(/\/+$/, '');
  }
};

export function useConversation(projectId?: string): UseConversationReturn {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFileOperations, setPendingFileOperations] = useState<FileOperationPreview | null>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const { session } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  // Real-time WebSocket integration for conversations and messages
  const { isConnected, lastMessage } = useSimpleWebSocket({
    url: getWebSocketUrl(),
    token: session?.access_token || '',
    enabled: false, // Temporarily disabled to reduce WebSocket conflicts
    maxReconnectAttempts: 3,
    reconnectDelay: 2000,
    onMessage: (data) => {
      if (!projectId) return; // Only handle real-time events if we have a project context
      
      if (data.type === 'conversation_created') {
        if (data.conversationData?.projectid === projectId || data.userId === 'system') {
          console.log('📥 Real-time conversation creation:', data);
          handleConversationCreated(data);
        }
      } else if (data.type === 'conversation_updated') {
        if (data.conversationData?.projectid === projectId || data.userId === 'system') {
          console.log('📥 Real-time conversation update:', data);
          handleConversationUpdated(data);
        }
      } else if (data.type === 'message_created') {
        if (data.conversationId === conversation?.id || data.userId === 'system') {
          console.log('📥 Real-time message creation:', data);
          handleMessageCreated(data);
        }
      } else if (data.type === 'message_deleted') {
        if (data.conversationId === conversation?.id || data.userId === 'system') {
          console.log('🗑️ Real-time message deletion:', data);
          handleMessageDeleted(data);
        }
      }
    },
    onConnect: () => {
      console.log('🔌 [useConversation] WebSocket connected - checking for missed messages');
      // When WebSocket reconnects, check for any missed messages
      if (conversation?.id) {
        console.log('🔄 [useConversation] Reloading messages after WebSocket reconnect');
        loadMessages(conversation.id);
      }
    },
    onError: (error) => {
      if (error.severity === 'high') {
        console.warn(`⚠️ Conversation WebSocket: ${error.userMessage}`);
      }
    }
  });

  // Real-time event handlers
  const handleConversationCreated = useCallback((event: any) => {
    console.log('🆕 Handling conversation creation:', event.conversationData);
    
    // If this is a conversation for our current project and we don't have one yet
    if (event.conversationData?.projectid === projectId && !conversation) {
      const transformedConversation = {
        id: event.conversationData.id,
        title: event.conversationData.title,
        status: event.conversationData.status,
        createdAt: event.conversationData.createdat,
        updatedAt: event.conversationData.updatedat,
        projectId: event.conversationData.projectid,
        userId: event.conversationData.userid
      };
      setConversation(transformedConversation);
      setMessages([]); // Start with empty messages
    }
  }, [projectId, conversation]);

  const handleConversationUpdated = useCallback((event: any) => {
    console.log('🔄 Handling conversation update:', event.conversationData);
    
    // Update conversation if it's the current one
    if (event.conversationData?.id === conversation?.id) {
      const transformedConversation = {
        id: event.conversationData.id,
        title: event.conversationData.title,
        status: event.conversationData.status,
        createdAt: event.conversationData.createdat,
        updatedAt: event.conversationData.updatedat,
        projectId: event.conversationData.projectid,
        userId: event.conversationData.userid
      };
      setConversation(transformedConversation);
    }
  }, [conversation?.id]);

  const handleMessageCreated = useCallback((event: any) => {
    console.log('📝 Handling message creation:', event.messageData);
    
    // Add new message to current conversation
    if (event.conversationId === conversation?.id && event.messageData) {
      const newMessage: Message = {
        id: event.messageData.id,
        content: event.messageData.content,
        role: event.messageData.role,
        messageType: event.messageData.messagetype,
        createdAt: event.messageData.createdat,
        metadata: event.messageData.metadata,
        relatedJobId: event.messageData.relatedjobid
      };
      
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) {
          console.log('📝 Message already exists, skipping:', newMessage.id);
          return prev;
        }
        
        // If this is an assistant message, check if we have a temporary one to replace
        if (newMessage.role === 'assistant') {
          const tempIndex = prev.findIndex(msg => msg.id.startsWith('temp-ai-') && msg.role === 'assistant');
          if (tempIndex >= 0) {
            console.log('📝 Replacing temporary AI message with real one:', newMessage.id);
            const updated = [...prev];
            updated[tempIndex] = newMessage;
            return updated;
          }
        }
        
        console.log('📝 Adding new message to conversation:', newMessage.id);
        return [...prev, newMessage];
      });
    }
  }, [conversation?.id]);

  const handleMessageDeleted = useCallback((event: any) => {
    console.log('🗑️ Handling message deletion:', event.messageId);
    
    // Remove message from current conversation
    if (event.conversationId === conversation?.id) {
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== event.messageId);
        console.log(`🗑️ Removed message ${event.messageId} from conversation (${prev.length} -> ${filtered.length} messages)`);
        return filtered;
      });
    }
  }, [conversation?.id]);

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
        // Transform database record to match interface
        const transformedConversation = {
          id: conversations[0].id,
          title: conversations[0].title,
          status: conversations[0].status,
          createdAt: conversations[0].createdat,
          updatedAt: conversations[0].updatedat,
          projectId: conversations[0].projectid,
          userId: conversations[0].userid
        };
        console.log('[useConversation] Transformed conversation:', transformedConversation);
        setConversation(transformedConversation);
        await loadMessages(conversations[0].id);
      } else {
        console.log('[useConversation] No conversations found for project, creating new one...');
        try {
          const newConversation = await createConversation(`Project ${projectId} Chat`);
          console.log('[useConversation] Created new conversation:', newConversation.id);
          setConversation(newConversation);
          setMessages([]);
        } catch (createError) {
          console.error('[useConversation] Failed to create new conversation:', createError);
          setConversation(null);
          setMessages([]);
        }
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
      
      // Trigger scroll to bottom after messages are loaded
      if (formattedMessages.length > 0) {
        console.log('[useConversation] Messages loaded, setting scroll trigger');
        setShouldScrollToBottom(true);
        // Reset the trigger after a short delay
        setTimeout(() => setShouldScrollToBottom(false), 500);
      }
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

      console.log('[useConversation] Creating conversation with data:', conversationData);

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

      // Transform database record to match interface
      const transformedConversation = {
        id: data.id,
        title: data.title,
        status: data.status,
        createdAt: data.createdat,
        updatedAt: data.updatedat,
        projectId: data.projectid,
        userId: data.userid
      };
      
      setConversation(transformedConversation);
      setMessages([]);
      return transformedConversation; // Return the transformed conversation
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
        // Include conversation history for context
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
        console.log('[useConversation] Active conversation:', activeConversation);
        console.log('[useConversation] Making AI API call to:', `${apiUrl}/projects/${activeConversation.projectId}/chat`);
        console.log('[useConversation] Request body:', {
          message: content,
          conversationId: activeConversation.id,
          historyLength: conversationHistory.length,
          provider: 'openai'
        });

        const aiResponse = await authenticatedFetch(`${apiUrl}/projects/${activeConversation.projectId}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
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

        // Note: AI message is already saved by the backend - no need to save here
        console.log('[useConversation] AI response received from backend');
        
        // Add AI message to UI immediately (will be updated via WebSocket when backend saves it)
        const tempAiMessage: Message = {
          id: `temp-ai-${Date.now()}`,
          content: aiContent,
          role: 'assistant',
          messageType: actions ? 'command' : 'text',
          createdAt: new Date().toISOString(),
          metadata: actions ? { actionsDetected: actions.detected } : null,
          relatedJobId: actions?.jobId || null
        };
        setMessages(prev => [...prev, tempAiMessage]);

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

      // Transform database record to match interface
      const transformedConversation = {
        id: data.id,
        title: data.title,
        status: data.status,
        createdAt: data.createdat,
        updatedAt: data.updatedat,
        projectId: data.projectid,
        userId: data.userid
      };
      
      setConversation(transformedConversation);
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

  // Approve file operations
  const approveFileOperations = async (operations: any[]) => {
    // TODO: Implement file operations approval
    console.log('Approving file operations:', operations);
    setPendingFileOperations(null);
  };

  // Reject file operations
  const rejectFileOperations = () => {
    setPendingFileOperations(null);
  };

  // Load project conversation when projectId changes
  useEffect(() => {
    const loadConversationForProject = async () => {
      if (!projectId) {
        console.log('[useConversation] Clearing conversation (no project)');
        clearConversation();
        return;
      }

      console.log('[useConversation] Project changed to:', projectId, '- clearing state and loading new conversation');
      
      // Immediately clear conversation state to prevent showing old conversation
      setConversation(null);
      setMessages([]);
      setError(null);
      
      // Load conversation inline to avoid dependency issues
      try {
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
        // Always prefer existing conversations over creating new ones
        const { data: allConversations, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('projectid', projectId)
          .eq('userid', user.id)
          .eq('status', 'ACTIVE')
          .order('updatedat', { ascending: false });

        if (convError) {
          throw convError;
        }

        let conversations = allConversations;

        // If we found conversations, check which ones have messages and prioritize those
        if (conversations && conversations.length > 0) {
          console.log('[useConversation] Found', conversations.length, 'existing conversations');
          
          // Check each conversation for messages and prioritize ones with content
          const conversationsWithMessageCounts = await Promise.all(
            conversations.map(async (conv) => {
              const { data: messages } = await supabase
                .from('messages')
                .select('id, createdat')
                .eq('conversationid', conv.id)
                .order('createdat', { ascending: false })
                .limit(1);
              
              return {
                ...conv,
                messageCount: messages?.length || 0,
                latestMessageDate: messages?.[0]?.createdat || null
              };
            })
          );
          
          // Sort: conversations with messages first (by latest message), then by updatedat
          conversations = conversationsWithMessageCounts.sort((a, b) => {
            if (a.messageCount > 0 && b.messageCount === 0) return -1;
            if (a.messageCount === 0 && b.messageCount > 0) return 1;
            if (a.messageCount > 0 && b.messageCount > 0) {
              return new Date(b.latestMessageDate).getTime() - new Date(a.latestMessageDate).getTime();
            }
            return new Date(b.updatedat).getTime() - new Date(a.updatedat).getTime();
          });
          
          console.log('[useConversation] Using conversation:', conversations[0].id, 
                     'with', conversations[0].messageCount, 'messages');
        }

        console.log('[useConversation] Found conversations:', conversations?.length || 0);

        if (conversations && conversations.length > 0) {
          console.log('[useConversation] Setting conversation:', conversations[0].id);
          // Transform database record to match interface
          const transformedConversation = {
            id: conversations[0].id,
            title: conversations[0].title,
            status: conversations[0].status,
            createdAt: conversations[0].createdat,
            updatedAt: conversations[0].updatedat,
            projectId: conversations[0].projectid,
            userId: conversations[0].userid
          };
          console.log('[useConversation] Transformed conversation:', transformedConversation);
          setConversation(transformedConversation);
          await loadMessages(conversations[0].id);
        } else {
          console.log('[useConversation] No conversations found for project, creating new one...');
          try {
            const newConversation = await createConversation(`Project ${projectId} Chat`);
            console.log('[useConversation] Created new conversation:', newConversation.id);
            setConversation(newConversation);
            setMessages([]);
          } catch (createError) {
            console.error('[useConversation] Failed to create new conversation:', createError);
            setConversation(null);
            setMessages([]);
          }
        }
      } catch (err) {
        console.error('[useConversation] Error loading project conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    loadConversationForProject();
  }, [projectId]); // Only depend on projectId

  return {
    conversation,
    messages,
    loading,
    error,
    pendingFileOperations,
    sendMessage,
    createConversation,
    loadConversation,
    clearConversation,
    approveFileOperations,
    rejectFileOperations,
    shouldScrollToBottom
  };
}