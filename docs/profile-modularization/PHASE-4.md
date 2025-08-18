## Phase 4: Tests Uplift (Unit + Integration) and Developer Docs

Scope: Strengthen unit/integration coverage for the modularized profile feature and add concise developer docs. No E2E. No user-visible changes.

Quality gates (every PR)

- `npm run build`
- `npx tsc --noEmit`
- `npm run test:run`
- `npm run lint` && `npm run format:check`

---

PR 26 – Test harness + mocks hardening

- Enhance `src/test/setup.ts` with:
  - Supabase client mocks (auth.getUser, from(...).select/eq/upsert/update)
  - Toast hook mock (`use-toast`)
  - Router helpers if needed
- Add `src/test/mocks/supabase.ts` for reusable stubs
- Acceptance: existing tests pass without ad‑hoc per‑test mocks

---

PR 27 – Unit tests: shared primitives

- Targets: `SectionCard`, `FieldLabel`, `InlineIconInput`, `TagToggleGroup`, `RangeWithTicks`
- Assertions:
  - Renders/props pass‑through
  - Long text wraps (no overflow)
  - Basic a11y roles/labels where applicable

---

PR 28 – Unit tests: basic cards/forms

- Targets: `AvatarCard`, `BioCard`, `ProfileInfoForm`
- Assertions:
  - Callbacks fired (onUpload/onSave/onSubmit)
  - Username helper text/icons render by availability
  - Slider/select changes propagate via props

---

PR 29 – Unit tests: safety & cooking fields

- Targets: `MedicalConditionsField`, `AllergiesField`, `DietaryRestrictionsField`, `PreferredCuisinesField`, `EquipmentField`, `SpiceToleranceField`, `DislikedIngredientsField`
- Assertions:
  - Toggle add/remove; Enter-to-add custom; chip remove

---

PR 30 – Hook tests (logic-focused)

- Targets: `useUsernameAvailability`, `useProfileBasics`, `useUserSafety`, `useCookingPreferences`
- Mock supabase helpers; assert state transitions, debounce, and save calls

---

PR 31 – Integration tests (component composition)

- Mount `profile-page` with mocked `AuthProvider` and supabase helpers
- Flows:
  - Bio save
  - Basics submit (name/units/time/skill)
  - Safety save (medical/allergies/dietary)
  - Cooking save (cuisines/equipment/spice/dislikes)
- Assert toasts and payloads

---

PR 32 – Developer docs

- Add `docs/profile-modularization/DEV-GUIDE.md` (structure below)
- Add `docs/profile-modularization/TESTING-GUIDE.md` (structure below)

Acceptance for Phase 4

- [ ] Unit + integration coverage added across components and hooks
- [ ] Docs present and accurate; no E2E introduced

---

DEV-GUIDE.md (outline)

- Overview of profile feature architecture (page → hooks → components → lib)
- Directory map (`src/components/profile/*`, `src/hooks/profile/*`)
- Component props conventions (controlled inputs, onSave/onSubmit)
- Hook contracts and expected side-effects
- Adding a new field (steps, where to wire, tests to add)

TESTING-GUIDE.md (outline)

- Where tests live and naming conventions
- Using `src/test/setup.ts` and `mocks/supabase.ts`
- Patterns for unit testing components and hooks
- Patterns for integration mounting of `profile-page`
- Running coverage locally and in CI (if configured)
