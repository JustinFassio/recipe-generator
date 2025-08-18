## Phase 2: Hooks Extraction and Main Page Simplification

Scope: Extract business logic into reusable hooks and simplify the main profile page. No UI changes.

Quality gates (every PR)
- `npm run build`
- `npx tsc --noEmit`
- `npm run test:run`
- `npm run lint` && `npm run format:check`

---

## Target Structure

### Components under `src/components/profile/`:
- **Basic profile**
  - `AvatarCard.tsx` (upload/change photo)
  - `BioCard.tsx` (About Me + save)
  - `ProfileInfoForm.tsx` (name, username, preferences, submit)
- **Safety**
  - `SafetySection.tsx` (wrapper layout)
  - `MedicalConditionsField.tsx`
  - `AllergiesField.tsx`
  - `DietaryRestrictionsField.tsx`
  - `SafetySaveButton.tsx`
- **Cooking**
  - `CookingSection.tsx` (wrapper layout)
  - `PreferredCuisinesField.tsx`
  - `EquipmentField.tsx`
  - `SpiceToleranceField.tsx`
  - `DislikedIngredientsField.tsx`
  - `CookingSaveButton.tsx`
- **Account**
  - `EmailCard.tsx`
  - `PasswordCard.tsx`
- **Shared primitives (feature-local)**
  - `SectionCard.tsx` (DaisyUI card shell)
  - `FieldLabel.tsx` (label + helper/alt text with wrapping)
  - `TagToggleGroup.tsx` (toggleable chip set)
  - `InlineIconInput.tsx` (input with left icon)
  - `RangeWithTicks.tsx`

### Hooks under `src/hooks/profile/`:
- `useUserSafety.ts` (load/save allergies, dietary, medical)
- `useCookingPreferences.ts`
- `useUsernameAvailability.ts` (debounced checker)
- `useProfileBasics.ts` (region/language/units/time/skill)

### Lib stays as is:
- `src/lib/user-preferences.ts` (already central)
- `src/lib/auth.ts` (profile updates, avatar, username)

### Page becomes a thin orchestrator:
- `src/pages/profile-page.tsx`:
  - Tabs + layout shell
  - Composes atomic cards/sections
  - Minimal local state; delegates to hooks/components

---

PR 15 – Extract useProfileUpdate hook ✅ **COMPLETED**
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

PR 20 – Create shared primitives
- Create `src/components/profile/SectionCard.tsx` (DaisyUI card shell)
- Create `src/components/profile/FieldLabel.tsx` (label + helper/alt text with wrapping)
- Create `src/components/profile/TagToggleGroup.tsx` (toggleable chip set)
- Create `src/components/profile/InlineIconInput.tsx` (input with left icon)
- Create `src/components/profile/RangeWithTicks.tsx`
- Acceptance: primitives are reusable and properly typed

---

PR 21 – Extract AvatarCard component
- Create `src/components/profile/AvatarCard.tsx`:
  - Avatar upload/change functionality
  - File input handling
  - Loading states
  - Error handling
- Update profile page to use component
- Acceptance: avatar functionality works identically

---

PR 22 – Extract BioCard component
- Create `src/components/profile/BioCard.tsx`:
  - Bio textarea with character counter
  - Save button with loading state
  - Uses `useBioUpdate` hook
- Update profile page to use component
- Acceptance: bio functionality works identically

---

PR 23 – Extract ProfileInfoForm component
- Create `src/components/profile/ProfileInfoForm.tsx`:
  - Name, username, region, language, units, time, skill fields
  - Uses `useProfileBasics` and `useUsernameAvailability` hooks
  - Form validation and submission
- Update profile page to use component
- Acceptance: profile info functionality works identically

---

PR 24 – Extract SafetySection components
- Create `src/components/profile/SafetySection.tsx` (wrapper)
- Create `src/components/profile/MedicalConditionsField.tsx`
- Create `src/components/profile/AllergiesField.tsx`
- Create `src/components/profile/DietaryRestrictionsField.tsx`
- Create `src/components/profile/SafetySaveButton.tsx`
- Uses `useUserSafety` hook
- Update profile page to use components
- Acceptance: safety functionality works identically

---

PR 25 – Extract CookingSection components
- Create `src/components/profile/CookingSection.tsx` (wrapper)
- Create `src/components/profile/PreferredCuisinesField.tsx`
- Create `src/components/profile/EquipmentField.tsx`
- Create `src/components/profile/SpiceToleranceField.tsx`
- Create `src/components/profile/DislikedIngredientsField.tsx`
- Create `src/components/profile/CookingSaveButton.tsx`
- Uses `useCookingPreferences` hook
- Update profile page to use components
- Acceptance: cooking functionality works identically

---

PR 26 – Extract Account components
- Create `src/components/profile/EmailCard.tsx`
- Create `src/components/profile/PasswordCard.tsx`
- Update profile page to use components
- Acceptance: email/password functionality works identically

---

PR 27 – Simplify main profile page
- Remove direct state management for preferences (now in hooks)
- Remove duplicate update logic (now in useProfileUpdate)
- Keep only:
  - Tab state management
  - Avatar upload logic
  - Email/password forms
  - Layout composition
- Acceptance: page is <500 lines, all functionality preserved

---

PR 28 – Add hook tests
- Create `src/hooks/profile/__tests__/useUserSafety.test.ts`
- Create `src/hooks/profile/__tests__/useCookingPreferences.test.ts`
- Create `src/hooks/profile/__tests__/useUsernameAvailability.test.ts`
- Create `src/hooks/profile/__tests__/useProfileBasics.test.ts`
- Create `src/hooks/__tests__/useProfileUpdate.test.ts`
- Test loading states, error handling, validation
- Acceptance: all hook tests pass, >80% coverage

---

PR 29 – Add component tests
- Create `src/components/profile/__tests__/AvatarCard.test.tsx`
- Create `src/components/profile/__tests__/BioCard.test.tsx`
- Create `src/components/profile/__tests__/ProfileInfoForm.test.tsx`
- Create `src/components/profile/__tests__/SafetySection.test.tsx`
- Create `src/components/profile/__tests__/CookingSection.test.tsx`
- Test component rendering, user interactions, hook integration
- Acceptance: all component tests pass

---

PR 30 – Update documentation
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

✅ **All components extracted and tested**
- UI logic moved from page to atomic components
- Each component has comprehensive tests
- Components use hooks for business logic

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
