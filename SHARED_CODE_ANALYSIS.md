# Shared Code Analysis

## Overview

This document identifies all shared code and dependencies that need to be extracted into NPM packages during the multi-repo migration.

## Shared Packages to Extract

### 1. @celiador/shared

**Purpose**: Common utilities, types, and configurations used across all services

**Current Location**: `bether_nextjs/packages/shared/`

**Contents to Extract**:
```typescript
// Common types and interfaces
export interface Project {
  id: string;
  name: string;
  description?: string;
  template: string;
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Job {
  id: string;
  projectId: string;
  type: 'SCAFFOLD' | 'EDIT' | 'TEST' | 'DEPLOY' | 'AI_ACTION';
  status: 'pending' | 'running' | 'completed' | 'failed';
  data: any;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Supabase client configuration
export const createSupabaseClient = (url: string, key: string) => {
  return createClient(url, key);
};

// Common utilities
export const generateId = () => crypto.randomUUID();
export const formatDate = (date: Date) => date.toISOString();
export const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
```

**Dependencies**:
- `@supabase/supabase-js`
- `zod` (for validation)

**Used By**:
- celiador-orchestrator
- celiador-preview-service
- celiador-codegen-worker
- celiador-web
- bether-ios (via shared types)

---

### 2. @celiador/agent-tools

**Purpose**: AI agent tools and code generation utilities

**Current Location**: `bether_nextjs/packages/agent-tools/`

**Contents to Extract**:
```typescript
// AI agent tools
export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export class CodeGenerationTool implements AgentTool {
  name = 'code_generation';
  description = 'Generate code based on user requirements';
  
  async execute(params: {
    prompt: string;
    context: string;
    language: string;
  }) {
    // Implementation
  }
}

export class FileOperationTool implements AgentTool {
  name = 'file_operation';
  description = 'Perform file operations (create, update, delete)';
  
  async execute(params: {
    operation: 'create' | 'update' | 'delete';
    path: string;
    content?: string;
  }) {
    // Implementation
  }
}

// Template processing utilities
export const processTemplate = (template: string, variables: Record<string, string>) => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
};

export const validateTemplate = (template: string) => {
  // Template validation logic
};
```

**Dependencies**:
- `openai`
- `@anthropic-ai/sdk`

**Used By**:
- celiador-codegen-worker
- celiador-orchestrator

---

### 3. @celiador/templates

**Purpose**: Project templates and template management

**Current Location**: `bether_nextjs/packages/templates/`

**Contents to Extract**:
```typescript
// Template metadata
export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'mobile' | 'api' | 'fullstack';
  framework: string;
  language: string;
  files: TemplateFile[];
  dependencies: string[];
  scripts: Record<string, string>;
}

export interface TemplateFile {
  path: string;
  content: string;
  type: 'file' | 'directory';
}

// Template registry
export const TEMPLATES: Record<string, Template> = {
  'nextjs-basic': {
    id: 'nextjs-basic',
    name: 'Next.js Basic',
    description: 'A basic Next.js application',
    category: 'web',
    framework: 'nextjs',
    language: 'typescript',
    files: [],
    dependencies: ['next', 'react', 'typescript'],
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start'
    }
  },
  // ... more templates
};

// Template utilities
export const getTemplate = (id: string): Template | null => {
  return TEMPLATES[id] || null;
};

export const listTemplates = (category?: string): Template[] => {
  const templates = Object.values(TEMPLATES);
  return category ? templates.filter(t => t.category === category) : templates;
};

export const validateTemplate = (template: Template): boolean => {
  // Validation logic
  return template.id && template.name && template.files.length > 0;
};
```

**Dependencies**:
- None (pure data and utilities)

**Used By**:
- celiador-orchestrator
- celiador-codegen-worker
- celiador-web

---

## Cross-Service Dependencies

### Database Schema (Supabase)

**Shared Tables**:
```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  data JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Contracts

**Shared API Types**:
```typescript
// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Request types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  template: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'archived' | 'deleted';
}

export interface CreateJobRequest {
  type: 'SCAFFOLD' | 'EDIT' | 'TEST' | 'DEPLOY' | 'AI_ACTION';
  data: any;
}
```

### Environment Variables

**Shared Environment Variables**:
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Queue System
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# GitHub Integration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Migration Strategy for Shared Code

### Phase 1: Create NPM Packages

1. **Create new repositories** for each shared package
2. **Set up NPM publishing** with GitHub Actions
3. **Extract shared code** from monorepo
4. **Publish initial versions** to NPM registry

### Phase 2: Update Service Dependencies

1. **Update package.json** files in each service
2. **Replace local imports** with NPM package imports
3. **Test integration** with shared packages
4. **Update CI/CD** to install NPM packages

### Phase 3: Version Management

1. **Implement semantic versioning** for all packages
2. **Set up automated publishing** on version bumps
3. **Maintain backward compatibility** during migration
4. **Document breaking changes** in changelogs

## Package Dependencies

### Dependency Graph

```
@celiador/shared
├── @supabase/supabase-js
├── zod
└── (no internal dependencies)

@celiador/agent-tools
├── @celiador/shared
├── openai
├── @anthropic-ai/sdk
└── zod

@celiador/templates
├── @celiador/shared
└── (no external dependencies)

celiador-orchestrator
├── @celiador/shared
├── @celiador/agent-tools
├── @celiador/templates
├── express
├── bullmq
└── cors

celiador-preview-service
├── @celiador/shared
├── express
└── cors

celiador-codegen-worker
├── @celiador/shared
├── @celiador/agent-tools
├── @celiador/templates
├── bullmq
└── openai

celiador-web
├── @celiador/shared
├── next
├── react
└── @supabase/supabase-js
```

## Testing Strategy

### Package Testing

1. **Unit tests** for each shared package
2. **Integration tests** for package interactions
3. **Type checking** with TypeScript
4. **Linting** with ESLint

### Service Testing

1. **API contract tests** using shared types
2. **End-to-end tests** across services
3. **Load testing** for performance validation
4. **Security testing** for authentication flows

## Rollback Plan

### Package Rollback

1. **Keep local copies** of shared code during migration
2. **Maintain version compatibility** for quick rollback
3. **Document rollback procedures** for each package
4. **Test rollback scenarios** before migration

### Service Rollback

1. **Independent service rollback** capability
2. **Database migration rollback** procedures
3. **API versioning** for backward compatibility
4. **Monitoring** for quick issue detection

---

*This analysis will be updated as we discover additional shared code during the migration process.*
