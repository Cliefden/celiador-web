# Orchestrator API Documentation

## Project Creation

**Endpoint:** `POST /projects`

**Authentication:** Bearer token required

**Request Body:**
```json
{
  "name": "project-name",
  "templateKey": "next-prisma-supabase",
  "repo": {
    "provider": "github",
    "owner": "username",
    "name": "repo-name"
  }
}
```

**Orchestrator Processing:**
1. Extracts `name`, `templateKey`, `repo` from request body
2. Gets `user.id` from authentication token
3. Calls `db.createProject()` with:
   ```javascript
   {
     name,
     templateKey,
     repoProvider: repo.provider,
     repoOwner: repo.owner,
     repoName: repo.name,
     userId: user.id
   }
   ```

**Database Insert:**
The `createProject` function should insert:
```javascript
{
  name: data.name,
  templatekey: data.templateKey,
  repoprovider: data.repoProvider,
  repoowner: data.repoOwner,
  reponame: data.repoName,
  userid: data.userId,
  creator: data.userId,  // ← This should be set
  updater: data.userId,  // ← This should be set
  status: 'READY'
}
```

## The Problem

The `creator` field is not being set during project creation, but `updater` works during updates. This suggests:

1. **Triggers are not working** - They should automatically set `creator` on INSERT
2. **Manual setting is not working** - The orchestrator should manually set `creator: data.userId`

## Solution: Fix the Triggers

The triggers should automatically set audit fields when using service role key.
