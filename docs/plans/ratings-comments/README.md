# Ratings & Comments Implementation Plan

Status: Planning • Scope: Enable user comments on public recipes (and versions) with proper RLS, API, UI, and analytics integration.

---

## Goals

- Allow authenticated users to leave a rating (1–5) with an optional text comment on recipes and specific versions.
- Display recent and top comments per recipe/version.
- Expose comment counts in aggregate/trending views without breaking existing code.
- Follow Migration Best Practices (one SQL command per migration; forward-only; no resets).

---

## Current State (Audit)

- Database: `public.recipe_ratings` exists with columns: `id, recipe_id, user_id, rating, comment, created_at, updated_at`, plus `version_number` (migration added). RLS allows public read; authenticated insert/update for owner rows.
- Frontend: UI scaffolding present (`RateCommentModal`, comment display in analytics) but submission is not wired. `versioning-api.ts` has placeholder `rateVersion`.
- Views: comment counts are stubbed as `0` in some views; no dedicated `recipe_comments` table at present.

---

## Approach

Prioritize minimal, safe changes that leverage existing `recipe_ratings.comment` for comments. Defer a dedicated `recipe_comments` table unless needed later.

- Phase 1 (Functional): Wire comment submission and display using `recipe_ratings` (no new tables). Add non-breaking comment counts to views.
- Phase 2 (Optional Evolution): Introduce `recipe_comments` table for long-form threads/replies if product requires, with a migration path and view updates.

---

## Phase 1 – Make Comments Functional (No New Tables)

### 1) Database (Views only)

- Add/Update views to surface counts without breaking existing consumers.
  - Update `public.recipe_aggregate_stats` to include `total_comments`:
    - Count rows in `recipe_ratings` where `recipe_id` matches and `comment IS NOT NULL AND comment <> ''`.
  - Update `public.recipe_version_stats` to include `version_comment_count` similarly filtered by `recipe_id` and `version_number`.

Migration files (one SQL command per file):

- 1. `create_or_replace_recipe_aggregate_stats_add_total_comments.sql`
- 2. `create_or_replace_recipe_version_stats_add_comment_count.sql`

Notes:

- Use `CREATE OR REPLACE VIEW` with the full, current definition to avoid column rename issues.
- Do not drop views unless necessary; prefer replace.

### 2) RLS / Security

- `recipe_ratings` already has:
  - SELECT for all (public read)
  - INSERT/UPDATE restricted to `auth.uid() = user_id`
- No change needed for Phase 1.

### 3) API

- Add a rating API (clean separation): `src/lib/api/features/rating-api.ts`
  - `submitRating(recipeId: string, versionNumber: number | null, rating: number, comment?: string)` → upsert into `recipe_ratings`.
  - `getComments(recipeId: string, versionNumber?: number, limit = 20)` → SELECT rows with non-empty comments ordered by `created_at DESC`.
- Wire existing placeholder in `versioning-api.ts` or switch consumers to `ratingApi`.
- In `recipeApi.getRecipeAnalytics`, replace hard-coded comment math with counts from views or a focused COUNT query if needed.

### 4) Frontend

- Wire `RateCommentModal` submission to call `ratingApi.submitRating(...)`.
- Display comments list on recipe view:
  - Use a new hook `useRecipeComments(recipeId, versionNumber?)` calling `ratingApi.getComments`.
  - Render list beneath ratings; show count badges from views.
- Keep UI minimal; reuse existing styles.

### 5) MCP / Verification

- Add SQL verification queries to docs:
  - Check views columns present (`total_comments`, `version_comment_count`).
  - Spot-check sample recipe comment counts and recent comments.

### 6) Testing

- Unit: rating-api submit/getComments; UI modal submit path (mock supabase).
- Integration: recipe view shows submitted comment after submit (mock auth + supabase).
- Lint/format/build gates pass.

### 7) Deployment

- Apply migrations locally → verify → deploy to production via CLI (no resets):
  - `npx supabase link --project-ref <PROD_REF>`
  - `npx supabase db push --yes`

---

## Phase 2 – Optional Dedicated Comments Table (If Needed)

Only if product requires threaded replies, edits, moderation, or reactions.

### 1) Database

- New table `recipe_comments`:
  - `id UUID PK, recipe_id UUID FK, version_number INT NULL, user_id UUID FK, body TEXT NOT NULL, rating INTEGER NULL, created_at/updated_at`.
  - Unique constraints: none (multiple comments per user allowed).
  - RLS: public SELECT; INSERT/UPDATE by owner; DELETE by owner or recipe owner.
- Migrations (separate files):
  - create table
  - enable RLS and policies
  - indexes: `(recipe_id, version_number, created_at DESC)`

### 2) Views

- Update `recipe_aggregate_stats`/`recipe_version_stats` to compute counts from `recipe_comments` instead of `recipe_ratings`.
- Keep backward compatibility: continue to include comments from `recipe_ratings` during transition (UNION ALL) or feature-flag flip.

### 3) API / Frontend

- Switch read/write paths to `recipe_comments` with a feature flag.
- Maintain compatibility shims during rollout.

---

## Rollback & Safety

- Views are replaced, not dropped (safe). If any issue, reapply prior view definition.
- No destructive DDL in Phase 1.
- All migrations forward-only per MIGRATION_BEST_PRACTICES.md.

---

## Task Checklist

- Database
  - [ ] Replace `recipe_aggregate_stats` adding `total_comments`
  - [ ] Replace `recipe_version_stats` adding `version_comment_count`
- API
  - [ ] Add `ratingApi.submitRating` (upsert with optional comment)
  - [ ] Add `ratingApi.getComments`
  - [ ] Update analytics/comment counts usage
- Frontend
  - [ ] Wire `RateCommentModal` submit
  - [ ] Show comments list on recipe view
- Verification
  - [ ] MCP queries for view columns and counts
- Testing & Deploy
  - [ ] Unit/integration tests
  - [ ] Deploy migrations to production

---

## MCP Verification Snippets (for docs)

- Views present:

```sql
SELECT viewname, definition LIKE '%total_comments%' AS has_total_comments
FROM pg_views WHERE viewname = 'recipe_aggregate_stats';

SELECT viewname, definition LIKE '%version_comment_count%' AS has_version_comment_count
FROM pg_views WHERE viewname = 'recipe_version_stats';
```

- Comment count sampling:

```sql
SELECT
  r.id,
  (SELECT COUNT(*) FROM recipe_ratings rr WHERE rr.recipe_id = r.id AND rr.comment IS NOT NULL AND rr.comment <> '') AS comments
FROM recipes r WHERE r.is_public = true LIMIT 10;
```

---

## Notes

- Start with Phase 1 to ship value fast using existing schema.
- Only pursue Phase 2 if requirements expand (threads/moderation).
- Keep PRs small and forward-only; avoid renames that churn history.
