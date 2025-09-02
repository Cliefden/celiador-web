-- Fix date field type in api_usage table for iOS compatibility
-- Run this in your Supabase SQL editor

-- Drop the view that depends on the date column
DROP VIEW IF EXISTS user_monthly_usage;

-- Change date field from DATE to TIMESTAMPTZ for proper iOS parsing
ALTER TABLE api_usage 
ALTER COLUMN date TYPE TIMESTAMPTZ 
USING date::TIMESTAMPTZ;

-- Recreate the user_monthly_usage view with updated date handling
CREATE VIEW user_monthly_usage AS
SELECT 
    u.user_id,
    u.provider_id,
    p.display_name as provider_name,
    u.current_month,
    u.free_tier_requests_used,
    u.free_tier_requests_limit,
    u.free_tier_tokens_used,
    u.free_tier_tokens_limit,
    
    -- Usage with user's own keys this month
    COALESCE(user_usage.total_requests, 0) as user_key_requests,
    COALESCE(user_usage.total_tokens, 0) as user_key_tokens,
    COALESCE(user_usage.total_cost_cents, 0) as user_key_cost_cents,
    
    -- Check if user has active key
    (SELECT COUNT(*) > 0 FROM user_api_keys k 
     WHERE k.user_id = u.user_id 
     AND k.provider_id = u.provider_id 
     AND k.is_active = true 
     AND k.deleted_at IS NULL) as has_user_key,
    
    -- Calculate remaining free tier
    GREATEST(0, u.free_tier_requests_limit - u.free_tier_requests_used) as free_requests_remaining,
    GREATEST(0, u.free_tier_tokens_limit - u.free_tier_tokens_used) as free_tokens_remaining
    
FROM user_usage_limits u
JOIN providers p ON u.provider_id = p.id
LEFT JOIN (
    SELECT 
        proj.userId as user_id, 
        a.provider_id,
        COUNT(*) as total_requests,
        SUM(a.total_tokens) as total_tokens,
        SUM(a.total_cost_cents) as total_cost_cents
    FROM api_usage a
    JOIN projects proj ON a.project_id = proj.id
    WHERE a.key_source = 'user' 
    AND a.date >= DATE_TRUNC('month', NOW())::timestamptz
    GROUP BY proj.userId, a.provider_id
) user_usage ON u.user_id = user_usage.user_id AND u.provider_id = user_usage.provider_id;