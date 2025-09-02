-- Fix storage paths in templates table to match actual filesystem structure
-- Current structure: /packages/templates/{template-name}/
-- Database needs to be updated to reflect this structure

UPDATE templates 
SET storage_path = CASE 
    WHEN template_key = 'next-saas-starter' THEN 'packages/templates/next-saas-starter'
    WHEN template_key = 'ecommerce-storefront' THEN 'packages/templates/ecommerce-storefront' 
    WHEN template_key = 'ai-chat-app' THEN 'packages/templates/ai-chat-app'
    WHEN template_key = 'dashboard-analytics' THEN 'packages/templates/dashboard-analytics'
    WHEN template_key = 'next-prisma-supabase' THEN 'packages/templates/next-prisma-supabase'
    -- These templates don't exist in filesystem yet, use placeholder paths
    WHEN template_key = 'blog-cms' THEN 'packages/templates/blog-cms'
    WHEN template_key = 'social-network' THEN 'packages/templates/social-network'
    WHEN template_key = 'task-manager' THEN 'packages/templates/task-manager'
    WHEN template_key = 'video-streaming' THEN 'packages/templates/video-streaming'
    WHEN template_key = 'marketplace' THEN 'packages/templates/marketplace'
    ELSE storage_path
END
WHERE template_key IN (
    'next-saas-starter', 
    'ecommerce-storefront', 
    'ai-chat-app', 
    'dashboard-analytics', 
    'next-prisma-supabase',
    'blog-cms',
    'social-network', 
    'task-manager',
    'video-streaming',
    'marketplace'
);

-- Verify the changes
SELECT id, name, template_key, storage_path 
FROM templates 
ORDER BY storage_path NULLS LAST;