# Deployment Guide for celiador.ai

## Architecture Overview
- **Frontend**: Vercel (celiador.ai)
- **Backend**: Railway/Render (api.celiador.ai)
- **Database**: Supabase (existing)
- **Redis**: Railway Redis addon

## 1. Frontend Deployment (Vercel)

### Deploy Web App
```bash
cd /Users/scw/Private/Programming/bether/bether_nextjs

# Deploy to Vercel
vercel --prod

# Add custom domain
vercel domains add celiador.ai
vercel domains add www.celiador.ai
```

### Environment Variables (Vercel Dashboard)
```
NEXT_PUBLIC_SUPABASE_URL=https://wpnucnsejqmqgtxdrwnt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_ORCHESTRATOR_URL=https://api.celiador.ai
```

### DNS Configuration for celiador.ai
- **A Record**: `@` → Vercel IP (auto-configured)
- **CNAME**: `www` → `cname.vercel-dns.com`

## 2. Backend Deployment (Railway)

### Create Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway new -n celiador-backend
```

### Deploy Orchestrator + Worker
```bash
# Add Railway remote
railway link

# Deploy with Redis addon
railway add redis

# Deploy orchestrator
railway deploy --dockerfile Dockerfile.orchestrator

# Deploy worker (separate service)
railway deploy --dockerfile Dockerfile.worker
```

### Environment Variables (Railway)
```
NODE_ENV=production
REDIS_URL=${{Redis.REDIS_URL}}
SUPABASE_URL=https://wpnucnsejqmqgtxdrwnt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Custom Domain for API
- Add `api.celiador.ai` to Railway project
- Configure CNAME: `api` → `your-app.railway.app`

## 3. Alternative: Docker Compose Deployment

### For VPS/Cloud Instance
```bash
# 1. Copy files to server
scp -r . user@your-server:/opt/celiador/

# 2. Create .env file on server
cat > .env << EOF
SUPABASE_URL=https://wpnucnsejqmqgtxdrwnt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
EOF

# 3. Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Nginx Reverse Proxy
```nginx
# /etc/nginx/sites-available/celiador
server {
    listen 80;
    server_name api.celiador.ai;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 4. Recommended Production Setup

### Option A: Railway (Recommended)
- ✅ Built-in Redis
- ✅ Auto-scaling
- ✅ Easy environment management
- ✅ Custom domains included

### Option B: Render
- ✅ Separate Redis service
- ✅ Background worker support
- ✅ Auto-deploy from Git

### Costs Comparison
- **Railway**: ~$20/month (Redis + 2 services)
- **Render**: ~$25/month (Redis + 2 services)
- **VPS**: ~$10-40/month (depending on size)

## 5. DNS Configuration Summary

```
celiador.ai       A/CNAME  → Vercel
www.celiador.ai   CNAME    → Vercel  
api.celiador.ai   CNAME    → Railway/Render
```

## 6. Deployment Commands

```bash
# Frontend (Vercel)
vercel --prod

# Backend (Railway)
railway deploy

# Or Docker (VPS)
docker-compose -f docker-compose.prod.yml up -d
```

Would you like me to proceed with Railway deployment setup?