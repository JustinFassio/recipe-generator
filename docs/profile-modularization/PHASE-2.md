## Phase 2: Feature Hooks and Page Simplification (Atomic, Small PRs)

Goal: Move state management and side-effects out of `src/pages/profile-page.tsx` into focused hooks, then reduce the page to a thin orchestrator that composes atomic components from Phase 1. No user-visible changes.

Why keep Markdown (.md)?

- Works best in GitHub/PRs (rendered headings, anchors, code fences, checklists)
- Easier intra-repo linking and structured review
- AI agents can parse both `.md` and `.txt`; `.md` adds semantics without cost

Gates for every PR

- Build: `npm run build`
- Type check: `npx tsc --noEmit`
- Tests: `npm run test:run`
- Lint/format: `npm run lint`, `npm run format:check`
- No copy/UX changes

Target structure (from Phase 1)

```
src/hooks/profile/
  useUsernameAvailability.ts
  useProfileBasics.ts
  useUserSafety.ts
  useCookingPreferences.ts
```

---

PR 11 – Hook: useUsernameAvailability (isolated)

- File: `src/hooks/profile/useUsernameAvailability.ts`
- Responsibilities:
  - Manage `username`, `available`, `checking` state
  - Debounce availability calls using existing `checkUsernameAvailability`
  - Validate pattern client-side (`^[a-z0-9_]{3,24}$`)
- API (tentative):

```ts
export function useUsernameAvailability(initial?: string) {
  return {
    username,
    setUsername, // lowercases and sanitizes
    available, // boolean | null
    checking, // boolean
    checkNow, // manual trigger (optional)
  };
}
```

- Page change: replace inline debounce logic with hook wiring in `ProfileInfoForm` props
- Tests: debounce behavior, pattern enforcement, states toggle on mock responses

Acceptance

- [ ] Same UX for claim/change username
- [ ] No extra requests; debounce parity verified

---

PR 12 – Hook: useProfileBasics

- File: `src/hooks/profile/useProfileBasics.ts`
- Responsibilities:
  - Local state for name, region, language, units, timePerMeal, skillLevel
  - Submit via `updateProfile`, then `refreshProfile`
  - No avatar/username responsibilities
- API (tentative):

```ts
export function useProfileBasics(
  initial: {
    fullName: string;
    region: string;
    language: string;
    units: string;
    timePerMeal: number;
    skillLevel: string;
  },
  deps: { update: typeof updateProfile; refresh: () => Promise<void> }
) {
  return { values, setField, submitting, submit };
}
```

- Page change: pass hook outputs to `ProfileInfoForm`; remove submit logic from page
- Tests: submit calls update+refresh, field changes reflect state

Acceptance

- [ ] Profile info updates unchanged; toasts still fire in page or moved helper

---

PR 13 – Hook: useUserSafety

- File: `src/hooks/profile/useUserSafety.ts`
- Responsibilities:
  - Load via `getUserSafety(userId)`
  - Maintain arrays: `medicalConditions`, `allergies`, `dietaryRestrictions`
  - Save via `updateUserSafety(userId, payload)`
  - Expose add/remove helpers for toggles and custom input
- API (tentative):

```ts
export function useUserSafety(userId: string) {
  return {
    loading,
    saving,
    medicalConditions,
    setMedicalConditions,
    allergies,
    setAllergies,
    dietaryRestrictions,
    setDietaryRestrictions,
    save, // persists all three vectors atomically
  };
}
```

- Page change: wire `SafetySection` children from hook instead of page state
- Tests: load default, add/remove, save calls, error path

Acceptance

- [ ] Safety save parity; helper texts and wrapping intact

---

PR 14 – Hook: useCookingPreferences

- File: `src/hooks/profile/useCookingPreferences.ts`
- Responsibilities:
  - Load via `getCookingPreferences(userId)`
  - Maintain `preferredCuisines`, `availableEquipment`, `dislikedIngredients`, `spiceTolerance`
  - Save via `updateCookingPreferences(userId, payload)`
  - Helpers for chip add/remove and slider change
- API (tentative):

```ts
export function useCookingPreferences(userId: string) {
  return {
    loading,
    saving,
    preferredCuisines,
    setPreferredCuisines,
    availableEquipment,
    setAvailableEquipment,
    dislikedIngredients,
    setDislikedIngredients,
    spiceTolerance,
    setSpiceTolerance,
    save,
  };
}
```

- Page change: wire cooking fields to hook outputs, move save handler to hook or keep in page invoking `save()`
- Tests: toggles, chips, slider, save calls

Acceptance

- [ ] Cooking save parity and toast behavior retained

---

PR 15 – Consolidate domain constants (optional but helpful)

- File: `src/components/profile/constants.ts`
- Move lists used across fields:
  - `COMMON_ALLERGENS`, `COMMON_DIETARY_RESTRICTIONS`
  - `POPULAR_CUISINES`, `COMMON_EQUIPMENT`
- Update fields to import from constants
- Tests: not required beyond type-safety; keep values identical

Acceptance

- [ ] Zero behavioral change; easier reuse

---

PR 16 – Feedback helper (optional)

- File: `src/hooks/profile/useSaveFeedback.ts`
- Centralize toast success/error UX to avoid duplication across save buttons
- Page/components call `withFeedback(asyncFn)` wrapper

Acceptance

- [ ] Toaster UX identical; less repetition

---

PR 17 – Page slim-down pass

- Remove residual state/effects moved into hooks
- `src/pages/profile-page.tsx` retains only:
  - Auth/context access (`useAuth`)
  - Tabs/layout scaffolding
  - Composition of atomic components, passing hook results
- Re-run full QA suite

Acceptance

- [ ] Page becomes primarily composition; no substantial logic
- [ ] All flows verified (avatar, bio, basics, safety, cooking, email, password)

---

Testing & QA notes

- Hooks unit tests should mock `supabase` functions (`getUserSafety`, `updateUserSafety`, etc.)
- Component tests remain UI-focused (props in, callbacks out)
- Keep coverage improvements incremental; prioritize hooks behavior

Rollback strategy

- Each PR is isolated; if an issue arises, revert the last PR without impacting others

Out of scope for Phase 2

- Visual redesigns, string changes, new fields
- Cross-feature refactors beyond profile domain
