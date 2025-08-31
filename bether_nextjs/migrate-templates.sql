-- Migrate existing templates from iOS mock data and ProjectTemplate enum
-- This combines data from both sources into the normalized structure

-- First, insert the core templates (combining iOS Template struct data + ProjectTemplate enum)
INSERT INTO templates (template_key, name, description, long_description, difficulty, icon, emoji, color_primary, color_secondary, rating, version, storage_path, sort_order) VALUES

-- From iOS Template struct (6 detailed templates)
('next-saas-starter', 'SaaS Starter Kit', 'Complete SaaS application with auth, payments, and dashboard', 'A comprehensive SaaS starter kit with user authentication, subscription management, payment processing, and a beautiful dashboard. Perfect for launching your next SaaS product quickly.', 'intermediate', 'cloud', '🚀', '#3B82F6', '#8B5CF6', 4.8, '1.0.0', 'templates/next-saas-starter/', 1),

('ai-chat-app', 'AI Chat Assistant', 'Smart chatbot with OpenAI integration and beautiful UI', 'An intelligent chat assistant powered by OpenAI''s GPT models. Features real-time conversations, message history, and customizable AI personalities.', 'advanced', 'brain', '🤖', '#8B5CF6', '#EC4899', 4.9, '1.0.0', 'templates/ai-chat-app/', 2),

('ecommerce-storefront', 'E-commerce Store', 'Full-featured online store with cart and payments', 'A complete e-commerce solution with product catalog, shopping cart, checkout process, and order management. Ready to start selling online immediately.', 'intermediate', 'cart', '🛍️', '#10B981', '#3B82F6', 4.7, '1.0.0', 'templates/ecommerce-storefront/', 3),

('dashboard-app', 'Analytics Dashboard', 'Beautiful dashboard with charts and real-time data', 'A comprehensive analytics dashboard with interactive charts, real-time data updates, and customizable widgets. Perfect for monitoring business metrics.', 'beginner', 'chart.bar', '📊', '#F59E0B', '#EF4444', 4.6, '1.0.0', 'templates/dashboard-app/', 4),

('landing-page', 'Landing Page Pro', 'High-converting landing page with modern design', 'A professionally designed landing page template with high conversion optimization, A/B testing support, and integrated analytics.', 'beginner', 'doc.text', '📄', '#06B6D4', '#10B981', 4.5, '1.0.0', 'templates/landing-page/', 5),

('task-manager', 'Task Manager App', 'Collaborative task management with teams and projects', 'A full-featured task management application with team collaboration, project organization, and productivity tracking.', 'intermediate', 'checkmark.circle', '✅', '#8B5CF6', '#3B82F6', 4.4, '1.0.0', 'templates/task-manager/', 6),

-- From ProjectTemplate enum (additional 4 templates not in iOS mock data)
('blank-nextjs', 'Next.js App', 'Minimal Next.js application starter', 'A clean Next.js application with TypeScript, Tailwind CSS, and modern development setup. Perfect starting point for any web application.', 'beginner', 'globe', '🌐', '#3B82F6', null, 4.2, '1.0.0', 'templates/blank-nextjs/', 7),

('react-typescript', 'React TypeScript', 'React application with TypeScript setup', 'A modern React application with TypeScript configuration, component structure, and development tooling setup.', 'beginner', 'atom', '⚛️', '#61DAFB', '#F7DF1E', 4.3, '1.0.0', 'templates/react-typescript/', 8),

('next-prisma-supabase', 'Next.js + Supabase', 'Full-stack app with Next.js, Prisma, and Supabase', 'A complete full-stack application combining Next.js frontend with Supabase backend, including authentication and database setup.', 'intermediate', 'swiftdata', '🗄️', '#3B82F6', '#3ECF8E', 4.6, '1.0.0', 'templates/next-prisma-supabase/', 9),

('blog-platform', 'Blog Platform', 'Content management system for blogging', 'A full-featured blog platform with content management, user authentication, comments, and SEO optimization.', 'intermediate', 'book.fill', '📚', '#10B981', '#3B82F6', 4.4, '1.0.0', 'templates/blog-platform/', 10);

