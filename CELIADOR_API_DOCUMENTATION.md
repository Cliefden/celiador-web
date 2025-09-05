# Celiador Microservices API Documentation

## Architecture Overview

The Celiador platform consists of four main microservices that work together to provide a complete code generation and project management platform:

1. **celiador-web** - Next.js frontend application (Port 3000)
2. **celiador-orchestrator** - Main API service and job coordinator (Port 4000)
3. **celiador-preview-service** - Live project preview service (Port 4001)
4. **celiador-codegen-worker** - AI-powered code generation worker (Background process)

### Technology Stack
- **Database**: Supabase (PostgreSQL)
- **Queue System**: BullMQ with Redis
- **File Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **AI Services**: OpenAI GPT-4, Anthropic Claude
- **Version Control**: GitHub API integration
- **Deployment**: Vercel API integration

---

## Service 1: celiador-web (Next.js Frontend)

**Port**: 3000  
**URL**: `http://localhost:3000`  
**Purpose**: React-based frontend application providing the user interface

### Key Features
- Project dashboard and management
- Real-time code editor
- AI chat interface
- Preview iframe integration
- GitHub/Vercel integration setup

### API Client Configuration
The frontend communicates with the orchestrator via an API client located at `/src/lib/api.ts`:

```typescript
// Base URL for API calls
private static baseUrl = 'http://localhost:4000';

// Authentication headers from Supabase session
private static async getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
}
```

### Frontend-Specific API Methods
- `startPreview(projectId, options)` - Start project preview
- `stopPreview(projectId, previewId)` - Stop project preview  
- `getPreviewStatus(projectId, previewId)` - Get preview status
- `listPreviews(projectId)` - List active previews
- `uploadFile(projectId, fileName, content, path)` - Upload file to project

---

## Service 2: celiador-orchestrator (Main API Service)

**Port**: 4000  
**URL**: `http://localhost:4000`  
**Purpose**: Central API service handling authentication, project management, job orchestration, and service coordination

### Authentication

All protected endpoints require a Bearer token from Supabase Auth:

```http
Authorization: Bearer <supabase_access_token>
```

### Health & Status

#### GET `/health`
Health check endpoint (no authentication required)

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-04T10:30:00Z"
}
```

### Authentication Endpoints

#### POST `/auth/register`
Register new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword",
  "name": "User Name"
}
```

**Response**:
```json
{
  "id": "user-uuid",
  "email": "user@example.com", 
  "name": "User Name"
}
```

#### POST `/auth/login`  
Login user and get access token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword"
}
```

**Response**:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "accessToken": "supabase_jwt_token"
}
```

### Template Management

#### GET `/templates`
Get available project templates (no authentication required)

**Response**:
```json
{
  "templates": [
    {
      "key": "next-prisma-supabase",
      "name": "⚡ Next.js + Prisma + Supabase",
      "description": "Full-stack starter with authentication, database, and modern UI",
      "icon": "Zap",
      "color": "from-green-600 to-teal-600",
      "category": "fullstack",
      "features": ["Next.js 14", "Prisma", "Supabase", "TypeScript"],
      "isActive": true,
      "version": "1.0.0",
      "createdAt": "2025-01-04T10:30:00Z",
      "updatedAt": "2025-01-04T10:30:00Z"
    }
  ]
}
```

### Project Management

#### GET `/projects`
Get all projects for authenticated user

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "id": "project-uuid",
    "name": "My Project",
    "templatekey": "next-prisma-supabase",
    "repoprovider": "github",
    "repoowner": "username",
    "reponame": "my-project",
    "userid": "user-uuid",
    "status": "READY",
    "createdat": "2025-01-04T10:30:00Z"
  }
]
```

#### POST `/projects`
Create new project

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "My New Project",
  "templateKey": "next-prisma-supabase",
  "repo": {
    "provider": "github",
    "owner": "username", 
    "name": "my-new-project"
  }
}
```

**Response**:
```json
{
  "id": "project-uuid",
  "name": "My New Project",
  "templatekey": "next-prisma-supabase",
  "status": "READY"
}
```

#### GET `/projects/:id`
Get specific project details

**Headers**: `Authorization: Bearer <token>`

**Response**: Project object (same as create response)

