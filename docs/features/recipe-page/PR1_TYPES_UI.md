# PR 1 — Types/Schema + Minimal UI

## Scope

- Add description to zod schema with default ''.
- TS types: description: string | null for persisted; UI normalized ''.
- Form textarea + view display; parser normalization.

## Files

- src/lib/schemas.ts, src/lib/types.ts
- src/components/recipes/recipe-form.tsx, src/components/recipes/recipe-view.tsx
- src/lib/recipe-parser\*.ts

## Tests

- Unit: schema accepts/omits description; types compile.
- Component: form renders textarea; view displays when provided.

## Guardrails

- No DB, no supabase.ts/env changes.
