-- ============================================================================
-- Migration: Fix Provider Analytics View to Include provider_id
-- ============================================================================

-- Drop and recreate the provider_usage_analytics view with provider_id
DROP VIEW IF EXISTS provider_usage_analytics;

CREATE VIEW provider_usage_analytics AS
SELECT 
    p.id as provider_id,
    p.provider_key,
    p.display_name,
    DATE_TRUNC('day', a.created_at) as date,
    
    -- Request counts by key source
    COUNT(*) FILTER (WHERE a.key_source = 'platform') as platform_requests,
    COUNT(*) FILTER (WHERE a.key_source = 'user') as user_key_requests,
    COUNT(*) FILTER (WHERE a.key_source = 'free_tier') as free_tier_requests,
    
    -- Token usage
    SUM(a.total_tokens) FILTER (WHERE a.key_source = 'platform') as platform_tokens,
    SUM(a.total_tokens) FILTER (WHERE a.key_source = 'user') as user_tokens,
    
    -- Costs (platform burden)
    SUM(a.total_cost_cents) FILTER (WHERE a.key_source = 'platform') as platform_cost_cents,
    SUM(a.total_cost_cents) FILTER (WHERE a.key_source = 'free_tier') as free_tier_cost_cents,
    
    -- Performance
    AVG(a.response_time_ms) as avg_response_time_ms,
    COUNT(*) FILTER (WHERE a.success = false) as error_count
    
FROM api_usage a
JOIN providers p ON a.provider_id = p.id
WHERE a.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.provider_key, p.display_name, DATE_TRUNC('day', a.created_at)
ORDER BY date DESC;