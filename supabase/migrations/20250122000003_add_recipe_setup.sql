-- Add setup field to recipes table
ALTER TABLE recipes ADD COLUMN setup text[] DEFAULT '{}' NOT NULL;

-- Add comment to explain the setup field
COMMENT ON COLUMN recipes.setup IS 'Array of setup/prep-ahead instructions (e.g., soak beans overnight, marinate chicken)';
