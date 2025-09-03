# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This repository contains three related applications undergoing architectural migration:

1. **`bether_nextjs/`** - Backend services platform (orchestrator, workers, shared packages) - **transitioning to backend-only**
2. **`celiador-web/`** - Main frontend Next.js application - **becoming primary frontend**
3. **`bether_swift/`** - iOS/macOS Swift applications

## Development Commands

### Bether Next.js Platform (bether_nextjs/)

#### Root Level Development
```bash
# Start all services for development
npm run dev:all          # Starts web, orchestrator, and worker
npm run dev:full         # Starts web, orchestrator, preview, and worker

# Individual services
npm run dev:web          # Web frontend on port 3000
npm run dev:orchestrator # Backend API on port 4000  
npm run dev:preview      # Preview service on port 4001
npm run dev:worker       # Code generation worker
```

#### Component Services
```bash
# Web App (apps/web/)
npm run dev              # Development server
npm run build            # Production build
npm run lint             # ESLint checks

# Orchestrator (apps/orchestrator/)
npm run dev              # Development with tsx
npm run build            # TypeScript compilation

# Workers (workers/codegen/)
npm run dev              # Development with tsx
npm run build            # TypeScript compilation
```

### Celiador Web (celiador-web/)
```bash
npm run dev              # Development server with Turbopack
npm run build            # Production build with Turbopack
npm run start            # Production server
npm run lint             # ESLint checks
```

### iOS Applications (bether_swift/)
Open `bether_swift/Bether/Bether.xcodeproj` in Xcode to work with:
- **External iOS**: Public-facing iOS app
- **Internal macOS**: Admin/data management tool

## Architecture Overview

### Bether Platform (Backend Services)

#### Monorepo Structure (pnpm workspace)
- **Web Frontend** (`apps/web/`) - **Legacy frontend** (being phased out in favor of `celiador-web/`)
- **Orchestrator Backend** (`apps/orchestrator/`) - Express.js API server with authentication, projects, jobs, file storage
- **Code Generation Worker** (`workers/codegen/`) - BullMQ worker for AI-powered code generation  
- **Preview Service** (`apps/preview-service/`) - Development preview server for generated projects

#### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express.js, BullMQ, Redis, Supabase
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Authentication**: Supabase Auth with JWT tokens
- **File Storage**: Supabase Storage with dual-write to temp directories
- **AI Integration**: OpenAI and Anthropic APIs for code generation
- **Job Processing**: BullMQ with Redis for background tasks

#### Core Services
**Authentication**: Supabase Auth with `AuthContext` providing React state management  
**Project Management**: Template-based scaffolding with background job processing  
**AI Conversation System**: Natural language interface for project commands  
**File Management**: Supabase Storage with real-time preview sync

### Celiador Web (Standalone Next.js App)
- **Framework**: Next.js 15.5.2 with React 19, TypeScript
- **Styling**: Tailwind CSS v4 with PostCSS
- **Build Tool**: Uses Turbopack for faster development builds
- **Components**: Similar component structure to main platform (auth, conversation, file-tree, etc.)
- **Integration**: Uses Supabase for backend services

### iOS Platform
- **External iOS**: SwiftUI app for end users with dashboard, project management, and conversation features
- **Internal macOS**: Admin tool with CRUD views for data management  
- **Shared Module**: Common SwiftUI components, models, and utilities
- **Integration**: Uses `Supabasable` framework for backend connectivity

## Environment Setup

### Bether Platform Prerequisites
- Node.js 18+ and pnpm
- Redis server (local or remote)
- Supabase project configured

### Required Environment Variables (Bether Platform)
```bash
# Supabase (required for all services)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis (required for job queue)
REDIS_URL=redis://localhost:6379

# AI Services (required for worker)
OPENAI_API_KEY=your-openai-key

# Optional
PREVIEW_SERVICE_URL=http://localhost:4001
```

### Celiador Web Setup
Standard Next.js environment with Supabase configuration.

### iOS Development Prerequisites
- Xcode 15+ with iOS 17+ deployment target
- Supabase credentials in `Shared/Secrets.swift`

## Database Schema (Shared Across Platforms)
Core Supabase tables:
- `profiles` - User profiles with RLS policies
- `projects` - User projects with soft delete support  
- `jobs` - Background job tracking and status
- `conversations` - AI conversation history
- `messages` - Individual conversation messages
- `integrations` - Service connections (GitHub, etc.)

## Component Patterns

### Shared UI Components
All Next.js applications use similar patterns:
- **Radix UI** for accessible primitives
- **Tailwind CSS** for styling
- **TypeScript** for type safety
- **Supabase Auth** for authentication

### File Organization
Components organized by domain:
- `auth/` - Authentication components
- `conversation/` - AI chat interfaces
- `file-tree/` - Project file management
- `project/` - Project creation and management  
- `ui/` - Reusable UI components

## Development Workflow

### Working with Bether Platform
1. Start Redis: `brew services start redis`
2. Configure environment files from `env.example`
3. Run `npm run dev:all` in `bether_nextjs/`
4. Access web app at http://localhost:3000, API at http://localhost:4000

### Working with Celiador Web
Navigate to `celiador-web/` and run standard Next.js commands.

### iOS Development
Open Xcode project and select appropriate target for development.

## Key Integration Points

### Job Processing System (Bether Platform)
- BullMQ handles background jobs with Redis
- Job types: `SCAFFOLD`, `EDIT`, `TEST`, `AI_ACTION`  
- Real-time status updates via database polling
- AI responses parsed for actionable intents

### Cross-Platform Data Sync
All platforms share the same Supabase backend, enabling seamless project synchronization between web, mobile, and different applications.

### Shared Packages (Bether Platform Only)
- **`@mvp/shared`** - Common utilities, types, and services
- **`@mvp/agent-tools`** - AI agent tools for code generation
- **`@mvp/templates`** - Project template packages