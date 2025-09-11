-- Chef Isabella's "Kitchen Reality" Categories Migration
-- Transform ingredient categories from scientific classification to behavioral organization
-- "Group by BEHAVIOR, not biology" - Chef Isabella

BEGIN;

-- First, temporarily remove the existing constraint to allow transformation
ALTER TABLE global_ingredients
  DROP CONSTRAINT IF EXISTS global_ingredients_category_check;

-- Transform existing categories to Chef Isabella's system
-- "vegetables" + "fruits" → "fresh_produce" (The Perishables)
UPDATE global_ingredients 
SET category = 'fresh_produce' 
WHERE category IN ('vegetables', 'fruits');

-- "spices" → "flavor_builders" (The Magic Makers)
UPDATE global_ingredients 
SET category = 'flavor_builders'
WHERE category = 'spices';

-- "dairy" → "dairy_cold" (The Refrigerated)
UPDATE global_ingredients 
SET category = 'dairy_cold'
WHERE category = 'dairy';

-- "pantry" → "pantry_staples" (The Reliable Backups)
UPDATE global_ingredients 
SET category = 'pantry_staples'
WHERE category = 'pantry';

-- Handle any 'other' category items (edge cases)
UPDATE global_ingredients 
SET category = 'cooking_essentials'
WHERE category = 'other' 
  AND (
    name ILIKE '%oil%' OR 
    name ILIKE '%vinegar%' OR 
    name ILIKE '%stock%' OR 
    name ILIKE '%broth%'
  );

-- Any remaining 'other' items default to pantry_staples
UPDATE global_ingredients 
SET category = 'pantry_staples'
WHERE category = 'other';

-- Now add the new CHECK constraint for Chef Isabella's "Kitchen Reality" categories

ALTER TABLE global_ingredients
  ADD CONSTRAINT global_ingredients_category_check CHECK (category IN (
    'proteins', 'fresh_produce', 'flavor_builders', 'cooking_essentials',
    'bakery_grains', 'dairy_cold', 'pantry_staples', 'frozen'
  ));

-- Add comment for documentation
COMMENT ON CONSTRAINT global_ingredients_category_check ON global_ingredients 
IS 'Chef Isabella''s "Kitchen Reality" categories: organized by behavior and kitchen location, not scientific classification';

-- Add table comment to document the transformation
COMMENT ON TABLE global_ingredients 
IS 'Ingredient categories transformed to Chef Isabella''s "Kitchen Reality" system - organized by where ingredients live in the kitchen and how they are used in cooking';

-- Log the transformation with counts
DO $$
DECLARE
    category_counts TEXT;
BEGIN
    SELECT string_agg(
        category || ': ' || cnt::text, 
        ', ' ORDER BY cnt DESC
    ) INTO category_counts
    FROM (
        SELECT category, count(*) as cnt
        FROM global_ingredients 
        GROUP BY category
    ) t;
    
    RAISE NOTICE 'Chef Isabella''s Kitchen Reality transformation complete!';
    RAISE NOTICE 'New category distribution: %', category_counts;
END $$;

COMMIT;