-- Now create the relationships for categories
-- Get category IDs first, then create relationships
INSERT INTO templates_categories (template_id, category_id, is_primary_category)
SELECT t.id, c.id, true
FROM templates t, template_categories c
WHERE 
  (t.template_key = 'next-saas-starter' AND c.key = 'saas') OR
  (t.template_key = 'ai-chat-app' AND c.key = 'ai') OR
  (t.template_key = 'ecommerce-storefront' AND c.key = 'ecommerce') OR
  (t.template_key = 'dashboard-app' AND c.key = 'dashboard') OR
  (t.template_key = 'landing-page' AND c.key = 'landing') OR
  (t.template_key = 'task-manager' AND c.key = 'saas') OR
  (t.template_key = 'blank-nextjs' AND c.key = 'saas') OR
  (t.template_key = 'react-typescript' AND c.key = 'saas') OR
  (t.template_key = 'next-prisma-supabase' AND c.key = 'saas') OR
  (t.template_key = 'blog-platform' AND c.key = 'saas');

-- Add secondary categories for some templates
INSERT INTO templates_categories (template_id, category_id, is_primary_category)
SELECT t.id, c.id, false
FROM templates t, template_categories c
WHERE 
  (t.template_key = 'ai-chat-app' AND c.key = 'saas') OR
  (t.template_key = 'dashboard-app' AND c.key = 'saas');

-- Create feature relationships for SaaS Starter Kit
INSERT INTO templates_features (template_id, feature_id, is_core_feature)
SELECT t.id, f.id, true
FROM templates t, template_features f
WHERE t.template_key = 'next-saas-starter' AND f.name IN (
  'User Authentication', 'Stripe Integration', 'Admin Dashboard', 
  'Email Templates', 'Database Schema', 'Responsive Design'
);

-- Create tech stack relationships for SaaS Starter Kit  
INSERT INTO templates_tech_stack (template_id, tech_id, is_primary_tech)
SELECT t.id, ts.id, true
FROM templates t, template_tech_stack ts
WHERE t.template_key = 'next-saas-starter' AND ts.name IN (
  'Next.js', 'TypeScript', 'Tailwind CSS', 'Stripe', 'Supabase'
);

-- Create feature relationships for AI Chat App
INSERT INTO templates_features (template_id, feature_id, is_core_feature)
SELECT t.id, f.id, true
FROM templates t, template_features f
WHERE t.template_key = 'ai-chat-app' AND f.name IN (
  'OpenAI Integration', 'Real-time Updates', 'Chat System', 
  'Custom AI Personas', 'File Uploads', 'Voice Input'
);

-- Create tech stack relationships for AI Chat App
INSERT INTO templates_tech_stack (template_id, tech_id, is_primary_tech)
SELECT t.id, ts.id, true
FROM templates t, template_tech_stack ts
WHERE t.template_key = 'ai-chat-app' AND ts.name IN (
  'React', 'OpenAI API', 'WebSocket', 'Node.js', 'MongoDB'
);

-- Create feature relationships for E-commerce Store
INSERT INTO templates_features (template_id, feature_id, is_core_feature)
SELECT t.id, f.id, true
FROM templates t, template_features f
WHERE t.template_key = 'ecommerce-storefront' AND f.name IN (
  'Product Catalog', 'Shopping Cart', 'Stripe Integration',
  'Order Management', 'Inventory Tracking', 'Customer Accounts'
);

-- Create tech stack relationships for E-commerce Store
INSERT INTO templates_tech_stack (template_id, tech_id, is_primary_tech)
SELECT t.id, ts.id, true
FROM templates t, template_tech_stack ts
WHERE t.template_key = 'ecommerce-storefront' AND ts.name IN (
  'Next.js', 'Stripe', 'Prisma', 'PostgreSQL', 'Redis'
);

-- Create feature relationships for Analytics Dashboard
INSERT INTO templates_features (template_id, feature_id, is_core_feature)
SELECT t.id, f.id, true
FROM templates t, template_features f
WHERE t.template_key = 'dashboard-app' AND f.name IN (
  'Interactive Charts', 'Real-time Updates', 'Custom Widgets',
  'Data Export', 'Role-Based Access', 'Responsive Design'
);

