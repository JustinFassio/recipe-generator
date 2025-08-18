## Phase 2: Hooks Extraction and Main Page Simplification

Scope: Extract business logic into reusable hooks and simplify the main profile page. No UI changes.

Quality gates (every PR)

- `npm run build`
- `npx tsc --noEmit`
- `npm run test:run`
- `npm run lint` && `npm run format:check`

---

PR 15 – Extract useProfileUpdate hook

- Create `src/hooks/useProfileUpdate.ts` with:
  - Generic `useProfileUpdate<T>` hook for common update patterns
  - Specialized hooks: `useBioUpdate`, `useUserSafetyUpdate`, `useCookingPreferencesUpdate`
  - Handles loading state, error handling, and toast notifications
  - Reduces code duplication across profile update functions
- Acceptance: profile page uses new hooks, tests pass

---

PR 16 – Extract useUserSafety hook

- Create `src/hooks/profile/useUserSafety.ts`:
  - `loadUserSafety()` - fetch allergies, dietary, medical conditions
  - `saveUserSafety(data)` - update safety preferences
  - `validateSafetyData(data)` - client-side validation
  - State: `allergies`, `dietaryRestrictions`, `medicalConditions`, `loading`, `error`
- Update profile page to use hook
- Acceptance: safety section uses hook, existing functionality preserved

---

PR 17 – Extract useCookingPreferences hook

- Create `src/hooks/profile/useCookingPreferences.ts`:
  - `loadCookingPreferences()` - fetch cuisines, equipment, spices, dislikes
  - `saveCookingPreferences(data)` - update cooking preferences
  - `validateCookingData(data)` - client-side validation
  - State: `preferredCuisines`, `availableEquipment`, `spiceTolerance`, `dislikedIngredients`, `loading`, `error`
- Update profile page to use hook
- Acceptance: cooking section uses hook, existing functionality preserved

---

PR 18 – Extract useUsernameAvailability hook

- Create `src/hooks/profile/useUsernameAvailability.ts`:
  - `checkUsername(username)` - debounced availability check
  - `claimUsername(username)` - claim available username
  - State: `username`, `isAvailable`, `isChecking`, `error`
- Update profile page to use hook
- Acceptance: username validation uses hook, debouncing works

---

PR 19 – Extract useProfileBasics hook

- Create `src/hooks/profile/useProfileBasics.ts`:
  - `loadProfileBasics()` - fetch region, language, units, time, skill
  - `saveProfileBasics(data)` - update basic preferences
  - `validateBasicsData(data)` - client-side validation
  - State: `region`, `language`, `units`, `timePerMeal`, `skillLevel`, `loading`, `error`
- Update profile page to use hook
- Acceptance: basic preferences use hook, existing functionality preserved

---

PR 20 – Simplify main profile page

- Remove direct state management for preferences (now in hooks)
- Remove duplicate update logic (now in useProfileUpdate)
- Keep only:
  - Tab state management
  - Avatar upload logic
  - Email/password forms
  - Layout composition
- Acceptance: page is <500 lines, all functionality preserved

---

PR 21 – Add hook tests

- Create `src/hooks/profile/__tests__/useUserSafety.test.ts`
- Create `src/hooks/profile/__tests__/useCookingPreferences.test.ts`
- Create `src/hooks/profile/__tests__/useUsernameAvailability.test.ts`
- Create `src/hooks/profile/__tests__/useProfileBasics.test.ts`
- Create `src/hooks/__tests__/useProfileUpdate.test.ts`
- Test loading states, error handling, validation
- Acceptance: all hook tests pass, >80% coverage

---

PR 22 – Update documentation

- Update `docs/profile-modularization/README.md` with Phase 2 completion
- Add hook usage examples to component docs
- Update API documentation for new hooks
- Acceptance: docs reflect current implementation

---

## Phase 2 Completion Criteria

✅ **All hooks extracted and tested**

- Business logic moved from page to hooks
- Each hook has comprehensive tests
- Hooks are reusable across components

✅ **Main page simplified**

- Profile page <500 lines
- No direct state management for preferences
- Clean separation of concerns

✅ **No functionality regression**

- All existing features work
- All tests pass
- No UI changes visible to users

✅ **Code quality improved**

- Reduced duplication
- Better testability
- Clearer separation of concerns
