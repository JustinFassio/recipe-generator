/*
# Seed Recipes with User Associations

This migration creates sample recipes that are properly associated with seeded users.
This runs after the user seeding to ensure proper user_id references.
*/

-- Insert sample recipes with proper user ownership
INSERT INTO public.recipes (id, title, ingredients, instructions, notes, image_url, user_id, is_public)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Avocado Toast',
    ARRAY['2 slices sourdough','1 ripe avocado','salt','pepper','chili flakes'],
    'Toast bread. Mash avocado with salt and pepper. Spread and top with chili flakes.',
    'Simple, fast breakfast.',
    'https://picsum.photos/seed/avocado_toast/800/600',
    (SELECT id FROM auth.users WHERE email = 'alice@example.com' LIMIT 1),
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Classic Caesar Salad',
    ARRAY['romaine lettuce','parmesan','croutons','caesar dressing','lemon'],
    'Chop lettuce. Toss with dressing, croutons, parmesan. Finish with lemon.',
    'Great with grilled chicken.',
    'https://picsum.photos/seed/caesar_salad/800/600',
    (SELECT id FROM auth.users WHERE email = 'bob@example.com' LIMIT 1),
    true
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'One-Pot Pasta',
    ARRAY['spaghetti','garlic','olive oil','tomatoes','basil','salt'],
    'Cook garlic in oil. Add tomatoes and pasta with water. Simmer until tender. Finish with basil.',
    'Weeknight friendly.',
    'https://picsum.photos/seed/one_pot_pasta/800/600',
    (SELECT id FROM auth.users WHERE email = 'cora@example.com' LIMIT 1),
    true
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  ingredients = EXCLUDED.ingredients,
  instructions = EXCLUDED.instructions,
  notes = EXCLUDED.notes,
  image_url = EXCLUDED.image_url,
  user_id = EXCLUDED.user_id,
  is_public = EXCLUDED.is_public;
