/*
# Phase 1B: User Safety Data Migration

This migration creates the user_safety table for allergies and dietary restrictions
following the feature-first/atomic component architecture.

## Changes:
- Create user_safety table with allergies and dietary_restrictions arrays
- Add RLS policies for self-access only
- Add triggers for automatic updated_at
- Maintain backward compatibility

## Phase: 1B - Safety Data
## Atomic Feature: User safety and dietary restrictions management
*/

-- Create user_safety table for safety-critical data
CREATE TABLE IF NOT EXISTS user_safety (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  allergies text[] DEFAULT '{}',
  dietary_restrictions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_safety ENABLE ROW LEVEL SECURITY;

-- Create self-access policy (users can only access their own safety data)
CREATE POLICY "user_safety_self_access" ON user_safety 
  FOR ALL USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER user_safety_set_updated_at
  BEFORE UPDATE ON user_safety
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_safety_user_id_idx ON user_safety (user_id);
CREATE INDEX IF NOT EXISTS user_safety_allergies_idx ON user_safety USING GIN (allergies);
CREATE INDEX IF NOT EXISTS user_safety_dietary_restrictions_idx ON user_safety USING GIN (dietary_restrictions);

-- Add helpful comments
COMMENT ON TABLE user_safety IS 'Safety-critical user data including allergies and dietary restrictions';
COMMENT ON COLUMN user_safety.allergies IS 'Array of allergens that must be strictly avoided';
COMMENT ON COLUMN user_safety.dietary_restrictions IS 'Array of dietary restrictions (vegan, vegetarian, etc.)';
