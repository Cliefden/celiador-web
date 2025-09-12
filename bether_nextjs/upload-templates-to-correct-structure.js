// Upload existing local templates to Supabase Storage with correct structure for codegen worker
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabaseUrl = "https://wpnucnsejqmqgtxdrwnt.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbnVjbnNlanFtcWd0eGRyd250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg4OTYwOCwiZXhwIjoyMDcwNDY1NjA4fQ.eVJn8uw5tne2VTAvHHw3OJ83AoVcC_p2vgypFK5BPZ4";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const templates = [
  'ai-chat-app',  // Just fix this one for now
  'next-saas-starter'
];

async function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.js': 'text/plain',
    '.jsx': 'text/plain',
    '.ts': 'text/plain',
    '.tsx': 'text/plain',
    '.json': 'application/json',
    '.css': 'text/css',
    '.scss': 'text/css',
    '.md': 'text/plain',
    '.html': 'text/html',
    '.txt': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.prisma': 'text/plain',
    '.sql': 'text/plain'
  };
  return contentTypes[ext] || 'text/plain';
}

async function uploadFileRecursively(localPath, storagePath, relativePath = '') {
  const stats = await fs.stat(localPath);
  
  if (stats.isDirectory()) {
    console.log(`📁 Processing directory: ${relativePath || '(root)'}`);
    
    const entries = await fs.readdir(localPath);
    for (const entry of entries) {
      // Skip hidden files and node_modules
      if (entry.startsWith('.') || entry === 'node_modules' || entry === '.next') {
        continue;
      }
      
      const entryLocalPath = path.join(localPath, entry);
      const entryRelativePath = relativePath ? `${relativePath}/${entry}` : entry;
      await uploadFileRecursively(entryLocalPath, storagePath, entryRelativePath);
    }
  } else {
    // Upload file
    const fileContent = await fs.readFile(localPath);
    const storageFilePath = relativePath ? `${storagePath}/${relativePath}` : storagePath;
    const contentType = await getContentType(localPath);
    
    console.log(`📄 Uploading: ${relativePath} (${fileContent.length} bytes, ${contentType})`);
    
    const { data, error } = await supabase.storage
      .from('project-templates')
      .upload(storageFilePath, fileContent, {
        contentType,
        upsert: true
      });
    
    if (error) {
      console.error(`❌ Failed to upload ${relativePath}:`, error);
    } else {
      console.log(`✅ Uploaded: ${relativePath}`);
    }
  }
}

async function uploadTemplates() {
  console.log('🚀 Uploading templates to correct structure in Supabase Storage...\n');
  
  const templatesDir = 'packages/templates';
  
  for (const template of templates) {
    console.log(`\n📦 Uploading template: ${template} to root level`);
    const localTemplatePath = path.join(templatesDir, template);
    const storageTemplatePath = template; // Store at root level
    
    try {
      // Check if local template exists
      await fs.access(localTemplatePath);
      
      // Upload all files in this template to root level
      await uploadFileRecursively(localTemplatePath, storageTemplatePath);
      
      console.log(`✅ Template ${template} uploaded successfully to root level`);
    } catch (error) {
      console.error(`❌ Failed to upload template ${template}:`, error);
    }
  }
  
  console.log('\n🎉 Template upload with correct structure completed!');
}

uploadTemplates();