# Rollback Strategy

## Overview

This document outlines comprehensive rollback strategies for the multi-repo migration, including service-level rollbacks, full system rollback, and risk mitigation procedures.

## Rollback Scenarios

### 1. Service-Level Rollback

**When to Use**: Individual service issues that don't affect the entire system

#### Frontend Rollback (celiador-web)

**Trigger Conditions**:
- Frontend deployment fails
- Critical UI bugs in production
- Performance degradation
- Security vulnerabilities

**Rollback Procedure**:
```bash
# 1. Immediate rollback via Vercel dashboard
# - Go to Vercel dashboard
# - Select project
# - Go to Deployments tab
# - Click "Promote to Production" on previous deployment

# 2. Or via CLI
vercel --prod --force

# 3. Verify rollback
curl -I https://yourdomain.com/health
```

**Verification Steps**:
- [ ] Frontend loads correctly
- [ ] Authentication works
- [ ] API calls succeed
- [ ] No console errors

**Time to Rollback**: < 2 minutes

---

#### Orchestrator Rollback (celiador-orchestrator)

**Trigger Conditions**:
- API endpoints failing
- Database connection issues
- High error rates
- Performance degradation

**Rollback Procedure**:
```bash
# 1. Via Railway dashboard
# - Go to Railway dashboard
# - Select orchestrator service
# - Go to Deployments tab
# - Click "Redeploy" on previous deployment

# 2. Or via CLI
railway redeploy --service orchestrator

# 3. Verify rollback
curl -f https://api.yourdomain.com/health
```

**Verification Steps**:
- [ ] Health check passes
- [ ] API endpoints respond
- [ ] Database connections work
- [ ] Queue processing resumes

**Time to Rollback**: < 5 minutes

---

#### Preview Service Rollback (celiador-preview-service)

**Trigger Conditions**:
- Preview instances failing to start
- Port allocation issues
- File serving problems
- High resource usage

**Rollback Procedure**:
```bash
# 1. Via Railway dashboard
# - Go to Railway dashboard
# - Select preview-service
# - Go to Deployments tab
# - Click "Redeploy" on previous deployment

# 2. Or via CLI
railway redeploy --service preview-service

# 3. Verify rollback
curl -f https://preview.yourdomain.com/health
```

**Verification Steps**:
- [ ] Health check passes
- [ ] New previews can be created
- [ ] Existing previews continue working
- [ ] Port allocation works

**Time to Rollback**: < 5 minutes

---

#### Codegen Worker Rollback (celiador-codegen-worker)

**Trigger Conditions**:
- Job processing failures
- AI service integration issues
- Queue processing errors
- High job failure rates

**Rollback Procedure**:
```bash
# 1. Via Railway dashboard
# - Go to Railway dashboard
# - Select codegen-worker
# - Go to Deployments tab
# - Click "Redeploy" on previous deployment

# 2. Or via CLI
railway redeploy --service codegen-worker

# 3. Verify rollback
# Check job processing in orchestrator dashboard
```

**Verification Steps**:
- [ ] Worker starts successfully
- [ ] Jobs begin processing
- [ ] AI services respond
- [ ] Queue depth decreases

**Time to Rollback**: < 5 minutes

---

### 2. Full System Rollback

**When to Use**: Critical system-wide issues that require reverting to the monorepo

**Trigger Conditions**:
- Multiple services failing simultaneously
- Data corruption or loss
- Security breach
- Critical infrastructure failure

**Rollback Procedure**:

#### Step 1: Immediate Response (0-15 minutes)
```bash
# 1. Stop all new deployments
# - Disable GitHub Actions workflows
# - Set maintenance mode on frontend

# 2. Assess the situation
# - Check service health
# - Review error logs
# - Identify root cause

# 3. Communicate with team
# - Notify stakeholders
# - Update status page
# - Begin incident response
```

#### Step 2: Service Rollback (15-30 minutes)
```bash
# 1. Rollback frontend to last known good state
vercel --prod --force

# 2. Rollback orchestrator
railway redeploy --service orchestrator

# 3. Rollback preview service
railway redeploy --service preview-service

# 4. Rollback worker
railway redeploy --service codegen-worker

# 5. Verify all services
./scripts/health-check.sh
```

#### Step 3: Database Rollback (30-45 minutes)
```bash
# 1. Check database state
psql $DATABASE_URL -c "SELECT COUNT(*) FROM projects;"

# 2. If needed, restore from backup
# - Identify last good backup
# - Restore database
# - Verify data integrity

# 3. Update service configurations
# - Point services to restored database
# - Restart services
```

#### Step 4: Full Monorepo Rollback (45-60 minutes)
```bash
# 1. Switch DNS to monorepo deployment
# - Update DNS records
# - Point to monorepo URL

# 2. Start monorepo services
cd bether_nextjs
npm run dev:all

# 3. Verify monorepo functionality
# - Test all features
# - Check data integrity
# - Monitor performance
```

**Verification Steps**:
- [ ] All services respond to health checks
- [ ] Frontend loads correctly
- [ ] API endpoints work
- [ ] Database queries succeed
- [ ] Job processing works
- [ ] Preview functionality works

**Time to Full Rollback**: < 60 minutes

---

