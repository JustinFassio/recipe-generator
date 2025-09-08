## Recipe Image Update: Correct Implementation

This document describes the production-ready implementation for updating recipe images so the `recipes-page` grid reflects changes immediately without manual refresh, while avoiding storage leaks.

### Objectives

- Immediate UI update after image change (no manual refresh)
- Correct cache invalidation and optimistic updates
- Safe storage management (cleanup old images; rollback on failures)
- Reliable navigation-driven refresh behavior

### Components and Hooks Involved

- `src/components/recipes/recipe-form.tsx`
- `src/pages/recipes-page.tsx`
- `src/hooks/use-recipes.ts`
- `src/lib/api.ts`
- `src/components/recipes/recipe-card.tsx`

### Core Requirements

1. Upload image and update recipe data.
2. Optimistically update all cached recipe lists so the grid reflects the new image URL immediately.
3. Invalidate queries in the background to ensure fresh server state.
4. Navigate back to the grid only after starting/awaiting cache refresh to avoid stale-first paint.
5. Add cache-busting to `<img>` URLs using a timestamp derived from `updated_at`.
6. Clean up storage on replacement/deletion; rollback uploaded files if the mutation fails.

---

### 1) Image Processing and Upload (Client)

- Use `processImageFile()` to validate/compress and generate a preview.
- Upload via `useUploadImage()` → `recipeApi.uploadImage(file)`.
  - Storage upload uses unique paths and long cache headers.
  - Returns a public URL string.

### 2) Persist Recipe Update

- Call `useUpdateRecipe().mutateAsync({ id, updates })` with the new `image_url`.
- The server updates the row and `updated_at`.

### 3) Optimistic List Cache Update (Critical)

In `useUpdateRecipe.onSuccess`:

- Set the individual recipe cache: `setQueryData(['recipe', id], updatedRecipe)`
- Optimistically merge `updatedRecipe` into every `['recipes', ...]` list cache using `setQueriesData` so the grid immediately shows the new `image_url`/`updated_at`.
- Then invalidate `['recipes']` and `['recipe-summary', id]` in the background.

This prevents stale-first renders and removes the need for a manual refresh.

### 4) Navigation Flow

From `recipe-form.tsx`, when finishing an update/create:

- `await queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false })` (awaits trigger)
- `navigate('/', { state: { refresh: Date.now() } })`

On `recipes-page.tsx`, optionally keep a mount-time invalidation via the refresh state. With optimistic updates, this becomes a safety net rather than a dependency.

### 5) Cache Busting for Images

In `recipe-card.tsx` and `recipe-view.tsx`:

- Render image as: `src={`${recipe.image_url}?v=${new Date(recipe.updated_at || recipe.created_at).getTime()}`}`

Because the list item is optimistically updated including `updated_at`, the query param changes immediately, bypassing any CDN/browser cache.

### 6) Storage Cleanup and Rollback

- When updating a recipe, fetch the current `image_url` first; if it changed, delete the old file after a successful DB update.
- On delete, remove the associated image from storage.
- On create/update failure after uploading a new file, rollback by deleting the uploaded file to avoid orphaned images.

All of the above are implemented in `recipeApi.updateRecipe`, `recipeApi.deleteRecipe`, and `recipe-form.tsx` try/catch.

---

### Gotchas and Anti-Patterns

- Only invalidating queries without an optimistic update causes a stale-first paint and forces users to refresh.
- Navigating immediately after invalidation without awaiting/optimistic update can race and render stale data.
- Reusing the same storage path without a cache-busting query param can pin stale CDN content.
- Forgetting storage cleanup leads to bloat and higher costs.

---

### Testing and Regression Prevention

- Add a unit test that asserts the recipes list cache is updated immediately on `useUpdateRecipe` success (see `src/__tests__/hooks/use-recipes-optimistic-update.test.ts`).
- Ensure component tests accept cache-busted image URLs (use `expect.stringContaining(originalUrl)` rather than exact match).

---

### Summary Checklist

- [x] `useUpdateRecipe` optimistically updates list caches and invalidates in background
- [x] Form awaits invalidation before navigation and passes `{ state: { refresh } }`
- [x] Cards use `image_url` + `?v=${updated_at}` for cache busting
- [x] API cleans up old images on update/delete; form rolls back on failure
- [x] Tests enforce optimistic update behavior

This setup ensures immediate visual updates, correct caching behavior, and safe storage hygiene in production.
