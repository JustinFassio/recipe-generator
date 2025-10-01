# Phase 0 – Recipe Description: PR Plan (Restart)

Goal: deliver description support in safe, reviewable increments (≤ 1,500 LOC each), no infra churn.

## PR 1 — Types, schema, and minimal UI (no persistence)

- Scope: add optional description to zod form schema (default ''), align TS types (persisted string | null; UI normalized to ''). Add textarea to recipe form and read-only block to recipe view. Parser normalizes to ''.
- Out of scope: DB writes, migrations, prompt changes.
- Tests: unit (schema), component (form/view).
- Guardrails: no changes to src/lib/supabase.ts or env.

## PR 2 — Persona/prompt updates (AI output schema only)

- Scope: update SAVE_RECIPE_PROMPT and personas to include description and guidance. No runtime/env changes; no DB changes.
- Tests: unit snapshot of prompt templates.

## PR 3 — Persistence: DB migration + read/write

- Scope: add nullable description columns to recipes and recipe_content_versions (additive). API/client read/write; UI tolerates null. Version payloads carry description.
- Safety: additive migration; no backfill required; treat null and '' as empty.
- Tests: integration save/load with and without description.

## PR 4 — Versioning integration

- Scope: include description in new version creation and diff logic; treat null/'' equivalently.
- Tests: integration on versioned UI.

## PR 5 — E2E coverage

- Scope: happy-path for editing, saving, viewing description (stub AI).

## PR 6 — Image generation prefers description

- Scope: prompt builders prefer description; UI nudge.
- Tests: unit on prompt builder.

## Guardrails (All PRs)

- No changes to src/lib/supabase.ts or env handling.
- Keep PRs small; avoid refactors.
- CI must pass (build, unit/component).
