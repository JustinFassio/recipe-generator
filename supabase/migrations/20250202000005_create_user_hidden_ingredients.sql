BEGIN;

CREATE TABLE IF NOT EXISTS user_hidden_ingredients (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  normalized_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, normalized_name)
);

COMMENT ON TABLE user_hidden_ingredients IS 'Per-user hidden ingredients to suppress system items from groceries page';

ALTER TABLE user_hidden_ingredients ENABLE ROW LEVEL SECURITY;

-- Policies: only owner can manage their hidden list
DO $$ BEGIN
  CREATE POLICY "Users can view their hidden ingredients" ON user_hidden_ingredients
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their hidden ingredients" ON user_hidden_ingredients
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their hidden ingredients" ON user_hidden_ingredients
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_user_hidden_ingredients_user ON user_hidden_ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hidden_ingredients_name ON user_hidden_ingredients(normalized_name);

COMMIT;


