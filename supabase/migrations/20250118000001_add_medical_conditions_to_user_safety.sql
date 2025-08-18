-- Add medical_conditions field to user_safety table
ALTER TABLE user_safety ADD COLUMN IF NOT EXISTS medical_conditions text[] DEFAULT '{}';

-- Add GIN index for medical_conditions array operations
CREATE INDEX IF NOT EXISTS user_safety_medical_conditions_idx ON user_safety USING gin(medical_conditions);

-- Update the existing trigger to handle medical_conditions updates
-- (The moddatetime trigger already handles all columns, so no change needed)
