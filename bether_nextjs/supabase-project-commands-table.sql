-- Create project_commands table
CREATE TABLE IF NOT EXISTS project_commands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    creator UUID,
    updater UUID,
    deleter UUID,
    
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    command_text TEXT NOT NULL,
    command_type TEXT DEFAULT 'text' CHECK (command_type IN ('text', 'voice', 'generated')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    response TEXT,
    executed_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies
ALTER TABLE project_commands ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read commands for projects they own
CREATE POLICY "Users can read project commands for their projects" ON project_commands
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_commands.project_id 
            AND projects.userid = auth.uid()
        )
    );

-- Policy: Users can insert commands for projects they own
CREATE POLICY "Users can create project commands for their projects" ON project_commands
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_commands.project_id 
            AND projects.userid = auth.uid()
        )
    );

-- Policy: Users can update commands for projects they own
CREATE POLICY "Users can update project commands for their projects" ON project_commands
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_commands.project_id 
            AND projects.userid = auth.uid()
        )
    );

-- Policy: Users can delete commands for projects they own
CREATE POLICY "Users can delete project commands for their projects" ON project_commands
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_commands.project_id 
            AND projects.userid = auth.uid()
        )
    );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_commands_project_id ON project_commands(project_id);
CREATE INDEX IF NOT EXISTS idx_project_commands_status ON project_commands(status);
CREATE INDEX IF NOT EXISTS idx_project_commands_created_at ON project_commands(created_at);
CREATE INDEX IF NOT EXISTS idx_project_commands_deleted_at ON project_commands(deleted_at) WHERE deleted_at IS NULL;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_project_commands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_commands_updated_at ON project_commands;
CREATE TRIGGER trigger_update_project_commands_updated_at
    BEFORE UPDATE ON project_commands
    FOR EACH ROW
    EXECUTE FUNCTION update_project_commands_updated_at();