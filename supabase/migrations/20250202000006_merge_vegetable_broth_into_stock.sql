BEGIN;

-- Add 'vegetable broth' as a synonym of canonical 'vegetable stock'
UPDATE global_ingredients
SET synonyms = (
  SELECT ARRAY(SELECT DISTINCT UNNEST( COALESCE(synonyms, '{}') || ARRAY['vegetable broth'] ))
)
WHERE normalized_name = 'vegetable stock';

-- Remove non-canonical duplicate row if it exists
DELETE FROM global_ingredients
WHERE normalized_name = 'vegetable broth';

COMMIT;


