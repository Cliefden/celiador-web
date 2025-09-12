#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Supabase configuration
const supabaseUrl = 'https://wpnucnsejqmqgtxdrwnt.supabase.co';
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
  const templateKey = 'ecommerce-store';
  const templateDir = __dirname;
  
  console.log(`📦 Uploading template: ${templateKey}`);
  console.log(`📁 Template directory: ${templateDir}`);

  try {
    // Upload individual files to Supabase Storage (not as zip)
    console.log('☁️  Uploading template files to Supabase Storage...');
    
    const uploadFileRecursively = async (localDir, storagePrefix = '') => {
      const items = fs.readdirSync(localDir, { withFileTypes: true });
      
      for (const item of items) {
        // Skip files/directories we don't want to upload
        if ([
          'node_modules', '.next', '.git', 'dist', 'build', 
          '.DS_Store', '*.log', 'upload-template.js', 'tsconfig.tsbuildinfo'
        ].some(pattern => {
          if (pattern.includes('*')) {
            return item.name.includes(pattern.replace('*', ''));
          }
          return item.name === pattern;
        })) {
          continue;
        }
        
        const localPath = path.join(localDir, item.name);
        const storagePath = storagePrefix ? `${storagePrefix}/${item.name}` : item.name;
        // Replace special characters that aren't allowed in Supabase storage keys
        const sanitizedStoragePath = storagePath.replace(/[\[\]]/g, '_');
        const fullStoragePath = `${templateKey}/${sanitizedStoragePath}`;
        
        if (item.isDirectory()) {
          // Recursively upload directory contents
          await uploadFileRecursively(localPath, sanitizedStoragePath);
        } else {
          // Upload individual file
          console.log(`📁 Uploading: ${storagePath}`);
          
          const fileBuffer = fs.readFileSync(localPath);
          const { error: uploadError } = await supabase.storage
            .from('project-templates')
            .upload(fullStoragePath, fileBuffer, {
              contentType: getContentType(path.extname(item.name)),
              upsert: true
            });
          
          if (uploadError) {
            console.error(`❌ Failed to upload ${storagePath}:`, uploadError.message);
            throw uploadError;
          }
        }
      }
    };
    
    // Helper function to get content type
    const getContentType = (ext) => {
      const contentTypes = {
        '.js': 'text/javascript',
        '.jsx': 'text/javascript', 
        '.ts': 'text/typescript',
        '.tsx': 'text/typescript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.html': 'text/html',
        '.md': 'text/markdown',
        '.txt': 'text/plain',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
      };
      return contentTypes[ext] || 'text/plain';
    };
    
    await uploadFileRecursively(templateDir);
    
    console.log('✅ All template files uploaded successfully!');
    
    // Insert template into database using new schema
    console.log('📝 Creating template record...');
    
    // Check if templates table exists
    console.log('🔍 Checking if templates table exists...');
    const { data: testData, error: testError } = await supabase
      .from('templates')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Templates table error:', testError.message);
      if (testError.message.includes('does not exist') || testError.message.includes('relation') || testError.message.includes('not found')) {
        throw new Error('Templates table does not exist. Please run the SQL setup first: bether_nextjs/templates-table.sql');
      }
      throw testError;
    }
    
    console.log('✅ Templates table exists');
    
    // Try to insert first, if it fails, update the existing record
    let templateData, templateError;
    
    // Check if template already exists
    const { data: existing, error: existingError } = await supabase
      .from('templates')
      .select('id')
      .eq('template_key', templateKey)
      .single();
    
    if (existing) {
      // Update existing template
      console.log('Template already exists, updating...');
      const result = await supabase
        .from('templates')
        .update({
          name: 'E-commerce Store',
          description: 'Full-featured e-commerce store with product catalog, shopping cart, and checkout',
          long_description: 'A complete e-commerce solution built with Next.js featuring product management, shopping cart functionality, user authentication, order processing, and payment integration. Perfect for building online stores and marketplace applications.',
          difficulty: 'intermediate',
          icon: 'ShoppingBag',
          emoji: '🛍️',
          color_primary: '#10B981',
          color_secondary: '#059669',
          rating: 4.5,
          is_active: true,
          version: '1.0.0',
          storage_path: templateKey,
          sort_order: 10,
          updated_at: new Date().toISOString()
        })
        .eq('template_key', templateKey)
        .select('id');
      
      templateData = result.data;
      templateError = result.error;
    } else {
      // Insert new template
      console.log('Creating new template...');
      const result = await supabase
        .from('templates')
        .insert({
          template_key: templateKey,
          name: 'E-commerce Store',
          description: 'Full-featured e-commerce store with product catalog, shopping cart, and checkout',
          long_description: 'A complete e-commerce solution built with Next.js featuring product management, shopping cart functionality, user authentication, order processing, and payment integration. Perfect for building online stores and marketplace applications.',
          difficulty: 'intermediate',
          icon: 'ShoppingBag',
          emoji: '🛍️',
          color_primary: '#10B981',
          color_secondary: '#059669',
          rating: 4.5,
          is_active: true,
          version: '1.0.0',
          storage_path: templateKey,
          sort_order: 10
        })
        .select('id');
      
      templateData = result.data;
      templateError = result.error;
    }
    
    if (templateError) {
      console.error('Database error:', templateError);
      throw templateError;
    }
    
    if (!templateData || templateData.length === 0) {
      throw new Error('Template creation returned no data');
    }
    
    const templateId = templateData[0].id;
    console.log(`✅ Template created with ID: ${templateId}`);
    
    // Add e-commerce category relationship
    const { data: categoryData } = await supabase
      .from('template_categories')
      .select('id')
      .eq('key', 'ecommerce')
      .single();
    
    if (categoryData) {
      await supabase
        .from('templates_categories')
        .upsert({
          template_id: templateId,
          category_id: categoryData.id,
          is_primary_category: true
        }, { onConflict: 'template_id,category_id' });
      
      console.log('✅ Category relationship created');
    }
    
    // Add existing features (using features that already exist in database)
    const existingFeatures = [
      'Product Catalog',
      'Shopping Cart', 
      'User Authentication',
      'Order Management',
      'Inventory Tracking',
      'Customer Accounts',
      'Stripe Integration',
      'Admin Dashboard',
      'Responsive Design',
      'Search Functionality'
    ];
    
    for (const featureName of existingFeatures) {
      const { data: featureData } = await supabase
        .from('template_features')
        .select('id')
        .eq('name', featureName)
        .single();
      
      if (featureData) {
        await supabase
          .from('templates_features')
          .upsert({
            template_id: templateId,
            feature_id: featureData.id,
            is_core_feature: ['Product Catalog', 'Shopping Cart', 'Stripe Integration', 'Order Management'].includes(featureName)
          }, { onConflict: 'template_id,feature_id' });
      }
    }
    
    console.log('✅ Features added successfully');
    
    // Add tech stack relationships (using existing tech stack items)
    const techStack = [
      'Next.js',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'Supabase',
      'Prisma',
      'Stripe',
      'NextAuth.js'
    ];
    
    for (const techName of techStack) {
      const { data: techData } = await supabase
        .from('template_tech_stack')
        .select('id')
        .eq('name', techName)
        .single();
      
      if (techData) {
        await supabase
          .from('templates_tech_stack')
          .upsert({
            template_id: templateId,
            tech_id: techData.id,
            is_primary_tech: ['Next.js', 'React', 'TypeScript', 'Stripe'].includes(techName)
          }, { onConflict: 'template_id,tech_id' });
      }
    }
    
    console.log('✅ Tech stack relationships added successfully');
    
    console.log('🧹 Upload completed - no temporary files to clean up');
    
    console.log('\n🎉 E-commerce template integration completed!');
    console.log(`📋 Template Key: ${templateKey}`);
    console.log(`🆔 Template ID: ${templateId}`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

// Run the upload
uploadTemplate();