#### DELETE `/projects/:id`
Delete project and all associated files

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "message": "Project and all files deleted successfully"
}
```

### Job Management

#### POST `/projects/:id/jobs`
Create new job for project

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "type": "SCAFFOLD|EDIT|TEST|DEPLOY|AI_ACTION",
  "prompt": "Description of what to do"
}
```

**Response**:
```json
{
  "id": "job-uuid",
  "projectid": "project-uuid",
  "userid": "user-uuid",
  "type": "EDIT",
  "prompt": "Add a new component",
  "status": "PENDING",
  "createdat": "2025-01-04T10:30:00Z"
}
```

#### GET `/jobs/:id`
Get job status and details

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "id": "job-uuid",
  "status": "COMPLETED|PENDING|RUNNING|FAILED|CANCELLED",
  "output": "Job completion message",
  "error": "Error message if failed",
  "metadata": {}
}
```

#### GET `/projects/:id/jobs`
Get all jobs for a project

**Headers**: `Authorization: Bearer <token>`
**Query Parameters**: 
- `type` - Filter by job type
- `status` - Filter by status (comma-separated)

**Response**:
```json
{
  "jobs": [
    {
      "id": "job-uuid",
      "type": "SCAFFOLD",
      "status": "COMPLETED",
      "createdat": "2025-01-04T10:30:00Z"
    }
  ]
}
```

#### POST `/jobs/:id/cancel`
Cancel running job

**Headers**: `Authorization: Bearer <token>`

#### POST `/jobs/:id/retry` 
Retry failed job

**Headers**: `Authorization: Bearer <token>`

### File Management

#### GET `/projects/:id/files`
Download all project files

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "files": [
    {
      "path": "src/app/page.tsx",
      "content": "file content",
      "contentType": "text/plain"
    }
  ]
}
```

