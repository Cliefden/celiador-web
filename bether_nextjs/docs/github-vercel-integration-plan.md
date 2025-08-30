# GitHub & Vercel Integration Implementation Plan

## Overview
This plan details the implementation of intelligent GitHub and Vercel integration for the Bether Conversational Development Platform, enabling seamless deployment workflows with automatic decision-making based on connected services.

## Implementation Strategy

### Phase 1: Database Schema & Core Services (Week 1-2)

#### 1.1 Database Schema Extensions
**File:** `packages/shared/src/types/integrations.ts`
```typescript
export interface ProjectIntegration {
  id: string;
  projectId: string;
  
  // GitHub Integration
  githubEnabled: boolean;
  githubRepoUrl?: string;
  githubAccessToken?: string; // encrypted
  githubDefaultBranch?: string;
  
  // Vercel Integration  
  vercelEnabled: boolean;
  vercelProjectId?: string;
  vercelTeamId?: string;
  vercelAccessToken?: string; // encrypted
  vercelDomain?: string;
  
  // Deployment Strategy
  deploymentMode: 'GITHUB_ONLY' | 'SMART_BRANCHING';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DeploymentHistory {
  id: string;
  projectId: string;
  type: 'GITHUB_PUSH' | 'VERCEL_DEPLOY' | 'PREVIEW_DEPLOY';
  branch?: string;
  commitSha?: string;
  vercelUrl?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: Date;
}
```

**Supabase Migration:** `supabase/migrations/003_integration_schema.sql`
```sql
-- Project integrations table
CREATE TABLE project_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- GitHub integration
  github_enabled BOOLEAN DEFAULT false,
  github_repo_url TEXT,
  github_access_token TEXT, -- encrypted
  github_default_branch TEXT DEFAULT 'main',
  
  -- Vercel integration
  vercel_enabled BOOLEAN DEFAULT false,
  vercel_project_id TEXT,
  vercel_team_id TEXT,
  vercel_access_token TEXT, -- encrypted
  vercel_domain TEXT,
  
  -- Deployment strategy
  deployment_mode TEXT DEFAULT 'GITHUB_ONLY' CHECK (deployment_mode IN ('GITHUB_ONLY', 'SMART_BRANCHING')),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(project_id)
);

-- Deployment history
CREATE TABLE deployment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('GITHUB_PUSH', 'VERCEL_DEPLOY', 'PREVIEW_DEPLOY')),
  branch TEXT,
  commit_sha TEXT,
  vercel_url TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.2 Enhanced GitHub Service
**File:** `apps/orchestrator/src/services/github-service.ts`
```typescript
export class GitHubService {
  // Existing methods...
  
  async createBranch(repoUrl: string, branchName: string, baseBranch = 'main'): Promise<void> {
    // Implementation for branch creation
  }
  
  async pushToMain(projectId: string, commitMessage: string): Promise<string> {
    // Direct push to main branch
  }
  
  async pushToBranch(projectId: string, branchName: string, commitMessage: string): Promise<string> {
    // Push to feature branch
  }
  
  async createPullRequest(repoUrl: string, head: string, base: string, title: string): Promise<string> {
    // Create PR for feature branch
  }
}
```

#### 1.3 New Vercel Service
**File:** `apps/orchestrator/src/services/vercel-service.ts`
```typescript
export class VercelService {
  private apiKey: string;
  private baseUrl = 'https://api.vercel.com';
  
  async connectProject(projectId: string, vercelProjectId: string): Promise<void> {
    // Link Bether project to Vercel project
  }
  
  async deployFromGitHub(vercelProjectId: string, branch: string): Promise<{ url: string; deploymentId: string }> {
    // Trigger deployment from GitHub branch
  }
  
  async createPreviewDeployment(vercelProjectId: string, branch: string): Promise<{ url: string; deploymentId: string }> {
    // Create preview deployment
  }
  
