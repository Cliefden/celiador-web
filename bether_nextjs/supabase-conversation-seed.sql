-- Supabase Conversation Seed Data
-- Run this in your Supabase SQL Editor after the conversation schema is set up
-- This creates sample conversations for development and testing

-- Create sample conversations for existing users/projects
DO $$
DECLARE
    sample_user_id UUID;
    sample_project_id UUID;
    conversation1_id UUID := uuid_generate_v4();
    conversation2_id UUID := uuid_generate_v4();
    conversation3_id UUID := uuid_generate_v4();
    message1_id UUID := uuid_generate_v4();
    message2_id UUID := uuid_generate_v4();
    message3_id UUID := uuid_generate_v4();
    message4_id UUID := uuid_generate_v4();
    message5_id UUID := uuid_generate_v4();
    message6_id UUID := uuid_generate_v4();
    sample_job_id UUID;
BEGIN
    -- Get a sample user from profiles table (works better than auth.uid() in seed context)
    SELECT id INTO sample_user_id FROM profiles LIMIT 1;
    
    -- If no profiles exist, skip the user-dependent parts
    IF sample_user_id IS NULL THEN
        RAISE NOTICE 'No users found in profiles table. Please create a user account first.';
        RETURN;
    END IF;
    
    -- Get a sample project (or create one for development)
    SELECT id INTO sample_project_id FROM projects WHERE userId = sample_user_id LIMIT 1;
    
    -- If no project exists, get any project or use a sample UUID
    IF sample_project_id IS NULL THEN
        SELECT id INTO sample_project_id FROM projects LIMIT 1;
        IF sample_project_id IS NULL THEN
            sample_project_id := uuid_generate_v4();
        END IF;
    END IF;
    
    -- Get a sample job ID
    SELECT id INTO sample_job_id FROM jobs WHERE projectId = sample_project_id LIMIT 1;
    
    -- Create Conversation 1: Project-specific discussion about adding dark mode
    INSERT INTO conversations (id, title, status, projectId, userId, createdAt)
    VALUES (
        conversation1_id,
        'Adding Dark Mode Toggle',
        'ACTIVE',
        sample_project_id,
        sample_user_id,
        NOW() - INTERVAL '2 days'
    );
    
    -- Messages for Conversation 1
    INSERT INTO messages (id, content, role, messageType, conversationId, userId, createdAt) VALUES
    (message1_id, 'I want to add a dark mode toggle to the settings page', 'user', 'text', conversation1_id, sample_user_id, NOW() - INTERVAL '2 days'),
    (message2_id, 'I can help you implement dark mode! Let me analyze your current styling setup and create a toggle component. This will involve updating your CSS variables and adding a theme context.', 'assistant', 'text', conversation1_id, sample_user_id, NOW() - INTERVAL '2 days' + INTERVAL '30 seconds'),
    (message3_id, 'Great! Please also make sure it persists across browser sessions', 'user', 'text', conversation1_id, sample_user_id, NOW() - INTERVAL '2 days' + INTERVAL '1 minute'),
    (message4_id, 'Absolutely! I''ll use localStorage to persist the theme preference. I''ll create a job to implement this feature.', 'assistant', 'text', conversation1_id, sample_user_id, NOW() - INTERVAL '2 days' + INTERVAL '90 seconds');
    
    -- Link message to job if job exists
    IF sample_job_id IS NOT NULL THEN
        UPDATE messages SET relatedJobId = sample_job_id WHERE id = message4_id;
    END IF;
    
    -- Create Conversation 2: Global discussion about project architecture
    INSERT INTO conversations (id, title, status, userId, createdAt)
    VALUES (
        conversation2_id,
        'Project Architecture Discussion',
        'ACTIVE',
        sample_user_id,
        NOW() - INTERVAL '1 day'
    );
    
    -- Messages for Conversation 2
    INSERT INTO messages (id, content, role, messageType, conversationId, userId, createdAt) VALUES
    (message5_id, 'Can you explain the current project architecture and suggest improvements?', 'user', 'text', conversation2_id, sample_user_id, NOW() - INTERVAL '1 day'),
    (message6_id, 'Based on your current setup, you have a solid monorepo structure with Next.js frontend, Express orchestrator, and BullMQ job processing. I''d recommend adding conversation capabilities and improving the mobile responsiveness. Would you like me to create a roadmap?', 'assistant', 'text', conversation2_id, sample_user_id, NOW() - INTERVAL '1 day' + INTERVAL '45 seconds');
    
    -- Create Conversation 3: Archived conversation
    INSERT INTO conversations (id, title, status, projectId, userId, createdAt)
    VALUES (
        conversation3_id,
        'Initial Project Setup',
        'ARCHIVED',
        sample_project_id,
        sample_user_id,
        NOW() - INTERVAL '5 days'
    );
    
    -- Add a system message
    INSERT INTO messages (id, content, role, messageType, conversationId, userId, createdAt) VALUES
    (uuid_generate_v4(), 'Project setup completed successfully. All dependencies installed and initial structure created.', 'system', 'job_result', conversation3_id, sample_user_id, NOW() - INTERVAL '5 days');
    
    -- Create conversation contexts for AI memory
    INSERT INTO conversation_contexts (conversationId, contextType, contextData) VALUES
    (conversation1_id, 'project_summary', jsonb_build_object(
        'projectName', 'Bether Conversational Platform',
        'techStack', jsonb_build_array('Next.js', 'TypeScript', 'Tailwind', 'Supabase', 'BullMQ'),
        'currentFocus', 'Adding conversational interface capabilities',
        'recentChanges', jsonb_build_array('Database schema extended', 'Conversation models added')
    )),
    (conversation1_id, 'user_preferences', jsonb_build_object(
        'preferredStyle', 'clean and minimal',
        'codeStyle', 'TypeScript with proper typing',
        'responseStyle', 'detailed but concise'
    )),
    (conversation2_id, 'project_summary', jsonb_build_object(
        'architecture', 'monorepo with microservices',
        'challenges', jsonb_build_array('mobile responsiveness', 'real-time features'),
        'goals', jsonb_build_array('conversational interface', 'cross-device sync')
    ));
    
    -- Create sample service integrations
    INSERT INTO service_integrations (service, config, status, userId) VALUES
    ('openai', jsonb_build_object(
        'apiKey', '[ENCRYPTED]',
        'model', 'gpt-4',
        'maxTokens', 2000,
        'temperature', 0.7
    ), 'ACTIVE', sample_user_id),
    ('anthropic', jsonb_build_object(
        'apiKey', '[ENCRYPTED]',
        'model', 'claude-3-sonnet-20240229',
        'maxTokens', 4000
    ), 'ACTIVE', sample_user_id),
    ('github', jsonb_build_object(
        'username', 'developer',
        'defaultRepo', 'bether-platform',
        'autoCreateIssues', true
    ), 'ACTIVE', sample_user_id);
    
    -- Create sample GitHub integration (mock data for development)
    INSERT INTO github_integrations (accessToken, scope, userId, createdAt) VALUES
    ('[ENCRYPTED_MOCK_TOKEN]', ARRAY['repo', 'user:email', 'write:discussion'], sample_user_id, NOW() - INTERVAL '1 week');
    
