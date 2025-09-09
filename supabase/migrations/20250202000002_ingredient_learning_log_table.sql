-- Create ingredient learning log table for tracking ingredient extraction from recipes
-- Phase 1: Core Foundation - Database Layer

BEGIN;

-- Create ingredient_learning_log table
CREATE TABLE ingredient_learning_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_text text NOT NULL,
  extracted_name text NOT NULL,
  suggested_category text,
  confidence_score numeric(3,2) DEFAULT 0.0,
  was_saved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT ingredient_learning_log_ingredient_text_check CHECK (length(ingredient_text) >= 2),
  CONSTRAINT ingredient_learning_log_extracted_name_check CHECK (length(extracted_name) >= 2),
  CONSTRAINT ingredient_learning_log_confidence_score_check CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0)
);

-- Indexes for learning analytics and performance
CREATE INDEX idx_ingredient_learning_recipe_id ON ingredient_learning_log(recipe_id);
CREATE INDEX idx_ingredient_learning_was_saved ON ingredient_learning_log(was_saved);
CREATE INDEX idx_ingredient_learning_created_at ON ingredient_learning_log(created_at DESC);
CREATE INDEX idx_ingredient_learning_confidence_score ON ingredient_learning_log(confidence_score DESC);

-- Enable RLS
ALTER TABLE ingredient_learning_log ENABLE ROW LEVEL SECURITY;

-- Users can only see learning logs for their own recipes
CREATE POLICY "Users can view learning logs for their own recipes" ON ingredient_learning_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM recipes 
    WHERE recipes.id = ingredient_learning_log.recipe_id 
    AND recipes.user_id = auth.uid()
  )
);

-- Users can insert learning logs for their own recipes
CREATE POLICY "Users can insert learning logs for their own recipes" ON ingredient_learning_log
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM recipes 
    WHERE recipes.id = ingredient_learning_log.recipe_id 
    AND recipes.user_id = auth.uid()
  )
);

-- Add helpful comments
COMMENT ON TABLE ingredient_learning_log IS 'Tracks ingredient extraction and learning from user recipes';
COMMENT ON COLUMN ingredient_learning_log.ingredient_text IS 'Original ingredient text from recipe';
COMMENT ON COLUMN ingredient_learning_log.extracted_name IS 'Cleaned ingredient name for matching';
COMMENT ON COLUMN ingredient_learning_log.suggested_category IS 'AI-suggested grocery category';
COMMENT ON COLUMN ingredient_learning_log.confidence_score IS 'Confidence in the extraction (0.0-1.0)';
COMMENT ON COLUMN ingredient_learning_log.was_saved IS 'Whether this ingredient was saved to global ingredients';

COMMIT;
