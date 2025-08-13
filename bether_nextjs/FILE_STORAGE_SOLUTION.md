# File Storage Solution for Generated Applications

## 🚨 Current Problem

Generated app files are stored locally in `projects/{project-id}/` which means:
- ❌ Files are lost on server restart
- ❌ Files are lost on deployment
- ❌ No persistence between sessions
- ❌ No backup or recovery
- ❌ No version control

## 💡 Recommended Solution: Supabase Storage

### **Why Supabase Storage?**

1. **Persistent**: Files survive server restarts and deployments
2. **Scalable**: Handles large files and many projects
3. **Secure**: Row Level Security (RLS) for user access control
4. **Integrated**: Already using Supabase for database and auth
5. **Versioned**: Built-in file versioning
6. **CDN**: Global content delivery network

### **Implementation Plan**

#### **1. Supabase Storage Setup**

```sql
-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-files', 'project-files', false);

-- RLS policies for project files
CREATE POLICY "Users can view their own project files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own project files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own project files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own project files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### **2. File Storage Service**

```typescript
// packages/shared/src/storage.ts
import { createClient } from '@supabase/supabase-js';

export class FileStorageService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async uploadProjectFiles(projectId: string, userId: string, files: FileData[]) {
    const results = [];
    
    for (const file of files) {
      const filePath = `${userId}/${projectId}/${file.path}`;
      
      const { data, error } = await this.supabase.storage
        .from('project-files')
        .upload(filePath, file.content, {
          contentType: file.contentType,
          upsert: true
        });
        
      if (error) throw error;
      results.push({ path: file.path, url: data.path });
    }
    
    return results;
  }

  async downloadProjectFiles(projectId: string, userId: string) {
    const { data, error } = await this.supabase.storage
      .from('project-files')
      .list(`${userId}/${projectId}`);
      
    if (error) throw error;
    
    const files = [];
    for (const file of data) {
      const { data: fileData } = await this.supabase.storage
        .from('project-files')
        .download(`${userId}/${projectId}/${file.name}`);
        
      files.push({
        path: file.name,
        content: await fileData.text()
      });
    }
    
    return files;
  }

  async deleteProjectFiles(projectId: string, userId: string) {
    const { error } = await this.supabase.storage
      .from('project-files')
      .remove([`${userId}/${projectId}`]);
      
    if (error) throw error;
  }
}
```

#### **3. Updated Worker Implementation**

```typescript
// workers/codegen/src/index.ts
import { FileStorageService } from '@mvp/shared';

async function handleScaffoldJob(jobData: JobData, result: JobResult) {
  const storageService = new FileStorageService();
  
  // Create temporary local directory
  const tempDir = `/tmp/project-${jobData.projectId}`;
  await tools.runCmd('mkdir', ['-p', tempDir]);
  
  try {
    // Copy template to temp directory
    const templateDir = `../../packages/templates/${jobData.templateKey}`;
    await tools.runCmd('cp', ['-r', templateDir, tempDir]);
    
    // Initialize git repository
    await tools.runCmd('git', ['init'], { cwd: tempDir });
    await tools.createBranch('main', undefined, { cwd: tempDir });
    
    // Customize with LLM if prompt provided
    if (jobData.prompt) {
      // ... LLM customization logic
    }
    
    // Upload files to Supabase Storage
    const files = await tools.listFiles(tempDir);
    const fileData = [];
    
    for (const file of files) {
      const content = await tools.readFile(`${tempDir}/${file}`);
      fileData.push({
        path: file,
        content: content,
        contentType: 'text/plain'
      });
    }
    
    await storageService.uploadProjectFiles(
      jobData.projectId, 
      jobData.userId, 
      fileData
    );
    
    // Clean up temp directory
    await tools.runCmd('rm', ['-rf', tempDir]);
    
    result.output = `Project scaffolded and uploaded to cloud storage`;
    result.metadata = { 
      filesUploaded: fileData.length,
      storageLocation: `supabase://project-files/${jobData.userId}/${jobData.projectId}`
    };
    
  } catch (error) {
    // Clean up temp directory on error
    await tools.runCmd('rm', ['-rf', tempDir]);
    throw error;
  }
}
```

#### **4. API Endpoints for File Access**

```typescript
// apps/orchestrator/src/index.ts

// Download project files
app.get('/projects/:id/files', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.user as any;
  
  try {
    const storageService = new FileStorageService();
    const files = await storageService.downloadProjectFiles(id, user.id);
    
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download project files' });
  }
});

// Get file tree structure
app.get('/projects/:id/files/tree', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.user as any;
  
  try {
    const storageService = new FileStorageService();
    const fileTree = await storageService.getProjectFileTree(id, user.id);
    
    res.json({ tree: fileTree });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get file tree' });
  }
});
```

### **Alternative Solutions**

#### **Option 2: GitHub Integration**
- Store generated code in GitHub repositories
- Use GitHub API for file operations
- Pros: Version control, collaboration, familiar
- Cons: More complex, rate limits, public by default

#### **Option 3: AWS S3 / Cloud Storage**
- Use AWS S3, Google Cloud Storage, or Azure Blob Storage
- Pros: Highly scalable, reliable, cost-effective
- Cons: Additional service dependency, more complex setup

#### **Option 4: Database Storage (for small files)**
- Store files as BLOB in PostgreSQL
- Pros: Simple, transactional
- Cons: Not suitable for large files, performance issues

## 🎯 Recommendation

**Use Supabase Storage** because:
1. ✅ Already integrated with your stack
2. ✅ Built-in security and access control
3. ✅ Simple implementation
4. ✅ Cost-effective for this use case
5. ✅ Handles file versioning automatically

## 📋 Implementation Steps

1. **Set up Supabase Storage bucket**
2. **Create FileStorageService**
3. **Update worker to use cloud storage**
4. **Add API endpoints for file access**
5. **Update frontend to display files from cloud**
6. **Add file download/export functionality**

Would you like me to implement this Supabase Storage solution?
