-- Template Categories table
CREATE TABLE IF NOT EXISTS template_categories (
  -- Standard Supabase fields
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  creator UUID,
  updater UUID,
  deleter UUID,
  
  -- Category details
  key TEXT NOT NULL UNIQUE, -- Used for referencing in code (e.g., 'saas', 'ecommerce')
  name TEXT NOT NULL, -- Display name (e.g., 'SaaS', 'E-commerce')
  description TEXT,
  icon TEXT NOT NULL, -- SF Symbol for iOS, Lucide icon for web
  color_primary TEXT NOT NULL, -- Hex color code
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- Templates table for unified template management
CREATE TABLE IF NOT EXISTS templates (
  -- Standard Supabase fields
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  creator UUID,
  updater UUID,
  deleter UUID,
  
  -- Template identification
  template_key TEXT NOT NULL UNIQUE, -- Used for referencing in code (e.g., 'next-saas-starter')
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  
  -- Categorization
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  
  -- Visual properties  
  icon TEXT NOT NULL, -- SF Symbol name for iOS, Lucide icon for web
  emoji TEXT NOT NULL,
  color_primary TEXT NOT NULL, -- Hex color code
  color_secondary TEXT, -- Optional secondary color for gradients
  
  -- Metadata
  rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 5.0),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  version TEXT DEFAULT '1.0.0',
  
  -- Template source location in Supabase Storage
  storage_path TEXT NOT NULL, -- Path in Supabase Storage where template files are stored
  
  -- Display order
  sort_order INTEGER DEFAULT 0
);

-- Template Features table for many-to-many relationship
CREATE TABLE IF NOT EXISTS template_features (
  -- Standard Supabase fields
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  creator UUID,
  updater UUID,
  deleter UUID,
  
  -- Feature details
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Optional icon for feature
  category TEXT, -- Group features by category (e.g., 'auth', 'payment', 'ui', 'database')
  is_active BOOLEAN DEFAULT true
);

-- Template Tech Stack table for many-to-many relationship  
CREATE TABLE IF NOT EXISTS template_tech_stack (
  -- Standard Supabase fields
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  creator UUID,
  updater UUID,
  deleter UUID,
  
  -- Tech stack details
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Optional icon for technology
  category TEXT, -- Group by type (e.g., 'frontend', 'backend', 'database', 'deployment')
  website_url TEXT, -- Link to documentation
  is_active BOOLEAN DEFAULT true
);

-- Junction table: Templates ↔ Features
CREATE TABLE IF NOT EXISTS templates_features (
  -- Standard Supabase fields
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  creator UUID,
  updater UUID,
  deleter UUID,
  
  -- Relationships
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES template_features(id) ON DELETE CASCADE,
  
  -- Optional metadata for this specific relationship
  is_core_feature BOOLEAN DEFAULT false, -- Is this a core/primary feature for this template?
  
  UNIQUE(template_id, feature_id)
);

-- Junction table: Templates ↔ Categories
CREATE TABLE IF NOT EXISTS templates_categories (
  -- Standard Supabase fields
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  creator UUID,
  updater UUID,
  deleter UUID,
  
  -- Relationships
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES template_categories(id) ON DELETE CASCADE,
  
  -- Optional metadata for this specific relationship
  is_primary_category BOOLEAN DEFAULT false, -- Is this the primary category for this template?
  
  UNIQUE(template_id, category_id)
);

-- Junction table: Templates ↔ Tech Stack
CREATE TABLE IF NOT EXISTS templates_tech_stack (
  -- Standard Supabase fields
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  creator UUID,
  updater UUID,
  deleter UUID,
  
  -- Relationships
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  tech_id UUID NOT NULL REFERENCES template_tech_stack(id) ON DELETE CASCADE,
  
  -- Optional metadata for this specific relationship
  is_primary_tech BOOLEAN DEFAULT false, -- Is this a primary technology for this template?
  
  UNIQUE(template_id, tech_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_templates_key ON templates(template_key) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_categories_active ON template_categories(is_active, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_template_categories_template ON templates_categories(template_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_template_features_template ON templates_features(template_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_template_tech_template ON templates_tech_stack(template_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_features_active ON template_features(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tech_active ON template_tech_stack(is_active) WHERE deleted_at IS NULL;

-- RLS policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tech_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_tech_stack ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read active templates and related data
CREATE POLICY "Allow authenticated users to read active templates" ON templates
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND is_active = true);

CREATE POLICY "Allow authenticated users to read template categories" ON template_categories
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND is_active = true);

CREATE POLICY "Allow authenticated users to read template features" ON template_features
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND is_active = true);

CREATE POLICY "Allow authenticated users to read template tech stack" ON template_tech_stack
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND is_active = true);

CREATE POLICY "Allow authenticated users to read template category relationships" ON templates_categories
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Allow authenticated users to read template feature relationships" ON templates_features
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Allow authenticated users to read template tech relationships" ON templates_tech_stack
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- Allow admin users to manage templates (you can adjust this based on your admin logic)
CREATE POLICY "Allow admins to manage templates" ON templates
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' IS NOT NULL);

CREATE POLICY "Allow admins to manage template categories" ON template_categories
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' IS NOT NULL);

CREATE POLICY "Allow admins to manage template features" ON template_features
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' IS NOT NULL);

CREATE POLICY "Allow admins to manage template tech stack" ON template_tech_stack
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' IS NOT NULL);

CREATE POLICY "Allow admins to manage template category relationships" ON templates_categories
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' IS NOT NULL);

CREATE POLICY "Allow admins to manage template feature relationships" ON templates_features
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' IS NOT NULL);

CREATE POLICY "Allow admins to manage template tech relationships" ON templates_tech_stack
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' IS NOT NULL);