## Risk Mitigation Strategies

### 1. Pre-Migration Preparation

#### Database Backup Strategy
```bash
# 1. Create full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Test backup restoration
createdb test_restore
psql test_restore < backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Verify backup integrity
psql test_restore -c "SELECT COUNT(*) FROM projects;"
```

#### Code Backup Strategy
```bash
# 1. Create archive branch of monorepo
git checkout -b archive/monorepo-backup
git push origin archive/monorepo-backup

# 2. Tag current state
git tag -a v1.0.0-monorepo -m "Monorepo state before migration"
git push origin v1.0.0-monorepo

# 3. Document current configuration
./scripts/export-config.sh > config_backup_$(date +%Y%m%d_%H%M%S).json
```

#### Infrastructure Backup
```bash
# 1. Export environment variables
env | grep -E "(SUPABASE|REDIS|OPENAI|ANTHROPIC|GITHUB)" > env_backup_$(date +%Y%m%d_%H%M%S).env

# 2. Document service configurations
# - Vercel project settings
# - Railway service configurations
# - DNS records
# - SSL certificates
```

### 2. During Migration Monitoring

#### Health Check Script
```bash
#!/bin/bash
# scripts/health-check.sh

echo "Checking service health..."

# Frontend health
echo "Frontend:"
curl -f https://yourdomain.com/health || echo "❌ Frontend down"

# API health
echo "API:"
curl -f https://api.yourdomain.com/health || echo "❌ API down"

# Preview service health
echo "Preview Service:"
curl -f https://preview.yourdomain.com/health || echo "❌ Preview service down"

# Database health
echo "Database:"
psql $DATABASE_URL -c "SELECT 1;" || echo "❌ Database down"

# Redis health
echo "Redis:"
redis-cli -u $REDIS_URL ping || echo "❌ Redis down"

echo "Health check complete."
```

#### Monitoring Dashboard
```bash
# scripts/monitor.sh
#!/bin/bash

while true; do
  echo "$(date): Running health check..."
  ./scripts/health-check.sh
  sleep 60
done
```

### 3. Post-Migration Validation

#### Feature Testing Checklist
- [ ] User authentication works
- [ ] Project creation works
- [ ] File editing works
- [ ] AI chat works
- [ ] Preview functionality works
- [ ] GitHub integration works
- [ ] Job processing works
- [ ] File upload/download works

#### Performance Testing
```bash
# Load test API endpoints
ab -n 1000 -c 10 https://api.yourdomain.com/health

# Test database performance
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM projects LIMIT 100;"

# Test queue processing
redis-cli -u $REDIS_URL llen codegen-jobs
```

## Communication Plan

### 1. Incident Response Team

**Primary Team**:
- **Incident Commander**: Technical lead
- **Communications Lead**: Product manager
- **Technical Lead**: Senior developer
- **Operations Lead**: DevOps engineer

**Escalation Path**:
1. **Level 1**: Development team (0-15 minutes)
2. **Level 2**: Engineering management (15-30 minutes)
3. **Level 3**: Executive team (30+ minutes)

### 2. Communication Channels

**Internal**:
- **Slack**: #incidents channel
- **Email**: incident@yourdomain.com
- **Phone**: Emergency contact list

**External**:
- **Status Page**: status.yourdomain.com
- **Twitter**: @yourdomain_status
- **Email**: users@yourdomain.com

### 3. Communication Templates

#### Incident Notification
```
🚨 INCIDENT: [Service Name] - [Brief Description]

Status: [Investigating/Identified/Monitoring/Resolved]
Impact: [High/Medium/Low]
Affected Services: [List services]
ETA: [Time estimate]

Updates will be posted every 15 minutes.
```

#### Resolution Notification
```
✅ RESOLVED: [Service Name] - [Brief Description]

Status: Resolved
Duration: [Time duration]
Root Cause: [Brief explanation]
Prevention: [Steps taken to prevent recurrence]

Thank you for your patience.
```

## Testing Rollback Procedures

### 1. Regular Testing Schedule

**Weekly**:
- Test individual service rollbacks
- Verify backup restoration
- Check monitoring systems

**Monthly**:
- Full system rollback test
- Disaster recovery drill
- Update rollback procedures

**Quarterly**:
- Review and update rollback plans
- Test with new team members
- Update documentation

### 2. Rollback Test Procedure

```bash
# 1. Schedule maintenance window
# 2. Notify users of planned maintenance
# 3. Create test environment
# 4. Simulate failure scenario
# 5. Execute rollback procedure
# 6. Verify system functionality
# 7. Document lessons learned
# 8. Update procedures if needed
```

## Documentation Maintenance

### 1. Keep Updated

**After Each Deployment**:
- Update rollback procedures
- Document new configurations
- Update contact information

**After Each Incident**:
- Document lessons learned
- Update procedures based on experience
- Share knowledge with team

### 2. Version Control

**Rollback Documentation**:
- Store in Git repository
- Version control all procedures
- Tag stable versions
- Maintain change log

**Configuration Backups**:
- Store in secure location
- Encrypt sensitive data
- Regular backup verification
- Access control management

---

*This rollback strategy will be tested and refined throughout the migration process to ensure we can quickly recover from any issues.*
