# 🔧 Celiador Environment Setup Checklist

Use this checklist to ensure your development environment is properly configured.

## ✅ Prerequisites

- [ ] Node.js 18+ installed
- [ ] npm or pnpm installed
- [ ] Redis installed and running
- [ ] Git configured

## ✅ Environment Files Setup

### Quick Setup (Recommended)
- [ ] Run `./setup-environment.sh` from root directory
- [ ] Review generated environment files
- [ ] Update API keys as needed

### Manual Setup
- [ ] `celiador-web/.env.local` - Frontend environment
- [ ] `celiador-orchestrator/.env` - API environment  
- [ ] `celiador-preview-service/.env` - Preview service environment
- [ ] `celiador-codegen-worker/.env` - Worker environment

## ✅ API Keys Configuration

### Required (Essential)
- [ ] **OpenAI API Key**
  - Source: https://platform.openai.com/api-keys
  - Used in: `celiador-orchestrator/.env` and `celiador-codegen-worker/.env`
  - Variable: `OPENAI_API_KEY`

### Optional (Enhanced Features)
- [ ] **Anthropic API Key**
  - Source: https://console.anthropic.com/
  - Used in: `celiador-orchestrator/.env`
  - Variable: `ANTHROPIC_API_KEY`

- [ ] **GitHub OAuth App**
  - Source: https://github.com/settings/applications/new
  - Used in: `celiador-orchestrator/.env`
  - Variables: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

- [ ] **Vercel API Token**
  - Source: https://vercel.com/account/tokens
  - Used in: `celiador-orchestrator/.env`
  - Variable: `VERCEL_API_TOKEN`

## ✅ Service Configuration

### Frontend (celiador-web)
- [ ] Port 3000 available
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured
- [ ] `NEXT_PUBLIC_ORCHESTRATOR_URL` set to `http://localhost:4000`

### Orchestrator API (celiador-orchestrator)
- [ ] Port 4000 available
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `REDIS_URL` set to `redis://localhost:6379`
- [ ] `OPENAI_API_KEY` configured
- [ ] `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` configured (optional)

### Preview Service (celiador-preview-service)
- [ ] Port 4001 available
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `PREVIEW_BASE_DIRECTORY` set to `/tmp/celiador-previews`

### Codegen Worker (celiador-codegen-worker)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `REDIS_URL` set to `redis://localhost:6379`
- [ ] `OPENAI_API_KEY` configured

## ✅ External Dependencies

### Redis
- [ ] Redis installed (`brew install redis` on macOS)
- [ ] Redis server running (`redis-server`)
- [ ] Redis accessible at `redis://localhost:6379`

### Supabase
- [ ] Supabase project active
- [ ] Database tables created
- [ ] RLS policies configured
- [ ] Storage buckets configured

## ✅ Validation

### Environment Validation
- [ ] Run `./env-setup/validate-env.sh`
- [ ] All required variables present
- [ ] No placeholder values remaining
- [ ] All services can connect to dependencies

### Service Health Check
- [ ] Run `./scripts/health-check.sh`
- [ ] All services responding
- [ ] Database connections working
- [ ] Redis connection working

## ✅ Development Workflow

### Starting Services
- [ ] Redis running (`redis-server`)
- [ ] All services started (`./scripts/dev-all.sh`)
- [ ] Frontend accessible at http://localhost:3000
- [ ] API accessible at http://localhost:4000
- [ ] Preview service accessible at http://localhost:4001

### Testing
- [ ] Frontend loads without errors
- [ ] API endpoints responding
- [ ] Database queries working
- [ ] File uploads working
- [ ] AI code generation working (if OpenAI key configured)

## 🚨 Troubleshooting

### Common Issues
- [ ] **Port conflicts**: Check `lsof -i :PORT` and kill conflicting processes
- [ ] **Redis connection**: Ensure Redis is running with `redis-server`
- [ ] **API key errors**: Verify keys are valid and have proper permissions
- [ ] **Database errors**: Check Supabase project status and RLS policies
- [ ] **CORS errors**: Verify `CORS_ORIGINS` includes all frontend URLs

### Logs to Check
- [ ] Frontend console errors (browser dev tools)
- [ ] Orchestrator logs (terminal output)
- [ ] Preview service logs (terminal output)
- [ ] Worker logs (terminal output)
- [ ] Redis logs (`redis-cli monitor`)

## 📋 Post-Setup Verification

### Basic Functionality
- [ ] User can sign up/login
- [ ] Projects can be created
- [ ] Files can be uploaded
- [ ] Code generation works (if OpenAI configured)
- [ ] Preview service works
- [ ] GitHub integration works (if configured)

### Advanced Features
- [ ] Subscription management (if Stripe configured)
- [ ] Email notifications (if SMTP configured)
- [ ] Vercel deployment (if Vercel token configured)
- [ ] Analytics tracking
- [ ] File storage and retrieval

## 📞 Support Resources

- [ ] Environment setup docs: `env-setup/README.md`
- [ ] Service documentation: `CELIADOR_API_DOCUMENTATION.md`
- [ ] Deployment guide: `DEPLOYMENT_STRATEGY.md`
- [ ] Troubleshooting: Check service logs and error messages

---

**✅ Complete this checklist before starting development!**

If you encounter issues, refer to the troubleshooting section or check the service logs for specific error messages.
