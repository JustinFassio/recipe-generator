# GitHub Secrets Setup for Critical Path Tests

This document explains how to configure the required GitHub repository secrets for the critical path testing workflow.

## Required Secrets

You need to add these secrets to your GitHub repository using the values from your local `.env` file:

### 🔑 Critical Secrets (Required)

1. **VITE_SUPABASE_URL**
   - Value: Copy from your local `.env` file (starts with `https://`)
   - Purpose: Supabase database connection for integration tests

2. **VITE_SUPABASE_ANON_KEY**
   - Value: Copy from your local `.env` file (long JWT token)
   - Purpose: Supabase anonymous key for RLS-protected database access

### 🔑 Optional Secrets (Recommended)

3. **VITE_OPENAI_MODEL**
   - Value: `gpt-4o-mini` (or your preferred model)
   - Purpose: OpenAI model configuration (has fallback if missing)

4. **OPENAI_API_KEY**
   - Value: Copy from your local `.env` file (starts with `sk-`)
   - Purpose: OpenAI API access for server-side AI parsing tests

## How to Add Secrets

### Method 1: GitHub Web Interface

1. Go to your repository on GitHub
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: [Copy from your local `.env` file]
   - Click **Add secret**
6. Repeat for each required secret

### Method 2: GitHub CLI (if installed)

```bash
# Navigate to your repository directory
cd "/Users/justinfassio/Local Sites/Recipe Generator"

# Add the critical secrets (replace with actual values from your .env file)
gh secret set VITE_SUPABASE_URL --body "YOUR_SUPABASE_URL_HERE"
gh secret set VITE_SUPABASE_ANON_KEY --body "YOUR_SUPABASE_ANON_KEY_HERE"

# Add optional secrets
gh secret set VITE_OPENAI_MODEL --body "gpt-4o-mini"
gh secret set OPENAI_API_KEY --body "YOUR_OPENAI_API_KEY_HERE"
```

## What the Tests Will Do

With these secrets configured, the critical path tests will:

1. ✅ **Validate secrets are present** - Fail immediately if critical secrets missing
2. ✅ **Test Supabase connection** - Verify credentials work and aren't expired
3. ✅ **Test database schema** - Ensure required tables exist
4. ✅ **Run integration tests** - Test recipe CRUD operations end-to-end
5. ✅ **Validate AI endpoints** - Test API structure and configuration

## Security Notes

- ✅ The Supabase anonymous key is designed for client-side use with RLS policies
- ✅ These are the same credentials used in your production environment
- ✅ GitHub repository secrets are encrypted and only accessible during workflow runs
- ⚠️ OpenAI API key should be monitored for usage/billing

## Testing the Setup

After adding the secrets, you can test by:

1. **Push to your branch** - The workflow will run automatically
2. **Check workflow status** in the Actions tab
3. **Review logs** to see which secrets are working

## Troubleshooting

If the workflow fails:

- **"Secret is missing"** → Add the missing secret to GitHub repository settings
- **"Supabase connection failed"** → Check if your Supabase project is active and credentials are valid
- **"Recipe versioning table not accessible"** → Run database migrations to ensure schema is up-to-date

---

**Created**: September 2025  
**Purpose**: Enable critical path testing in CI/CD pipeline  
**Status**: Ready for implementation

> **Note**: Secrets have been configured in GitHub repository settings.
