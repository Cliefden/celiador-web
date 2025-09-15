# Celiador Development Scripts

This directory contains all the scripts needed for the hybrid monorepo development environment.

## Available Scripts

### 🚀 **dev-all.sh** - Start All Services
Starts all services for local development.

```bash
./scripts/dev-all.sh
```

**Features:**
- Starts all services in parallel
- Checks prerequisites (Node.js, Redis)
- Monitors service health
- Shows real-time logs
- Graceful shutdown with Ctrl+C

**Services Started:**
- Web App (port 3000)
- Orchestrator API (port 4000)
- Preview Service (port 4001)
- Codegen Worker (background)

---

### 🔄 **sync-to-repos.sh** - Deploy to Production
Syncs changes from development monorepo to deployment repositories.

```bash
./scripts/sync-to-repos.sh
```

**Features:**
- Syncs all services to deployment repos
- Publishes shared packages to NPM
- Updates package.json dependencies
- Commits and pushes changes
- Triggers automatic deployments

**Deployment Targets:**
- `celiador-web` → Vercel
- `celiador-orchestrator` → Railway
- `celiador-preview-service` → Railway
- `celiador-codegen-worker` → Railway

---

### 🔨 **build-all.sh** - Build All Services
Builds all services and packages.

```bash
./scripts/build-all.sh [OPTIONS]
```

**Options:**
- `--clean` - Clean build artifacts before building
- `--packages-only` - Build only shared packages
- `--services-only` - Build only services
- `--help` - Show help message

**Features:**
- Builds all services and packages
- Installs dependencies if needed
- Cleans build artifacts
- Parallel building for speed

---

### 🧪 **test-all.sh** - Test All Services
Runs tests for all services and packages.

```bash
./scripts/test-all.sh [OPTIONS]
```

**Options:**
- `--lint` - Run linting checks
- `--typecheck` - Run TypeScript type checking
- `--integration` - Run integration tests
- `--packages-only` - Test only shared packages
- `--services-only` - Test only services
- `--help` - Show help message

**Features:**
- Runs unit tests for all services
- Runs linting and type checking
- Integration tests (if services are running)
- Comprehensive test reporting

---

### 🛠️ **setup-dev.sh** - Setup Development Environment
Sets up the complete development environment.

```bash
./scripts/setup-dev.sh
```

**Features:**
- Checks and installs prerequisites
- Creates directory structure
- Creates package.json files
- Creates environment files
- Creates TypeScript configs
- Installs all dependencies
- Makes scripts executable

---

### 🏥 **health-check.sh** - Check Service Health
Checks the health of all services.

```bash
./scripts/health-check.sh [OPTIONS]
```

**Options:**
- `--quick` - Run quick health check (services only)
- `--help` - Show help message

**Features:**
- Checks service endpoints
- Checks port usage
- Checks Redis connection
- Checks database connection
- Checks environment variables
- Shows system resources
- Comprehensive health reporting

---

### 🧹 **cleanup.sh** - Clean Development Environment
Cleans up the development environment.

```bash
./scripts/cleanup.sh [OPTIONS]
```

**Options:**
- `--builds` - Clean build artifacts
- `--node-modules` - Clean node_modules directories
- `--logs` - Clean log files
- `--temp` - Clean temporary files
- `--docker` - Clean Docker containers and images
- `--redis` - Clean Redis data
- `--git` - Clean Git (untracked files, reset)
- `--kill-processes` - Kill all Node.js processes
- `--all` - Clean everything
- `--help` - Show help message

**Features:**
- Kills running processes
- Cleans build artifacts
- Removes node_modules
- Cleans logs and temp files
- Docker cleanup
- Redis data cleanup
- Git cleanup

---

### 📦 **update-deps.sh** - Update Dependencies
Updates dependencies for all services and packages.

```bash
./scripts/update-deps.sh [OPTIONS]
```

**Options:**
- `--update` - Update dependencies to compatible versions
- `--check-outdated` - Check for outdated packages
- `--audit` - Audit dependencies for security vulnerabilities
- `--latest` - Update to latest versions (may break compatibility)
- `--packages-only` - Update only shared packages
- `--services-only` - Update only services
- `--help` - Show help message

**Features:**
- Updates all dependencies
- Checks for outdated packages
- Security vulnerability auditing
- Dependency summary reporting

---

## Quick Start Guide

### 1. Setup Development Environment
```bash
./scripts/setup-dev.sh
```

### 2. Start All Services
```bash
./scripts/dev-all.sh
```

### 3. Check Health
```bash
./scripts/health-check.sh
```

### 4. Run Tests
```bash
./scripts/test-all.sh
```

### 5. Deploy to Production
```bash
./scripts/sync-to-repos.sh
```

---

## Common Workflows

### Daily Development
```bash
# Start development environment
./scripts/dev-all.sh

# Make changes to code
# Test locally
# Check health
./scripts/health-check.sh

# Run tests
./scripts/test-all.sh
```

### Deployment
```bash
# Build all services
./scripts/build-all.sh

# Run tests
./scripts/test-all.sh

# Deploy to production
./scripts/sync-to-repos.sh
```

### Maintenance
```bash
# Update dependencies
./scripts/update-deps.sh --update --audit

# Clean environment
./scripts/cleanup.sh --all

# Setup fresh environment
./scripts/setup-dev.sh
```

---

## Troubleshooting

### Port Conflicts
```bash
# Kill processes on specific ports
./scripts/cleanup.sh --kill-processes
```

### Dependency Issues
```bash
# Clean and reinstall dependencies
./scripts/cleanup.sh --node-modules
npm install
```

### Build Issues
```bash
# Clean builds and rebuild
./scripts/cleanup.sh --builds
./scripts/build-all.sh --clean
```

### Service Issues
```bash
# Check service health
./scripts/health-check.sh

# Check logs
tail -f logs/*.log
```

---

## Script Dependencies

All scripts require:
- **Node.js 18+**
- **npm 8+**
- **Git**
- **Redis** (for development)
- **curl** (for health checks)

---

## Environment Variables

Scripts use environment variables from:
- `.env` (root)
- `services/*/.env` (service-specific)
- `services/*/.env.local` (local overrides)

---

## Logs

Service logs are stored in:
- `logs/orchestrator.log`
- `logs/preview-service.log`
- `logs/codegen-worker.log`
- `logs/web.log`

---

## Support

For issues with scripts:
1. Check the logs in the `logs/` directory
2. Run `./scripts/health-check.sh` to diagnose issues
3. Check environment variables are set correctly
4. Ensure all prerequisites are installed

---

*These scripts are designed to make the hybrid monorepo development experience as smooth as possible while maintaining the benefits of multi-repo deployment.*
