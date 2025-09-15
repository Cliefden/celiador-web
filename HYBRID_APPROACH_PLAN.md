# Hybrid Multi-Repo Approach

## Overview

The hybrid approach maintains a **development monorepo** for day-to-day development while using **separate deployment repositories** for production. This gives you the best of both worlds: development convenience + deployment flexibility.

## Architecture

### Development Environment (Monorepo)
```
celiador-dev/                    # Development monorepo
├── services/
│   ├── web/                    # Frontend service
│   ├── orchestrator/           # API service  
│   ├── preview-service/        # Preview service
│   └── codegen-worker/         # AI worker
├── packages/
│   ├── shared/                 # Shared utilities
│   ├── agent-tools/           # AI tools
│   └── templates/             # Project templates
├── scripts/
│   ├── dev-all.sh             # Start all services
│   ├── build-all.sh           # Build all services
│   ├── test-all.sh            # Test all services
│   └── sync-to-repos.sh       # Sync to deployment repos
├── docker-compose.dev.yml     # Local development
└── package.json               # Root package.json
```

### Deployment Environment (Multi-Repo)
```
celiador-web/                   # Deploy to Vercel
celiador-orchestrator/          # Deploy to Railway
celiador-preview-service/       # Deploy to Railway
celiador-codegen-worker/        # Deploy to Railway
celiador-shared/                # NPM packages
```

## How It Works

### 1. Development Workflow (Unchanged)

**Daily Development:**
```bash
# Clone development monorepo
git clone celiador-dev
cd celiador-dev

# Install dependencies (one command)
npm install

# Start all services (one command)
npm run dev:all

# Work on any service
# - Edit web/ code
# - Edit orchestrator/ code  
# - Edit shared packages
# - All in one repository
```

**Your current workflow stays exactly the same:**
```bash
# These commands work identically to now
npm run dev:all          # Start everything
npm run dev:web          # Start just frontend
npm run dev:orchestrator # Start just API
npm run dev:worker       # Start just worker
```

### 2. Deployment Workflow (New)

**When ready to deploy:**
```bash
# Sync changes to deployment repos
npm run sync:deploy

# This script:
# 1. Pushes web/ changes to celiador-web repo
# 2. Pushes orchestrator/ changes to celiador-orchestrator repo
# 3. Pushes preview-service/ changes to celiador-preview-service repo
# 4. Pushes codegen-worker/ changes to celiador-codegen-worker repo
# 5. Publishes shared packages to NPM
# 6. Triggers deployments on Vercel/Railway
```

## Detailed Implementation

### Development Monorepo Structure

**package.json (Root)**
```json
{
  "name": "celiador-dev",
  "private": true,
  "scripts": {
    "dev": "npm run dev:all",
    "dev:all": "./scripts/dev-all.sh",
    "dev:web": "cd services/web && npm run dev",
    "dev:orchestrator": "cd services/orchestrator && npm run dev",
    "dev:preview": "cd services/preview-service && npm run dev",
    "dev:worker": "cd services/codegen-worker && npm run dev",
    "build": "./scripts/build-all.sh",
    "test": "./scripts/test-all.sh",
    "sync:deploy": "./scripts/sync-to-repos.sh",
    "setup": "./scripts/setup-dev.sh"
  },
  "workspaces": [
    "services/*",
    "packages/*"
  ]
}
```

**scripts/dev-all.sh**
```bash
#!/bin/bash

echo "🚀 Starting Celiador Development Environment..."

# Kill any existing processes
pkill -f "node" 2>/dev/null
pkill -f "next" 2>/dev/null

# Start Redis (if not running)
if ! pgrep -x "redis-server" > /dev/null; then
    echo "📦 Starting Redis..."
    brew services start redis
fi

# Start all services in parallel
echo "🌐 Starting Web App (port 3000)..."
cd services/web && npm run dev &
WEB_PID=$!

echo "🔧 Starting Orchestrator (port 4000)..."
cd services/orchestrator && npm run dev &
ORCH_PID=$!

echo "👀 Starting Preview Service (port 4001)..."
cd services/preview-service && npm run dev &
PREV_PID=$!

echo "🤖 Starting Codegen Worker..."
cd services/codegen-worker && npm run dev &
WORKER_PID=$!

# Wait for services to start
sleep 5

echo ""
echo "✅ All services started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 API: http://localhost:4000"
echo "👀 Preview: http://localhost:4001"
echo "🤖 Worker: Running in background"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping all services..."
    kill $WEB_PID $ORCH_PID $PREV_PID $WORKER_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM
wait
```

