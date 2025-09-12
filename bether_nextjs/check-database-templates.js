// Check what templates are actually in the Supabase database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wpnucnsejqmqgtxdrwnt.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbnVjbnNlanFtcWd0eGRyd250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg4OTYwOCwiZXhwIjoyMDcwNDY1NjA4fQ.eVJn8uw5tne2VTAvHHw3OJ83AoVcC_p2vgypFK5BPZ4";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseTables() {
  console.log('🔍 Checking database tables and data...\n');

  try {
    // 1. Skip table existence check and go straight to querying data
    console.log('1️⃣ Checking template tables by querying them directly...');

    // 2. Check templates table
    console.log('\n2️⃣ Checking templates table...');
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*')
      .order('sort_order');

    if (templatesError) {
      console.error('❌ Failed to query templates:', templatesError);
    } else {
      console.log(`Found ${templates.length} templates:`);
      templates.forEach(template => {
        console.log(`   - ${template.template_key}: ${template.name} (${template.difficulty}, rating: ${template.rating})`);
        console.log(`     Storage path: ${template.storage_path}`);
        console.log(`     Active: ${template.is_active}`);
      });
    }

    // 3. Check template categories
    console.log('\n3️⃣ Checking template categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('template_categories')
      .select('*')
      .order('sort_order');

    if (categoriesError) {
      console.error('❌ Failed to query categories:', categoriesError);
    } else {
      console.log(`Found ${categories.length} categories:`);
      categories.forEach(category => {
        console.log(`   - ${category.key}: ${category.name} (${category.color_primary})`);
      });
    }

    // 4. Check template features
    console.log('\n4️⃣ Checking template features...');
    const { data: features, error: featuresError } = await supabase
      .from('template_features')
      .select('*')
      .order('category, name');

    if (featuresError) {
      console.error('❌ Failed to query features:', featuresError);
    } else {
      console.log(`Found ${features.length} features:`);
      const featuresByCategory = {};
      features.forEach(feature => {
        if (!featuresByCategory[feature.category]) {
          featuresByCategory[feature.category] = [];
        }
        featuresByCategory[feature.category].push(feature);
      });
      
      Object.keys(featuresByCategory).forEach(category => {
        console.log(`   ${category}:`);
        featuresByCategory[category].forEach(feature => {
          console.log(`     - ${feature.name}`);
        });
      });
    }

    // 5. Check tech stack
    console.log('\n5️⃣ Checking tech stack...');
    const { data: techStack, error: techError } = await supabase
      .from('template_tech_stack')
      .select('*')
      .order('category, name');

    if (techError) {
      console.error('❌ Failed to query tech stack:', techError);
    } else {
      console.log(`Found ${techStack.length} technologies:`);
      const techByCategory = {};
      techStack.forEach(tech => {
        if (!techByCategory[tech.category]) {
          techByCategory[tech.category] = [];
        }
        techByCategory[tech.category].push(tech);
      });
      
      Object.keys(techByCategory).forEach(category => {
        console.log(`   ${category}:`);
        techByCategory[category].forEach(tech => {
          console.log(`     - ${tech.name}`);
        });
      });
    }

    // 6. Check template relationships
    console.log('\n6️⃣ Checking template relationships...');
    
    // Categories relationships
    const { data: templateCategories, error: tcError } = await supabase
      .from('templates_categories')
      .select(`
        *,
        template:templates(template_key, name),
        category:template_categories(key, name)
      `);

    if (tcError) {
      console.error('❌ Failed to query template-category relationships:', tcError);
    } else {
      console.log(`Template-Category relationships (${templateCategories.length}):`);
      templateCategories.forEach(rel => {
        console.log(`   - ${rel.template.template_key} → ${rel.category.key} ${rel.is_primary_category ? '(primary)' : ''}`);
      });
    }

    // Features relationships
    const { data: templateFeatures, error: tfError } = await supabase
      .from('templates_features')
      .select(`
        *,
        template:templates(template_key, name),
        feature:template_features(name)
      `);

    if (tfError) {
      console.error('❌ Failed to query template-feature relationships:', tfError);
    } else {
      console.log(`\nTemplate-Feature relationships (${templateFeatures.length}):`);
      const featuresByTemplate = {};
      templateFeatures.forEach(rel => {
        if (!featuresByTemplate[rel.template.template_key]) {
          featuresByTemplate[rel.template.template_key] = [];
        }
        featuresByTemplate[rel.template.template_key].push({
          feature: rel.feature.name,
          is_core: rel.is_core_feature
        });
      });
      
      Object.keys(featuresByTemplate).forEach(templateKey => {
        console.log(`   ${templateKey}:`);
        featuresByTemplate[templateKey].forEach(feature => {
          console.log(`     - ${feature.feature} ${feature.is_core ? '(core)' : ''}`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabaseTables();