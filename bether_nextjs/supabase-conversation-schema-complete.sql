-- Supabase Conversation Schema Extension - Complete Version
-- This extends the existing Supabase database with conversational capabilities
-- Run this SQL in your Supabase SQL Editor after running supabase-setup.sql and supabase-profiles-setup.sql

-- Conversation threads - each project can have multiple conversation contexts
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Context linking (following existing camelCase pattern)
    projectId UUID REFERENCES projects(id) ON DELETE CASCADE,
    userId UUID NOT NULL, -- References auth.users via profiles
    
    -- Audit fields matching existing pattern
    creator UUID,
    updater UUID,
    deleter UUID,
    deletedAt TIMESTAMP WITH TIME ZONE
);

-- Individual messages within conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    messageType TEXT DEFAULT 'text' CHECK (messageType IN ('text', 'command', 'file_reference', 'job_result')),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Context and metadata
    metadata JSONB,
    parentId UUID REFERENCES messages(id), -- For threaded conversations
    
    -- Linking to existing job system
    relatedJobId UUID REFERENCES jobs(id),
    
    -- Relations (following existing camelCase pattern)
    conversationId UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    userId UUID NOT NULL, -- References auth.users via profiles
    
    -- Audit fields matching existing pattern
    creator UUID,
    updater UUID,
    deleter UUID,
    deletedAt TIMESTAMP WITH TIME ZONE
);

-- AI context management for maintaining project understanding
CREATE TABLE IF NOT EXISTS conversation_contexts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contextType TEXT NOT NULL, -- 'project_summary', 'file_knowledge', 'user_preferences'
    contextData JSONB NOT NULL, -- Vector embeddings, summaries, preferences
    lastUpdated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Linking (following existing camelCase pattern)
    conversationId UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    projectId UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Audit fields matching existing pattern
    creator UUID,
    updater UUID,
    deleter UUID,
    deletedAt TIMESTAMP WITH TIME ZONE
);

-- Enhanced GitHub integration data (extends existing project repo fields)
CREATE TABLE IF NOT EXISTS github_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    accessToken TEXT NOT NULL, -- Encrypted GitHub access token
    refreshToken TEXT, -- For token refresh
    scope TEXT[] DEFAULT ARRAY[]::TEXT[], -- GitHub OAuth scopes
    installationId TEXT, -- GitHub App installation ID
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Link to existing user system (following existing camelCase pattern)
    userId UUID UNIQUE NOT NULL, -- References auth.users via profiles
    
    -- Audit fields matching existing pattern
    creator UUID,
    updater UUID,
    deleter UUID,
    deletedAt TIMESTAMP WITH TIME ZONE
);

-- Track external service integrations
CREATE TABLE IF NOT EXISTS service_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service TEXT NOT NULL, -- 'openai', 'anthropic', 'vercel', etc.
    config JSONB NOT NULL, -- Service-specific configuration
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED', 'ERROR')),
    lastSync TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Link to user (following existing camelCase pattern)
    userId UUID NOT NULL, -- References auth.users via profiles
    
    -- Audit fields matching existing pattern
    creator UUID,
    updater UUID,
    deleter UUID,
    deletedAt TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance (following existing pattern)
