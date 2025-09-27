# Kitchen Inventory Feature - Implementation Plan

**Module:** features/kitchen-inventory  
**Scope:** Replace "My Groceries" page behavior with a single-source-of-truth Kitchen Inventory that cleanly toggles availability and persists correctly.  
**Status:** Ready to implement

---

## Goals

- Provide a clean, reliable workflow for marking ingredients In Stock (Available) or Out of Stock (Unavailable).
- Ensure Save persists only `groceries` (kitchen inventory) and reloads consistently.
- Remove data source conflicts and never pass invalid categories to item toggles.

---

## Non-Goals (Phase 1)

- Renaming database columns (`groceries` → `kitchen_inventory`)
- System-wide terminology renames or page route renames
- Shopping list automation or dual-write logic

These may be handled in a later feature iteration.

---

## Architecture

- Source of truth: `useGroceries()`
  - State: `groceries: Record<string, string[]>`
  - Actions: `toggleIngredient`, `saveGroceries`, `loadGroceries`
  - Utilities: `hasIngredient`, `getCategoryCount`
- UI components:
  - `GroceryCard` (kept minimal):
    - Reads `hasIngredient(category, ingredient)`
    - Calls `toggleIngredient(category, ingredient)`
    - No autosave, no database writes
  - Page (Kitchen Inventory view):
    - Resolves actual category for every ingredient in All view before rendering `GroceryCard`
    - Save button calls `saveGroceries()` and shows unique-count of selected items

---

## Behavior Contracts

- Toggling a card only mutates local `groceries` state.
- Save persists `groceries` only via `updateUserGroceries(userId, groceries)`.
- After Save, data is reloaded (`loadGroceries`) to confirm consistency with the database.
- IngredientMatcher uses the same `groceries` passed from `useGroceries`.

---

## Acceptance Criteria

- Toggle any item in All view; Save count decrements/increments immediately and correctly.
- Save writes only `groceries` and a subsequent reload reflects the change.
- Refresh page or navigate away/back – availability persists.
- No invalid categories are ever passed to `GroceryCard` (never "all").

---

## Tasks

1. Page wiring (single source of truth)

- Ensure `src/pages/groceries-page.tsx` uses only `useGroceries()` for rendering and Save
- Resolve category in All view via a dedicated helper; skip items with unknown category

2. Hook guardrails

- `useGroceries` manages only `groceries`
- `selectedCount` derived from unique items across categories
- `saveGroceries()` persists only `groceries` and reloads

3. Component guardrails

- `GroceryCard` remains minimal (toggle local only, no autosave)

4. QA and validation

- Unit: verify `toggleIngredient` add/remove semantics
- E2E: toggle → Save → refresh → persist across navigation
- Supabase query spot-check to verify `groceries` reflects changes

---

## Risks & Mitigations

- Risk: Hidden or filtered items skew Save count  
  Mitigation: Save count computed from `groceries` unique items only
- Risk: All view category mis-resolution  
  Mitigation: Central resolver with fallback scan and null-guard

---

## Rollout

- Ship as an isolated feature update to the existing page
- Follow-up iteration may introduce terminology and schema renames under a separate feature

---

## References

- Previous plan: `docs/shopping-cart/GROCERY_WORKFLOW_FIX_PLAN.md` (superseded by this feature plan)
- Component audit: `docs/shopping-cart/GROCERY_CARD_AUDIT.md`
- Ingredient matcher audit: `docs/shopping-cart/INGREDIENT_MATCHER_AUDIT.md`
