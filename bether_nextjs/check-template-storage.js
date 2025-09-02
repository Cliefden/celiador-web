// Check what templates are actually in Supabase Storage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wpnucnsejqmqgtxdrwnt.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbnVjbnNlanFtcWd0eGRyd250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg4OTYwOCwiZXhwIjoyMDcwNDY1NjA4fQ.eVJn8uw5tne2VTAvHHw3OJ83AoVcC_p2vgypFK5BPZ4";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTemplateStorage() {
  console.log('🔍 Checking template storage...\n');

  try {
    // List all buckets
    console.log('1️⃣ Listing all buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Failed to list buckets:', bucketError);
      return;
    }

    console.log('Available buckets:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.id} (${bucket.public ? 'public' : 'private'})`);
    });

    // Check project-templates bucket specifically
    const templatesBucket = buckets.find(bucket => bucket.id === 'project-templates');
    if (!templatesBucket) {
      console.log('\n❌ project-templates bucket not found');
      return;
    }

    console.log('\n2️⃣ Checking project-templates bucket...');
    
    // List root contents of project-templates bucket
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('project-templates')
      .list('');

    if (rootError) {
      console.error('❌ Failed to list root files:', rootError);
      return;
    }

    console.log(`Found ${rootFiles.length} items in project-templates root:`);
    rootFiles.forEach(file => {
      console.log(`   - ${file.name} (${file.metadata ? 'file' : 'folder'})`);
    });

    // Check if packages folder exists
    const packagesFolder = rootFiles.find(item => item.name === 'packages');
    if (packagesFolder) {
      console.log('\n3️⃣ Checking packages folder...');
      
      const { data: packagesContents, error: packagesError } = await supabase.storage
        .from('project-templates')
        .list('packages');

      if (packagesError) {
        console.error('❌ Failed to list packages folder:', packagesError);
        return;
      }

      console.log(`Found ${packagesContents.length} items in packages:`);
      packagesContents.forEach(file => {
        console.log(`   - ${file.name} (${file.metadata ? 'file' : 'folder'})`);
      });

      // Check templates subfolder
      const templatesFolder = packagesContents.find(item => item.name === 'templates');
      if (templatesFolder) {
        console.log('\n4️⃣ Checking packages/templates folder...');
        
        const { data: templatesContents, error: templatesError } = await supabase.storage
          .from('project-templates')
          .list('packages/templates');

        if (templatesError) {
          console.error('❌ Failed to list packages/templates folder:', templatesError);
          return;
        }

        console.log(`Found ${templatesContents.length} template folders:`);
        templatesContents.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata ? 'file' : 'folder'})`);
        });

        // Check contents of each template folder
        for (const template of templatesContents.filter(item => !item.metadata)) {
          console.log(`\n5️⃣ Checking template: ${template.name}`);
          
          const { data: templateFiles, error: templateError } = await supabase.storage
            .from('project-templates')
            .list(`packages/templates/${template.name}`);

          if (templateError) {
            console.error(`❌ Failed to list ${template.name} files:`, templateError);
            continue;
          }

          console.log(`   Found ${templateFiles.length} files in ${template.name}:`);
          templateFiles.forEach(file => {
            console.log(`     - ${file.name} (${file.metadata ? 'file' : 'folder'})`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking storage:', error);
  }
}

checkTemplateStorage();