  async getDeploymentStatus(deploymentId: string): Promise<'PENDING' | 'SUCCESS' | 'FAILED'> {
    // Check deployment status
  }
}
```

### Phase 2: Deployment Orchestration Logic (Week 2-3)

#### 2.1 Deployment Orchestrator
**File:** `apps/orchestrator/src/services/deployment-orchestrator.ts`
```typescript
export class DeploymentOrchestrator {
  constructor(
    private githubService: GitHubService,
    private vercelService: VercelService,
    private storageService: FileStorageService
  ) {}
  
  async determineDeploymentStrategy(projectId: string): Promise<DeploymentStrategy> {
    const integration = await this.getProjectIntegration(projectId);
    
    if (!integration.githubEnabled) {
      throw new Error("GitHub integration required");
    }
    
    if (!integration.vercelEnabled) {
      return { type: 'GITHUB_ONLY', target: 'main' };
    }
    
    return { 
      type: 'SMART_BRANCHING', 
      options: ['github', 'vercel', 'preview'] 
    };
  }
  
  async executeDeployment(projectId: string, action: DeploymentAction): Promise<DeploymentResult> {
    // 1. Sync files from Supabase Storage to temp directory
    // 2. Execute git operations
    // 3. Trigger Vercel deployment if needed
    // 4. Record deployment history
    // 5. Return result with URLs/status
  }
  
  private async syncProjectFiles(projectId: string): Promise<string> {
    // Create temp directory with project files from Storage
  }
  
