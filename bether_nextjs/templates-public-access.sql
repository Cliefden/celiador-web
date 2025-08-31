-- Allow public read access to templates for landing page
DROP POLICY IF EXISTS "Allow authenticated users to read active templates" ON templates;

-- Create new policy that allows both authenticated and anonymous users to read templates
CREATE POLICY "Allow public read access to active templates" ON templates
  FOR SELECT TO public
  USING (deleted_at IS NULL AND is_active = true);

-- Also allow public access to template categories (for filtering)
DROP POLICY IF EXISTS "Allow authenticated users to read template categories" ON template_categories;

CREATE POLICY "Allow public read access to template categories" ON template_categories
  FOR SELECT TO public
  USING (deleted_at IS NULL AND is_active = true);