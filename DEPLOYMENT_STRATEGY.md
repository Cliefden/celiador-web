# Deployment Strategy

## Overview

This document outlines the deployment strategy for each service in the multi-repo architecture, including platform selection, CI/CD pipelines, and operational considerations.

## Platform Selection

### Service Deployment Matrix

| Service | Platform | Reasoning | Cost | Scalability |
|---------|----------|-----------|------|-------------|
| celiador-web | Vercel | Next.js optimization, global CDN, automatic deployments | Free tier available | Excellent |
| celiador-orchestrator | Railway | Easy container deployment, good for APIs, Redis integration | $5/month | Good |
| celiador-preview-service | Railway | Container support, port management, scaling | $5/month | Good |
| celiador-codegen-worker | Railway | Background worker support, Redis integration | $5/month | Good |
| bether-ios | App Store | Native iOS deployment | $99/year | N/A |

### Alternative Platforms Considered

#### Frontend (celiador-web)
- **Netlify**: Similar to Vercel, good Next.js support
- **AWS Amplify**: More complex but more control
- **Vercel**: **Chosen** - Best Next.js integration, excellent DX

#### Backend Services
- **AWS ECS**: More complex but more scalable
- **Google Cloud Run**: Good for containers, more expensive
- **DigitalOcean App Platform**: Good alternative to Railway
- **Railway**: **Chosen** - Simple, cost-effective, good for small teams

## Detailed Deployment Plans

### 1. celiador-web (Frontend)

**Platform**: Vercel
**Deployment Method**: Git-based automatic deployment

#### Configuration

**vercel.json**:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "devCommand": "npm run dev",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "NEXT_PUBLIC_API_URL": "@api-url"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

#### CI/CD Pipeline

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Run linting
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### Environment Variables

```env
# Public (exposed to client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Private (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking and performance monitoring
- **Uptime monitoring**: External service (UptimeRobot)

---

### 2. celiador-orchestrator (API Service)

**Platform**: Railway
**Deployment Method**: Container deployment

#### Configuration

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start the application
CMD ["npm", "start"]
```

**railway.json**:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### CI/CD Pipeline

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Run linting
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Deploy to Railway
        uses: railway-app/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: orchestrator
```

#### Environment Variables

```env
# Server configuration
NODE_ENV=production
PORT=4000

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Queue system
REDIS_URL=redis://your-redis-instance:6379

# AI services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# GitHub integration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# CORS
CORS_ORIGIN=https://yourdomain.com
```

#### Monitoring

- **Railway Metrics**: Built-in CPU, memory, and network monitoring
- **Health checks**: `/health` endpoint for uptime monitoring
- **Logging**: Structured logging with Winston
- **Error tracking**: Sentry integration

---

### 3. celiador-preview-service (Preview Service)

**Platform**: Railway
**Deployment Method**: Container deployment

#### Configuration

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 4001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4001/health || exit 1

# Start the application
CMD ["npm", "start"]
```

#### CI/CD Pipeline

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Run linting
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Deploy to Railway
        uses: railway-app/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: preview-service
```

#### Environment Variables

```env
# Server configuration
NODE_ENV=production
PORT=4001

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Preview configuration
PREVIEW_BASE_URL=https://preview.yourdomain.com
PREVIEW_PORT_RANGE=8000-9000
PREVIEW_TIMEOUT=3600000
```

#### Monitoring

- **Railway Metrics**: Built-in monitoring
- **Health checks**: `/health` endpoint
- **Preview instance tracking**: Monitor active previews
- **Resource usage**: CPU and memory for preview instances

---

### 4. celiador-codegen-worker (AI Worker)

**Platform**: Railway
**Deployment Method**: Container deployment

#### Configuration

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
```

#### CI/CD Pipeline

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Run linting
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Deploy to Railway
        uses: railway-app/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: codegen-worker
```

#### Environment Variables

```env
# Server configuration
NODE_ENV=production

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Queue system
REDIS_URL=redis://your-redis-instance:6379

# AI services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Worker configuration
WORKER_CONCURRENCY=1
JOB_TIMEOUT=300000
MAX_RETRIES=3
```

#### Monitoring

- **Railway Metrics**: Built-in monitoring
- **Job processing metrics**: Track job success/failure rates
- **Queue monitoring**: Monitor queue depth and processing times
- **Error tracking**: Sentry integration for job failures

---

## Infrastructure Components

### Redis (Queue System)

**Platform**: Railway Redis
**Configuration**:
```env
REDIS_URL=redis://default:password@redis.railway.internal:6379
```

**Monitoring**:
- Memory usage
- Connection count
- Queue depth
- Command latency

### Supabase (Database & Storage)

**Platform**: Supabase Cloud
**Configuration**:
- Database: PostgreSQL with RLS
- Storage: File storage for projects
- Auth: JWT-based authentication

**Monitoring**:
- Database performance
- Storage usage
- Auth metrics
- API usage

## Security Considerations

### Environment Variables

1. **Secrets Management**: Use platform-specific secret management
2. **Rotation**: Regular rotation of API keys and tokens
3. **Access Control**: Limit access to production secrets
4. **Audit**: Log access to sensitive data

### Network Security

1. **HTTPS**: All services use HTTPS
2. **CORS**: Proper CORS configuration
3. **Rate Limiting**: Implement rate limiting on APIs
4. **Firewall**: Restrict access to internal services

### Data Protection

1. **Encryption**: Data encrypted in transit and at rest
2. **Backup**: Regular database backups
3. **Retention**: Data retention policies
4. **GDPR**: Compliance with data protection regulations

## Monitoring & Alerting

### Application Monitoring

1. **Uptime**: Service availability monitoring
2. **Performance**: Response time and throughput
3. **Errors**: Error rate and exception tracking
4. **Dependencies**: External service health

### Infrastructure Monitoring

1. **Resources**: CPU, memory, disk usage
2. **Network**: Bandwidth and latency
3. **Database**: Query performance and connections
4. **Queue**: Job processing and backlog

### Alerting

1. **Critical**: Service down, high error rate
2. **Warning**: High resource usage, slow response
3. **Info**: Deployment notifications, maintenance

## Cost Optimization

### Resource Sizing

1. **Right-sizing**: Match resources to actual usage
2. **Auto-scaling**: Scale based on demand
3. **Reserved instances**: Use reserved capacity where possible
4. **Spot instances**: Use spot instances for non-critical workloads

### Monitoring Costs

1. **Usage tracking**: Monitor resource usage
2. **Cost alerts**: Set up cost alerts
3. **Optimization**: Regular cost optimization reviews
4. **Budget**: Set and monitor budgets

## Disaster Recovery

### Backup Strategy

1. **Database**: Daily automated backups
2. **Code**: Git repositories as backup
3. **Configuration**: Infrastructure as code
4. **Secrets**: Secure secret backup

### Recovery Procedures

1. **RTO**: Recovery Time Objective < 1 hour
2. **RPO**: Recovery Point Objective < 15 minutes
3. **Testing**: Regular disaster recovery testing
4. **Documentation**: Detailed recovery procedures

---

*This deployment strategy will be updated as we learn from the migration process and optimize for production workloads.*
