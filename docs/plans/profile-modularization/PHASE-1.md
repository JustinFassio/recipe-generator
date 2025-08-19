## Phase 1: Small, Verified Edits – Profile Page Modularization

Scope: Extract the highest-impact, low-risk sections from `src/pages/profile-page.tsx` into atomic components, keeping behavior 1:1. Each PR focuses on a single, isolated slice with its own tests and QA.

Gates for every PR

- Must compile: `npx tsc --noEmit`
- Tests green: `npm run test:run` (or targeted tests)
- Lint/format pass: `npm run lint`, `npm run format:check`
- Build passes: `npm run build`
- No copy/UX changes; only internal structure

---

PR 01 – Scaffold and Shared Primitives (no behavior change)

- Files added (no page edits yet):
  - `src/components/profile/shared/SectionCard.tsx`
  - `src/components/profile/shared/FieldLabel.tsx`
  - `src/components/profile/shared/InlineIconInput.tsx`
  - `src/components/profile/shared/TagToggleGroup.tsx`
  - `src/components/profile/shared/RangeWithTicks.tsx`
- Content:
  - Minimal wrappers using current DaisyUI classes (no hard props yet beyond `className`, `children`, and basic value/onChange for inputs)
  - Export barrels optional
- Tests:
  - Basic render/snapshot tests for each primitive
- QA:
  - Build/lint/format only; page untouched

Verification checklist

- [ ] New files tree matches plan
- [ ] Primitives render with no runtime warnings
- [ ] No changes to `profile-page.tsx`

---

PR 02 – Extract AvatarCard

- Files:
  - `src/components/profile/basic/AvatarCard.tsx`
- Move logic/UI:
  - Avatar preview (uses `profile.avatar_url` prop)
  - File input, upload button, spinner overlay
  - Props (UI-only):
    - `avatarUrl: string | null`
    - `loading: boolean`
    - `onUpload(file: File): Promise<void> | void`
  - No Supabase calls inside component
- Page changes:
  - Replace inline avatar section with `<AvatarCard avatarUrl={profile.avatar_url} loading={avatarLoading} onUpload={handleAvatarUpload} />`
- Tests:
  - Renders avatar or fallback icon
  - Triggers `onUpload` when file selected
- QA focus:
  - Upload flow works; toasts appear; spinner shows; profile refresh intact

Verification checklist

- [ ] Visual parity for the avatar card
- [ ] Upload still updates avatar and refreshes profile
- [ ] No new warnings in console/tests

---

PR 03 – Extract BioCard

- Files:
  - `src/components/profile/basic/BioCard.tsx`
- Move logic/UI:
  - About Me header, textarea with 500-char counter, helper text, Save button
  - Props:
    - `bio: string`
    - `onChange(value: string): void`
    - `onSave(): Promise<void> | void`
    - `loading: boolean`
  - No Supabase calls inside component
- Page changes:
  - Replace inline bio section with `<BioCard bio={bio} onChange={setBio} onSave={handleBioSave} loading={loading} />`
  - Implement `handleBioSave` in page reusing existing `updateProfile({ bio })` + `refreshProfile()` + toasts
- Tests:
  - Renders counter, respects maxLength, calls handlers
- QA focus:
  - Bio saves as before, copy unchanged, text wrapping preserved

Verification checklist

- [ ] Bio save unchanged; counter reflects length
- [ ] Helper text wraps; no overflow
- [ ] No regression in loading state

---

PR 04 – Extract ProfileInfoForm (structure only)

- Files:
  - `src/components/profile/basic/ProfileInfoForm.tsx`
- Move logic/UI:
  - Full Name input
  - Username: current display + claim/change input + status icon + helper text
  - Preferences: region, language, units, time per meal, skill level
  - Submit button
  - Props (controlled form):
    - `fullName`, `onFullNameChange`
    - `username`, `onUsernameChange`, `usernameAvailable`, `usernameChecking`
    - `region`, `onRegionChange`
    - `language`, `onLanguageChange`
    - `units`, `onUnitsChange`
    - `timePerMeal`, `onTimePerMealChange`
    - `skillLevel`, `onSkillLevelChange`
    - `onSubmit`, `submitting`
    - `currentUsername: string | null` (for current display block)
  - No Supabase calls or debouncing inside the component
