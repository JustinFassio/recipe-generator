-- Create global ingredients table for community-driven ingredient database
-- Phase 1: Core Foundation - Database Layer

BEGIN;

-- Create global_ingredients table
CREATE TABLE global_ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  normalized_name text NOT NULL,
  category text NOT NULL,
  synonyms text[] DEFAULT '{}',
  usage_count integer DEFAULT 1,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT global_ingredients_name_check CHECK (length(name) >= 2),
  CONSTRAINT global_ingredients_category_check CHECK (category IN (
    'proteins', 'vegetables', 'spices', 'pantry', 'dairy', 'fruits', 'other'
  )),
  CONSTRAINT global_ingredients_usage_count_check CHECK (usage_count > 0)
);

-- Indexes for performance
CREATE INDEX idx_global_ingredients_normalized_name ON global_ingredients(normalized_name);
CREATE INDEX idx_global_ingredients_category ON global_ingredients(category);
CREATE INDEX idx_global_ingredients_usage_count ON global_ingredients(usage_count DESC);
CREATE INDEX idx_global_ingredients_created_at ON global_ingredients(created_at DESC);
CREATE INDEX idx_global_ingredients_is_verified ON global_ingredients(is_verified);

-- Unique constraint on normalized name to prevent duplicates
CREATE UNIQUE INDEX idx_global_ingredients_unique_normalized 
ON global_ingredients(normalized_name);

-- Enable RLS
ALTER TABLE global_ingredients ENABLE ROW LEVEL SECURITY;

-- Everyone can read global ingredients
CREATE POLICY "Global ingredients are readable by everyone" ON global_ingredients
FOR SELECT USING (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can add global ingredients" ON global_ingredients
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only the creator or admin can update
CREATE POLICY "Users can update their own global ingredients" ON global_ingredients
FOR UPDATE USING (auth.uid() = created_by);

-- Auto-update timestamp trigger
CREATE TRIGGER global_ingredients_set_updated_at
  BEFORE UPDATE ON global_ingredients
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- Add helpful comments
COMMENT ON TABLE global_ingredients IS 'Community-driven global ingredients database for recipe matching';
COMMENT ON COLUMN global_ingredients.name IS 'Original ingredient name as it appears in recipes';
COMMENT ON COLUMN global_ingredients.normalized_name IS 'Normalized version for matching (lowercase, no punctuation)';
COMMENT ON COLUMN global_ingredients.category IS 'Grocery category: proteins, vegetables, spices, pantry, dairy, fruits, other';
COMMENT ON COLUMN global_ingredients.synonyms IS 'Alternative names and variations for this ingredient';
COMMENT ON COLUMN global_ingredients.usage_count IS 'How many times this ingredient has been used in recipes';
COMMENT ON COLUMN global_ingredients.is_verified IS 'Whether this ingredient has been manually verified by admin';

COMMIT;
