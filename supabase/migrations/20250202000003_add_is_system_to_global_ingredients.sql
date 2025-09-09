BEGIN;

ALTER TABLE global_ingredients
  ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_global_ingredients_is_system
  ON global_ingredients(is_system);

COMMENT ON COLUMN global_ingredients.is_system IS 'Whether this ingredient is an administrator-provided system staple';

COMMIT;


