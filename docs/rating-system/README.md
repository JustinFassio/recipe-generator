### Rating System Overview

This document catalogs all rating-related components and systems in the app, their locations, and recommended usage. It also highlights which parts are legacy vs. current.

---

### Core Components (src/components/ui/rating.tsx)

- **Rating**: Base interactive star widget
  - Props: `rating`, `onRate?`, `readonly?`, `size?`, `label?`, `showValue?`, `className?`
  - Use when you need a simple star input/display.

- **CreatorRating**: Recipe owner’s self-rating (orange theme)
  - Props: `rating`, `onRate?`, `disabled?`, `className?`
  - Used in creator flows and on recipe cards where owner rating is shown.

- **CommunityRating**: Aggregate community rating display (blue theme)
  - Props: `averageRating`, `totalRatings`, `userRating?`, `onRate?`, `className?`
  - Legacy-style aggregate card. Prefer the specialized `recipes/rating-display.tsx` for new UI.

- **YourComment**: Logged-in user’s personal rating + comment (green theme)
  - Props: `userRating?`, `userComment?`, `onEdit?`, `className?`
  - Shown near recipe header to surface the user’s own contribution.

- **RatingDisplay (combined UI)**: Creator + community summary block
  - Props: `creatorRating`, `communityRating?`, `className?`
  - Legacy composite; not wired to data. Prefer `recipes/rating-display.tsx`.

---

### Specialized Rating Systems

- **recipes/rating-display.tsx (PRIMARY RATING UI)**
  - Props: `recipeId`, `versionNumber?`, `showAggregateRating?`, `allowRating?`, `className?`
  - Fetches real data via `ratingApi`, shows:
    - Version-specific rating (left panel)
    - Aggregate rating across versions (right panel when `showAggregateRating`)
  - Loads the user’s rating even when `versionNumber` is unset (defaults to 1).

- **recipes/rate-comment-modal.tsx**
  - Modal to submit rating + required comment.
  - Uses `ratingApi.submitRating(recipeId, versionNumber | null, rating, comment)`.

- **recipes/comment-system.tsx**
  - Lists comments for a recipe/version using `ratingApi.getComments`.

- **recipes/analytics-panel.tsx**
  - Displays analytics; does not own rating state. Reads from DB for counts.

- **recipes/recipe-analytics-dashboard.tsx (Orchestrator)**
  - Composes the left/right rating panels using `recipes/rating-display.tsx` and passes `currentVersion`.

---

### Data/API

- **src/lib/api/features/rating-api.ts**
  - `submitRating`, `getComments`, `getUserVersionRating`.
  - Backed by `public.recipe_ratings` and views (aggregate counts).

---

### Recommended Usage

- For version or aggregate rating panels: use `recipes/rating-display.tsx`.
- For the user’s personal block near the header: use `YourComment`.
- For submitting ratings/comments: use `RateCommentModal`.
- For comments list: use `CommentSystem`.

---

### Deprecation/Consolidation Plan

- Prefer `recipes/rating-display.tsx` over `ui/CommunityRating` and `ui/RatingDisplay` (combined) for new work.
- Keep `CreatorRating` and `YourComment` as lightweight presentational components.
- Remove any remaining mock-data paths; ensure all reads go through `ratingApi`.

---

### Known UX Notes

- Left panel defaults to Version 1 when no explicit version is selected.
- Both rating and comment are required in the modal; validation messages guide users.

---

Last updated: 2025-09-24T00:00:00.000Z
