-- ============================================================================
-- BYOK (Bring Your Own Key) Complete Database Schema
-- ============================================================================

-- 1. PROVIDERS TABLE
-- Central registry of all AI providers with pricing and capabilities
CREATE TABLE providers (
    -- Standard Supabase fields
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    creator UUID,
    updater UUID,
    deleter UUID,
    
    -- Provider Identity
    provider_key TEXT UNIQUE NOT NULL, -- 'anthropic', 'openai', 'google'
    display_name TEXT NOT NULL, -- 'Claude (Anthropic)'
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    docs_url TEXT,
    signup_url TEXT,
    
    -- API Configuration
    api_base_url TEXT,
    auth_type TEXT NOT NULL DEFAULT 'bearer', -- 'bearer', 'api_key', 'oauth'
    auth_header_format TEXT DEFAULT 'Bearer {key}', -- Template for auth header
    
    -- Rate Limits
    rate_limit_rpm INTEGER, -- Requests per minute
    rate_limit_tpm INTEGER, -- Tokens per minute
    rate_limit_rpd INTEGER, -- Requests per day
    
    -- Pricing Structure
    pricing_model TEXT NOT NULL, -- 'per_token', 'per_request', 'subscription'
    input_cost_per_1m_tokens DECIMAL(12,6), -- Cost per 1M input tokens (micro-cents)
    output_cost_per_1m_tokens DECIMAL(12,6), -- Cost per 1M output tokens
    request_base_cost_cents INTEGER DEFAULT 0, -- Fixed cost per request
    currency TEXT DEFAULT 'USD',
    
    -- Model Defaults
    default_model TEXT,
    supported_models JSONB, -- [{"name": "claude-3-5-sonnet", "context": 200000}]
    max_context_tokens INTEGER,
    max_output_tokens INTEGER,
    
    -- Capabilities
    supports_streaming BOOLEAN DEFAULT false,
    supports_functions BOOLEAN DEFAULT false,
    supports_vision BOOLEAN DEFAULT false,
    supports_code_execution BOOLEAN DEFAULT false,
    
    -- Platform Status
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    maintenance_mode BOOLEAN DEFAULT false
);

-- 2. USER API KEYS
-- User-provided API keys for each provider
CREATE TABLE user_api_keys (
    -- Standard Supabase fields
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    creator UUID,
    updater UUID,
    deleter UUID,
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    
    -- Key Management
    key_name TEXT, -- User-friendly name: "My Claude Key", "Work OpenAI"
    encrypted_key TEXT NOT NULL, -- Encrypted API key
    key_hash TEXT NOT NULL, -- Hash for duplicate detection
    key_prefix TEXT, -- First 8 chars for display: "sk-1234..."
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_valid BOOLEAN DEFAULT true, -- Set to false if key fails validation
    last_validated_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    
    -- Usage Limits (user-defined)
    monthly_budget_cents INTEGER, -- User's spending limit
    daily_request_limit INTEGER, -- User's request limit
    
    UNIQUE(user_id, provider_id, key_hash)
);

-- 3. API USAGE TRACKING
-- Detailed tracking of every API call
CREATE TABLE api_usage (
    -- Standard Supabase fields
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    creator UUID,
    updater UUID,
    deleter UUID,
    
    -- Context (user_id derived from project.user_id)
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_api_key_id UUID REFERENCES user_api_keys(id) ON DELETE SET NULL,
    
    -- Request Details
    operation_type TEXT NOT NULL, -- 'claude_code', 'chat', 'template_gen', 'code_review'
    model_used TEXT,
    
    -- Token Usage
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
    
    -- Cost Calculation
    input_cost_cents INTEGER DEFAULT 0,
    output_cost_cents INTEGER DEFAULT 0,
    total_cost_cents INTEGER GENERATED ALWAYS AS (input_cost_cents + output_cost_cents) STORED,
    
    -- Key Source
    key_source TEXT NOT NULL, -- 'platform', 'user', 'free_tier'
    
    -- Performance
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Aggregation Helper (computed in application layer)
    date DATE
);

-- 4. USER USAGE LIMITS & FREE TIER
-- Track free tier usage and user-defined limits
CREATE TABLE user_usage_limits (
    -- Standard Supabase fields
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    creator UUID,
    updater UUID,
    deleter UUID,
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    
    -- Free Tier Limits (monthly reset)
    free_tier_requests_limit INTEGER DEFAULT 50,
    free_tier_tokens_limit INTEGER DEFAULT 100000, -- 100k tokens
    
    -- Current Month Tracking
    current_month TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
    free_tier_requests_used INTEGER DEFAULT 0,
    free_tier_tokens_used INTEGER DEFAULT 0,
    
    -- User Budgets (when using their own keys)
    monthly_budget_cents INTEGER, -- Overall monthly budget
    daily_budget_cents INTEGER, -- Daily spending limit
    
    -- Notifications
    notify_at_80_percent BOOLEAN DEFAULT true,
    notify_at_100_percent BOOLEAN DEFAULT true,
    last_notification_sent TIMESTAMPTZ,
    
    UNIQUE(user_id, provider_id)
);

