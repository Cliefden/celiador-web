#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Supabase configuration
const supabaseUrl = 'https://chlxwnkmlgxviwrzrgww.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function uploadTemplate() {
  const templateName = 'ai-chat-app';
  const templateDir = __dirname;
  
  console.log(`📦 Uploading template: ${templateName}`);
  console.log(`📁 Template directory: ${templateDir}`);

  try {
    // Create a temporary zip file of the template
    const zipPath = path.join('/tmp', `${templateName}.zip`);
    
    // Create zip excluding node_modules and other build artifacts
    console.log('🗜️  Creating template archive...');
    execSync(`cd "${templateDir}" && zip -r "${zipPath}" . -x "node_modules/*" ".next/*" "*.log" ".git/*" "*.zip" "upload-template.js"`, { 
      stdio: 'inherit' 
    });
    
    // Read the zip file
    const zipBuffer = fs.readFileSync(zipPath);
    
    // Upload to Supabase Storage
    console.log('☁️  Uploading to Supabase Storage...');
    const { data, error } = await supabase.storage
      .from('templates')
      .upload(`${templateName}.zip`, zipBuffer, {
        contentType: 'application/zip',
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Template uploaded successfully!');
    console.log(`📍 Storage path: ${data.path}`);
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('templates')
      .getPublicUrl(`${templateName}.zip`);
    
    console.log(`🌐 Public URL: ${urlData.publicUrl}`);
    
    // Update the template metadata in the database
    console.log('📝 Updating template metadata...');
    
    const templateMetadata = {
      name: templateName,
      title: 'AI Chat Assistant',
      description: 'Modern AI chat application with OpenAI integration, typing indicators, and beautiful gradient UI. Works with or without API key.',
      category: 'AI/Chat',
      tags: ['ai', 'chat', 'openai', 'nextjs', 'typescript', 'tailwind'],
      preview_image: null,
      file_url: urlData.publicUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      framework: 'Next.js',
      language: 'TypeScript',
      dependencies: {
        'next': '^15.5.2',
        'react': '^18.0.0',
        'typescript': '^5.0.0',
        'tailwindcss': '^3.0.0',
        'openai': '^4.0.0',
        'lucide-react': '^0.400.0',
        'clsx': '^2.0.0'
      },
      features: [
        'Real-time AI conversations',
        'Beautiful modern interface', 
        'Typing indicators & animations',
        'Works with or without API key',
        'OpenAI GPT integration',
        'Responsive design',
        'Gradient backgrounds',
        'Message history',
        'Copy message functionality'
      ]
    };
    
    const { data: dbData, error: dbError } = await supabase
      .from('templates')
      .upsert(templateMetadata, { onConflict: 'name' });
    
    if (dbError) {
      console.warn('⚠️  Failed to update database metadata:', dbError.message);
    } else {
      console.log('✅ Template metadata updated successfully!');
    }
    
    // Clean up temporary file
    fs.unlinkSync(zipPath);
    console.log('🧹 Cleaned up temporary files');
    
    console.log('\n🎉 Template upload completed!');
    console.log(`🔗 Try it out at: http://localhost:3001/templates/${templateName}/preview`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

// Run the upload
uploadTemplate();