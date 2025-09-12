#!/usr/bin/env node

/**
 * Upload Template Script
 * 
 * Uploads a template from the templates/ directory to Supabase Storage
 * and registers it in the templates database table.
 * 
 * Usage: node scripts/upload-template.js <template-name>
 * Example: node scripts/upload-template.js ai-chat-app
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Template metadata configuration
const TEMPLATE_CONFIGS = {
  'ai-chat-app': {
    name: 'AI Chat Assistant',
    description: 'A modern, beautiful AI chat application with real-time messaging, typing indicators, and premium UI components',
    difficulty: 'beginner',
    emoji: '🤖',
    color_primary: '#667eea',
    color_secondary: '#764ba2',
    rating: 4.8,
    sort_order: 1,
    category: 'AI & Machine Learning',
    tags: ['ai', 'chat', 'messaging', 'typescript', 'tailwind'],
    features: [
      'Real-time messaging',
      'Typing indicators', 
      'Message reactions',
      'Auto-scrolling',
      'Responsive design',
      'Modern UI'
    ]
  },
  'next-prisma-supabase': {
    name: 'Full-Stack SaaS Starter',
    description: 'Complete full-stack application with Next.js, Prisma, Supabase, and authentication',
    difficulty: 'intermediate',
    emoji: '🚀',
    color_primary: '#4ade80',
    color_secondary: '#22c55e',
    rating: 4.9,
    sort_order: 2,
    category: 'Full-Stack',
    tags: ['nextjs', 'prisma', 'supabase', 'auth', 'database', 'saas'],
    features: [
      'User authentication',
      'Database integration',
      'API routes',
      'Server components',
      'Type safety',
      'Production ready'
    ]
  }
};

async function shouldSkipFile(filePath, basePath) {
  const relativePath = path.relative(basePath, filePath);
  
  const skipPatterns = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '.cache',
    'coverage',
    '.nyc_output',
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '.env.local',
    '.env.*.local',
    'package-lock.json',  // Skip lock files for templates
    'yarn.lock'
  ];

  return skipPatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(relativePath);
    }
    return relativePath.includes(pattern);
  });
}

async function readDirectoryRecursive(dirPath, basePath, files = []) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (await shouldSkipFile(fullPath, basePath)) {
      continue;
    }
    
    if (entry.isDirectory()) {
      await readDirectoryRecursive(fullPath, basePath, files);
    } else if (entry.isFile()) {
      const relativePath = path.relative(basePath, fullPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      files.push({
        path: relativePath,
        content,
        contentType: getContentType(relativePath)
      });
    }
  }
  
  return files;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  const mimeTypes = {
    '.js': 'text/javascript',
    '.ts': 'text/typescript', 
    '.jsx': 'text/javascript',
    '.tsx': 'text/typescript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
  };
  
  return mimeTypes[ext] || 'text/plain';
}

async function uploadTemplate(templateName) {
  console.log(`🚀 Starting upload for template: ${templateName}`);
  
  // Validate template exists
  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  
  try {
    await fs.access(templatePath);
  } catch {
    console.error(`❌ Error: Template '${templateName}' not found in templates/ directory`);
    process.exit(1);
  }
  
  // Get template configuration
  const config = TEMPLATE_CONFIGS[templateName];
  if (!config) {
    console.error(`❌ Error: No configuration found for template '${templateName}'`);
    console.error('Please add template configuration to TEMPLATE_CONFIGS in this script');
    process.exit(1);
  }
  
  try {
    // 1. Read all template files
    console.log('📁 Reading template files...');
    const files = await readDirectoryRecursive(templatePath, templatePath);
    console.log(`📄 Found ${files.length} files to upload`);
    
    // 2. Upload files to Supabase Storage
    console.log('☁️ Uploading files to Supabase Storage...');
    let uploadedCount = 0;
    const errors = [];
    
    for (const file of files) {
      try {
        const storagePath = `${templateName}/${file.path}`;
        
        // Upload to storage
        const { error } = await supabase.storage
          .from('templates')
          .upload(storagePath, file.content, {
            contentType: file.contentType,
            upsert: true // Overwrite if exists
          });
        
        if (error) {
          errors.push(`Failed to upload ${file.path}: ${error.message}`);
        } else {
          uploadedCount++;
          process.stdout.write(`\\r✅ Uploaded ${uploadedCount}/${files.length} files`);
        }
      } catch (err) {
        errors.push(`Failed to upload ${file.path}: ${err.message}`);
      }
    }
    
    console.log(`\\n📤 Successfully uploaded ${uploadedCount}/${files.length} files`);
    
    if (errors.length > 0) {
      console.log('⚠️  Upload errors:');
      errors.forEach(error => console.log(`   ${error}`));
    }
    
    // 3. Register/update template in database
    console.log('💾 Updating template database record...');
    
    const templateData = {
      template_key: templateName,
      name: config.name,
      description: config.description,
      difficulty: config.difficulty,
      emoji: config.emoji,
      color_primary: config.color_primary,
      color_secondary: config.color_secondary,
      rating: config.rating,
      sort_order: config.sort_order,
      is_active: true,
      metadata: {
        category: config.category,
        tags: config.tags,
        features: config.features,
        files_count: files.length,
        last_updated: new Date().toISOString()
      }
    };
    
    // Upsert template record
    const { error: dbError } = await supabase
      .from('templates')
      .upsert(templateData, {
        onConflict: 'template_key'
      });
    
    if (dbError) {
      console.error(`❌ Database error: ${dbError.message}`);
      process.exit(1);
    }
    
    console.log('✅ Template database record updated successfully');
    
    // 4. Summary
    console.log('\\n🎉 Upload completed successfully!');
    console.log(`Template: ${config.name}`);
    console.log(`Files: ${uploadedCount} uploaded`);
    console.log(`Storage: supabase/templates/${templateName}/`);
    console.log(`Database: templates table updated`);
    
    if (errors.length === 0) {
      console.log('\\n🚀 Template is ready to use in Celiador!');
    } else {
      console.log(`\\n⚠️  Completed with ${errors.length} errors - check template functionality`);
    }
    
  } catch (error) {
    console.error(`❌ Upload failed: ${error.message}`);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const templateName = process.argv[2];
  
  if (!templateName) {
    console.log('Upload Template to Supabase Storage');
    console.log('');
    console.log('Usage: node scripts/upload-template.js <template-name>');
    console.log('');
    console.log('Available templates:');
    Object.keys(TEMPLATE_CONFIGS).forEach(key => {
      console.log(`  ${key} - ${TEMPLATE_CONFIGS[key].name}`);
    });
    process.exit(1);
  }
  
  await uploadTemplate(templateName);
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

main();