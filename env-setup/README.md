# 🔧 Celiador Environment Setup

This directory contains tools and templates for setting up your Celiador development environment.

## 📁 Files Overview

- `master.env.example` - Master environment configuration template
- `setup-env.sh` - Automated environment setup script
- `validate-env.sh` - Environment validation script
- `web.env.template` - Frontend environment template
- `orchestrator.env.template` - Orchestrator API environment template
- `preview.env.template` - Preview service environment template
- `worker.env.template` - Codegen worker environment template

## 🚀 Quick Setup

### 1. Run the Setup Script

```bash
cd env-setup
chmod +x setup-env.sh
./setup-env.sh
```

This will:
- Create environment files for all services
- Copy templates to the appropriate locations
- Backup existing files if they exist

### 2. Update API Keys

Edit the following files and replace placeholder values:

- `celiador-web/.env.local`
- `celiador-orchestrator/.env`
- `celiador-preview-service/.env`
- `celiador-codegen-worker/.env`

### 3. Validate Configuration

```bash
chmod +x validate-env.sh
./validate-env.sh
```

## 🔑 Required API Keys

### Essential (Required for basic functionality)

1. **OpenAI API Key**
   - Get from: https://platform.openai.com/api-keys
   - Used for: Code generation in the worker
   - Set in: `OPENAI_API_KEY`

2. **Supabase Configuration**
   - Already configured in templates
   - URL and keys are provided

### Optional (For enhanced functionality)

3. **Anthropic API Key**
   - Get from: https://console.anthropic.com/
   - Used for: Claude integration
   - Set in: `ANTHROPIC_API_KEY`

4. **GitHub OAuth App**
   - Create at: https://github.com/settings/applications/new
   - Used for: GitHub integration
   - Set in: `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

5. **Vercel API Token**
   - Get from: https://vercel.com/account/tokens
   - Used for: Deployment integration
   - Set in: `VERCEL_API_TOKEN`

## 🛠️ Service-Specific Configuration

### Frontend (celiador-web)
- **Port**: 3000
- **Environment**: `.env.local`
- **Key Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_ORCHESTRATOR_URL`

### Orchestrator API (celiador-orchestrator)
- **Port**: 4000
- **Environment**: `.env`
- **Key Variables**:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `REDIS_URL`
  - `OPENAI_API_KEY`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`

### Preview Service (celiador-preview-service)
- **Port**: 4001
- **Environment**: `.env`
- **Key Variables**:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `PREVIEW_BASE_DIRECTORY`

### Codegen Worker (celiador-codegen-worker)
- **Environment**: `.env`
- **Key Variables**:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `REDIS_URL`
  - `OPENAI_API_KEY`

## 🔍 Environment Validation

The validation script checks for:
- ✅ Required environment variables are present
- ✅ No placeholder values remain
- ✅ External dependencies (Redis, Node.js)
- ✅ Service connectivity

## 🚨 Troubleshooting

### Common Issues

1. **Redis Connection Error**
   ```bash
   # Install Redis
   brew install redis
   
   # Start Redis
   redis-server
   ```

2. **Missing Environment Variables**
   ```bash
   # Run validation
   ./validate-env.sh
   
   # Update missing variables
   nano ../celiador-orchestrator/.env
   ```

3. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :4000
   
   # Kill the process
   kill -9 <PID>
   ```

4. **Supabase Connection Issues**
   - Verify your Supabase URL and keys
   - Check if your Supabase project is active
   - Ensure RLS policies are configured

### Development Workflow

1. **Start Redis** (if not running)
   ```bash
   redis-server
   ```

2. **Start All Services**
   ```bash
   ./scripts/dev-all.sh
   ```

3. **Check Service Health**
   ```bash
   ./scripts/health-check.sh
   ```

## 📝 Environment File Structure

```
bether/
├── celiador-web/
│   └── .env.local          # Frontend environment
├── celiador-orchestrator/
│   └── .env                # API environment
├── celiador-preview-service/
│   └── .env                # Preview service environment
├── celiador-codegen-worker/
│   └── .env                # Worker environment
└── env-setup/              # This directory
    ├── setup-env.sh        # Setup script
    ├── validate-env.sh     # Validation script
    └── *.env.template      # Service templates
```

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use different API keys for development and production
- Rotate API keys regularly
- Use environment-specific Supabase projects when possible

## 📞 Support

If you encounter issues:
1. Run the validation script
2. Check the service logs
3. Verify all dependencies are installed
4. Ensure all API keys are valid and have proper permissions
