# Recipes Visibility – Explicit is_public Model

Goal: Make recipes private-by-default for signed-in users (My Recipes), expose a read-only public feed via is_public, and support saving (copying) public recipes into a user’s own collection.

## Scope

- Add `is_public boolean DEFAULT false` to `public.recipes`.
- Replace the current image-based public policy with an explicit `is_public = true` policy.
- Preserve owner-only CRUD.
- Keep a separate Explore/Feed that queries public recipes; “My Recipes” shows only the owner’s rows.
- Add a “Save to My Recipes” flow (clone record + copy image to user’s folder).

## Database Changes (Migration)

- Add column:
  - `ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;`
- RLS policies:
  - Drop/replace current: `TO public USING (image_url IS NOT NULL)`.
  - New public read: `TO anon USING (is_public = true)` (optional: also `TO authenticated` for feed while logged-in).
  - Keep owner read: `TO authenticated USING (auth.uid() = user_id)`.
  - Keep owner-only INSERT/UPDATE/DELETE.
- Indexes (optional, later):
  - `CREATE INDEX ... ON public.recipes (is_public, created_at DESC);`

## App Changes

- My Recipes page
  - Update query to filter by `user_id` (owner-only) and remove reliance on public policy.
- Explore/Feed page (new)
  - Query public recipes (`is_public = true`).
  - Show read-only cards with user first name (from `profiles.full_name` → first token).
  - Include “Save to My Recipes” button.
- Save-to-My-Recipes flow
  - Insert a new `recipes` row with current `user_id`, copying fields from the source.
  - Copy the public image into `recipe-images/<current_user_id>/<new_name>` and set `image_url` to the new public URL.
  - Do not mutate the source row.

## Rollout Plan

1. Ship migration adding `is_public` and swapping policies.
2. Update “My Recipes” query to filter by owner.
3. Add Explore/Feed with read-only public query.
4. Implement “Save to My Recipes”.
5. QA: verify RLS anon vs authenticated; ensure owners cannot see or edit others’ private rows.

## Production Readiness

- Keep CORS strict for edge functions in production.
- Ensure auth redirect allowlist includes deployed URLs.
- Consider rate limits for public feed.
- Add tests for RLS and cloning flow.

## Backward Compatibility

- Existing recipes remain private unless explicitly toggled to `is_public = true` by future UI.
- If needed, run a one-off script to mark selected seed/demo recipes public.
