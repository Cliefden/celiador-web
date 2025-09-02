-- Allow public read access to templates for landing page
DROP POLICY IF EXISTS "Allow authenticated users to read active templates" ON templates;
DROP POLICY IF EXISTS "Allow authenticated users to read template categories" ON template_categories;
DROP POLICY IF EXISTS "Allow authenticated users to read template features" ON template_features;
DROP POLICY IF EXISTS "Allow authenticated users to read template tech stack" ON template_tech_stack;
DROP POLICY IF EXISTS "Allow authenticated users to read template category relationships" ON templates_categories;
DROP POLICY IF EXISTS "Allow authenticated users to read template feature relationships" ON templates_features;
DROP POLICY IF EXISTS "Allow authenticated users to read template tech relationships" ON templates_tech_stack;

-- Create new policies that allow public read access
CREATE POLICY "Allow public read access to active templates" ON templates
  FOR SELECT TO public
  USING (deleted_at IS NULL AND is_active = true);

CREATE POLICY "Allow public read access to template categories" ON template_categories
  FOR SELECT TO public
  USING (deleted_at IS NULL AND is_active = true);

CREATE POLICY "Allow public read access to template features" ON template_features
  FOR SELECT TO public
  USING (deleted_at IS NULL AND is_active = true);

CREATE POLICY "Allow public read access to template tech stack" ON template_tech_stack
  FOR SELECT TO public
  USING (deleted_at IS NULL AND is_active = true);

CREATE POLICY "Allow public read access to template category relationships" ON templates_categories
  FOR SELECT TO public
  USING (deleted_at IS NULL);

CREATE POLICY "Allow public read access to template feature relationships" ON templates_features
  FOR SELECT TO public
  USING (deleted_at IS NULL);

CREATE POLICY "Allow public read access to template tech relationships" ON templates_tech_stack
  FOR SELECT TO public
  USING (deleted_at IS NULL);