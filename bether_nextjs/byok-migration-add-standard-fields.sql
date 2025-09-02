-- ============================================================================
-- Migration: Add Standard Supabasable Fields to BYOK Tables
-- ============================================================================

-- 1. Add standard fields to providers table
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS creator UUID,
ADD COLUMN IF NOT EXISTS updater UUID,
ADD COLUMN IF NOT EXISTS deleter UUID;

-- 2. Add standard fields to user_api_keys table  
ALTER TABLE user_api_keys
ADD COLUMN IF NOT EXISTS creator UUID,
ADD COLUMN IF NOT EXISTS updater UUID,
ADD COLUMN IF NOT EXISTS deleter UUID;

-- 3. Add standard fields to api_usage table
ALTER TABLE api_usage
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS creator UUID,
ADD COLUMN IF NOT EXISTS updater UUID,
ADD COLUMN IF NOT EXISTS deleter UUID;

-- 4. Add standard fields to user_usage_limits table
ALTER TABLE user_usage_limits
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS creator UUID,
ADD COLUMN IF NOT EXISTS updater UUID,
ADD COLUMN IF NOT EXISTS deleter UUID;

-- 5. Add standard fields to usage_summaries table (if exists)
ALTER TABLE usage_summaries
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS creator UUID,
ADD COLUMN IF NOT EXISTS updater UUID,
ADD COLUMN IF NOT EXISTS deleter UUID;

-- 6. Add standard fields to billing_events table (if exists)
ALTER TABLE billing_events
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS creator UUID,
ADD COLUMN IF NOT EXISTS updater UUID,
ADD COLUMN IF NOT EXISTS deleter UUID;

-- 7. Update timestamp column types to match standard (if needed)
-- Note: Only run these if your timestamps are using different types

-- ALTER TABLE providers ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE providers ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- ALTER TABLE user_api_keys ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE user_api_keys ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- ALTER TABLE api_usage ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

-- ALTER TABLE user_usage_limits ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE user_usage_limits ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;