  private generateBranchName(): string {
    return `feature/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 2.2 Integration Manager
**File:** `apps/orchestrator/src/services/integration-manager.ts`
```typescript
export class IntegrationManager {
  async setupGitHubIntegration(userId: string, projectId: string, repoUrl: string): Promise<void> {
    // 1. Validate GitHub access token
    // 2. Test repository access
    // 3. Store encrypted credentials
    // 4. Update project integration settings
  }
  
  async setupVercelIntegration(userId: string, projectId: string, vercelProjectId: string): Promise<void> {
    // 1. Validate Vercel access token
    // 2. Test project access
    // 3. Store encrypted credentials
    // 4. Update deployment mode to SMART_BRANCHING
  }
  
  async autoDetectExistingIntegrations(projectId: string): Promise<IntegrationSuggestions> {
    // Scan for existing repos/projects and suggest connections
  }
}
```

### Phase 3: API Endpoints (Week 3)

#### 3.1 New Orchestrator Routes
**File:** `apps/orchestrator/src/routes/integrations.ts`
```typescript
// POST /projects/:id/integrations/github
router.post('/:id/integrations/github', async (req, res) => {
  const { repoUrl, accessToken } = req.body;
  await integrationManager.setupGitHubIntegration(req.user.id, req.params.id, repoUrl, accessToken);
  res.json({ success: true });
});

// POST /projects/:id/integrations/vercel  
router.post('/:id/integrations/vercel', async (req, res) => {
  const { projectId, accessToken } = req.body;
  await integrationManager.setupVercelIntegration(req.user.id, req.params.id, projectId, accessToken);
  res.json({ success: true });
});

// POST /projects/:id/deploy
router.post('/:id/deploy', async (req, res) => {
  const { action, commitMessage } = req.body;
  const result = await deploymentOrchestrator.executeDeployment(req.params.id, { 
    type: action, 
    commitMessage 
  });
  res.json(result);
});

// GET /projects/:id/deployment-options
router.get('/:id/deployment-options', async (req, res) => {
  const strategy = await deploymentOrchestrator.determineDeploymentStrategy(req.params.id);
  res.json(strategy);
});
```

### Phase 4: Frontend Integration UI (Week 4)

#### 4.1 Integration Setup Components
**File:** `apps/web/src/components/integrations/IntegrationSetup.tsx`
```typescript
export function IntegrationSetup({ projectId }: { projectId: string }) {
  // Multi-step wizard for connecting GitHub and Vercel
  // 1. GitHub OAuth flow
  // 2. Repository selection
  // 3. Vercel OAuth flow (optional)
  // 4. Project linking
  // 5. Configuration confirmation
}
```

**File:** `apps/web/src/components/integrations/DeploymentButtons.tsx`
```typescript
export function DeploymentButtons({ projectId }: { projectId: string }) {
  const { deploymentOptions } = useDeploymentOptions(projectId);
  
  if (deploymentOptions.type === 'GITHUB_ONLY') {
    return <PushToMainButton projectId={projectId} />;
  }
  
  return (
    <div className="flex gap-2">
      <PushToBranchButton projectId={projectId} />
      <DeployToVercelButton projectId={projectId} />
      <PreviewDeployButton projectId={projectId} />
    </div>
  );
}
```

#### 4.2 Integration Status Display
**File:** `apps/web/src/components/integrations/IntegrationStatus.tsx`
```typescript
export function IntegrationStatus({ projectId }: { projectId: string }) {
  // Display connected services status
  // Show recent deployment history
  // Quick disconnect/reconnect options
}
```

### Phase 5: Job Queue Integration (Week 4-5)

#### 5.1 New Job Types
**File:** `packages/shared/src/types/jobs.ts`
```typescript
export type JobType = 
  | 'SCAFFOLD' 
  | 'EDIT' 
  | 'TEST' 
  | 'DEPLOY'
  | 'GITHUB_PUSH'
  | 'VERCEL_DEPLOY'
  | 'PREVIEW_DEPLOY';

export interface DeploymentJobData {
  projectId: string;
  deploymentType: 'github' | 'vercel' | 'preview';
  commitMessage: string;
  branch?: string;
  mergeToMain?: boolean;
}
```

#### 5.2 Enhanced Worker
**File:** `workers/codegen/src/deployment-worker.ts`
```typescript
export class DeploymentWorker {
  async processDeploymentJob(job: Job<DeploymentJobData>): Promise<void> {
    const { projectId, deploymentType, commitMessage } = job.data;
    
    try {
      const result = await this.deploymentOrchestrator.executeDeployment(projectId, {
        type: deploymentType,
        commitMessage
      });
      
      // Update job with deployment URLs and status
      await job.progress({ status: 'deployed', urls: result.urls });
      
    } catch (error) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }
}
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Database schema migrations
- [ ] Enhanced GitHub service with branch management
- [ ] Basic Vercel service implementation
- [ ] Integration data models and types

### Week 2: Core Logic
- [ ] Deployment orchestrator with smart decision logic
- [ ] Integration manager for setup workflows
- [ ] File sync between Storage and git operations
- [ ] Encryption for stored credentials

### Week 3: API Layer
- [ ] Integration setup endpoints
- [ ] Deployment action endpoints
- [ ] Status and history endpoints
- [ ] OAuth flow handlers

### Week 4: Frontend UI
- [ ] Integration setup wizard components
- [ ] Smart deployment button components
- [ ] Status dashboard and history display
- [ ] Mobile-responsive integration management

### Week 5: Job Queue & Testing
- [ ] New deployment job types
- [ ] Enhanced worker processing
- [ ] Comprehensive testing suite
- [ ] Documentation and examples

## User Experience Flow

### Initial Setup (One-time)
1. **GitHub Connection**
   - Click "Connect GitHub" 
   - OAuth flow → repository selection
   - Auto-detection of existing repos

2. **Vercel Connection** (Optional)
   - Click "Connect Vercel"
   - OAuth flow → project linking
   - Deployment mode switches to SMART_BRANCHING

### Daily Usage
**GitHub Only:**
- Single "Push to GitHub" button → commits to main

**GitHub + Vercel:**
- "Push to GitHub" → creates feature branch
- "Deploy to Vercel" → pushes to main + deploys
- "Preview Deploy" → feature branch + preview URL

### Error Handling & Fallbacks
- Failed deployments → clear error messages + retry options
- Missing credentials → guided re-authentication
- Service outages → graceful degradation with manual options

## Security Considerations
- OAuth tokens encrypted at rest using Supabase vault
- Short-lived access tokens with refresh capability
- Audit logging for all deployment actions
- User permission validation for repository/project access

## Performance & Scalability
- Async job processing prevents UI blocking
- Deployment queuing handles concurrent operations
- Cached integration status reduces API calls
- Efficient file sync using differential updates

This implementation provides a seamless, intelligent deployment experience that automatically adapts to the user's connected services while maintaining simplicity through smart defaults and automated decision-making.