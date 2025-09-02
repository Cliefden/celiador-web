-- Mock users and usage data for testing cost monitoring dashboard
-- Run this in your Supabase SQL editor to populate test data

-- First, get the provider IDs
DO $$
DECLARE
    anthropic_id UUID;
    openai_id UUID;
    google_id UUID;
    user1_id UUID := '11111111-1111-1111-1111-111111111111';
    user2_id UUID := '22222222-2222-2222-2222-222222222222';
    user3_id UUID := '33333333-3333-3333-3333-333333333333';
    project1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    project2_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    project3_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    i INTEGER;
    random_date DATE;
    random_hour INTEGER;
    random_cost INTEGER;
    random_tokens INTEGER;
    random_response_time INTEGER;
    operation_types TEXT[] := ARRAY['claude_code', 'chat', 'template_gen', 'code_review'];
    key_sources TEXT[] := ARRAY['platform', 'free_tier', 'user'];
BEGIN
    -- Get provider IDs
    SELECT id INTO anthropic_id FROM providers WHERE provider_key = 'anthropic';
    SELECT id INTO openai_id FROM providers WHERE provider_key = 'openai';
    SELECT id INTO google_id FROM providers WHERE provider_key = 'google';

    -- Insert new mock users into auth.users table (profiles will be auto-generated)
    INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data) VALUES
        (user1_id, 'john.doe@example.com', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', '{"full_name": "John Doe", "username": "johndoe"}'),
        (user2_id, 'jane.smith@example.com', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', '{"full_name": "Jane Smith", "username": "janesmith"}'),
        (user3_id, 'mike.wilson@example.com', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', '{"full_name": "Mike Wilson", "username": "mikewilson"}')
    ON CONFLICT (id) DO NOTHING;

    -- Wait a moment for trigger to create profiles, then update with additional data
    PERFORM pg_sleep(1);
    
    -- Update the auto-generated profiles with additional personal data
    UPDATE profiles SET
        website = 'https://johndoe.dev',
        first_name = 'John',
        last_name = 'Doe',
        phone_number = '+1-555-0101'
    WHERE id = user1_id;
    
    UPDATE profiles SET
        website = 'https://janesmith.design',
        first_name = 'Jane',
        last_name = 'Smith',
        phone_number = '+1-555-0102'
    WHERE id = user2_id;
    
    UPDATE profiles SET
        website = 'https://mikewilson.tech',
        first_name = 'Mike',
        last_name = 'Wilson',
        phone_number = '+1-555-0103'
    WHERE id = user3_id;

    -- Insert mock projects if they don't exist
    INSERT INTO projects (id, name, userid, templatekey, status) VALUES
        (project1_id, 'E-commerce Platform', user1_id, 'nextjs-ecommerce', 'READY'),
        (project2_id, 'Social Media App', user2_id, 'react-social', 'READY'),
        (project3_id, 'Dashboard Analytics', user3_id, 'nextjs-dashboard', 'READY')
    ON CONFLICT (id) DO NOTHING;

    -- Insert mock user API keys (some users have BYOK, others use free tier)
    INSERT INTO user_api_keys (id, user_id, provider_id, key_name, encrypted_key, key_hash, is_active, created_at, creator) VALUES
        (gen_random_uuid(), user1_id, anthropic_id, 'My Anthropic Key', 'encrypted_key_data_1', 'hash_of_key_1', true, NOW() - INTERVAL '10 days', user1_id),
        (gen_random_uuid(), user2_id, openai_id, 'My OpenAI Key', 'encrypted_key_data_2', 'hash_of_key_2', true, NOW() - INTERVAL '15 days', user2_id)
    ON CONFLICT DO NOTHING;

    -- Insert mock user usage limits
    INSERT INTO user_usage_limits (id, user_id, provider_id, free_tier_requests_limit, free_tier_tokens_limit, free_tier_requests_used, free_tier_tokens_used, current_month, created_at, creator) VALUES
        (gen_random_uuid(), user1_id, anthropic_id, 100, 200000, 45, 125000, TO_CHAR(NOW(), 'YYYY-MM'), NOW() - INTERVAL '10 days', user1_id),
        (gen_random_uuid(), user2_id, openai_id, 75, 150000, 32, 89000, TO_CHAR(NOW(), 'YYYY-MM'), NOW() - INTERVAL '15 days', user2_id),
        (gen_random_uuid(), user3_id, anthropic_id, 50, 100000, 55, 105000, TO_CHAR(NOW(), 'YYYY-MM'), NOW() - INTERVAL '5 days', user3_id)
    ON CONFLICT DO NOTHING;

    -- Generate mock API usage data for the last 45 days
    FOR i IN 1..500 LOOP
        -- Random date in the last 45 days
        random_date := CURRENT_DATE - (random() * 45)::INTEGER;
        random_hour := (random() * 24)::INTEGER;
        
        -- Random cost between $0.001 and $0.50
        random_cost := (random() * 49000 + 100)::INTEGER; -- 100-50000 cents
        
        -- Random token usage
        random_tokens := (random() * 8000 + 500)::INTEGER;
        
        -- Random response time
        random_response_time := (random() * 3000 + 200)::INTEGER;
        
        INSERT INTO api_usage (
            id,
            provider_id,
            project_id,
            operation_type,
            model_used,
            input_tokens,
            output_tokens,
            key_source,
            input_cost_cents,
            output_cost_cents,
            response_time_ms,
            success,
            date,
            created_at,
            creator
        ) VALUES (
            gen_random_uuid(),
            CASE (random() * 3)::INTEGER
                WHEN 0 THEN anthropic_id
                WHEN 1 THEN openai_id
                ELSE google_id
            END,
            CASE (random() * 3)::INTEGER
                WHEN 0 THEN project1_id
                WHEN 1 THEN project2_id
                ELSE project3_id
            END,
            operation_types[1 + (random() * 4)::INTEGER % 4],
            CASE (random() * 3)::INTEGER
                WHEN 0 THEN 'claude-3-5-sonnet'
                WHEN 1 THEN 'gpt-4'
                ELSE 'gemini-pro'
            END,
            (random() * random_tokens * 0.6)::INTEGER, -- input tokens (60% of total)
            (random_tokens * 0.4)::INTEGER, -- output tokens (40% of total)
            key_sources[1 + (random() * 3)::INTEGER % 3],
            (random_cost * 0.6)::INTEGER, -- input cost (60% of total)
            (random_cost * 0.4)::INTEGER, -- output cost (40% of total)
            random_response_time,
            random() > 0.05, -- 95% success rate
            random_date, -- date field (DATE type)
            random_date + (random_hour || ' hours')::INTERVAL, -- created_at field (TIMESTAMP type)
            CASE (random() * 3)::INTEGER
                WHEN 0 THEN user1_id
                WHEN 1 THEN user2_id
                ELSE user3_id
            END
        );
    END LOOP;

    RAISE NOTICE 'Mock data inserted successfully: 500 API usage records, 3 projects, 2 user API keys, 3 usage limits';
END $$;

-- Update provider usage analytics view to refresh with new data
REFRESH MATERIALIZED VIEW IF EXISTS provider_usage_analytics;

-- Show summary of inserted data
SELECT 
    'API Usage Records' as data_type,
    COUNT(*) as count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    SUM(total_cost_cents)/100.0 as total_cost_dollars
FROM api_usage
WHERE created_at > NOW() - INTERVAL '1 minute'

UNION ALL

SELECT 
    'Projects' as data_type,
    COUNT(*) as count,
    MIN(createdat)::DATE as earliest_date,
    MAX(createdat)::DATE as latest_date,
    NULL as total_cost_dollars
FROM projects
WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc')

UNION ALL

SELECT 
    'User API Keys' as data_type,
    COUNT(*) as count,
    MIN(created_at)::DATE as earliest_date,
    MAX(created_at)::DATE as latest_date,
    NULL as total_cost_dollars
FROM user_api_keys
WHERE created_at > NOW() - INTERVAL '1 minute';