**scripts/sync-to-repos.sh**
```bash
#!/bin/bash

echo "🔄 Syncing changes to deployment repositories..."

# Function to sync a service
sync_service() {
    local service_name=$1
    local deploy_repo=$2
    
    echo "📦 Syncing $service_name to $deploy_repo..."
    
    # Create temporary directory
    mkdir -p /tmp/sync-$service_name
    
    # Copy service files
    cp -r services/$service_name/* /tmp/sync-$service_name/
    
    # Clone deployment repo
    git clone https://github.com/yourorg/$deploy_repo.git /tmp/$deploy_repo
    
    # Copy files to deployment repo
    cp -r /tmp/sync-$service_name/* /tmp/$deploy_repo/
    
    # Commit and push
    cd /tmp/$deploy_repo
    git add .
    git commit -m "Sync from development monorepo - $(date)"
    git push origin main
    
    # Cleanup
    rm -rf /tmp/sync-$service_name
    rm -rf /tmp/$deploy_repo
    
    echo "✅ $service_name synced to $deploy_repo"
}

# Sync each service
sync_service "web" "celiador-web"
sync_service "orchestrator" "celiador-orchestrator"
sync_service "preview-service" "celiador-preview-service"
sync_service "codegen-worker" "celiador-codegen-worker"

# Publish shared packages
echo "📦 Publishing shared packages..."
cd packages/shared && npm publish
cd ../agent-tools && npm publish
cd ../templates && npm publish

echo "🎉 All services synced and deployed!"
```

### Docker Compose for Development

**docker-compose.dev.yml**
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  web:
    build: ./services/web
    ports:
      - "3000:3000"
    volumes:
      - ./services/web:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:4000
    depends_on:
      - redis

  orchestrator:
    build: ./services/orchestrator
    ports:
      - "4000:4000"
    volumes:
      - ./services/orchestrator:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  preview-service:
    build: ./services/preview-service
    ports:
      - "4001:4001"
    volumes:
      - ./services/preview-service:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development

  codegen-worker:
    build: ./services/codegen-worker
    volumes:
      - ./services/codegen-worker:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

volumes:
  redis_data:
```

## Benefits of Hybrid Approach

### Development Benefits (Same as Monorepo)
- ✅ **Single repository** to clone and understand
- ✅ **One command** to start entire development environment
- ✅ **Cross-service changes** in single commits
- ✅ **Shared dependencies** managed in one place
- ✅ **Type safety** across services
- ✅ **Familiar workflow** - no learning curve

### Deployment Benefits (Same as Multi-Repo)
- ✅ **Independent deployments** per service
- ✅ **Platform optimization** (Vercel for frontend, Railway for backend)
- ✅ **Independent scaling** per service
- ✅ **Service-specific CI/CD** pipelines
- ✅ **Team autonomy** for deployment decisions
- ✅ **Faster deployments** (only changed services)

### Operational Benefits
- ✅ **Gradual migration** - can move to full multi-repo later
- ✅ **Fallback option** - always have development monorepo
- ✅ **Best of both worlds** - convenience + flexibility
- ✅ **Low risk** - minimal disruption to current workflow

## Migration Strategy

### Phase 1: Setup Hybrid Structure (Week 1)
1. **Create development monorepo** (`celiador-dev`)
2. **Copy current code** into services/ structure
3. **Create deployment repositories** (empty initially)
4. **Set up sync scripts**
5. **Test development workflow**

### Phase 2: Setup Deployment (Week 2)
1. **Configure deployment platforms** (Vercel, Railway)
2. **Set up CI/CD** for deployment repos
3. **Test sync and deployment** process
4. **Document new workflow**

### Phase 3: Gradual Transition (Week 3-4)
1. **Start using hybrid approach** for new features
2. **Train team** on new workflow
3. **Optimize sync scripts**
4. **Monitor and adjust**

### Phase 4: Full Adoption (Week 5+)
1. **All development** uses monorepo
2. **All deployments** use multi-repo
3. **Optimize processes**
4. **Consider full multi-repo** if team prefers

## Team Workflow Examples

### Daily Development (Unchanged)
```bash
# Morning routine
git clone celiador-dev
cd celiador-dev
npm install
npm run dev:all

# Work on features
# - Edit any service
# - Test locally
# - Commit changes
```

### Deployment (New)
```bash
# When ready to deploy
npm run sync:deploy

# This automatically:
# - Syncs to deployment repos
# - Publishes shared packages
# - Triggers deployments
# - Updates production
```

### Cross-Service Changes
```bash
# Make API change + frontend change
# - Edit orchestrator/ code
# - Edit web/ code
# - Test locally
# - Commit both changes
# - Deploy both services
npm run sync:deploy
```

## Comparison with Alternatives

| Aspect | Monorepo | Multi-Repo | Hybrid |
|--------|----------|------------|---------|
| Development Convenience | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Deployment Flexibility | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Team Autonomy | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Learning Curve | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Risk Level | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

## When to Use Hybrid vs Full Multi-Repo

### Use Hybrid When:
- ✅ Small team (2-4 developers)
- ✅ Frequent cross-service changes
- ✅ Want deployment benefits without development complexity
- ✅ Prefer gradual migration
- ✅ Value development convenience

### Move to Full Multi-Repo When:
- ✅ Large team (5+ developers)
- ✅ Clear service boundaries
- ✅ Teams want full autonomy
- ✅ Infrequent cross-service changes
- ✅ Value deployment flexibility over development convenience

## Conclusion

The hybrid approach gives you **80% of the benefits** of multi-repo with **0% of the development complexity**. You keep your current workflow while gaining deployment flexibility. It's the perfect stepping stone that lets you evaluate whether you want to go full multi-repo later.

**My recommendation**: Start with hybrid. It's the safest path that gives you immediate benefits without any downside to your current development experience.
