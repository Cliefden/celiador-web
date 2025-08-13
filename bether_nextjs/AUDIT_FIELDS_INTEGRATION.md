# Audit Fields Integration

This document describes the integration of comprehensive audit fields across the Bether platform's Swift models, Next.js backend, and Supabase database.

## Overview

We've added comprehensive audit fields to both `Project` and `Job` models to provide full tracking of who created, updated, and deleted records, along with soft delete capabilities.

## Audit Fields Added

### Common Audit Fields (Both Project and Job)
- `creator`: UUID of the user who created the record
- `updater`: UUID of the user who last updated the record  
- `deleter`: UUID of the user who deleted the record (soft delete)
- `deletedAt`: Timestamp when the record was soft deleted
- `createdAt`: Timestamp when the record was created
- `updatedAt`: Timestamp when the record was last updated

## Implementation Details

### 1. Swift Models (`bether_swift/Bether/Shared/Models/`)

**Project.swift:**
```swift
var id: reference?
var createdAt: Date?
var creator: profileID?
var updater: profileID?
var updatedAt: Date?
var deleter: profileID?
var deletedAt: Date?
// ... other fields
```

**Job.swift:**
```swift
var id: reference?
var createdAt: Date?
var creator: profileID?
var updater: profileID?
var updatedAt: Date?
var deleter: profileID?
var deletedAt: Date?
// ... other fields
```

### 2. Supabase Database Schema

**Updated `supabase-setup.sql`:**
- Added audit fields to both `projects` and `jobs` tables
- Added `userId` field to `jobs` table (was missing)
- Updated RLS policies to include audit field checks
- Added automatic triggers for setting `creator` and `updater`
- Added indexes for performance on audit fields

**Key Features:**
- **Automatic Audit**: Triggers automatically set `creator` on insert and `updater` on update
- **Soft Delete**: Records are marked as deleted with `deletedAt` timestamp
- **RLS Integration**: Policies check audit fields for access control
- **Performance**: Indexes on audit fields for efficient queries

### 3. Prisma Schemas

**Updated both `apps/orchestrator/prisma/schema.prisma` and `workers/codegen/prisma/schema.prisma`:**
```prisma
model Project {
  // ... existing fields
  
  // Audit fields
  creator   String?
  updater   String?
  deleter   String?
  deletedAt DateTime?
  
  // ... relations
}

model Job {
  // ... existing fields
  
  // Audit fields
  creator   String?
  updater   String?
  deleter   String?
  deletedAt DateTime?
  
  // ... relations
}
```

### 4. Next.js Backend Updates

**Updated `apps/orchestrator/src/index.ts`:**
- Modified `createJob` to include `userId` field
- Database operations now work with audit fields
- Supabase client handles audit field population automatically

## Migration Process

### For New Installations
1. Run the updated `supabase-setup.sql` script
2. Generate Prisma client: `pnpm db:generate`
3. Push schema: `pnpm db:push`

### For Existing Installations
1. Run the `supabase-audit-migration.sql` script
2. Update Prisma schemas
3. Generate and push Prisma client
4. Restart services

## Benefits

### 1. **Complete Audit Trail**
- Track who created each record
- Track who last modified each record
- Track who deleted each record (soft delete)

### 2. **Enhanced Security**
- RLS policies check audit fields
- Users can only access records they created/updated
- Service role bypasses audit checks for system operations

### 3. **Soft Delete Support**
- Records are marked as deleted rather than physically removed
- Maintains referential integrity
- Allows for data recovery if needed

### 4. **Performance Optimized**
- Indexes on audit fields for efficient queries
- Automatic triggers handle audit field updates
- No manual audit field management required

### 5. **Cross-Platform Consistency**
- Swift models match database schema
- Next.js backend handles audit fields automatically
- Supabase provides automatic audit field population

## Usage Examples

### Swift - Creating a Project
```swift
let project = Project(
    name: "My Project",
    templateKey: "next-prisma-supabase",
    userId: user.id
)
// creator, createdAt automatically set by Supabase
```

### Swift - Updating a Project
```swift
project.name = "Updated Project Name"
// updater, updatedAt automatically set by Supabase
```

### Swift - Soft Delete
```swift
// Set deleter and deletedAt for soft delete
project.deleter = currentUser.id
project.deletedAt = Date()
```

### Next.js - Creating a Job
```javascript
const job = await db.createJob({
  projectId: project.id,
  userId: user.id,  // Now required
  type: 'SCAFFOLD',
  prompt: 'Create a todo app'
});
// creator, createdAt automatically set
```

## RLS Policy Examples

### Projects - View Policy
```sql
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (
    (auth.uid() = userId OR auth.uid() = creator OR auth.uid() = updater) 
    AND deletedAt IS NULL 
    OR auth.role() = 'service_role'
  );
```

### Jobs - Update Policy
```sql
CREATE POLICY "Users can update jobs for their projects" ON jobs
  FOR UPDATE USING (
    (
      EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = jobs.projectId 
        AND projects.userId = auth.uid()
      )
      OR auth.uid() = jobs.userId 
      OR auth.uid() = jobs.creator
    )
    AND jobs.deletedAt IS NULL 
    OR auth.role() = 'service_role'
  );
```

## Future Enhancements

1. **Audit Logging**: Create separate audit log table for detailed change tracking
2. **Bulk Operations**: Add support for bulk soft delete operations
3. **Audit Reports**: Create views for audit reporting and compliance
4. **Data Retention**: Implement automatic hard delete after retention period
5. **Audit Field Validation**: Add validation rules for audit field consistency

## Troubleshooting

### Common Issues

1. **Missing userId in Jobs**: Ensure `userId` is passed when creating jobs
2. **RLS Policy Errors**: Check that audit fields are properly set in policies
3. **Trigger Errors**: Verify trigger functions exist and are properly configured
4. **Migration Issues**: Run migration script in correct order

### Verification Commands

```sql
-- Check if audit fields exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('creator', 'updater', 'deleter', 'deletedAt');

-- Check triggers
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'projects';

-- Test audit field population
INSERT INTO projects (name, userid) VALUES ('Test Project', auth.uid());
SELECT creator, updater, createdat, updatedat FROM projects WHERE name = 'Test Project';
```

The audit fields integration provides a robust foundation for data governance, security, and compliance across the Bether platform! 🎉
