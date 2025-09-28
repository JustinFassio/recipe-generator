# GitHub Actions Secrets Setup

To fix the failing Pre-PR Verification tests, you need to add the following secrets to your GitHub repository:

## Required Secrets

Go to your repository settings → Secrets and variables → Actions, and add these secrets:

### 1. VITE_SUPABASE_URL

- **Value**: `http://127.0.0.1:54321`
- **Description**: Local Supabase URL for testing

### 2. VITE_SUPABASE_ANON_KEY

- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- **Description**: Anonymous key for Supabase testing

## How to Add Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add each secret with the name and value above

## Additional Environment Variables (if needed)

If you also need to add other environment variables for the tests, you can add:

- `OPENAI_API_KEY`: Your OpenAI API key (if tests need AI functionality)
- `VITE_OPENAI_MODEL`: `gpt-4o-mini` (default model for testing)

## Verification

After adding these secrets, the GitHub Actions workflow should be able to:

- Connect to Supabase for database tests
- Run authentication tests without errors
- Complete the Pre-PR Verification successfully

## Notes

- These are the same values used in your local `.env.local` file
- The Supabase URL points to the local development instance
- The anonymous key is the default Supabase demo key