#### GET `/projects/:id/files/tree`
Get project file tree structure

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "tree": [
    {
      "name": "src",
      "type": "directory",
      "children": [
        {
          "name": "app",
          "type": "directory", 
          "children": [
            {
              "name": "page.tsx",
              "type": "file",
              "path": "src/app/page.tsx"
            }
          ]
        }
      ]
    }
  ]
}
```

#### GET `/projects/:id/files/*`
Get specific file content

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "file": {
    "path": "src/app/page.tsx",
    "content": "file content here",
    "contentType": "text/plain"
  }
}
```

#### PUT `/projects/:id/files/save`
Save file content (dual-writes to storage and preview)

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "filePath": "src/app/page.tsx",
  "content": "updated file content"
}
```

#### POST `/projects/:id/files/create`
Create new file or directory

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "filePath": "src/components/NewComponent.tsx",
  "content": "component code",
  "type": "file" // or "directory"
}
```

#### DELETE `/projects/:id/files/*`
Delete specific file

**Headers**: `Authorization: Bearer <token>`

#### POST `/projects/:id/files/delete-folder`
Delete folder and all contents

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "folderPath": "src/components"
}
```

### AI Chat Integration

#### POST `/projects/:id/chat`
Send message to AI assistant with project context

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "message": "Add a login component to the app",
  "conversationId": "conv-uuid",
  "history": [
    {"role": "user", "content": "previous message"},
    {"role": "assistant", "content": "previous response"}
  ],
  "provider": "openai",
  "model": "gpt-4"
}
```

**Response**:
```json
{
  "response": "I'll help you add a login component...",
  "provider": "openai",
  "model": "gpt-4",
  "usage": {},
  "actions": {
    "detected": 3,
    "jobId": "job-uuid"
  }
}
```

#### GET `/ai/health`
Check AI service availability

**Response**:
```json
{
  "available": true,
  "providers": ["openai", "anthropic"],
  "status": "ok"
}
```

### Preview Service Integration

#### POST `/projects/:id/preview/start`
Start project preview (proxied to preview service)

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "My Project Preview",
  "type": "nextjs"
}
```

#### GET `/projects/:id/preview/:instanceId/status`
Get preview status

#### DELETE `/projects/:id/preview/:instanceId`
Stop preview

#### GET `/projects/:id/preview/list`  
List active previews

### GitHub Integration

#### GET `/auth/github/connect`
Initiate GitHub OAuth flow

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "authUrl": "https://github.com/login/oauth/authorize?...",
  "state": "user_12345_1641234567"
}
```

#### GET `/auth/github/callback`
Handle GitHub OAuth callback (redirects to frontend)

#### GET `/auth/github/status`
Check GitHub connection status

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "connected": true,
  "hasToken": true
}
```

#### POST `/projects/:id/github/connect`
Connect project to GitHub repository

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "repoName": "my-project",
  "description": "My project description",
  "isPrivate": false
}
```

### Integration Routes (via `/api/integrations`)

#### GET `/api/integrations/projects/:id/status`
Get integration status for project

#### POST `/api/integrations/projects/:id/github`
Connect project to GitHub

#### POST `/api/integrations/projects/:id/vercel`
Connect project to Vercel

#### GET `/api/integrations/projects/:id/deployment-options`
Get available deployment options

#### POST `/api/integrations/projects/:id/deploy`
Execute deployment

### Commands API

#### GET `/api/projects/:id/commands`
Get project commands

#### POST `/api/projects/:id/commands`  
Create new command

#### PATCH `/api/projects/:id/commands`
Update command status

---

## Service 3: celiador-preview-service (Preview Service)

**Port**: 4001  
**URL**: `http://localhost:4001`  
**Purpose**: Manages live project previews by syncing files from storage and running development servers

### Core Endpoints

#### GET `/`
Service information

**Response**:
```json
{
  "service": "Celiador Preview Service",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "preview": "/preview",
    "status": "/status"
  }
}
```

### Preview Management

#### POST `/preview/start`
Start new project preview

**Request Body**:
```json
{
  "projectId": "project-uuid",
  "userId": "user-uuid", 
  "name": "My Project",
  "type": "nextjs",
  "rootPath": "."
}
```

**Response**:
```json
{
  "success": true,
  "preview": {
    "id": "preview-instance-uuid",
    "projectId": "project-uuid",
    "userId": "user-uuid",
    "url": "http://localhost:8001",
    "port": 8001,
    "status": "running|starting|failed",
    "localPath": "/tmp/celiador-previews/user-project",
    "syncResult": {"filesDownloaded": 15, "success": true},
    "startTime": "2025-01-04T10:30:00Z",
    "errorMessage": null
  }
}
```

#### DELETE `/preview/:instanceId`
Stop project preview

**Response**:
```json
{
  "success": true,
  "message": "Preview stopped"
}
```

#### GET `/preview/:instanceId/status`
Get preview instance status

**Response**:
```json
{
  "success": true,
  "preview": {
    "id": "preview-instance-uuid",
    "status": "running",
    "url": "http://localhost:8001",
    "port": 8001,
    "lastAccessed": "2025-01-04T10:35:00Z"
  }
}
```

#### GET `/preview/list`
List all preview instances

**Query Parameters**:
- `projectId` - Filter by project ID

**Response**:
```json
{
  "success": true,
  "previews": [
    {
      "id": "preview-instance-uuid",
      "projectId": "project-uuid",
      "status": "running",
      "url": "http://localhost:8001",
      "startTime": "2025-01-04T10:30:00Z"
    }
  ]
}
```

#### POST `/preview/:instanceId/restart`
Restart preview instance

### Status Endpoints

#### GET `/status/health`
Health check

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-04T10:30:00Z",
  "service": "preview-service"
}
```

#### GET `/status/info`
Detailed service information

**Response**:
```json
{
  "success": true,
  "service": "preview-service",
  "resources": {
    "allocatedPorts": 3,
    "availablePorts": 997,
    "activePreviews": 3,
    "runningPreviews": 2
  },
  "allocatedPorts": [8001, 8002, 8003],
  "previews": [
    {
      "id": "preview-uuid",
      "projectId": "project-uuid",
      "port": 8001,
      "status": "running",
      "uptime": 300000
    }
  ]
}
```

#### POST `/status/cleanup`
Cleanup stale previews

---

## Service 4: celiador-codegen-worker (AI Worker)

**Purpose**: Background worker that processes code generation jobs using BullMQ

### Job Types Processed

The worker processes jobs enqueued by the orchestrator service:

#### SCAFFOLD Jobs
- Downloads project template from Supabase Storage
- Customizes template using LLM if prompt provided
- Installs dependencies
- Uploads completed project to user's storage

#### EDIT Jobs  
- Modifies existing project files
- Uses LLM to understand and implement changes
- Updates files in storage and preview

#### TEST Jobs
- Generates tests using LLM
- Runs existing test suites
- Returns test results

#### DEPLOY Jobs
- Handles deployment requests (placeholder)

#### AI_ACTION Jobs
- Executes file operations based on AI responses
- Supports create_file, update_file, delete_file actions
- Dual-writes to storage and preview directories

### Job Processing Flow

1. Worker receives job from Redis queue
2. Updates job status to "RUNNING" via orchestrator API
3. Processes job based on type
4. Updates orchestrator with results via PATCH `/jobs/:id`
5. For file operations, syncs changes to preview service

### Error Handling

- Failed jobs are marked as "FAILED" with error details
- Job retry logic implemented for transient failures  
- Preview sync failures don't block main operations

---

## Inter-Service Communication

### Data Flow Patterns

1. **Project Creation Flow**:
   - Frontend → Orchestrator → Worker (SCAFFOLD job)
   - Worker downloads template → customizes → uploads to storage
   - Orchestrator updates job status

2. **AI Chat Flow**:
   - Frontend → Orchestrator (chat endpoint)
   - Orchestrator analyzes for actions → creates AI_ACTION job
   - Worker executes file operations → syncs to preview

3. **Preview Flow**:
   - Frontend → Orchestrator → Preview Service
   - Preview Service downloads files from storage
   - Runs development server on allocated port

4. **File Editing Flow**:
   - Frontend → Orchestrator (save file)
   - Orchestrator saves to storage + preview temp directory
   - Real-time sync to active previews

### Authentication Flow

```
Frontend (Supabase Auth) → Orchestrator (JWT validation) → Other Services
```

- Frontend authenticates with Supabase
- All API calls include Bearer token
- Orchestrator validates tokens with Supabase Auth
- Other services trust orchestrator for authentication

### Queue System (BullMQ + Redis)

- **Queue Name**: `codegen-jobs`
- **Redis URL**: `redis://localhost:6379` (default)
- **Concurrency**: 1 (sequential processing)
- **Retry Logic**: 3 attempts with exponential backoff

### Database Schema (Supabase)

Key tables:
- `projects` - Project metadata
- `jobs` - Job tracking and status  
- `project_commands` - User commands
- `messages` - Chat conversation history
- `github_integrations` - GitHub OAuth tokens
- `project_integrations` - Vercel and deployment settings

### File Storage (Supabase Storage)

Buckets:
- `project-templates` - Template files
- `project-files` - User project files (organized by userId/projectId)

### Port Allocation

- **3000**: Frontend (celiador-web)
- **4000**: Orchestrator API (celiador-orchestrator)  
- **4001**: Preview Service (celiador-preview-service)
- **6379**: Redis (queue system)
- **8000-9000**: Dynamic preview ports (managed by preview service)

### Error Handling & Monitoring

- Structured logging with service prefixes
- Health check endpoints on all services
- Graceful shutdown handling
- Job timeout and retry mechanisms
- Preview cleanup for stale instances

---

## Environment Configuration

### Required Environment Variables

#### Shared (all services):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REDIS_URL=redis://localhost:6379
```

#### Orchestrator specific:
```env  
PORT=4000
OPENAI_API_KEY=your_openai_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
PREVIEW_SERVICE_URL=http://localhost:4001
```

#### Preview Service specific:
```env
PREVIEW_SERVICE_PORT=4001
```

#### Worker specific:  
```env
OPENAI_API_KEY=your_openai_key
```

### Development Setup

1. Start Redis server
2. Configure environment variables
3. Start services in order:
   - `celiador-orchestrator`: `npm run dev` (port 4000)
   - `celiador-preview-service`: `npm run dev` (port 4001) 
   - `celiador-codegen-worker`: `npm run dev` (background)
   - `celiador-web`: `npm run dev` (port 3000)

### API Testing

Use the health check endpoints to verify service availability:
- `GET http://localhost:4000/health` - Orchestrator
- `GET http://localhost:4001/status/health` - Preview Service
- `GET http://localhost:3000` - Frontend

---

This documentation provides a comprehensive reference for the Celiador microservices architecture, covering all endpoints, request/response formats, authentication requirements, and inter-service communication patterns.