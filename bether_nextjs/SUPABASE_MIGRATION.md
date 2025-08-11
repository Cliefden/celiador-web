# Supabase Migration Guide

## Overview

This guide will help you migrate from SQLite to Supabase for the Bether platform. Supabase provides:
- **PostgreSQL Database** - Scalable, production-ready database
- **Built-in Authentication** - JWT-based auth with social providers
- **Real-time Features** - Live updates and subscriptions
- **Row Level Security** - Database-level access control
- **Auto-generated APIs** - REST and GraphQL APIs

## Migration Steps

### 1. Create Supabase Project

1. **Visit** [supabase.com](https://supabase.com) and sign up/login
2. **Create New Project**:
   - Choose organization
   - Enter project name (e.g., "bether-studio")
   - Enter database password (save this!)
   - Choose region closest to you
3. **Wait for Setup** (2-3 minutes)

### 2. Get Project Credentials

1. **Go to Settings > API** in your Supabase dashboard
2. **Copy these values**:
   - Project URL (e.g., `https://your-project.supabase.co`)
   - Anon/Public Key
   - Service Role Key (keep this secret!)

### 3. Update Environment Variables

**Create/update `.env` files:**

```bash
# apps/orchestrator/.env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
REDIS_URL=redis://localhost:6379
PORT=4000

# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# workers/codegen/.env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Set Up Database Schema

1. **Generate Prisma Client**:
   ```bash
   cd apps/orchestrator
   pnpm db:generate
   ```

2. **Push Schema to Supabase**:
   ```bash
   pnpm db:push
   ```

3. **Verify Tables**:
   - Go to Supabase Dashboard > Table Editor
   - You should see: `users`, `projects`, `jobs`

### 5. Configure Row Level Security (RLS)

**Enable RLS on all tables:**

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = userId);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = userId);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = userId);

-- Jobs policies
CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT USING (auth.uid() = userId);

CREATE POLICY "Users can insert own jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = userId);

CREATE POLICY "Users can delete own jobs" ON jobs
  FOR DELETE USING (auth.uid() = userId);
```

### 6. Test the Migration

1. **Start Services**:
   ```bash
   # Terminal 1: Orchestrator
   pnpm --filter @mvp/orchestrator dev
   
   # Terminal 2: Worker
   pnpm --filter @mvp/worker-codegen dev
   
   # Terminal 3: Web App
   pnpm --filter @mvp/web dev
   ```

2. **Test Authentication**:
   - Visit `http://localhost:3000`
   - Register a new account
   - Login with credentials
   - Create a project
   - Run a job

3. **Verify Database**:
   - Check Supabase Dashboard > Table Editor
   - Verify data is being created

## Key Changes Made

### 1. Database Schema
- **Provider**: SQLite → PostgreSQL
- **JSON Fields**: Now properly supported
- **Relationships**: Foreign keys with CASCADE

### 2. Authentication
- **Custom Auth** → **Supabase Auth**
- **Simple User ID** → **JWT Tokens**
- **Local Storage** → **Secure Sessions**

### 3. API Security
- **x-user-id Header** → **Bearer Token**
- **Manual Verification** → **Automatic RLS**

### 4. Web Interface
- **Password Fields**: Added to login/register
- **Session Management**: Automatic token handling
- **Error Handling**: Better Supabase error messages

## Benefits of Supabase

### ✅ Production Ready
- **Scalable**: Handles millions of users
- **Reliable**: 99.9% uptime SLA
- **Secure**: SOC2 compliant

### ✅ Developer Experience
- **Auto-generated APIs**: REST and GraphQL
- **Real-time**: Live subscriptions
- **Dashboard**: Visual data management

### ✅ Built-in Features
- **Authentication**: Social logins, MFA
- **Storage**: File uploads
- **Edge Functions**: Serverless compute

## Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Verify DATABASE_URL format
   - Check password in connection string
   - Ensure IP is not blocked

2. **Authentication Errors**:
   - Verify environment variables
   - Check Supabase project settings
   - Clear browser storage

3. **RLS Policy Errors**:
   - Verify policies are created
   - Check user permissions
   - Test with Supabase dashboard

### Debug Commands

```bash
# Test database connection
pnpm --filter @mvp/orchestrator db:studio

# Check Prisma schema
pnpm --filter @mvp/orchestrator db:generate

# Reset database (careful!)
pnpm --filter @mvp/orchestrator db:push --force-reset
```

## Next Steps

### 🚀 Advanced Features
1. **Real-time Job Updates**: Live job status
2. **File Storage**: Project file uploads
3. **Edge Functions**: Serverless job processing
4. **Social Auth**: GitHub, Google login

### 🔧 Production Deployment
1. **Environment Variables**: Set production values
2. **Domain Configuration**: Custom domains
3. **SSL Certificates**: Automatic HTTPS
4. **Monitoring**: Performance tracking

## Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Discord Community**: [supabase.com/discord](https://supabase.com/discord)
- **GitHub Issues**: Report bugs in this repo

---

**🎉 Congratulations!** Your Bether platform is now powered by Supabase with enterprise-grade authentication and database capabilities!
