### Rating — Base Interactive Star Widget

This document explains the implementation and usage of the base star rating widget used across the app.

---

### Location

- Source: `src/components/ui/rating.tsx` → `export function Rating(...)`

---

### Purpose

- Provide a small, reusable star control to display a rating value and optionally allow a user to select a rating.
- Acts as a low-level primitive used by higher-level components like `CreatorRating`, `CommunityRating`, and `YourComment`.

---

### Props

- `rating: number`
  - The current rating value (1–5). Values ≤0 show an unfilled state.
- `onRate?: (rating: number) => void`
  - If provided and `readonly` is `false`, enables interaction and calls back with the selected star.
- `readonly?: boolean` (default `false`)
  - Disables interaction and hover effects when `true`.
- `size?: 'sm' | 'md' | 'lg'` (default `md`)
  - Controls star icon size via predefined Tailwind classes.
- `label?: string`
  - Optional inline label (e.g., "Your Rating").
- `showValue?: boolean` (default `true`)
  - Shows textual value to the right (e.g., `4/5` or `Not rated`).
- `className?: string`
  - Pass-through classes for layout or spacing.

---

### Behavior & State

- Hover state (`hoveredRating`) is local component state.
  - When interactive, moving the mouse over a star previews that value.
  - `onMouseLeave` restores the display to the committed `rating`.
- Click on a star (interactive only) triggers `onRate(starRating)`.
- Displayed value is computed as `hoveredRating || rating`.

---

### Styling

- Icons: `lucide-react` `Star`.
- Filled stars: `fill-yellow-400 text-yellow-400`.
- Empty stars: `fill-gray-200 text-gray-300`.
- Interactive affordances: `cursor-pointer`, subtle `hover:scale-110`, `drop-shadow-sm` on hover for filled portion.
- Size map:
  - `sm` → `w-4 h-4`
  - `md` → `w-5 h-5`
  - `lg` → `w-6 h-6`

---

### Accessibility

- Each star is a `button` with `aria-label` like `"3 stars"`.
- Readonly mode disables buttons to prevent focus/interaction.
- Optional `label` prop renders accessible text adjacent to the control.

---

### Usage Examples

Display-only rating (small):

```tsx
<Rating rating={4} readonly size="sm" label="Average" />
```

Interactive rating for user input:

```tsx
function MyFormControl() {
  const [value, setValue] = useState(0);
  return (
    <Rating
      rating={value}
      onRate={(v) => setValue(v)}
      size="md"
      label="Your Rating"
    />
  );
}
```

Compact display without value text:

```tsx
<Rating rating={5} readonly size="sm" showValue={false} />
```

---

### Integration Notes

- The widget itself is stateless w.r.t. persistence; parent components own the value and persistence.
- For submitting to Supabase, pair with `ratingApi.submitRating(...)` in event handlers.
- For combined displays, prefer higher-level components:
  - `CreatorRating` — owner’s rating card
  - `CommunityRating` — aggregate display
  - `YourComment` — user’s own rating/comment summary

---

### Edge Cases & Tips

- When `rating <= 0` and `readonly`, the control renders empty stars; consider toggling `showValue` if you don’t want to show “Not rated”.
- Don’t pass fractional values; stars are whole integers in this component. If you need halves, renderers should be extended or a separate display component added.
- Keep interactive usage out of disabled/readonly contexts to avoid confusing keyboard users.

---

### Testing

- Unit test hover behavior by simulating `mouseEnter`/`mouseLeave` and verifying the visual state via class changes.
- Unit test click behavior by asserting `onRate` calls with expected values.

---

Last updated: 2025-09-24
