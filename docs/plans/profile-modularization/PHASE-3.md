## Phase 3: Finalization, Quality, and Cleanup (Small PRs)

**STATUS: 📋 PLANNING** - Ready to begin after Phase 2 completion

Goal: Polish the modularized profile feature after Phase 1 (components) and Phase 2 (hooks). Eliminate duplication, harden quality, and leave the page as a thin orchestrator with excellent DX and UX. No user-visible changes unless explicitly stated.

Keep using Markdown for plan docs to improve PR review legibility and anchor linking.

Quality gates for every PR

- Build: `npm run build`
- Type check: `npx tsc --noEmit`
- Tests: `npm run test:run`
- Lint/format: `npm run lint`, `npm run format:check`
- Re-run relevant manual QA flows (avatar, bio, basics, safety, cooking)

---

## Current State After Phase 2

### ✅ **Already Completed** (from Phases 1 & 2):

- **7 specialized hooks** extracted and tested (97.13% coverage)
- **19 atomic components** created and tested
- **Profile page simplified** to 313 lines (78% total reduction)
- **Comprehensive testing** with 137 total tests passing
- **Accessibility improvements** already implemented (htmlFor/id attributes)
- **Constants already centralized** where needed (username validation, time per meal bounds)
- **Toast/feedback patterns** already established in hooks

### 🔄 **Phase 3 Focus Areas**:

1. **Constants consolidation** - Move scattered lists to centralized constants
2. **Performance optimization** - React.memo and useCallback stabilization
3. **Accessibility audit** - Verify and enhance a11y compliance
4. **Code cleanup** - Remove any remaining duplication or dead code
5. **Documentation** - Developer guides and testing documentation

---

PR 18 – Centralize domain constants & types (safe consolidation)

- Files:
  - `src/components/profile/constants.ts`
  - `src/components/profile/types.ts` (optional)
- Actions:
  - Move repeated lists to `constants.ts`:
    - `commonAllergens` from `AllergiesField.tsx`
    - `commonDietaryRestrictions` from `DietaryRestrictionsField.tsx`
    - `spiceLabels` from `SpiceToleranceField.tsx`
    - `timePerMealLabels` from `ProfileInfoForm.tsx`
  - Define narrow union types where sensible (e.g., `Units = 'metric' | 'imperial'`)
  - Export stable shapes for component props in `types.ts` (optional)
- Tests: ensure imports compile; no behavior change
- Acceptance:
  - [ ] No copy change; components import from constants
  - [ ] TS types improve editor hints and safety

---

PR 19 – Performance & stability pass

- Actions:
  - Add `React.memo` to heavy field components where props are stable:
    - `TagToggleGroup` (if not already memoized)
    - `RangeWithTicks` (if not already memoized)
    - `InlineIconInput` (if not already memoized)
  - Use `useCallback`/`useMemo` to stabilize handler arrays passed to toggles
  - Confirm no unnecessary re-renders in profiler (informal check)
- Tests: none required beyond behavior; rely on existing suite
- Acceptance:
  - [ ] No behavior change; smoother interactions on large lists

---

PR 20 – Accessibility audit & fixes

- Actions:
  - Verify labels/ids association for inputs (already partially done)
  - Ensure toggle groups have accessible names/roles
  - Confirm keyboard navigation for chip add/remove flows
  - Add aria-live or inline status where appropriate for loading
  - Review and enhance existing a11y implementations
- Tests: RTL checks for roles/names; keyboard interaction tests for critical fields
- Acceptance:
  - [ ] No regressions; improved a11y without visible changes

---

PR 21 – Cleanup and dead code removal

- Actions:
  - Remove any leftover inline helpers from `profile-page.tsx` replaced by hooks
  - Prune unused imports and types
  - Ensure barrel exports are consistent
  - Remove any duplicate validation logic now centralized in hooks
- Acceptance:
  - [ ] `src/pages/profile-page.tsx` is a thin orchestrator with tabs/layout + composition only

---

PR 22 – Developer documentation

- Files:
  - `docs/profile-modularization/DEV-GUIDE.md`
  - `docs/profile-modularization/TESTING-GUIDE.md`
- Actions:
  - Document profile feature architecture (page → hooks → components → lib)
  - Document component props conventions and hook contracts
  - Document testing patterns and mock strategies
  - Add examples for extending the profile system
- Acceptance:
  - [ ] Clear documentation for future developers

---

PR 23 – Storybook stories (optional, dev-only)

- Files under `.storybook/` and stories next to components (if Storybook is adopted)
- Actions:
  - Create stories for each atomic component to aid visual QA
  - Focus on profile-specific components first
- Acceptance:
  - [ ] No runtime deps impact; stories are dev-only

---

Release checklist (final PR in Phase 3)

- [ ] All profile flows verified manually on desktop and mobile
- [ ] Tests green; build/type-check clean
- [ ] Lint/format pass
- [ ] No regressions in copy or RLS-backed persistence
- [ ] Performance audit shows no regressions
- [ ] Accessibility audit passes WCAG 2.1 AA

Rollback strategy

- Each PR is isolated; revert the last PR on failure
- Avoid cross-cutting renames within a single PR

Out of scope

- New features or UI redesigns
- Changing API contracts in `src/lib/*` beyond what hooks already use
- E2E testing (covered in separate initiatives)

---

## Notes

- **Phase 1 Achievement**: 1,461 → 495 lines (66% reduction)
- **Phase 2 Achievement**: 494 → 313 lines (37% additional reduction)
- **Combined Achievement**: 1,461 → 313 lines (78% total reduction)
- **Test Coverage**: 97.13% for hooks, comprehensive component testing
- **Architecture**: Perfect separation of concerns achieved