-- 5. USAGE AGGREGATIONS (for performance)
-- Pre-calculated usage summaries
CREATE TABLE usage_summaries (
    -- Standard Supabase fields
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    creator UUID,
    updater UUID,
    deleter UUID,
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    
    -- Time Period
    period_type TEXT NOT NULL, -- 'daily', 'monthly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Aggregated Metrics
    total_requests INTEGER DEFAULT 0,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    
    -- Breakdown by Key Source
    platform_key_requests INTEGER DEFAULT 0,
    user_key_requests INTEGER DEFAULT 0,
    free_tier_requests INTEGER DEFAULT 0,
    
    UNIQUE(user_id, provider_id, period_type, period_start)
);

-- 6. BILLING EVENTS
-- Track billing-related events for audit trail
CREATE TABLE billing_events (
    -- Standard Supabase fields
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    creator UUID,
    updater UUID,
    deleter UUID,
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id),
    
    event_type TEXT NOT NULL, -- 'limit_exceeded', 'key_added', 'budget_warning'
    event_data JSONB,
    
    -- Resolution
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolution_action TEXT -- 'key_added', 'limit_increased', 'ignored'
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Usage tracking indexes  
CREATE INDEX idx_api_usage_provider_date ON api_usage(provider_id, date);
CREATE INDEX idx_api_usage_project_date ON api_usage(project_id, date);
CREATE INDEX idx_api_usage_operation_date ON api_usage(operation_type, date);

-- User limits indexes
CREATE INDEX idx_user_limits_month ON user_usage_limits(user_id, current_month);

-- Performance for aggregations (user_id via project join)
CREATE INDEX idx_usage_aggregation ON api_usage(project_id, provider_id, date, key_source);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Providers: Public read access
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active providers" ON providers
  FOR SELECT TO public
  USING (is_active = true AND maintenance_mode = false);

-- User API Keys: Users can only access their own
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own API keys" ON user_api_keys
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- API Usage: Users can only see usage for their projects
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own project usage" ON api_usage
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = api_usage.project_id 
      AND p.userId = auth.uid()
    )
  );

-- Allow system to insert usage (for background processes)
CREATE POLICY "System can insert usage" ON api_usage
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Usage Limits: Users manage their own limits
ALTER TABLE user_usage_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own limits" ON user_usage_limits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Usage Summaries: Users view their own summaries
ALTER TABLE usage_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own summaries" ON usage_summaries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Billing Events: Users view their own events
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own billing events" ON billing_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS FOR USAGE TRACKING
-- ============================================================================

-- Function to calculate cost based on provider pricing
CREATE OR REPLACE FUNCTION calculate_api_cost(
    provider_uuid UUID,
    input_tokens INTEGER,
    output_tokens INTEGER
) RETURNS INTEGER AS $$
DECLARE
    provider_record providers%ROWTYPE;
    input_cost INTEGER;
    output_cost INTEGER;
