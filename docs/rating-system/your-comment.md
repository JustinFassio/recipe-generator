### "Your Comment" — Logged-in User Rating + Comment

This document explains how the logged-in user’s personal rating and comment are stored, loaded, and displayed across the app.

---

### Goal

- Surface the signed-in user’s own rating and comment for the current recipe/version near the recipe header for quick recognition and edit access.
- Ensure a single, consistent write path and real data (no mocks).

---

### Data Model (Supabase)

- Table: `public.recipe_ratings`
  - `id UUID PK`
  - `recipe_id UUID NOT NULL` → FK `recipes.id`
  - `user_id UUID NOT NULL` → FK `auth.users.id`
  - `rating INTEGER NOT NULL CHECK 1..5`
  - `version_number INTEGER NULL` → targets a specific version (or `NULL` for whole-recipe intent)
  - `comment TEXT NULL` → optional free text, required by our UX
  - `created_at TIMESTAMPTZ DEFAULT now()`
  - `updated_at TIMESTAMPTZ DEFAULT now()`
  - Unique constraint: `UNIQUE(recipe_id, user_id)` (one row per user/recipe)
    - We pass `onConflict: 'recipe_id,user_id'` in upserts to avoid 409s.

- RLS Policies (summary):
  - SELECT: public read
  - INSERT/UPDATE: only the owner row (`auth.uid() = user_id`)

Views used elsewhere (counts/analytics):

- `recipe_aggregate_stats.total_comments` (counts non-empty comments)
- `recipe_version_stats.version_comment_count`

---

### Write Path (Submitting/Editing)

- Component: `src/components/recipes/rate-comment-modal.tsx`
  - Requires both a star rating and a non-empty comment.
  - Calls `ratingApi.submitRating(recipeId, versionNumber, rating, comment)`.
  - Implementation: `src/lib/api/features/rating-api.ts`
    - Uses `upsert({...}, { onConflict: 'recipe_id,user_id' })` then `select('*').single()`.
  - On success: closes modal, triggers parent `onSubmitted()` to refresh data.

---

### Read Path (Displaying the User’s Own Entry)

- Loader in page: `src/pages/recipe-view-page.tsx`
  - State: `userComment: { rating?: number; comment?: string } | null`
  - Function: `loadUserComment` (wrapped with `useCallback`)
    - Determines current version (`versionContent?.version_number || requestedVersion || 1`).
    - Calls `ratingApi.getUserVersionRating(recipeId, versionNumber)`.
    - On data: sets `userComment` with `{ rating, comment }`.
  - `useEffect` refreshes when `recipe`, `user`, or version changes.

- Display component: `src/components/ui/rating.tsx` → `YourComment`
  - Props: `userRating?`, `userComment?`, `onEdit?`, `className?`
  - Read-only star display + the user’s comment in a green info card.
  - Edit action surfaces a toast directing users to the Rate & Comment modal.

- Integration point in the recipe view:
  - File: `src/components/recipes/recipe-view.tsx`
  - Renders `YourComment` when `userComment?.rating || userComment?.comment` is present.

---

### Additional Rating Panels (for context)

- Version/Aggregate panels: `src/components/recipes/rating-display.tsx`
  - Left panel (version-specific) and right panel (aggregate across versions), orchestrated by `src/components/recipes/recipe-analytics-dashboard.tsx`.
  - Also loads the user’s rating; defaults to version 1 when no version is specified.

---

### UX Rules

- Both a rating and a comment are required in the modal; inline validation informs the user what’s missing.
- Hover flicker mitigated by moving `onMouseLeave` to the star container and fixing the description area height.

---

### Common Failure Modes + Guards

- 409 Conflict on submit: fixed via `upsert(..., { onConflict: 'recipe_id,user_id' })`.
- Missing `comment` column: ensure migration `add_comment_column_to_recipe_ratings.sql` precedes any view changes using `comment`.
- Aggregate view not present: `getPublicRecipesWithStats` gracefully falls back to basic list.
- Version unspecified: default to version 1 for user-rating reads in `rating-display.tsx` and via page loader logic.

---

### Quick Reference (Key Files)

- UI card: `src/components/ui/rating.tsx` (`YourComment`)
- Page state: `src/pages/recipe-view-page.tsx` (`userComment`, `loadUserComment`)
- Recipe view integration: `src/components/recipes/recipe-view.tsx`
- Modal submit: `src/components/recipes/rate-comment-modal.tsx`
- Rating API: `src/lib/api/features/rating-api.ts`
- DB views: `supabase/migrations/*create_or_replace*_recipe_*_stats*.sql`

---

Last updated: 2025-09-24