CREATE INDEX IF NOT EXISTS idx_conversations_userId ON conversations(userId);
CREATE INDEX IF NOT EXISTS idx_conversations_projectId ON conversations(projectId);
CREATE INDEX IF NOT EXISTS idx_conversations_createdAt ON conversations(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_deletedAt ON conversations(deletedAt);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

CREATE INDEX IF NOT EXISTS idx_messages_conversationId ON messages(conversationId);
CREATE INDEX IF NOT EXISTS idx_messages_userId ON messages(userId);
CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_messages_parentId ON messages(parentId);
CREATE INDEX IF NOT EXISTS idx_messages_relatedJobId ON messages(relatedJobId);
CREATE INDEX IF NOT EXISTS idx_messages_deletedAt ON messages(deletedAt);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_messageType ON messages(messageType);

CREATE INDEX IF NOT EXISTS idx_conversation_contexts_conversationId ON conversation_contexts(conversationId);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_projectId ON conversation_contexts(projectId);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_deletedAt ON conversation_contexts(deletedAt);

CREATE INDEX IF NOT EXISTS idx_github_integrations_userId ON github_integrations(userId);
CREATE INDEX IF NOT EXISTS idx_github_integrations_deletedAt ON github_integrations(deletedAt);
CREATE INDEX IF NOT EXISTS idx_service_integrations_userId ON service_integrations(userId);
CREATE INDEX IF NOT EXISTS idx_service_integrations_deletedAt ON service_integrations(deletedAt);

-- Add audit triggers for new tables (using existing functions from supabase-setup.sql)
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_conversations_creator 
    BEFORE INSERT ON conversations 
    FOR EACH ROW EXECUTE FUNCTION set_creator_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_messages_creator 
    BEFORE INSERT ON messages 
    FOR EACH ROW EXECUTE FUNCTION set_creator_column();

CREATE TRIGGER update_conversation_contexts_updated_at 
    BEFORE UPDATE ON conversation_contexts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_conversation_contexts_creator 
    BEFORE INSERT ON conversation_contexts 
    FOR EACH ROW EXECUTE FUNCTION set_creator_column();

CREATE TRIGGER update_github_integrations_updated_at 
    BEFORE UPDATE ON github_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_github_integrations_creator 
    BEFORE INSERT ON github_integrations 
    FOR EACH ROW EXECUTE FUNCTION set_creator_column();

CREATE TRIGGER update_service_integrations_updated_at 
    BEFORE UPDATE ON service_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_service_integrations_creator 
    BEFORE INSERT ON service_integrations 
    FOR EACH ROW EXECUTE FUNCTION set_creator_column();

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations (following existing pattern)
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (
        (auth.uid() = userId OR auth.uid() = creator OR auth.uid() = updater) 
        AND deletedAt IS NULL 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can create their own conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = userId 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (
        (auth.uid() = userId OR auth.uid() = creator) 
        AND deletedAt IS NULL 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can delete their own conversations" ON conversations
    FOR DELETE USING (
        (auth.uid() = userId OR auth.uid() = creator) 
        AND deletedAt IS NULL 
        OR auth.role() = 'service_role'
    );

-- RLS Policies for messages
CREATE POLICY "Users can view messages for their conversations" ON messages
    FOR SELECT USING (
        (
            EXISTS (
                SELECT 1 FROM conversations 
                WHERE conversations.id = messages.conversationId 
                AND conversations.userId = auth.uid()
            )
            OR auth.uid() = messages.userId 
            OR auth.uid() = messages.creator 
            OR auth.uid() = messages.updater
        )
        AND messages.deletedAt IS NULL 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can create messages for their conversations" ON messages
    FOR INSERT WITH CHECK (
        (
            EXISTS (
                SELECT 1 FROM conversations 
                WHERE conversations.id = messages.conversationId 
                AND conversations.userId = auth.uid()
            )
            OR auth.uid() = messages.userId
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can update messages for their conversations" ON messages
    FOR UPDATE USING (
        (
            EXISTS (
                SELECT 1 FROM conversations 
                WHERE conversations.id = messages.conversationId 
                AND conversations.userId = auth.uid()
            )
            OR auth.uid() = messages.userId 
            OR auth.uid() = messages.creator
        )
        AND messages.deletedAt IS NULL 
        OR auth.role() = 'service_role'
    );

-- RLS Policies for conversation contexts
CREATE POLICY "Users can view conversation contexts for their conversations" ON conversation_contexts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = conversation_contexts.conversationId 
            AND conversations.userId = auth.uid()
        )
        AND conversation_contexts.deletedAt IS NULL 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can insert conversation contexts for their conversations" ON conversation_contexts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = conversation_contexts.conversationId 
            AND conversations.userId = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

-- RLS Policies for GitHub integrations
CREATE POLICY "Users can view their own github integrations" ON github_integrations
    FOR SELECT USING (
        (auth.uid() = userId OR auth.uid() = creator OR auth.uid() = updater) 
        AND deletedAt IS NULL 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can create their own github integrations" ON github_integrations
    FOR INSERT WITH CHECK (
        auth.uid() = userId 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can update their own github integrations" ON github_integrations
    FOR UPDATE USING (
        (auth.uid() = userId OR auth.uid() = creator) 
        AND deletedAt IS NULL 
        OR auth.role() = 'service_role'
    );

-- RLS Policies for service integrations
CREATE POLICY "Users can view their own service integrations" ON service_integrations
    FOR SELECT USING (
        (auth.uid() = userId OR auth.uid() = creator OR auth.uid() = updater) 
        AND deletedAt IS NULL 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can create their own service integrations" ON service_integrations
    FOR INSERT WITH CHECK (
        auth.uid() = userId 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can update their own service integrations" ON service_integrations
    FOR UPDATE USING (
        (auth.uid() = userId OR auth.uid() = creator) 
        AND deletedAt IS NULL 
        OR auth.role() = 'service_role'
    );

-- Summary of what was created
DO $$
BEGIN
    RAISE NOTICE 'Conversation schema extension completed successfully!';
    RAISE NOTICE 'Tables created: conversations, messages, conversation_contexts, github_integrations, service_integrations';
    RAISE NOTICE 'All tables include proper UUID fields, audit triggers, RLS policies, and performance indexes';
    RAISE NOTICE 'Ready for conversational development features!';
END $$;