END $$;

-- Add some additional sample conversations with different patterns
INSERT INTO conversations (title, status, userId, createdAt) 
SELECT 
    'Conversation ' || generate_series,
    CASE 
        WHEN generate_series % 3 = 0 THEN 'ARCHIVED'
        ELSE 'ACTIVE'
    END,
    (SELECT id FROM profiles LIMIT 1),
    NOW() - (generate_series || ' hours')::INTERVAL
FROM generate_series(1, 5);

-- Add sample messages to these conversations
INSERT INTO messages (content, role, messageType, conversationId, userId, createdAt)
SELECT 
    'Sample message ' || generate_series,
    CASE 
        WHEN generate_series % 2 = 0 THEN 'assistant'
        ELSE 'user'
    END,
    'text',
    c.id,
    c.userId,
    c.createdAt + (generate_series || ' minutes')::INTERVAL
FROM conversations c
CROSS JOIN generate_series(1, 3)
WHERE c.title LIKE 'Conversation %';

-- Create indexes if they don't exist (shouldn't be necessary but just in case)
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_messageType ON messages(messageType);

-- Update conversation updated timestamps based on latest messages
UPDATE conversations 
SET updatedAt = (
    SELECT MAX(createdAt) 
    FROM messages 
    WHERE messages.conversationId = conversations.id
)
WHERE EXISTS (
    SELECT 1 
    FROM messages 
    WHERE messages.conversationId = conversations.id
);

-- Add some statistics
DO $$
DECLARE
    conversation_count INTEGER;
    message_count INTEGER;
    context_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conversation_count FROM conversations;
    SELECT COUNT(*) INTO message_count FROM messages;
    SELECT COUNT(*) INTO context_count FROM conversation_contexts;
    
    RAISE NOTICE 'Seed data created successfully:';
    RAISE NOTICE '- % conversations', conversation_count;
    RAISE NOTICE '- % messages', message_count;  
    RAISE NOTICE '- % conversation contexts', context_count;
    RAISE NOTICE '- Service integrations and GitHub integration created';
END $$;