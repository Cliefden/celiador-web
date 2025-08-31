-- Bether Subscription System Database Schema
-- Run this in Supabase SQL Editor

-- 1. Create subscription tiers enum
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');

-- 2. Update profiles table to include current tier
ALTER TABLE profiles 
ADD COLUMN current_tier subscription_tier DEFAULT 'free',
ADD COLUMN subscription_status subscription_status DEFAULT 'active',
ADD COLUMN trial_ends_at TIMESTAMPTZ;

-- 3. Create subscriptions table
CREATE TABLE subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    billing_cycle billing_cycle,
    
    -- Stripe integration
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    stripe_price_id TEXT,
    
    -- Billing dates
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    
    -- Pricing
    amount_cents INTEGER,
    currency TEXT DEFAULT 'usd',
    
    UNIQUE(user_id) -- One active subscription per user
);

-- 4. Create subscription limits table (defines what each tier gets)
CREATE TABLE subscription_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier subscription_tier NOT NULL UNIQUE,
    
    -- Project limits
    max_projects INTEGER NOT NULL,
    max_templates INTEGER,
    
    -- Feature flags
    voice_commands BOOLEAN DEFAULT FALSE,
    github_integration BOOLEAN DEFAULT FALSE,
    custom_templates BOOLEAN DEFAULT FALSE,
    team_collaboration BOOLEAN DEFAULT FALSE,
    advanced_ai_models BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    analytics_dashboard BOOLEAN DEFAULT FALSE,
    sso_integration BOOLEAN DEFAULT FALSE,
    
    -- API limits
    api_calls_per_month INTEGER,
    max_deployments_per_month INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert default tier limits
INSERT INTO subscription_limits (tier, max_projects, voice_commands, github_integration, custom_templates, team_collaboration, advanced_ai_models, priority_support, analytics_dashboard, sso_integration, api_calls_per_month, max_deployments_per_month) VALUES
('free', 2, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 100, 5),
('pro', 25, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, FALSE, 1000, 50),
('enterprise', -1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, -1, -1); -- -1 means unlimited

-- 6. Create usage tracking table
CREATE TABLE usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Current month usage
    month_year TEXT NOT NULL, -- Format: "2025-08"
    projects_created INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    deployments_made INTEGER DEFAULT 0,
    voice_commands_used INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, month_year)
);

-- 7. Create subscription events table (for audit trail)
CREATE TABLE subscription_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'renewed'
    from_tier subscription_tier,
    to_tier subscription_tier,
    amount_cents INTEGER,
    
    -- Stripe data
    stripe_event_id TEXT,
    stripe_invoice_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
ON subscriptions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
ON subscriptions FOR UPDATE
USING (user_id = auth.uid());

-- 10. RLS Policies for subscription_limits (read-only for all users)
CREATE POLICY "Everyone can view subscription limits"
ON subscription_limits FOR SELECT
TO authenticated
USING (true);

-- 11. RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage"
ON usage_tracking FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own usage"
ON usage_tracking FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert usage data"
ON usage_tracking FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 12. RLS Policies for subscription_events
CREATE POLICY "Users can view their own subscription events"
ON subscription_events FOR SELECT
USING (user_id = auth.uid());

-- 13. Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_usage_tracking_user_month ON usage_tracking(user_id, month_year);
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at DESC);

-- 14. Create functions for usage tracking
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_usage_type TEXT,
    p_amount INTEGER DEFAULT 1
) RETURNS VOID AS $$
DECLARE
    current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
    INSERT INTO usage_tracking (user_id, month_year, projects_created, api_calls_made, deployments_made, voice_commands_used)
    VALUES (
        p_user_id, 
        current_month,
        CASE WHEN p_usage_type = 'project' THEN p_amount ELSE 0 END,
        CASE WHEN p_usage_type = 'api_call' THEN p_amount ELSE 0 END,
        CASE WHEN p_usage_type = 'deployment' THEN p_amount ELSE 0 END,
        CASE WHEN p_usage_type = 'voice_command' THEN p_amount ELSE 0 END
    )
    ON CONFLICT (user_id, month_year)
    DO UPDATE SET
        projects_created = usage_tracking.projects_created + CASE WHEN p_usage_type = 'project' THEN p_amount ELSE 0 END,
        api_calls_made = usage_tracking.api_calls_made + CASE WHEN p_usage_type = 'api_call' THEN p_amount ELSE 0 END,
        deployments_made = usage_tracking.deployments_made + CASE WHEN p_usage_type = 'deployment' THEN p_amount ELSE 0 END,
        voice_commands_used = usage_tracking.voice_commands_used + CASE WHEN p_usage_type = 'voice_command' THEN p_amount ELSE 0 END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create function to check if user can perform action
CREATE OR REPLACE FUNCTION can_user_perform_action(
    p_user_id UUID,
    p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_tier subscription_tier;
    tier_limits RECORD;
    current_usage RECORD;
    current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
    -- Get user's current tier
    SELECT current_tier INTO user_tier
    FROM profiles 
    WHERE id = p_user_id;
    
    -- Get tier limits
    SELECT * INTO tier_limits
    FROM subscription_limits
    WHERE tier = user_tier;
    
    -- Get current usage
    SELECT * INTO current_usage
    FROM usage_tracking
    WHERE user_id = p_user_id AND month_year = current_month;
    
    -- Check specific actions
    CASE p_action
        WHEN 'create_project' THEN
            IF tier_limits.max_projects = -1 THEN -- unlimited
                RETURN TRUE;
            END IF;
            
            SELECT COUNT(*) <= tier_limits.max_projects
            FROM projects
            WHERE user_id = p_user_id AND deleter IS NULL;
            
        WHEN 'voice_command' THEN
            RETURN tier_limits.voice_commands;
            
        WHEN 'github_integration' THEN
            RETURN tier_limits.github_integration;
            
        WHEN 'custom_template' THEN
            RETURN tier_limits.custom_templates;
            
        ELSE
            RETURN FALSE;
    END CASE;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;