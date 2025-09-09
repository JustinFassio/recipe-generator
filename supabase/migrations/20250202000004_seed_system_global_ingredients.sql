BEGIN;

-- Insert baseline system ingredients if they don't already exist
INSERT INTO global_ingredients (name, normalized_name, category, synonyms, usage_count, is_verified, is_system)
SELECT * FROM (
  VALUES
    ('Maple Syrup', 'maple syrup', 'pantry', ARRAY['pure maple syrup','syrup'], 10, true, true),
    ('Dark Chocolate', 'dark chocolate', 'pantry', ARRAY['bittersweet chocolate','semisweet chocolate'], 10, true, true),
    ('Olive Oil', 'olive oil', 'pantry', ARRAY['extra virgin olive oil','evoo'], 25, true, true),
    ('Vanilla Extract', 'vanilla extract', 'pantry', ARRAY['vanilla'], 20, true, true)
) AS t(name, normalized_name, category, synonyms, usage_count, is_verified, is_system)
WHERE NOT EXISTS (
  SELECT 1 FROM global_ingredients gi WHERE gi.normalized_name = t.normalized_name
);

COMMIT;


