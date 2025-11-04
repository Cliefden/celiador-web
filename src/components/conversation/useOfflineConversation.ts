import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useSimpleWebSocket } from '../../hooks/useSimpleWebSocket';
import { offlineActivityManager, optimisticUpdatesManager } from '../../lib/offline';
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

interface UseOfflineConversationReturn {
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
  shouldScrollToBottom: boolean;
  isOnline: boolean;
  hasPendingMessages: boolean;
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

export function useOfflineConversation(projectId?: string): UseOfflineConversationReturn {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFileOperations, setPendingFileOperations] = useState<FileOperationPreview | null>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasPendingMessages, setHasPendingMessages] = useState(false);
  const { session } = useAuth();

  // Monitor online status
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Real-time WebSocket integration for conversations and messages
  const { isConnected, lastMessage } = useSimpleWebSocket({
    url: getWebSocketUrl(),
    token: session?.access_token || '',
    enabled: !!session?.access_token,
    maxReconnectAttempts: 3,
    reconnectDelay: 2000,
    onMessage: (data) => {
      if (!projectId) return;
      
      if (data.type === 'conversation_created') {
        if (data.conversationData?.projectid === projectId || data.userId === 'system') {
          handleConversationCreated(data);
        }
      } else if (data.type === 'conversation_updated') {
        if (data.conversationData?.projectid === projectId || data.userId === 'system') {
          handleConversationUpdated(data);
        }
      } else if (data.type === 'message_created') {
        if (data.conversationId === conversation?.id || data.userId === 'system') {
          handleMessageCreated(data);
        }
      } else if (data.type === 'message_deleted') {
        if (data.conversationId === conversation?.id || data.userId === 'system') {
          handleMessageDeleted(data);
        }
      }
    },
    onConnect: () => {
      console.log('🔌 [useOfflineConversation] WebSocket connected - checking for missed messages');
      // When WebSocket reconnects, check for any missed messages
      if (conversation?.id) {
        console.log('🔄 [useOfflineConversation] Reloading messages after WebSocket reconnect');
        loadMessages(conversation.id);
      }
    },
    onError: (error) => {
      if (error.severity === 'high') {
        console.warn(`⚠️ Conversation WebSocket: ${error.userMessage}`);
      }
    }
  });

  // Listen for optimistic updates confirmations
  useEffect(() => {
    const handleOptimisticConfirmed = (event: CustomEvent) => {
      if (event.detail.type === 'send_message') {
        console.log('✅ Message confirmed by server:', event.detail);
        // Update message in UI to remove optimistic styling
        setMessages(prev => prev.map(msg => 
          msg.id === event.detail.tempId ? { ...msg, metadata: { ...msg.metadata, optimistic: false } } : msg
        ));
      }
    };

    const handleOptimisticFailed = (event: CustomEvent) => {
      if (event.detail.type === 'send_message') {
        console.error('❌ Message failed to sync:', event.detail);
        // Could show a retry button or error indicator
        setMessages(prev => prev.map(msg => 
          msg.id === event.detail.tempId ? { ...msg, metadata: { ...msg.metadata, failed: true } } : msg
        ));
      }
    };

    optimisticUpdatesManager.on('optimisticConfirmed', handleOptimisticConfirmed);
    optimisticUpdatesManager.on('optimisticFailed', handleOptimisticFailed);

    return () => {
      optimisticUpdatesManager.off('optimisticConfirmed', handleOptimisticConfirmed);
      optimisticUpdatesManager.off('optimisticFailed', handleOptimisticFailed);
    };
  }, []);

  // Real-time event handlers (same as original)
  const handleConversationCreated = useCallback((event: any) => {
    console.log('🆕 Handling conversation creation:', event.conversationData);
    
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
      setMessages([]);
    }
  }, [projectId, conversation]);

  const handleConversationUpdated = useCallback((event: any) => {
    console.log('🔄 Handling conversation update:', event.conversationData);
    
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
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) {
          console.log('📝 Message already exists, skipping:', newMessage.id);
          return prev;
        }
        
        console.log('📝 Adding new message to conversation:', newMessage.id);
        return [...prev, newMessage];
      });
    }
  }, [conversation?.id]);

  const handleMessageDeleted = useCallback((event: any) => {
    console.log('🗑️ Handling message deletion:', event.messageId);
    
    if (event.conversationId === conversation?.id) {
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== event.messageId);
        console.log(`🗑️ Removed message ${event.messageId} from conversation (${prev.length} -> ${filtered.length} messages)`);
        return filtered;
      });
    }
  }, [conversation?.id]);

  // Enhanced sendMessage with offline support
  const sendMessage = async (content: string, messageType: Message['messageType'] = 'text', targetConversation?: Conversation) => {
    console.log('[useOfflineConversation] sendMessage called with:', { content, messageType, isOnline });
    
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

      if (isOnline) {
        // Online mode - try direct API call first
        try {
          await sendMessageOnline(content, messageType, activeConversation, user);
          return;
        } catch (error) {
          console.warn('Online message send failed, falling back to offline mode:', error);
          // Fall through to offline mode
        }
      }

      // Offline mode or online fallback
      await sendMessageOffline(content, messageType, activeConversation, user);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  };

  const sendMessageOnline = async (content: string, messageType: string, activeConversation: Conversation, user: any) => {
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

    // Get AI response from orchestrator
    const sessionResult = await supabase.auth.getSession();
    const authToken = sessionResult.data.session?.access_token;
    
    if (!authToken) {
      throw new Error('No auth token available');
    }

    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
    const chatUrl = `${apiUrl}/projects/${activeConversation.projectId}/chat`;
    const requestBody = {
      message: content,
      conversationId: activeConversation.id,
      history: conversationHistory,
      provider: 'openai'
    };
    
    console.log('Making chat API request to:', chatUrl);
    
    const aiResponse = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('AI response status:', aiResponse.status);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'AI service unavailable' };
      }
      throw new Error(errorData.error || `AI API error: ${aiResponse.status} ${aiResponse.statusText}`);
    }

    const responseData = await aiResponse.json();
    const { response: aiContent, actions } = responseData;

    // Save AI response to database
    const assistantResponse = {
      conversationid: activeConversation.id,
      content: aiContent,
      role: 'assistant',
      messagetype: actions ? 'command' : 'text',
      userid: user.id,
      creator: user.id,
      relatedjobid: actions?.jobId || null,
      metadata: actions ? { actionsDetected: actions.detected } : null
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
  };

  const sendMessageOffline = async (content: string, messageType: string, activeConversation: Conversation, user: any) => {
    console.log('📴 Sending message in offline mode');
    
    // Use optimistic updates for immediate UI feedback
    const result = await optimisticUpdatesManager.sendMessageOptimistically({
      content,
      role: 'user',
      messageType
    }, activeConversation.id, activeConversation.projectId || '', user.id);

    if (!result.success) {
      throw new Error(result.error || 'Failed to queue message');
    }

    // Add optimistic message to UI immediately
    const optimisticMessage: Message = {
      id: result.tempId,
      content,
      role: 'user',
      messageType,
      createdAt: new Date().toISOString(),
      metadata: { optimistic: true, synced: false }
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setHasPendingMessages(true);

    // If this looks like a command that would trigger a job, create an optimistic job too
    if (content.toLowerCase().includes('create') || 
        content.toLowerCase().includes('add') || 
        content.toLowerCase().includes('build') ||
        content.toLowerCase().includes('generate')) {
      
      try {
        const jobResult = await offlineActivityManager.createJob({
          type: 'AI_ACTION',
          prompt: content,
          metadata: { triggeredByMessage: result.tempId }
        }, activeConversation.projectId || '', user.id);

        console.log('⚡ Created optimistic job for offline message:', jobResult);
      } catch (error) {
        console.warn('Could not create optimistic job:', error);
      }
    }

    console.log('✅ Message queued for sync when online');
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    try {
      console.log('[useOfflineConversation] Loading messages for conversation:', conversationId);
      
      // Force fresh query by using a timestamp to bypass cache
      console.log('[useOfflineConversation] 🔍 DEBUGGING: About to query messages for conversation:', conversationId);
      console.log('[useOfflineConversation] 🔍 DEBUGGING: Supabase client:', !!supabase);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversationid', conversationId)
        .order('createdat', { ascending: true });
        
      console.log('[useOfflineConversation] 🔍 DEBUGGING: Query completed');
      console.log('[useOfflineConversation] 🔍 DEBUGGING: Error:', messagesError);
      console.log('[useOfflineConversation] 🔍 DEBUGGING: Data length:', messagesData?.length);
      console.log('[useOfflineConversation] 🔍 DEBUGGING: Full data sample:', messagesData?.slice(0, 3));
      
      // Success - the caching issue has been resolved

      if (messagesError) {
        console.error('[useOfflineConversation] Error querying messages:', messagesError);
        throw messagesError;
      }

      console.log('[useOfflineConversation] Found messages:', messagesData?.length || 0);
      console.log('[useOfflineConversation] Raw message data sample:', messagesData?.slice(-3));

      const formattedMessages: Message[] = (messagesData || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        messageType: msg.messagetype,
        createdAt: msg.createdat,
        metadata: msg.metadata,
        relatedJobId: msg.relatedjobid
      }));

      console.log('[useOfflineConversation] Setting', formattedMessages.length, 'messages');
      console.log('[useOfflineConversation] Latest messages:', formattedMessages.slice(-3).map(m => `${m.role}: ${m.content}`));
      setMessages(formattedMessages);
      
      // Trigger scroll to bottom after messages are loaded
      if (formattedMessages.length > 0) {
        console.log('[useOfflineConversation] Messages loaded, setting scroll trigger');
        setShouldScrollToBottom(true);
        // Reset the trigger after a short delay
        setTimeout(() => setShouldScrollToBottom(false), 500);
      }
    } catch (err) {
      console.error('[useOfflineConversation] Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  };

  // Load project conversation (same as original but with offline awareness)
  const loadProjectConversation = useCallback(async () => {
    if (!projectId) {
      console.log('[useOfflineConversation] No projectId provided');
      return;
    }

    try {
      console.log('[useOfflineConversation] Loading conversation for project:', projectId);
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[useOfflineConversation] No user authenticated');
        throw new Error('User not authenticated');
      }

      console.log('[useOfflineConversation] User authenticated:', user.id);

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

      console.log('[useOfflineConversation] Found conversations:', conversations?.length || 0);

      if (conversations && conversations.length > 0) {
        console.log('[useOfflineConversation] Loading existing conversation:', conversations[0].id);
        
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
        
        console.log('[useOfflineConversation] Transformed conversation:', transformedConversation);
        setConversation(transformedConversation);
        await loadMessages(conversations[0].id);
      } else {
        console.log('[useOfflineConversation] No conversations found for project, creating new one...');
        try {
          const newConversation = await createConversation(`Project ${projectId} Chat`);
          console.log('[useOfflineConversation] Created new conversation:', newConversation.id);
          setConversation(newConversation);
          setMessages([]);
        } catch (createError) {
          console.error('[useOfflineConversation] Failed to create new conversation:', createError);
          setConversation(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('[useOfflineConversation] Error loading project conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Create new conversation (same as original)
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

      console.log('[useOfflineConversation] Creating conversation with data:', conversationData);

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

  // Load conversation by ID (same as original)
  const loadConversation = async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Load conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('userid', user.id)
        .single();

      if (conversationError) {
        throw conversationError;
      }

      if (!conversationData) {
        throw new Error('Conversation not found');
      }

      // Transform database record to match interface
      const transformedConversation = {
        id: conversationData.id,
        title: conversationData.title,
        status: conversationData.status,
        createdAt: conversationData.createdat,
        updatedAt: conversationData.updatedat,
        projectId: conversationData.projectid,
        userId: conversationData.userid
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
    setHasPendingMessages(false);
  };

  // Approve file operations
  const approveFileOperations = async (operations: any[]) => {
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
        console.log('[useOfflineConversation] Clearing conversation (no project)');
        clearConversation();
        return;
      }

      console.log('🔄 [useOfflineConversation] *** PROJECT SWITCH DETECTED ***');
      console.log('🔄 [useOfflineConversation] Project changed to:', projectId, '- clearing state and loading new conversation');
      console.log('🔄 [useOfflineConversation] This should appear in browser console when switching projects!');
      
      // Immediately clear conversation state to prevent showing old conversation
      setConversation(null);
      setMessages([]);
      setError(null);
      setHasPendingMessages(false);
      
      // Load conversation inline to avoid dependency issues
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('[useOfflineConversation] No user authenticated');
          throw new Error('User not authenticated');
        }

        console.log('[useOfflineConversation] User authenticated:', user.id);

        // Find active conversation for this project
        // Always prefer existing conversations over creating new ones
        console.log('[useOfflineConversation] Querying conversations for project:', projectId, 'user:', user.id);
        const { data: allConversations, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('projectid', projectId)
          .eq('userid', user.id)
          .eq('status', 'ACTIVE')
          .order('updatedat', { ascending: false });

        if (convError) {
          console.error('[useOfflineConversation] Error in conversation query:', convError);
          throw convError;
        }

        console.log('[useOfflineConversation] Raw query result:', allConversations);
        console.log('[useOfflineConversation] Found', allConversations?.length || 0, 'conversations from query');
        
        let conversations = allConversations;

        // If we found conversations, check which ones have messages and prioritize those
        if (conversations && conversations.length > 0) {
          console.log('[useOfflineConversation] Found', conversations.length, 'existing conversations');
          
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
          
          console.log('[useOfflineConversation] Using conversation:', conversations[0].id, 
                     'with', conversations[0].messageCount, 'messages');
        }

        if (conversations && conversations.length > 0) {
          console.log('[useOfflineConversation] Loading existing conversation:', conversations[0].id);
          
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
          
          console.log('[useOfflineConversation] Transformed conversation:', transformedConversation);
          setConversation(transformedConversation);
          await loadMessages(conversations[0].id);
        } else {
          console.log('[useOfflineConversation] No conversations found for project, checking database directly before creating...');
          
          // Double-check: query database directly to see if conversations exist
          try {
            const { data: directCheck } = await supabase
              .from('conversations')
              .select('*')
              .eq('projectid', projectId);
            
            console.log('[useOfflineConversation] Direct database check found', directCheck?.length || 0, 'conversations total for project');
            if (directCheck && directCheck.length > 0) {
              console.log('[useOfflineConversation] Found conversations in direct check:');
              directCheck.forEach((conv, i) => {
                console.log(`  ${i + 1}. ${conv.id} - User: ${conv.userid} - Status: ${conv.status} - Title: ${conv.title}`);
              });
              
              console.log('❌ [useOfflineConversation] ERROR: Conversations exist but query did not find them!');
              console.log('❌ [useOfflineConversation] This indicates a query filtering issue');
              console.log('❌ [useOfflineConversation] NOT creating new conversation to avoid duplicates');
              
              setConversation(null);
              setMessages([]);
              setError('Failed to load existing conversations');
              return;
            }
          } catch (directCheckError) {
            console.error('[useOfflineConversation] Direct database check failed:', directCheckError);
          }
          
          console.log('[useOfflineConversation] Creating new conversation...');
          try {
            const newConversation = await createConversation(`Project ${projectId} Chat`);
            console.log('[useOfflineConversation] Created new conversation:', newConversation.id);
            setConversation(newConversation);
            setMessages([]);
          } catch (createError) {
            console.error('[useOfflineConversation] Failed to create new conversation:', createError);
            setConversation(null);
            setMessages([]);
          }
        }
      } catch (err) {
        console.error('[useOfflineConversation] Error loading project conversation:', err);
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
    shouldScrollToBottom,
    isOnline,
    hasPendingMessages
  };
}