// Fix template storage paths in database to match what's actually in Supabase Storage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wpnucnsejqmqgtxdrwnt.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbnVjbnNlanFtcWd0eGRyd250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg4OTYwOCwiZXhwIjoyMDcwNDY1NjA4fQ.eVJn8uw5tne2VTAvHHw3OJ83AoVcC_p2vgypFK5BPZ4";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Templates that are actually in storage under packages/templates/
const actualStoragePaths = {
  'next-saas-starter': 'packages/templates/next-saas-starter',
  'ai-chat-app': 'packages/templates/ai-chat-app', 
  'ecommerce-storefront': 'packages/templates/ecommerce-storefront',
  'dashboard-analytics': 'packages/templates/dashboard-analytics', // Note: this is dashboard-analytics, not dashboard-app
  'next-prisma-supabase': 'packages/templates/next-prisma-supabase'
};

async function fixStoragePaths() {
  console.log('🔧 Fixing template storage paths...\n');

  try {
    // Get current templates
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*');

    if (templatesError) {
      console.error('❌ Failed to get templates:', templatesError);
      return;
    }

    console.log('Current templates and their storage paths:');
    templates.forEach(template => {
      console.log(`   - ${template.template_key}: ${template.storage_path}`);
    });

    console.log('\n🔄 Updating storage paths for templates that exist in storage...');

    // Update paths for templates that exist in actual storage
    for (const [templateKey, correctPath] of Object.entries(actualStoragePaths)) {
      const template = templates.find(t => t.template_key === templateKey);
      
      if (template && template.storage_path !== correctPath) {
        console.log(`Updating ${templateKey}: ${template.storage_path} → ${correctPath}`);
        
        const { error } = await supabase
          .from('templates')
          .update({ storage_path: correctPath })
          .eq('template_key', templateKey);
          
        if (error) {
          console.error(`❌ Failed to update ${templateKey}:`, error);
        } else {
          console.log(`✅ Updated ${templateKey}`);
        }
      } else if (template) {
        console.log(`✓ ${templateKey} path already correct`);
      } else {
        console.log(`⚠️  Template ${templateKey} not found in database`);
      }
    }

    // Check for templates in DB that don't exist in storage
    console.log('\n⚠️  Templates in database but NOT in storage:');
    templates.forEach(template => {
      if (!Object.keys(actualStoragePaths).includes(template.template_key)) {
        console.log(`   - ${template.template_key}: ${template.storage_path}`);
      }
    });

    console.log('\n✅ Storage path fixes completed!');

  } catch (error) {
    console.error('❌ Error fixing storage paths:', error);
  }
}

fixStoragePaths();