# Multi-Repo Migration Plan

## Executive Summary

This document outlines the comprehensive plan to migrate the current monorepo architecture to a multi-repo setup for better deployment, scaling, and team management. The migration will be executed in 5 phases over 8-12 weeks.

## Current Architecture Analysis

### Services Identified
1. **celiador-web** - Next.js frontend (standalone, ready for extraction)
2. **celiador-orchestrator** - Express.js API service (standalone, ready for extraction)
3. **celiador-preview-service** - Preview service (standalone, ready for extraction)
4. **celiador-codegen-worker** - AI worker (standalone, ready for extraction)
5. **bether_swift** - iOS/macOS apps (already separate)
6. **bether_nextjs** - Legacy monorepo (to be archived)

### Shared Dependencies
- **@mvp/shared** - Common utilities and types
- **@mvp/agent-tools** - AI agent tools
- **@mvp/templates** - Project templates
- **Supabase** - Database, auth, storage
- **Redis** - Job queue system

### Communication Patterns
- Frontend → Orchestrator (REST API)
- Orchestrator → Worker (BullMQ/Redis)
- Orchestrator → Preview Service (HTTP)
- All services → Supabase (Database/Storage)

## Migration Strategy

### Phase 1: Extract Frontend (Week 1-2)
**Goal**: Create standalone celiador-web repository

#### Tasks:
1. **Create new repository**: `celiador-web`
2. **Copy source code**: Move `celiador-web/` contents to new repo
3. **Update dependencies**: Remove monorepo-specific references
4. **Create CI/CD**: Set up Vercel deployment
5. **Update API endpoints**: Point to production orchestrator
6. **Test deployment**: Verify frontend works independently

#### Deliverables:
- [ ] New `celiador-web` repository
- [ ] Vercel deployment configured
- [ ] Environment variables documented
- [ ] API client updated for production URLs

#### Risk Level: **LOW** (already standalone)

---

### Phase 2: Extract Orchestrator (Week 3-4)
**Goal**: Create standalone celiador-orchestrator repository

#### Tasks:
1. **Create new repository**: `celiador-orchestrator`
2. **Copy source code**: Move `celiador-orchestrator/` contents
3. **Extract shared packages**: Create `@celiador/shared` NPM package
4. **Update dependencies**: Replace monorepo packages with NPM packages
5. **Create CI/CD**: Set up Railway/Render deployment
6. **Database setup**: Ensure Supabase connection works
7. **Test deployment**: Verify API endpoints work

#### Deliverables:
- [ ] New `celiador-orchestrator` repository
- [ ] `@celiador/shared` NPM package published
- [ ] Production deployment configured
- [ ] API documentation updated
- [ ] Health checks implemented

#### Risk Level: **MEDIUM** (shared dependencies)

---

### Phase 3: Extract Preview Service (Week 5-6)
**Goal**: Create standalone celiador-preview-service repository

#### Tasks:
1. **Create new repository**: `celiador-preview-service`
2. **Copy source code**: Move `celiador-preview-service/` contents
3. **Update dependencies**: Use `@celiador/shared` package
4. **Create CI/CD**: Set up container deployment
5. **Port management**: Implement dynamic port allocation
6. **Test deployment**: Verify preview functionality

#### Deliverables:
- [ ] New `celiador-preview-service` repository
- [ ] Container deployment configured
- [ ] Port management system working
- [ ] Integration tests with orchestrator

#### Risk Level: **MEDIUM** (port management complexity)

---

### Phase 4: Extract Codegen Worker (Week 7-8)
**Goal**: Create standalone celiador-codegen-worker repository

#### Tasks:
1. **Create new repository**: `celiador-codegen-worker`
2. **Copy source code**: Move `celiador-codegen-worker/` contents
3. **Extract agent tools**: Create `@celiador/agent-tools` NPM package
4. **Update dependencies**: Use shared packages
5. **Create CI/CD**: Set up worker deployment
6. **Queue configuration**: Ensure Redis connection works
7. **Test deployment**: Verify job processing

#### Deliverables:
- [ ] New `celiador-codegen-worker` repository
- [ ] `@celiador/agent-tools` NPM package published
- [ ] Worker deployment configured
- [ ] Job processing tests passing

#### Risk Level: **MEDIUM** (queue dependencies)

---

### Phase 5: Archive Legacy & Finalize (Week 9-12)
**Goal**: Archive bether_nextjs and finalize multi-repo setup

#### Tasks:
1. **Archive bether_nextjs**: Move to archive branch
2. **Update documentation**: Update all README files
3. **Create shared packages**: Extract templates to `@celiador/templates`
4. **Update iOS apps**: Point to new API endpoints
5. **Performance testing**: Load test all services
6. **Monitoring setup**: Implement service monitoring
7. **Security audit**: Review access controls

