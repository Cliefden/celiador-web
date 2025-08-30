-- Integration Extensions for GitHub + Vercel Deployment
-- This extends the existing schema with project-level integration settings

-- Project-level integration settings (extends existing projects table)
CREATE TABLE IF NOT EXISTS project_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    projectId UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- GitHub Integration (extends existing github connection)
    githubEnabled BOOLEAN DEFAULT false,
    githubDefaultBranch TEXT DEFAULT 'main',
    
    -- Vercel Integration  
    vercelEnabled BOOLEAN DEFAULT false,
    vercelProjectId TEXT,
    vercelTeamId TEXT,
    vercelAccessToken TEXT, -- encrypted
    vercelDomain TEXT,
    
    -- Deployment Strategy
    deploymentMode TEXT DEFAULT 'GITHUB_ONLY' CHECK (deploymentMode IN ('GITHUB_ONLY', 'SMART_BRANCHING')),
    
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Audit fields matching existing pattern
    creator UUID,
    updater UUID,
    deleter UUID,
    deletedAt TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(projectId)
);

-- Deployment history for tracking all deployments
CREATE TABLE IF NOT EXISTS deployment_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    projectId UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('GITHUB_PUSH', 'VERCEL_DEPLOY', 'PREVIEW_DEPLOY')),
    branch TEXT,
    commitSha TEXT,
    vercelUrl TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    metadata JSONB, -- Store additional deployment info
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Audit fields
    creator UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_integrations_projectId ON project_integrations(projectId);
CREATE INDEX IF NOT EXISTS idx_project_integrations_deploymentMode ON project_integrations(deploymentMode);
CREATE INDEX IF NOT EXISTS idx_deployment_history_projectId ON deployment_history(projectId);
CREATE INDEX IF NOT EXISTS idx_deployment_history_createdAt ON deployment_history(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_history_status ON deployment_history(status);

-- Update triggers for updated_at
CREATE TRIGGER update_project_integrations_updated_at 
    BEFORE UPDATE ON project_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers matching existing pattern
CREATE TRIGGER set_project_integrations_creator 
    BEFORE INSERT ON project_integrations 
    FOR EACH ROW EXECUTE FUNCTION set_creator_column();

CREATE TRIGGER set_deployment_history_creator 
    BEFORE INSERT ON deployment_history 
    FOR EACH ROW EXECUTE FUNCTION set_creator_column();

-- RLS policies
ALTER TABLE project_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_history ENABLE ROW LEVEL SECURITY;

-- Users can manage integrations for their projects
CREATE POLICY "Users can view project integrations for their projects" ON project_integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = projectId AND p.userId = auth.uid()
        )
    );

CREATE POLICY "Users can create project integrations for their projects" ON project_integrations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = projectId AND p.userId = auth.uid()
        )
    );

CREATE POLICY "Users can update project integrations for their projects" ON project_integrations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = projectId AND p.userId = auth.uid()
        )
    );

-- Deployment history policies
CREATE POLICY "Users can view deployment history for their projects" ON deployment_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = projectId AND p.userId = auth.uid()
        )
    );

CREATE POLICY "Users can create deployment history for their projects" ON deployment_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = projectId AND p.userId = auth.uid()
        )
    );

-- Function to initialize project integration when GitHub is connected
CREATE OR REPLACE FUNCTION initialize_project_integration()
RETURNS TRIGGER AS $$
BEGIN
    -- When a project gets GitHub info, create project_integration record
    IF NEW.github_repo_url IS NOT NULL AND OLD.github_repo_url IS NULL THEN
        INSERT INTO project_integrations (projectId, githubEnabled, deploymentMode)
        VALUES (NEW.id, true, 'GITHUB_ONLY')
        ON CONFLICT (projectId) DO UPDATE SET 
            githubEnabled = true,
            updatedAt = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-initialize integration when GitHub is connected
CREATE TRIGGER auto_initialize_project_integration
    AFTER UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION initialize_project_integration();