- Page changes:
  - Wire existing state/handlers into `<ProfileInfoForm />`
  - Keep debounced username check and submit logic in page (unchanged)
- Tests:
  - Field renders reflect props; submit calls `onSubmit`
  - Helper text present; icons render by availability state
- QA focus:
  - Full profile update and username claim still work
  - Slider/Select interactions preserved

Verification checklist

- [ ] Name/username/preferences submit successfully
- [ ] Debounce behavior unchanged (still in page)
- [ ] Validation, patterns, min/max intact

---

PR 05 – SafetySection wrapper (structure only)

- Files:
  - `src/components/profile/safety/SafetySection.tsx`
- Move logic/UI:
  - Section heading and intro paragraph only
  - Props: `children`, optional `className`
- Page changes:
  - Wrap existing safety fields in `<SafetySection>`
- Tests:
  - Renders heading and children
- QA focus:
  - No visual change besides component boundary

Verification checklist

- [ ] Visual parity confirmed
- [ ] No functional change

---

PR 06 – Extract MedicalConditionsField

- Files:
  - `src/components/profile/safety/MedicalConditionsField.tsx`
- Move logic/UI:
  - Toggle buttons + custom input (Enter to add)
  - Props (controlled): `values: string[]`, `onChange(values: string[]): void`
- Page changes:
  - Replace inline medical conditions block; keep state in page
- Tests:
  - Toggles add/remove; enter adds custom
- QA focus:
  - Values persist and save via existing button

Verification checklist

- [ ] All toggles function; custom entry works
- [ ] Styling/labels unchanged

---

PR 07 – Extract AllergiesField & DietaryRestrictionsField

- Files:
  - `src/components/profile/safety/AllergiesField.tsx`
  - `src/components/profile/safety/DietaryRestrictionsField.tsx`
- Move logic/UI for each list + custom entry
- Props (controlled): `values: string[]`, `onChange(values: string[]): void`
- Page changes: swap inline blocks for components
- Tests: same pattern as medical conditions
- QA: toggle + custom entry parity

Verification checklist

- [ ] Allergies and dietary toggles/custom inputs work
- [ ] No text overflow regressions

---

PR 08 – Extract SafetySaveButton

- Files:
  - `src/components/profile/safety/SafetySaveButton.tsx`
- Move UI-only button; props: `onClick`, `loading`
- Page changes: use component and keep `updateUserSafety` call in page
- Tests: button renders correct label by `loading`, calls handler
- QA: safety save unchanged

Verification checklist

- [ ] Save still persists arrays and toasts

---

PR 09 – CookingSection wrapper (structure only)

- Files:
  - `src/components/profile/cooking/CookingSection.tsx`
- Wrap existing cooking fields; no logic moved
- QA: visual parity

Verification checklist

- [ ] Wrapper only; no behavior change

---

PR 10 – Extract Cooking Fields (4 components)

- Files:
  - `PreferredCuisinesField.tsx`, `EquipmentField.tsx`, `SpiceToleranceField.tsx`, `DislikedIngredientsField.tsx`
- Props (controlled): corresponding arrays/values + change handlers
- Page changes: replace inline cooking blocks
- Tests: toggles, range change, chip removal + enter-to-add
- QA: cooking save unchanged

Verification checklist

- [ ] All interactions preserved
- [ ] Save still persists and toasts

---

Post-Phase 1 (not in this phase)

- Move state/side-effects into feature hooks (`useUserSafety`, `useCookingPreferences`, etc.) in Phase 2
- Final page simplification in Phase 3

Notes

- Keep each PR limited to its slice; avoid cross-cutting refactors
- If a slice exceeds ~300–500 changed lines, split it further (e.g., Allergies and Dietary in separate PRs)
