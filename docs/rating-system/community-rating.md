### Community Rating — User Ratings, Comments, and Aggregates

This document describes the end‑to‑end implementation of the Community Rating system: data model, views/aggregates, API, UI, events, and UX rules.

---

### Purpose

- Allow authenticated users to leave a 1–5 star rating with a required comment on recipes (and specific versions).
- Display version‑specific and aggregate ratings, counts, and distributions using real data (no mocks).

---

### Data Model (Supabase)

- Table: `public.recipe_ratings`
  - `id UUID PK`
  - `recipe_id UUID NOT NULL` → FK `recipes.id`
  - `version_number INTEGER NULL` → specific version, or `NULL` for whole recipe
  - `user_id UUID NOT NULL` → FK `auth.users.id`
  - `rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5)`
  - `comment TEXT NULL` (required by our UX)
  - `created_at TIMESTAMPTZ DEFAULT now()`
  - `updated_at TIMESTAMPTZ DEFAULT now()`
  - Unique constraints:
    - `UNIQUE(recipe_id, user_id)` (current schema)
    - Note: If per‑version uniqueness is desired, use `(recipe_id, version_number, user_id)`.

- RLS (summary)
  - SELECT: public read
  - INSERT/UPDATE: only row owner (`auth.uid() = user_id`)

---

### Views / Aggregates

- `public.recipe_aggregate_stats`
  - Columns include: `id` (recipe id), `aggregate_avg_rating`, `total_ratings`, `total_views`, `total_versions`, `latest_version`, `total_comments`.
  - `total_comments` counts rows in `recipe_ratings` where `comment IS NOT NULL AND btrim(comment) <> ''`.

- `public.recipe_version_stats`
  - Per version: `version_avg_rating`, `version_rating_count`, `version_view_count`, `version_comment_count`, plus metadata.
  - Joins `recipe_ratings` filtered by `recipe_id` and `version_number`.

Migrations (examples in repo):

- `create_or_replace_recipe_aggregate_stats_add_total_comments.sql`
- `create_or_replace_recipe_version_stats_add_comment_count.sql`

---

### API Layer

- File: `src/lib/api/features/rating-api.ts`
  - `submitRating(recipeId: string, versionNumber: number | null, rating: number, comment?: string)`
    - Upsert into `recipe_ratings` with `{ onConflict: 'recipe_id,user_id' }` to avoid 409 conflicts.
  - `getComments(recipeId: string, versionNumber?: number, limit = 20)`
    - Returns recent comments (non‑empty) with basic profile info.
  - `getUserVersionRating(recipeId: string, versionNumber: number)`
    - Returns the signed‑in user’s rating/comment for the version.

- Related API (fallbacks/analytics): `src/lib/api.ts`
  - `getPublicRecipesWithStats` gracefully falls back if aggregate view is missing.

---

### UI / Components

- Primary rating panels: `src/components/recipes/rating-display.tsx`
  - Version panel (left): `recipeId`, `versionNumber`, `allowRating=true`
  - Aggregate panel (right): `recipeId`, `showAggregateRating=true`, `allowRating=false`
  - Loads real data via `ratingApi.getComments(...)`; computes average, count, distribution.
  - Loads the signed‑in user’s rating (defaults to version 1 when no explicit version).
  - Subscribes to `rating-updated` and `user-comment-updated` events to live‑refresh.

- Modal for submission: `src/components/recipes/rate-comment-modal.tsx`
  - Requires both star rating and non‑empty comment.
  - Calls `ratingApi.submitRating(...)`.
  - On success: closes, invokes parent refresh, and dispatches `rating-updated`.

- Comment list: `src/components/recipes/comment-system.tsx`
  - Uses `ratingApi.getComments(...)`.
  - After submit, reloads and dispatches both `user-comment-updated` and `rating-updated` so header cards and rating panels refresh.

- Your personal card: `src/components/ui/rating.tsx` → `YourComment`
  - Shows the user’s own rating/comment near the header.
  - “Edit” scrolls to comments and opens the form via `open-comment-form` event.

---

### Event Bus (UI Synchronization)

- `rating-updated`
  - Emitted after successful upsert in modal and comment system.
  - Listened to by `rating-display.tsx` instances to refresh both version and aggregate panels.

- `user-comment-updated`
  - Emitted alongside rating updates to refresh the `Your Comment` card and any dependent UI.

- `open-comment-form`
  - Triggered by the `Your Comment` card “Edit” action.
  - Listened to by `comment-system.tsx` to open the inline form and scroll into view.

---

### UX Rules

- Rating (1–5) and comment are both required for submission.
- Hover flicker mitigated by moving `onMouseLeave` to star container and fixing description area height in the modal.
- Version panel defaults to version 1 when no explicit version is selected.

---

### Common Pitfalls & Guards

- 409 Conflict on rating submit → fixed by `onConflict: 'recipe_id,user_id'` in upsert.
- Missing `comment` column → ensure migration adding `comment` to `recipe_ratings` runs before view updates.
- Aggregate view missing → UI falls back to basic public list until view exists.
- Stale UI after edits → event bus refresh (`rating-updated`, `user-comment-updated`) ensures live updates across panels/cards.

---

### Quick Reference (Key Files)

- DB: `supabase/migrations/*recipe_ratings*.sql`, `*recipe_aggregate_stats*.sql`, `*recipe_version_stats*.sql`
- API: `src/lib/api/features/rating-api.ts`
- Panels: `src/components/recipes/rating-display.tsx`
- Modal: `src/components/recipes/rate-comment-modal.tsx`
- Comments: `src/components/recipes/comment-system.tsx`
- Personal card: `src/components/ui/rating.tsx` (`YourComment`)

---

Last updated: 2025-09-24
