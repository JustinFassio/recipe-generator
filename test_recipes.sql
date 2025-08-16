-- Test recipes for local development
-- Run this in Supabase Studio SQL Editor

INSERT INTO recipes (title, ingredients, instructions, notes, image_url, user_id) VALUES
(
  'Spicy Thai Basil Chicken',
  ARRAY['chicken breast', 'basil leaves', 'chili peppers', 'garlic', 'soy sauce'],
  'Cook chicken with basil and chili peppers. Add garlic and soy sauce for flavor.',
  'A quick and spicy Thai-inspired dish',
  'http://127.0.0.1:54321/storage/v1/object/public/recipe-images/388d419c-b0bd-48c7-ac41-b65f572750cc/1755220104434.jpg',
  '388d419c-b0bd-48c7-ac41-b65f572750cc'
),
(
  'Homemade Sourdough Bread',
  ARRAY['flour', 'water', 'salt', 'sourdough starter'],
  'Mix ingredients and let rise. Bake at high temperature until golden brown.',
  'Traditional sourdough bread with a crispy crust',
  'http://127.0.0.1:54321/storage/v1/object/public/recipe-images/388d419c-b0bd-48c7-ac41-b65f572750cc/1755219597530.jpeg',
  '388d419c-b0bd-48c7-ac41-b65f572750cc'
),
(
  'Chocolate Lava Cake',
  ARRAY['dark chocolate', 'butter', 'eggs', 'sugar', 'flour'],
  'Melt chocolate and butter. Mix with eggs and sugar. Bake until edges are set but center is gooey.',
  'Decadent chocolate cake with a molten center',
  'http://127.0.0.1:54321/storage/v1/object/public/recipe-images/388d419c-b0bd-48c7-ac41-b65f572750cc/1755272174915.jpg',
  '388d419c-b0bd-48c7-ac41-b65f572750cc'
);

-- Verify the recipes were inserted
SELECT id, title, image_url, user_id FROM recipes WHERE image_url IS NOT NULL;
