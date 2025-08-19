# Seed Users (Local Development)

These test accounts are created by the local seeding script and are intended for development only.

## Credentials

- alice@example.com — Password123! (username: alice)
- bob@example.com — Password123! (username: bob)
- cora@example.com — Password123! (username: cora)

## How to reseed locally

1. Reset DB and run SQL seeds (e.g., sample recipes):

```bash
supabase db reset
```

2. Seed users via Admin API (requires local service role key):

```bash
SUPABASE_SERVICE_ROLE_KEY=$(supabase status | sed -n 's/^service_role key: //p' | tr -d '\n') \
SUPABASE_URL=http://127.0.0.1:54321 \
npm run seed
```

- The script lives at `scripts/seed-users.ts` and uses `public.claim_username_atomic` to set usernames.
- Profiles, user safety, and cooking preferences are populated for each user.

Note: These accounts exist only in your local Supabase stack and should never be used in production.
