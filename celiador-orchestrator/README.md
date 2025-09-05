# Celiador Orchestrator

Standalone backend service for the Celiador platform, providing API endpoints for project management, job processing, authentication, and file storage.

## Features

- **Authentication**: Supabase Auth with JWT tokens
- **Project Management**: CRUD operations for projects and templates
- **Job Processing**: Background job queue with BullMQ and Redis
- **File Storage**: Supabase Storage integration with real-time sync
- **AI Integration**: OpenAI and Anthropic API integration for code generation
- **GitHub Integration**: Repository management and OAuth

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your actual values

# Start development server
npm run dev
```

### Production (Docker)
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f orchestrator
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get user profile

### Projects
- `GET /projects` - List user projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Jobs
- `POST /projects/:id/jobs` - Create new job
- `GET /jobs/:id` - Get job status
- `PATCH /jobs/:id` - Update job status

### Files
- `GET /projects/:id/files` - List project files
- `POST /projects/:id/files` - Upload files
- `PUT /projects/:id/files/*` - Update file
- `DELETE /projects/:id/files/*` - Delete file

### Health
- `GET /health` - Service health check

## Environment Variables

See `.env.example` for required configuration.

## Architecture

The orchestrator acts as the central API service for the Celiador platform, coordinating between:
- Frontend applications (celiador-web, iOS apps)
- Background workers (code generation, deployment)
- External services (Supabase, GitHub, AI providers)