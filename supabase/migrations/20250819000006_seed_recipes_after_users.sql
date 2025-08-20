/*
# Seed Recipes After Users (Production Safe)

This migration creates sample recipes only if seed users exist.
If seed users don't exist (like in production), this migration will skip recipe seeding.
This ensures migrations don't fail in production environments.
*/

-- Insert sample recipes with proper user ownership, but only if seed users exist
DO $$
DECLARE
  alice_id UUID;
  bob_id UUID;
  cora_id UUID;
BEGIN
  -- Fetch user IDs (but don't fail if they don't exist)
  SELECT id INTO alice_id FROM auth.users WHERE email = 'alice@example.com' LIMIT 1;
  SELECT id INTO bob_id   FROM auth.users WHERE email = 'bob@example.com'   LIMIT 1;
  SELECT id INTO cora_id  FROM auth.users WHERE email = 'cora@example.com'  LIMIT 1;
  
  -- Only proceed if ALL seed users exist (for development environments)
  IF alice_id IS NOT NULL AND bob_id IS NOT NULL AND cora_id IS NOT NULL THEN
    -- Insert recipes
    INSERT INTO public.recipes (id, title, ingredients, instructions, notes, image_url, user_id, is_public)
    VALUES
      (
        '11111111-1111-1111-1111-111111111111',
        'Avocado Toast',
        ARRAY['2 slices sourdough','1 ripe avocado','salt','pepper','chili flakes'],
        'Toast bread. Mash avocado with salt and pepper. Spread and top with chili flakes.',
        'Simple, fast breakfast.',
        'https://picsum.photos/seed/avocado_toast/800/600',
        alice_id,
        true
      ),
      (
        '22222222-2222-2222-2222-222222222222',
        'Classic Caesar Salad',
        ARRAY['romaine lettuce','parmesan','croutons','caesar dressing','lemon'],
        'Chop lettuce. Toss with dressing, croutons, parmesan. Finish with lemon.',
        'Great with grilled chicken.',
        'https://picsum.photos/seed/caesar_salad/800/600',
        bob_id,
        true
      ),
      (
        '33333333-3333-3333-3333-333333333333',
        'One-Pot Pasta',
        ARRAY['spaghetti','garlic','olive oil','tomatoes','basil','salt'],
        'Cook garlic in oil. Add tomatoes and pasta with water. Simmer until tender. Finish with basil.',
        'Weeknight friendly.',
        'https://picsum.photos/seed/one_pot_pasta/800/600',
        cora_id,
        true
      ),
      (
        '44444444-4444-4444-4444-444444444444',
        'Grilled Chicken Breast',
        ARRAY['chicken breast','olive oil','garlic powder','paprika','salt','pepper'],
        'Season chicken. Grill 6-8 minutes per side until 165°F internal temperature.',
        'Perfect for meal prep.',
        'https://picsum.photos/seed/grilled_chicken/800/600',
        bob_id,
        true
      ),
      (
        '55555555-5555-5555-5555-555555555555',
        'Spanish Paella',
        ARRAY['rice','saffron','shrimp','chicken','bell peppers','onion','garlic'],
        'Sauté aromatics. Add rice and saffron. Layer with proteins and simmer until rice is tender.',
        'Traditional Spanish dish.',
        'https://picsum.photos/seed/paella/800/600',
        cora_id,
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
      
    RAISE NOTICE 'Seed recipes inserted successfully';
  ELSE
    RAISE NOTICE 'Seed users not found - skipping recipe seeding (this is normal in production)';
  END IF;
END $$;
