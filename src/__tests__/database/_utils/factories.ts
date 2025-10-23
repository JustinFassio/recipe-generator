import { SupabaseClient } from '@supabase/supabase-js';

export async function createUserAndProfile(admin?: SupabaseClient) {
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

  // Create profile if admin client is provided
  if (admin) {
    console.log('Creating profile for user:', userId);
    const { error: profileError } = await admin.from('profiles').insert({
      id: userId,
      username: uniqueUsername(),
      full_name: 'Test User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.warn(`Profile creation failed:`, profileError);
    } else {
      console.log('Profile created successfully');
    }
  } else {
    console.warn(
      'Database tests running with anon key - profile creation may be limited'
    );
  }

  return {
    user: mockUser,
    email,
    password,
  };
}

export function uniqueUsername(base = 'user'): string {
  return `${base}_${Math.random().toString(36).slice(2, 8)}`.toLowerCase();
}
