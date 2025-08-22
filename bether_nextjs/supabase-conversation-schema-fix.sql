-- Fix for missing updatedAt columns in conversation schema
-- Run this in Supabase SQL Editor to add missing updatedAt fields

-- Add updatedAt column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updatedAt column to conversation_contexts table  
ALTER TABLE conversation_contexts ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE conversation_contexts ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have proper timestamps
UPDATE messages SET updatedAt = createdAt WHERE updatedAt IS NULL;
UPDATE conversation_contexts SET 
    updatedAt = lastUpdated,
    createdAt = lastUpdated 
WHERE updatedAt IS NULL OR createdAt IS NULL;

-- Add missing updatedAt column to service_integrations if needed
ALTER TABLE service_integrations ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW();
UPDATE service_integrations SET updatedAt = createdAt WHERE updatedAt IS NULL;