-- Create tech stack relationships for Analytics Dashboard
INSERT INTO templates_tech_stack (template_id, tech_id, is_primary_tech)
SELECT t.id, ts.id, true
FROM templates t, template_tech_stack ts
WHERE t.template_key = 'dashboard-app' AND ts.name IN (
  'React', 'Chart.js', 'WebSocket', 'Express', 'MySQL'
);

-- Create feature relationships for Landing Page Pro
INSERT INTO templates_features (template_id, feature_id, is_core_feature)
SELECT t.id, f.id, true
FROM templates t, template_features f
WHERE t.template_key = 'landing-page' AND f.name IN (
  'Responsive Design', 'A/B Testing', 'Contact Forms',
  'Analytics Integration', 'SEO Optimized'
);

-- Create tech stack relationships for Landing Page Pro
INSERT INTO templates_tech_stack (template_id, tech_id, is_primary_tech)
SELECT t.id, ts.id, true
FROM templates t, template_tech_stack ts
WHERE t.template_key = 'landing-page' AND ts.name IN (
  'Next.js', 'Tailwind CSS', 'TypeScript'
);

-- Create feature relationships for Task Manager App
INSERT INTO templates_features (template_id, feature_id, is_core_feature)
SELECT t.id, f.id, true
FROM templates t, template_features f
WHERE t.template_key = 'task-manager' AND f.name IN (
  'User Authentication', 'Real-time Updates', 'File Uploads',
  'Push Notifications', 'Role-Based Access'
);

-- Create tech stack relationships for Task Manager App
INSERT INTO templates_tech_stack (template_id, tech_id, is_primary_tech)
SELECT t.id, ts.id, true
FROM templates t, template_tech_stack ts
WHERE t.template_key = 'task-manager' AND ts.name IN (
  'Vue.js', 'Node.js', 'MongoDB', 'Socket.io', 'Redis'
);

-- Create minimal relationships for the simpler templates
-- Next.js App
INSERT INTO templates_features (template_id, feature_id, is_core_feature)
SELECT t.id, f.id, true
FROM templates t, template_features f
WHERE t.template_key = 'blank-nextjs' AND f.name IN ('Responsive Design');

INSERT INTO templates_tech_stack (template_id, tech_id, is_primary_tech)
SELECT t.id, ts.id, true
FROM templates t, template_tech_stack ts
WHERE t.template_key = 'blank-nextjs' AND ts.name IN ('Next.js', 'TypeScript', 'Tailwind CSS');

-- React TypeScript
INSERT INTO templates_features (template_id, feature_id, is_core_feature)
SELECT t.id, f.id, true
FROM templates t, template_features f
WHERE t.template_key = 'react-typescript' AND f.name IN ('Responsive Design', 'Component Library');

INSERT INTO templates_tech_stack (template_id, tech_id, is_primary_tech)
SELECT t.id, ts.id, true
FROM templates t, template_tech_stack ts
WHERE t.template_key = 'react-typescript' AND ts.name IN ('React', 'TypeScript');

-- Next.js + Supabase
INSERT INTO templates_features (template_id, feature_id, is_core_feature)
SELECT t.id, f.id, true
FROM templates t, template_features f
WHERE t.template_key = 'next-prisma-supabase' AND f.name IN (
  'User Authentication', 'Database Schema', 'Responsive Design'
);

INSERT INTO templates_tech_stack (template_id, tech_id, is_primary_tech)
SELECT t.id, ts.id, true
FROM templates t, template_tech_stack ts
WHERE t.template_key = 'next-prisma-supabase' AND ts.name IN (
  'Next.js', 'Prisma', 'Supabase', 'TypeScript'
);

-- Blog Platform
INSERT INTO templates_features (template_id, feature_id, is_core_feature)
SELECT t.id, f.id, true
FROM templates t, template_features f
WHERE t.template_key = 'blog-platform' AND f.name IN (
  'User Authentication', 'SEO Optimized', 'Responsive Design'
);

INSERT INTO templates_tech_stack (template_id, tech_id, is_primary_tech)
SELECT t.id, ts.id, true
FROM templates t, template_tech_stack ts
WHERE t.template_key = 'blog-platform' AND ts.name IN (
  'Next.js', 'PostgreSQL', 'TypeScript'
);