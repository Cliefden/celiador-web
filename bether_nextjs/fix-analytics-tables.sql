-- ============================================================================
-- Fix Analytics: Convert Views to Proper Tables with Standard Fields
-- ============================================================================

-- Drop the existing views
DROP VIEW IF EXISTS user_monthly_usage;
DROP VIEW IF EXISTS provider_usage_analytics;

-- 1. USER MONTHLY USAGE TABLE
-- Replace view with proper table for better performance and consistency
CREATE TABLE user_monthly_usage (
    -- Standard Supabase fields
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    creator UUID,
    updater UUID,
    deleter UUID,
    
    -- Core references
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    
    -- Time period
    month_year TEXT NOT NULL, -- 'YYYY-MM' format
    
    -- Free tier tracking
    free_tier_requests_used INTEGER DEFAULT 0,
    free_tier_requests_limit INTEGER DEFAULT 50,
    free_tier_tokens_used INTEGER DEFAULT 0,
    free_tier_tokens_limit INTEGER DEFAULT 100000,
    
    -- User key usage this month
    user_key_requests INTEGER DEFAULT 0,
    user_key_tokens INTEGER DEFAULT 0,
    user_key_cost_cents INTEGER DEFAULT 0,
    
    -- Status flags
    has_user_key BOOLEAN DEFAULT false,
    
    UNIQUE(user_id, provider_id, month_year)
);

-- 2. PROVIDER USAGE ANALYTICS TABLE
-- Aggregated analytics for platform monitoring
CREATE TABLE provider_usage_analytics (
    -- Standard Supabase fields
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    creator UUID,
    updater UUID,
    deleter UUID,
    
    -- Core references
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    
    -- Time period
    date DATE NOT NULL,
    period_type TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'monthly'
    
    -- Request counts by key source
    platform_requests INTEGER DEFAULT 0,
    user_key_requests INTEGER DEFAULT 0,
    free_tier_requests INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    
    -- Token usage
    platform_tokens INTEGER DEFAULT 0,
    user_tokens INTEGER DEFAULT 0,
    free_tier_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    -- Costs (platform burden)
    platform_cost_cents INTEGER DEFAULT 0,
    free_tier_cost_cents INTEGER DEFAULT 0,
    total_platform_cost_cents INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2), -- Percentage
    
    UNIQUE(provider_id, date, period_type)
);

-- 3. PROJECT USAGE SUMMARY TABLE
-- Per-project usage aggregations
CREATE TABLE project_usage_summary (
    -- Standard Supabase fields
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    creator UUID,
    updater UUID,
    deleter UUID,
    
    -- Core references
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    
    -- Time period
    date DATE NOT NULL,
    month_year TEXT NOT NULL, -- 'YYYY-MM' format
    
    -- Usage metrics
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    
    -- Breakdown by operation
    claude_code_requests INTEGER DEFAULT 0,
    chat_requests INTEGER DEFAULT 0,
    template_requests INTEGER DEFAULT 0,
    
    -- Key source breakdown
    platform_key_usage INTEGER DEFAULT 0,
    user_key_usage INTEGER DEFAULT 0,
    free_tier_usage INTEGER DEFAULT 0,
    
    UNIQUE(project_id, provider_id, date)
);

-- ============================================================================
-- INDEXES FOR NEW TABLES
-- ============================================================================

-- User monthly usage indexes
CREATE INDEX idx_user_monthly_usage_user_month ON user_monthly_usage(user_id, month_year);
CREATE INDEX idx_user_monthly_usage_provider ON user_monthly_usage(provider_id, month_year);

-- Provider analytics indexes
CREATE INDEX idx_provider_analytics_date ON provider_usage_analytics(provider_id, date);
CREATE INDEX idx_provider_analytics_period ON provider_usage_analytics(period_type, date);

-- Project summary indexes
CREATE INDEX idx_project_usage_date ON project_usage_summary(project_id, date);
CREATE INDEX idx_project_usage_month ON project_usage_summary(project_id, month_year);

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- User monthly usage: Users see their own usage
ALTER TABLE user_monthly_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own monthly usage" ON user_monthly_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Provider analytics: Admin/service access only
ALTER TABLE provider_usage_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage provider analytics" ON provider_usage_analytics
  FOR ALL TO service_role
  USING (true);

-- Project usage: Users see their project usage
ALTER TABLE project_usage_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own project usage" ON project_usage_summary
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_usage_summary.project_id 
      AND p.userId = auth.uid()
    )
  );