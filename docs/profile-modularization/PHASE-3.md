## Phase 3: Finalization, Quality, and Cleanup (Small PRs)

Goal: Polish the modularized profile feature after Phase 1 (components) and Phase 2 (hooks). Eliminate duplication, harden quality, and leave the page as a thin orchestrator with excellent DX and UX. No user-visible changes unless explicitly stated.

Keep using Markdown for plan docs to improve PR review legibility and anchor linking.

Quality gates for every PR

- Build: `npm run build`
- Type check: `npx tsc --noEmit`
- Tests: `npm run test:run`
- Lint/format: `npm run lint`, `npm run format:check`
- Re-run relevant manual QA flows (avatar, bio, basics, safety, cooking)

---

PR 18 – Centralize domain constants & types (safe consolidation)

- Files:
  - `src/components/profile/constants.ts`
  - `src/components/profile/types.ts` (optional)
- Actions:
  - Move repeated lists (allergens, dietary restrictions, cuisines, equipment) to `constants.ts`
  - Define narrow union types where sensible (e.g., `Units = 'metric' | 'imperial'`)
  - Export stable shapes for component props in `types.ts` (optional)
- Tests: ensure imports compile; no behavior change
- Acceptance:
  - [ ] No copy change; components import from constants
  - [ ] TS types improve editor hints and safety

---

PR 19 – Shared primitives refinement (single source of truth)

- Scope: `SectionCard`, `FieldLabel`, `InlineIconInput`, `TagToggleGroup`, `RangeWithTicks`
- Actions:
  - Ensure long-text handling (wrapping/overflow) is implemented in primitives, remove ad-hoc per-page classes
  - Add minimal aria/label support in primitives
  - Add tests for text wrapping and aria attributes where applicable
- Acceptance:
  - [ ] Profile page drops bespoke wrapping classes; visual parity maintained

---

PR 20 – Toast/feedback utilities unification (optional)

- File: `src/hooks/profile/useSaveFeedback.ts` or `src/lib/feedback.ts`
- Actions:
  - Provide a `withFeedback(asyncFn, { success, error })` helper
  - Replace duplicated try/catch toast logic in save handlers
- Tests: unit test wrapper; mock toast hook
- Acceptance:
  - [ ] Identical toast UX; less repetition in page/components

---

PR 21 – Accessibility audit & fixes

- Actions:
  - Verify labels/ids association for inputs
  - Ensure toggle groups have accessible names/roles
  - Confirm keyboard navigation for chip add/remove flows
  - Add aria-live or inline status where appropriate for loading
- Tests: RTL checks for roles/names; keyboard interaction tests for critical fields
- Acceptance:
  - [ ] No regressions; improved a11y without visible changes

---

PR 22 – Performance & stability pass

- Actions:
  - Add `React.memo` to heavy field components where props are stable
  - Use `useCallback`/`useMemo` to stabilize handler arrays passed to toggles
  - Confirm no unnecessary re-renders in profiler (informal check)
- Tests: none required beyond behavior; rely on existing suite
- Acceptance:
  - [ ] No behavior change; smoother interactions on large lists

---

PR 23 – Tests uplift (targeted)

- Actions:
  - Add hook unit tests coverage: `useProfileBasics`, `useUserSafety`, `useCookingPreferences`, `useUsernameAvailability`
  - Add interaction tests for TagToggleGroup and RangeWithTicks
- Acceptance:
  - [ ] Coverage improves for the profile feature without brittle tests

---

PR 24 – Storybook stories (optional, dev-only)

- Files under `.storybook/` and stories next to components (if Storybook is adopted)
- Actions:
  - Create stories for each atomic component to aid visual QA
- Acceptance:
  - [ ] No runtime deps impact; stories are dev-only

---

PR 25 – Cleanup and dead code removal

- Actions:
  - Remove any leftover inline helpers from `profile-page.tsx` replaced by hooks
  - Prune unused imports and types
  - Ensure barrel exports (if added) are consistent
- Acceptance:
  - [ ] `src/pages/profile-page.tsx` is a thin orchestrator with tabs/layout + composition only

---

Release checklist (final PR in Phase 3)

- [ ] All profile flows verified manually on desktop and mobile
- [ ] Tests green; build/type-check clean
- [ ] Lint/format pass
- [ ] No regressions in copy or RLS-backed persistence

Rollback strategy

- Each PR is isolated; revert the last PR on failure
- Avoid cross-cutting renames within a single PR

Out of scope

- New features or UI redesigns
- Changing API contracts in `src/lib/*` beyond what hooks already use
