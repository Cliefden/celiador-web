-- Create table for Claude Code conversations (metadata only)
CREATE TABLE IF NOT EXISTS claude_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  creator UUID,
  updater UUID,
  deleter UUID,
  
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Claude Code Session',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

-- Create table for individual Claude Code messages
CREATE TABLE IF NOT EXISTS claude_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  creator UUID,
  updater UUID,
  deleter UUID,
  
  conversation_id UUID NOT NULL REFERENCES claude_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  
  -- Metadata as separate columns (Apple-friendly)
  input_method TEXT, -- 'voice', 'text', 'quick_action'
  device_type TEXT, -- 'ios', 'web'
  voice_confidence DECIMAL(3,2), -- 0.00-1.00
  execution_time_ms INTEGER,
  files_modified TEXT[], -- Array of file paths
  commands_executed TEXT[], -- Array of commands
  error_message TEXT
);

-- Create unique index to ensure one conversation per project
CREATE UNIQUE INDEX idx_claude_conversations_project 
ON claude_conversations(project_id);

-- Create indexes for faster queries
CREATE INDEX idx_claude_conversations_updated_at 
ON claude_conversations(updated_at);

CREATE INDEX idx_claude_messages_conversation_id 
ON claude_messages(conversation_id);

CREATE INDEX idx_claude_messages_created_at 
ON claude_messages(created_at);

-- Enable RLS
ALTER TABLE claude_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can access Claude conversations for their projects" 
ON claude_conversations FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = claude_conversations.project_id 
    AND projects.userid = auth.uid()
  )
);

-- RLS policies for messages
CREATE POLICY "Users can access Claude messages for their conversations" 
ON claude_messages FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM claude_conversations 
    JOIN projects ON projects.id = claude_conversations.project_id
    WHERE claude_conversations.id = claude_messages.conversation_id 
    AND projects.userid = auth.uid()
  )
);