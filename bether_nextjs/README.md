
# Lovable-like MVP Monorepo

This is a build-ready scaffold for a prompt → app generator (Lovable-style). It includes:
- `apps/web`: React/Next.js UI shell (Monaco-ready) for file tree, jobs, and logs
- `apps/orchestrator`: REST + SSE API (Express) and BullMQ job queue
- `workers/codegen`: LLM worker with BullMQ job processing and tool orchestration
- `packages/agent-tools`: strongly-typed tool interfaces (writeFile, patchFile, runCmd…)
- `packages/templates/next-prisma-supabase`: base full-stack web template
- `packages/shared`: shared DTOs and zod schemas
- `infra`: placeholders for Docker and Terraform

## Quickstart

1) Install pnpm and Node 20+
2) Install and start Redis (required for job queue):
   ```bash
   # macOS
   brew install redis
   brew services start redis
   
   # Or use Docker
   docker run -d -p 6379:6379 redis:alpine
   ```
3) `pnpm i`
4) Copy `env.example` to `.env` files in each app and fill values:
   ```bash
   cp env.example apps/orchestrator/.env
   cp env.example workers/codegen/.env
   ```
5) Dev:
   - `pnpm --filter @mvp/orchestrator dev` (API + job queue)
   - `pnpm --filter @mvp/worker-codegen dev` (job processor)
   - `pnpm --filter @mvp/web dev` (web UI)

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
