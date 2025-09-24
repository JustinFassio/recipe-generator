### Creator Ratings — Author’s Self‑Assessment

This document explains how the recipe author's own rating (Creator Rating) is modeled, captured, and displayed across the app.

---

### Locations

- UI primitive: `src/components/ui/rating.tsx` → `export function CreatorRating(...)`
- Recipe creation/edit: `src/components/recipes/recipe-form.tsx` (uses `CreatorRating` for input)
- Recipe view display: `src/components/recipes/recipe-view.tsx` (shows read‑only creator rating when present)
- Version cards (stats): `src/components/recipes/version-selector.tsx` (shows creator rating per version where available)

---

### Purpose

- Allow creators to self‑assess each recipe/version (1–5 stars) to help readers gauge baseline quality.
- Distinct from community ratings; does not require a comment and is set by the recipe owner only.

---

### Data Model (Database)

- Table: `public.recipes`
  - Column: `creator_rating INTEGER CHECK (creator_rating >= 1 AND creator_rating <= 5)`
  - Represents creator’s rating for the original recipe entry.

- Table: `public.recipe_content_versions`
  - Column: `creator_rating INTEGER NULL CHECK (creator_rating >= 1 AND creator_rating <= 5)`
  - Each version can carry its own creator rating (preferred source of truth for versioned experiences).

- Views (read only context):
  - `recipe_version_stats` exposes `creator_rating` per version for display in version lists and analytics.

RLS/Security (high‑level):

- Creator can update their own recipe/version rows; public can read.
- Policies live with the table definitions (see Supabase migrations and policies in repo).

---

### Write Path (Creator Editing)

- Component: `src/components/recipes/recipe-form.tsx`
  - Uses `CreatorRating` as an input control for the author while creating or editing a recipe.
  - UI text clarifies rating can be updated before sharing; post‑publish flows often show it as read‑only.
  - On change, the value is stored into form state and submitted with the rest of the recipe/version payload to Supabase.

---

### Read/Display Paths

- Recipe page header: `src/components/recipes/recipe-view.tsx`
  - If `recipe.creator_rating` is present, renders a compact `CreatorRating` with `disabled={true}`.

- Version list: `src/components/recipes/version-selector.tsx`
  - Shows a small star strip sourced from each version’s `creator_rating` within the card’s metadata row.

- Combined rating cards: `src/components/recipes/rating-display.tsx`
  - These cards focus on community data; creator rating is not mixed into the averages but can be displayed elsewhere on the page.

---

### UI Components

- `CreatorRating` (in `src/components/ui/rating.tsx`)
  - A composition of the base `Rating` widget with an orange theme and helper text.
  - Props:
    - `rating: number`
    - `onRate?: (rating: number) => void` (omitted when read‑only)
    - `disabled?: boolean` (prevents interaction when true)
    - `className?: string`
  - Typical usage:
    - Editable in `recipe-form` before sharing.
    - Read‑only in `recipe-view` after sharing (or when the viewer is not the owner).

---

### UX Rules

- Whole‑number stars (1–5). No halves.
- Editable only by the recipe owner in creation/edit flows.
- Displayed as read‑only for viewers and typically for creators after sharing.

---

### Integration Notes

- The creator rating is separate from community ratings (`recipe_ratings`). Do not aggregate the two.
- For versioned flows, prefer `recipe_content_versions.creator_rating` when showing per‑version metadata; fallback to `recipes.creator_rating` only when a version‑specific value is absent.
- Creator rating does not trigger the rating cards’ event bus (`rating-updated`) since it is not part of community aggregates; however, lists that surface version metadata (e.g., `VersionSelector`) should requery after saves.

---

### Example Snippets

Display read‑only in recipe view header:

```tsx
{
  recipe.creator_rating && (
    <CreatorRating
      rating={recipe.creator_rating}
      disabled
      className="max-w-xs"
    />
  );
}
```

Editable in recipe form:

```tsx
<CreatorRating
  rating={watch('creator_rating') ?? 0}
  onRate={(val) => setValue('creator_rating', val)}
  className="max-w-xs"
/>
```

---

### Testing

- Unit: `CreatorRating` renders correct filled stars for given value; `onRate` fires when not disabled.
- Integration: `recipe-form` persists `creator_rating` and
  read‑only display reflects saved value in `recipe-view` and version lists.

---

Last updated: 2025-09-24
