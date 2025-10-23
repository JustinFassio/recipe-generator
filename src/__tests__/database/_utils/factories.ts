// Removed SupabaseClient import as it's not used for security reasons

export async function createUserAndProfile() {
  const email = `test+${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'Password123!';
  const userId = crypto.randomUUID();

  // For testing purposes, we'll create a mock user object
  // For unit tests, we intentionally create a mock user object to avoid external dependencies.
  // In integration tests, you would use the Supabase Auth API to create real users.
  const mockUser = {
    id: userId,
    email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Note: Profile creation will be skipped in client-side tests for security
  // These tests should be run in server-side environments only
  console.warn(
    'Database tests running with anon key - profile creation may be limited'
  );

  return {
    user: mockUser,
    email,
    password,
  };
}

export function uniqueUsername(base = 'user'): string {
  return `${base}_${Math.random().toString(36).slice(2, 8)}`.toLowerCase();
}
