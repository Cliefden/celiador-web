// Fix template storage structure for codegen worker compatibility
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabaseUrl = "https://wpnucnsejqmqgtxdrwnt.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbnVjbnNlanFtcWd0eGRyd250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg4OTYwOCwiZXhwIjoyMDcwNDY1NjA4fQ.eVJn8uw5tne2VTAvHHw3OJ83AoVcC_p2vgypFK5BPZ4";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const templates = [
  'next-saas-starter',
  'ecommerce-storefront', 
  'ai-chat-app',
  'dashboard-analytics',
  'next-prisma-supabase'
];

async function copyTemplateFiles(fromPath, toPath) {
  console.log(`📁 Copying from ${fromPath} to ${toPath}`);
  
  // First, list all files recursively from the source
  async function getAllFiles(basePath = '') {
    const fullFromPath = basePath ? `${fromPath}/${basePath}` : fromPath;
    
    const { data, error } = await supabase.storage
      .from('project-templates')
      .list(fullFromPath, { limit: 1000 });
    
    if (error) {
      console.error(`Error listing ${fullFromPath}:`, error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    let allFiles = [];
    
    for (const item of data) {
      const itemPath = basePath ? `${basePath}/${item.name}` : item.name;
      const itemFullPath = `${fullFromPath}/${item.name}`;
      
      if (item.metadata && item.metadata.size === undefined) {
        // It's a directory, recurse
        const subFiles = await getAllFiles(itemPath);
        allFiles = allFiles.concat(subFiles);
      } else {
        // It's a file
        allFiles.push({
          name: item.name,
          path: itemPath,
          fullPath: itemFullPath,
          size: item.metadata?.size || 0
        });
      }
    }
    
    return allFiles;
  }
  
  const files = await getAllFiles();
  console.log(`Found ${files.length} files to copy`);
  
  // Download and re-upload each file
  for (const file of files) {
    console.log(`📄 Copying: ${file.path} (${file.size} bytes)`);
    
    // Download from source
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('project-templates')
      .download(file.fullPath);
    
    if (downloadError) {
      console.error(`❌ Failed to download ${file.path}:`, downloadError);
      continue;
    }
    
    // Upload to destination
    const destPath = `${toPath}/${file.path}`;
    const { error: uploadError } = await supabase.storage
      .from('project-templates')
      .upload(destPath, fileData, {
        contentType: getContentType(file.path),
        upsert: true
      });
    
    if (uploadError) {
      console.error(`❌ Failed to upload ${destPath}:`, uploadError);
    } else {
      console.log(`✅ Copied: ${file.path}`);
    }
  }
}

function getContentType(filePath) {
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

async function fixTemplateStructure() {
  console.log('🔧 Fixing template storage structure...\n');
  
  for (const template of templates) {
    console.log(`\n📦 Processing template: ${template}`);
    const oldPath = `packages/templates/${template}`;
    const newPath = template;
    
    try {
      // Check if old structure exists
      const { data: oldExists } = await supabase.storage
        .from('project-templates')
        .list(oldPath, { limit: 1 });
      
      if (oldExists && oldExists.length > 0) {
        console.log(`✅ Found template at ${oldPath}, copying to ${newPath}`);
        await copyTemplateFiles(oldPath, newPath);
      } else {
        console.log(`⚠️  Template ${template} not found at ${oldPath}, skipping`);
      }
    } catch (error) {
      console.error(`❌ Failed to process template ${template}:`, error);
    }
  }
  
  console.log('\n🎉 Template structure fix completed!');
}

fixTemplateStructure();