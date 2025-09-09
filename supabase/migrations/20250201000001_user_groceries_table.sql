-- Create user_groceries table for grocery list management
-- Phase 1: Core Foundation - Database Layer

BEGIN;

-- Create user_groceries table
CREATE TABLE user_groceries (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  groceries jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE user_groceries ENABLE ROW LEVEL SECURITY;

-- Users can only access their own groceries
CREATE POLICY "user_groceries_own_data" ON user_groceries
FOR ALL USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER user_groceries_set_updated_at
  BEFORE UPDATE ON user_groceries
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- Add helpful comment
COMMENT ON TABLE user_groceries IS 'User grocery selections for AI recipe personalization';
COMMENT ON COLUMN user_groceries.groceries IS 'JSONB structure: {"category": ["ingredient1", "ingredient2"]}';

COMMIT;
