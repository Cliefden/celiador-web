# Bether Conversational Development Platform Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Enable developers to manage projects through natural conversational interfaces (text and voice) from any device
- Eliminate context-switching friction between GitHub, AI tools, deployment platforms, and project management workflows  
- Provide seamless cross-device continuity where project state and context sync automatically across phone, computer, and tablet
- Implement "invisible service integrations" that automatically configure and manage GitHub, OpenAI, Anthropic, and deployment platform connections
- Deliver contextual AI understanding that maintains project memory across sessions and acts as both project partner and personal assistant
- Achieve 70% weekly conversational interface adoption within 90 days of user onboarding
- Generate $50K MRR within 12 months targeting solo developers and small teams

### Background Context

Developers today operate in a fragmented ecosystem requiring constant context-switching between GitHub repositories, deployment platforms, AI coding assistants, and project management tools. This fragmentation is amplified by multi-device workflows where developers have ideas during commutes, review code on tablets, and implement on desktops, but project context rarely follows them seamlessly. Current solutions force users to adapt to tool constraints rather than natural communication patterns.

The Bether Conversational Development Platform addresses this core friction through three breakthrough innovations: a conversational interface that understands project context, invisible service integration that automatically configures connections, and universal platform access that enables device-fluid development. The goal is to transform development from a tool-switching workflow into a natural conversation where developers can "message their phone about projects and return to find ideas implemented."

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-21 | v1.0 | Initial PRD creation based on comprehensive Project Brief and brainstorming session results | Business Analyst Mary |

---

## Requirements

**IMPORTANT:** This PRD builds upon the existing Lovable-like MVP infrastructure including Next.js web app, Express orchestrator with BullMQ, LLM worker, and Supabase integration.

### Functional Requirements

**EXISTING FOUNDATION REQUIREMENTS:**
**FR1:** The system shall maintain existing project scaffolding, job queue (BullMQ), and LLM worker capabilities for code generation
**FR2:** The system shall preserve existing Next.js web interface with file tree, project management, and job monitoring functionality  
**FR3:** The system shall continue supporting Supabase authentication and database operations for user management
**FR4:** The system shall maintain existing Express orchestrator API with project creation, job management, and logging endpoints

**NEW CONVERSATIONAL INTERFACE REQUIREMENTS:**
**FR5:** The system shall add a conversational interface component to the existing web application that accepts text input for project management commands
**FR6:** The conversational interface shall integrate with existing LLM worker to process natural language requests and trigger appropriate jobs in the BullMQ system
**FR7:** Users shall be able to create and modify projects through conversational commands that leverage the existing job queue and agent tools
**FR8:** The system shall maintain conversation history using existing Supabase database infrastructure with new conversation tables
**FR9:** The conversational interface shall provide real-time feedback through existing SSE job logging system
**FR10:** Users shall be able to query project status, job history, and file contents through the natural language interface

**ENHANCED INTEGRATION REQUIREMENTS:**
**FR11:** The system shall add GitHub API integration to existing orchestrator for repository connections and automated issue creation
**FR12:** The system shall enhance existing LLM worker with contextual project understanding and multi-turn conversation capabilities
**FR13:** The system shall improve mobile responsiveness of existing web application for better cross-device access
**FR14:** The conversational interface shall trigger existing job types (SCAFFOLD, EDIT, TEST) through natural language commands
**FR15:** The system shall add OpenAI/Anthropic API integration alongside existing LLM capabilities for enhanced AI responses

### Non-Functional Requirements

**NFR1:** Conversational commands shall integrate with existing job queue system maintaining current response times (<2 seconds for job creation)
**NFR2:** The enhanced system shall maintain existing 98% uptime and job processing reliability
**NFR3:** New conversational features shall not impact existing file tree, project management, or job monitoring performance
**NFR4:** The system shall continue supporting current browser compatibility (Chrome, Safari, Firefox) with improved mobile responsiveness
**NFR5:** Conversation history shall be stored efficiently in Supabase without affecting existing project and job data performance
**NFR6:** New GitHub and AI API integrations shall include proper error handling and rate limiting using existing infrastructure patterns
**NFR7:** The system shall maintain existing security practices while adding conversation data encryption
**NFR8:** Enhanced mobile interface shall work within existing Next.js and Tailwind CSS framework without major architectural changes

---

## Technical Assumptions

**IMPORTANT:** This section prioritizes database schema extensions as the foundation for conversational capabilities.

### Repository Structure: Monorepo
Continue using existing monorepo structure with apps/orchestrator managing core data and workers/codegen handling LLM processing.

