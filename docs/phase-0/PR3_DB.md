# PR 3 — Persistence: DB + Read/Write

## Scope

- Migrations: add nullable description columns to recipes and recipe_content_versions.
- Read/write in API and client; version payloads include description.

## Files

- supabase/migrations/_\_add_recipe_descriptions_.sql
- src/lib/api/\*\*, src/components/recipes/versioned-recipe-card.tsx

## Safety

- Additive, reversible; no data loss.

## Tests

- Integration save/load description present/absent.