#### Deliverables:
- [ ] Legacy monorepo archived
- [ ] All documentation updated
- [ ] `@celiador/templates` NPM package published
- [ ] iOS apps updated
- [ ] Monitoring dashboard configured
- [ ] Security audit completed

#### Risk Level: **LOW** (cleanup phase)

---

## Repository Structure

### Final Multi-Repo Architecture

```
celiador-web/                 # Frontend (Vercel)
├── src/
├── package.json
├── vercel.json
└── README.md

celiador-orchestrator/        # API Service (Railway)
├── src/
├── package.json
├── Dockerfile
└── README.md

celiador-preview-service/     # Preview Service (Railway)
├── src/
├── package.json
├── Dockerfile
└── README.md

celiador-codegen-worker/      # AI Worker (Railway)
├── src/
├── package.json
├── Dockerfile
└── README.md

bether-ios/                   # iOS Apps (App Store)
├── Bether/
├── Bether.xcodeproj
└── README.md

celiador-shared/              # Shared NPM Packages
├── packages/
│   ├── shared/              # @celiador/shared
│   ├── agent-tools/         # @celiador/agent-tools
│   └── templates/           # @celiador/templates
└── README.md
```

## Shared Package Strategy

### NPM Packages to Create

1. **@celiador/shared**
   - Common types and interfaces
   - Database schemas
   - Utility functions
   - Supabase client configuration

2. **@celiador/agent-tools**
   - AI agent tools
   - Code generation utilities
   - Template processing

3. **@celiador/templates**
   - Project templates
   - Template metadata
   - Template validation

### Package Management
- Use semantic versioning
- Publish to NPM registry
- Use GitHub Actions for automated publishing
- Maintain backward compatibility

## Deployment Strategy

### Service Deployment Targets

| Service | Platform | Reason |
|---------|----------|---------|
| celiador-web | Vercel | Optimized for Next.js, global CDN |
| celiador-orchestrator | Railway | Easy container deployment, good for APIs |
| celiador-preview-service | Railway | Container support, port management |
| celiador-codegen-worker | Railway | Background worker support |
| bether-ios | App Store | Native iOS deployment |

### Environment Configuration

#### Production Environment Variables
```env
# Shared
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
REDIS_URL=redis://your-redis-instance:6379

# Orchestrator
PORT=4000
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Preview Service
PORT=4001
PREVIEW_BASE_URL=https://preview.yourdomain.com

# Codegen Worker
WORKER_CONCURRENCY=1
JOB_TIMEOUT=300000
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### Frontend (celiador-web)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
```

#### Backend Services
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: railway-app/railway-deploy@v1
```

## Risk Mitigation

### High-Risk Areas

1. **Shared Dependencies**
   - **Risk**: Breaking changes in shared packages
   - **Mitigation**: Semantic versioning, comprehensive testing

2. **Service Communication**
   - **Risk**: API contract changes
   - **Mitigation**: API versioning, backward compatibility

3. **Database Schema**
   - **Risk**: Schema changes affecting multiple services
   - **Mitigation**: Database migrations, schema validation

4. **Authentication Flow**
   - **Risk**: JWT token validation issues
   - **Mitigation**: Shared auth utilities, comprehensive testing

### Rollback Strategy

1. **Service-Level Rollback**
   - Each service can be rolled back independently
   - Database migrations are reversible
   - API versioning allows backward compatibility

2. **Full Rollback**
   - Keep monorepo in archive branch
   - Can quickly switch back if needed
   - Database state preserved

## Success Metrics

### Technical Metrics
- [ ] All services deploy successfully
- [ ] API response times < 200ms
- [ ] 99.9% uptime for all services
- [ ] Zero data loss during migration

### Business Metrics
- [ ] No user-facing downtime
- [ ] Faster deployment times
- [ ] Improved development velocity
- [ ] Better team autonomy

## Timeline Summary

| Phase | Duration | Services | Risk Level |
|-------|----------|----------|------------|
| 1 | Week 1-2 | Frontend | LOW |
| 2 | Week 3-4 | Orchestrator | MEDIUM |
| 3 | Week 5-6 | Preview Service | MEDIUM |
| 4 | Week 7-8 | Codegen Worker | MEDIUM |
| 5 | Week 9-12 | Archive & Finalize | LOW |

**Total Duration**: 8-12 weeks
**Team Size**: 2-3 developers
**Budget Impact**: Minimal (existing infrastructure)

## Next Steps

1. **Approve migration plan**
2. **Set up new repositories**
3. **Begin Phase 1 (Frontend extraction)**
4. **Schedule weekly progress reviews**
5. **Prepare rollback procedures**

---

*This plan will be updated as we progress through each phase and learn from the migration process.*