### Service Architecture
**Extending Existing Architecture:**
- **Database Layer:** Add conversational schema to existing Prisma/Supabase setup
- **API Layer:** Extend existing Express orchestrator with conversation endpoints  
- **Worker Layer:** Enhance existing LLM worker with conversation context capabilities
- **Frontend Layer:** Add conversational components to existing Next.js interface

### Conversational Database Schema Extensions

**Building on existing User, Profile, Project, Job models:**

```prisma
// Conversation threads - each project can have multiple conversation contexts
model Conversation {
  id          String   @id @default(cuid())
  title       String?  // Optional conversation title
  status      String   @default("ACTIVE") // ACTIVE, ARCHIVED, DELETED
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Context linking
  projectId   String?   // Optional - conversations can be project-specific or global
  project     Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Audit fields matching existing pattern
  creator     String?
  updater     String?
  deleter     String?
  deletedAt   DateTime? @map("deleted_at")

  // Relations
  messages    Message[]
  
  @@map("conversations")
}

// Individual messages within conversations
model Message {
  id            String   @id @default(cuid())
  content       String   // The actual message text
  role          String   // "user", "assistant", "system"
  messageType   String   @default("text") @map("message_type") // "text", "command", "file_reference", "job_result"
  createdAt     DateTime @default(now()) @map("created_at")

  // Context and metadata
  metadata      Json?    // Store additional context, file references, job IDs, etc.
  parentId      String?  @map("parent_id") // For threaded conversations
  parent        Message? @relation("MessageThread", fields: [parentId], references: [id])
  children      Message[] @relation("MessageThread")

  // Linking to existing job system
  relatedJobId  String?  @map("related_job_id") // Link messages to jobs they triggered
  relatedJob    Job?     @relation(fields: [relatedJobId], references: [id])

  // Relations
  conversationId String      @map("conversation_id")
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  userId         String      @map("user_id")
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("messages")
}

// AI context management for maintaining project understanding
model ConversationContext {
  id              String   @id @default(cuid())
  contextType     String   @map("context_type") // "project_summary", "file_knowledge", "user_preferences"
  contextData     Json     @map("context_data") // Vector embeddings, summaries, preferences
  lastUpdated     DateTime @default(now()) @map("last_updated")
  
  // Linking
  conversationId  String      @map("conversation_id")
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  projectId       String?     @map("project_id")
  project         Project?    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@map("conversation_contexts")
}

// Enhanced GitHub integration data (extends existing project repoProvider/repoOwner/repoName)
model GitHubIntegration {
  id            String   @id @default(cuid())
  accessToken   String   @map("access_token") // Encrypted GitHub access token
  refreshToken  String?  @map("refresh_token") // For token refresh
  scope         String[] // GitHub OAuth scopes
  installationId String? @map("installation_id") // GitHub App installation ID
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  // Link to existing user system
  userId        String   @unique @map("user_id")
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("github_integrations")
}

// Track external service integrations
model ServiceIntegration {
  id          String   @id @default(cuid())
  service     String   // "openai", "anthropic", "vercel", etc.
  config      Json     // Service-specific configuration
  status      String   @default("ACTIVE") // ACTIVE, DISABLED, ERROR
  lastSync    DateTime? @map("last_sync")
  createdAt   DateTime @default(now()) @map("created_at")
  
  // Link to user
  userId      String   @map("user_id") 
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("service_integrations")
}
```

### Database Schema Rationale

**Building on existing patterns:**
- **Audit fields** match existing `creator`, `updater`, `deleter`, `deletedAt` pattern
- **User/Project relationships** follow existing foreign key conventions  
- **Job integration** links messages to existing job system for workflow continuity

**Conversation design:**
- **Flexible context linking** - conversations can be project-specific or global
- **Message threading** supports complex multi-turn conversations
- **Job integration** connects conversations to existing workflow system
- **Context management** enables AI memory across sessions

**Integration strategy:**
- **GitHub tokens** stored securely for API access
- **Service integrations** extensible for future OpenAI/Anthropic/Vercel connections
- **Metadata JSON fields** provide flexibility for evolving requirements

### Testing Requirements
- Unit tests for new conversation models and relationships
- Integration tests for conversation → job workflow
- Database migration testing for schema additions
- Existing test suite must continue passing

### Additional Technical Assumptions
- **Prisma migrations** will handle schema updates without breaking existing data
- **Supabase RLS policies** need updates for conversation data access control  
- **Existing API endpoints** remain unchanged while new conversation endpoints are added
- **BullMQ job system** integrations require conversation context passing

---

*PRD in progress - additional sections to be added as we continue...*