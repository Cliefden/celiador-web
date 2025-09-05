
# Celiador Web Application

This is the web frontend for the Celiador platform. It includes:
- `apps/web`: React/Next.js UI for project management, file editing, and AI conversations
- Connects to external services:
  - Orchestrator API at `../celiador-orchestrator` (port 4000)
  - Preview service at `../celiador-preview-service` (port 4001) 
  - Codegen worker at `../celiador-codegen-worker`

## Quickstart

### Prerequisites
Make sure the external services are running:
1) Start the orchestrator: `cd ../celiador-orchestrator && npm run dev`
2) Start the preview service: `cd ../celiador-preview-service && npm run dev` 
3) Start the codegen worker: `cd ../celiador-codegen-worker && npm run dev`

### Start Web App
1) Install dependencies: `pnpm i`
2) Start the web app:
   ```bash
   ./start-new-dev.sh
   # OR
   npm run dev
   ```
3) Access at: http://localhost:3000

## Job Queue System

The system now includes a complete job queue implementation:

- **Orchestrator**: REST API that enqueues jobs to BullMQ
- **Worker**: Processes jobs from the queue using agent tools
- **Job Types**: SCAFFOLD, EDIT, TEST, DEPLOY
- **Real-time**: Job status tracking and logging

## API Endpoints

- `POST /projects` - Create a new project
- `POST /projects/:id/jobs` - Enqueue a job for a project
- `GET /projects/:id` - Get project details
- `GET /projects/:id/jobs` - List project jobs
- `GET /jobs/:id` - Get job details
- `GET /projects/:id/jobs/:jobId/logs` - Stream job logs (SSE)

## Notes
- Queue: BullMQ with Redis (required)
- Worker processes jobs sequentially for now
- Agent tools are implemented with real file system operations
- Template system ready for scaffolding new projects
