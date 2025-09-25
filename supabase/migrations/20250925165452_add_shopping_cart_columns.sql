-- Migration: Add shopping cart functionality to existing user_groceries table
-- Date: 2025-09-25
-- Description: Extends user_groceries with shopping_list and shopping_contexts JSONB columns

BEGIN;

-- Add shopping cart functionality to existing user_groceries table
ALTER TABLE user_groceries 
ADD COLUMN IF NOT EXISTS shopping_list JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS shopping_contexts JSONB DEFAULT '{}';

-- Add performance indexes for JSONB operations
CREATE INDEX IF NOT EXISTS idx_user_groceries_shopping_list 
    ON user_groceries USING GIN (shopping_list);

CREATE INDEX IF NOT EXISTS idx_user_groceries_shopping_contexts 
    ON user_groceries USING GIN (shopping_contexts);

-- Add partial index for active shopping lists (performance optimization)
CREATE INDEX IF NOT EXISTS idx_user_groceries_active_shopping 
    ON user_groceries (user_id) 
    WHERE shopping_list != '{}';

-- Add helpful comments for documentation
COMMENT ON COLUMN user_groceries.shopping_list IS 
    'Shopping list status tracking: {"ingredient_name": "pending|purchased"}';

COMMENT ON COLUMN user_groceries.shopping_contexts IS 
    'Shopping item contexts: {"ingredient_name": {"sources": [...], "quantities": [...], "notes": "..."}}';

-- Add data validation constraints
ALTER TABLE user_groceries 
ADD CONSTRAINT check_shopping_list_is_object 
    CHECK (jsonb_typeof(shopping_list) = 'object'),
ADD CONSTRAINT check_shopping_contexts_is_object 
    CHECK (jsonb_typeof(shopping_contexts) = 'object');

-- Create validation function for shopping status values
CREATE OR REPLACE FUNCTION validate_shopping_status(status_json jsonb)
RETURNS boolean AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 
        FROM jsonb_each_text(status_json) 
        WHERE value NOT IN ('pending', 'purchased')
    );
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate shopping status values
ALTER TABLE user_groceries 
ADD CONSTRAINT check_valid_shopping_status 
    CHECK (validate_shopping_status(shopping_list));

COMMIT;
