-- Providers table for API key management and pricing
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Provider identification
    provider_key TEXT UNIQUE NOT NULL, -- 'anthropic', 'openai', 'google', etc.
    display_name TEXT NOT NULL, -- 'Claude (Anthropic)', 'ChatGPT (OpenAI)', etc.
    description TEXT,
    website_url TEXT,
    docs_url TEXT,
    
    -- API configuration
    api_base_url TEXT,
    auth_type TEXT NOT NULL DEFAULT 'bearer', -- 'bearer', 'api_key', 'oauth'
    rate_limit_per_minute INTEGER,
    rate_limit_per_day INTEGER,
    
    -- Pricing model
    pricing_model TEXT NOT NULL, -- 'per_token', 'per_request', 'per_minute', 'subscription'
    input_cost_per_1k_tokens DECIMAL(10,6), -- Cost per 1k input tokens
    output_cost_per_1k_tokens DECIMAL(10,6), -- Cost per 1k output tokens
    request_cost_cents INTEGER, -- Fixed cost per request (if applicable)
    currency TEXT DEFAULT 'USD',
    
    -- Model information
    default_model TEXT,
    supported_models JSONB, -- Array of available models
    max_context_tokens INTEGER,
    max_output_tokens INTEGER,
    
    -- Features
    supports_streaming BOOLEAN DEFAULT false,
    supports_function_calling BOOLEAN DEFAULT false,
    supports_vision BOOLEAN DEFAULT false,
    supports_code_execution BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false -- For enterprise providers
);

-- Insert initial provider data
INSERT INTO providers (
    provider_key, display_name, description, website_url, docs_url,
    api_base_url, pricing_model, input_cost_per_1k_tokens, output_cost_per_1k_tokens,
    default_model, max_context_tokens, max_output_tokens,
    supports_streaming, supports_function_calling, supports_vision
) VALUES 
(
    'anthropic',
    'Claude (Anthropic)',
    'Advanced AI assistant with strong reasoning and code capabilities',
    'https://anthropic.com',
    'https://docs.anthropic.com',
    'https://api.anthropic.com',
    'per_token',
    0.003000, -- $3.00 per 1M input tokens
    0.015000, -- $15.00 per 1M output tokens
    'claude-3-5-sonnet-20241022',
    200000,
    8192,
    true,
    true,
    true
),
(
    'openai',
    'ChatGPT (OpenAI)',
    'Popular AI model with broad capabilities and tool use',
    'https://openai.com',
    'https://platform.openai.com/docs',
    'https://api.openai.com',
    'per_token',
    0.003000, -- $3.00 per 1M input tokens for GPT-4
    0.015000, -- $15.00 per 1M output tokens for GPT-4
    'gpt-4-turbo',
    128000,
    4096,
    true,
    true,
    true
),
(
    'google',
    'Gemini (Google)',
    'Google\'s multimodal AI with strong reasoning capabilities',
    'https://ai.google.dev',
    'https://ai.google.dev/docs',
    'https://generativelanguage.googleapis.com',
    'per_token',
    0.001250, -- $1.25 per 1M input tokens for Gemini Pro
    0.005000, -- $5.00 per 1M output tokens for Gemini Pro
    'gemini-1.5-pro',
    1000000,
    8192,
    true,
    true,
    true
);

-- User API keys table (updated to reference providers)
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    
    key_name TEXT, -- User-friendly name like "My Claude Key"
    encrypted_key TEXT NOT NULL,
    key_hash TEXT NOT NULL, -- For identifying without decrypting
    
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    
    UNIQUE(user_id, provider_id, key_hash)
);

-- Usage tracking table (updated to reference providers)
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Usage metrics
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    request_count INTEGER DEFAULT 1,
    
    -- Cost calculation
    cost_cents INTEGER, -- Calculated from provider pricing
    
    -- Context
    operation_type TEXT, -- 'claude_code', 'chat', 'template_generation'
    model_used TEXT,
    
    -- Aggregation helper
    date DATE DEFAULT CURRENT_DATE,
    
    INDEX(user_id, date),
    INDEX(provider_id, date)
);

-- User usage limits (for free tier management)
CREATE TABLE user_usage_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    
    -- Monthly limits (resets each month)
    monthly_token_limit INTEGER DEFAULT 100000, -- 100k tokens free
    monthly_request_limit INTEGER DEFAULT 50, -- 50 requests free
    
    -- Current month usage
    current_month_tokens INTEGER DEFAULT 0,
    current_month_requests INTEGER DEFAULT 0,
    month_year TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
    
    UNIQUE(user_id, provider_id)
);

-- RLS Policies
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_limits ENABLE ROW LEVEL SECURITY;

-- Public read access to providers (everyone can see available providers)
CREATE POLICY "Anyone can view active providers" ON providers
  FOR SELECT TO public
  USING (is_active = true);

-- Users can only see their own API keys
CREATE POLICY "Users can manage their own API keys" ON user_api_keys
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Users can only see their own usage
CREATE POLICY "Users can view their own usage" ON api_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can only see their own limits
CREATE POLICY "Users can view their own limits" ON user_usage_limits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);