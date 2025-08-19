-- Seed data for local development.
-- This file runs automatically after migrations during `supabase db reset`.
-- Keep it idempotent using stable IDs and ON CONFLICT upserts.

begin;

-- Public sample recipes (no user ownership required)
insert into public.recipes (id, title, ingredients, instructions, notes, image_url, user_id)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Avocado Toast',
    array['2 slices sourdough','1 ripe avocado','salt','pepper','chili flakes'],
    'Toast bread. Mash avocado with salt and pepper. Spread and top with chili flakes.',
    'Simple, fast breakfast.',
    'https://picsum.photos/seed/avocado_toast/800/600',
    null
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Classic Caesar Salad',
    array['romaine lettuce','parmesan','croutons','caesar dressing','lemon'],
    'Chop lettuce. Toss with dressing, croutons, parmesan. Finish with lemon.',
    'Great with grilled chicken.',
    'https://picsum.photos/seed/caesar_salad/800/600',
    null
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'One-Pot Pasta',
    array['spaghetti','garlic','olive oil','tomatoes','basil','salt'],
    'Cook garlic in oil. Add tomatoes and pasta with water. Simmer until tender. Finish with basil.',
    'Weeknight friendly.',
    'https://picsum.photos/seed/one_pot_pasta/800/600',
    null
  )
on conflict (id) do update set
  title = excluded.title,
  ingredients = excluded.ingredients,
  instructions = excluded.instructions,
  notes = excluded.notes,
  image_url = excluded.image_url;

commit;