BEGIN
    SELECT * INTO provider_record FROM providers WHERE id = provider_uuid;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculate costs in micro-cents, then convert to cents
    input_cost = FLOOR((input_tokens::DECIMAL * provider_record.input_cost_per_1m_tokens) / 1000);
    output_cost = FLOOR((output_tokens::DECIMAL * provider_record.output_cost_per_1m_tokens) / 1000);
    
    RETURN input_cost + output_cost + COALESCE(provider_record.request_base_cost_cents, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can make request (within limits)
CREATE OR REPLACE FUNCTION can_user_make_request(
    user_uuid UUID,
    provider_uuid UUID,
    estimated_tokens INTEGER DEFAULT 1000
) RETURNS BOOLEAN AS $$
DECLARE
    user_limit user_usage_limits%ROWTYPE;
    current_month_text TEXT;
BEGIN
    current_month_text = TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get or create user limits
    SELECT * INTO user_limit 
    FROM user_usage_limits 
    WHERE user_id = user_uuid AND provider_id = provider_uuid;
    
    IF NOT FOUND THEN
        -- Create default limits for new user
        INSERT INTO user_usage_limits (user_id, provider_id, current_month)
        VALUES (user_uuid, provider_uuid, current_month_text);
        RETURN true;
    END IF;
    
    -- Reset monthly counters if month changed
    IF user_limit.current_month != current_month_text THEN
        UPDATE user_usage_limits 
        SET current_month = current_month_text,
            free_tier_requests_used = 0,
            free_tier_tokens_used = 0
        WHERE id = user_limit.id;
        RETURN true;
    END IF;
    
    -- Check if user has own API key (unlimited if they do)
    IF EXISTS (
        SELECT 1 FROM user_api_keys 
        WHERE user_id = user_uuid 
        AND provider_id = provider_uuid 
        AND is_active = true 
        AND deleted_at IS NULL
    ) THEN
        RETURN true;
    END IF;
    
    -- Check free tier limits
    IF user_limit.free_tier_requests_used >= user_limit.free_tier_requests_limit THEN
        RETURN false;
    END IF;
    
    IF user_limit.free_tier_tokens_used + estimated_tokens > user_limit.free_tier_tokens_limit THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to record API usage
CREATE OR REPLACE FUNCTION record_api_usage(
    provider_uuid UUID,
    project_uuid UUID,
    operation_type TEXT,
    model_used TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    key_source TEXT,
    response_time_ms INTEGER DEFAULT NULL,
    success BOOLEAN DEFAULT true,
    error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    usage_id UUID;
    calculated_cost INTEGER;
    user_key_id UUID;
    user_uuid UUID;
BEGIN
    -- Get user_id from project
    SELECT userId INTO user_uuid FROM projects WHERE id = project_uuid;
    -- Calculate cost
    calculated_cost = calculate_api_cost(provider_uuid, input_tokens, output_tokens);
    
    -- Get user key ID if using user's key
    IF key_source = 'user' THEN
        SELECT id INTO user_key_id 
        FROM user_api_keys 
        WHERE user_id = user_uuid 
        AND provider_id = provider_uuid 
        AND is_active = true 
        AND deleted_at IS NULL
        LIMIT 1;
    END IF;
    
    -- Insert usage record
    INSERT INTO api_usage (
        provider_id, project_id, user_api_key_id,
        operation_type, model_used,
        input_tokens, output_tokens,
        input_cost_cents, output_cost_cents,
        key_source, response_time_ms, success, error_message,
        date
    ) VALUES (
        provider_uuid, project_uuid, user_key_id,
        operation_type, model_used,
        input_tokens, output_tokens,
        calculated_cost * input_tokens / (input_tokens + output_tokens), -- Proportional split
        calculated_cost * output_tokens / (input_tokens + output_tokens),
        key_source, response_time_ms, success, error_message,
        CURRENT_DATE
    ) RETURNING id INTO usage_id;
    
    -- Update user limits if using free tier
    IF key_source = 'free_tier' THEN
        INSERT INTO user_usage_limits (user_id, provider_id, current_month, free_tier_requests_used, free_tier_tokens_used)
        VALUES (user_uuid, provider_uuid, TO_CHAR(NOW(), 'YYYY-MM'), 1, input_tokens + output_tokens)
        ON CONFLICT (user_id, provider_id) 
        DO UPDATE SET
            free_tier_requests_used = user_usage_limits.free_tier_requests_used + 1,
            free_tier_tokens_used = user_usage_limits.free_tier_tokens_used + input_tokens + output_tokens,
            updated_at = NOW();
    END IF;
    
    -- Update last used timestamp for user key
    IF user_key_id IS NOT NULL THEN
        UPDATE user_api_keys 
        SET last_used_at = NOW() 
        WHERE id = user_key_id;
    END IF;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- User's current month usage summary
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
    AND a.date >= DATE_TRUNC('month', NOW())::date
    GROUP BY proj.userId, a.provider_id
) user_usage ON u.user_id = user_usage.user_id AND u.provider_id = user_usage.provider_id;

-- Provider usage analytics (for platform monitoring)
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

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

INSERT INTO providers (
    provider_key, display_name, description, website_url, docs_url, signup_url,
    api_base_url, auth_header_format,
    rate_limit_rpm, rate_limit_tpm,
    pricing_model, input_cost_per_1m_tokens, output_cost_per_1m_tokens,
    default_model, max_context_tokens, max_output_tokens,
    supports_streaming, supports_functions, supports_vision
) VALUES 
(
    'anthropic',
    'Claude (Anthropic)',
    'Advanced AI with strong reasoning, coding, and analysis capabilities',
    'https://anthropic.com',
    'https://docs.anthropic.com',
    'https://console.anthropic.com',
    'https://api.anthropic.com',
    'Bearer {key}',
    50, -- 50 RPM
    40000, -- 40k TPM
    'per_token',
    3000, -- $3 per 1M input tokens (in micro-cents)
    15000, -- $15 per 1M output tokens
    'claude-3-5-sonnet-20241022',
    200000,
    8192,
    true, true, true
),
(
    'openai',
    'ChatGPT (OpenAI)',
    'Popular AI model with broad capabilities and extensive ecosystem',
    'https://openai.com',
    'https://platform.openai.com/docs',
    'https://platform.openai.com/signup',
    'https://api.openai.com',
    'Bearer {key}',
    60, -- 60 RPM  
    150000, -- 150k TPM
    'per_token',
    2500, -- $2.50 per 1M input tokens
    10000, -- $10 per 1M output tokens  
    'gpt-4o',
    128000,
    16384,
    true, true, true
),
(
    'google',
    'Gemini (Google)',
    'Google\'s multimodal AI with large context and competitive pricing',
    'https://ai.google.dev',
    'https://ai.google.dev/docs',
    'https://makersuite.google.com',
    'https://generativelanguage.googleapis.com',
    'Bearer {key}',
    30, -- 30 RPM
    32000, -- 32k TPM
    'per_token',
    1250, -- $1.25 per 1M input tokens
    5000, -- $5 per 1M output tokens
    'gemini-1.5-pro',
    1000000,
    8192,
    true, true, true
);