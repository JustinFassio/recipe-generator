import { SupabaseClient } from '@supabase/supabase-js';

export async function createUserAndProfile(admin?: SupabaseClient) {
  const email = `test+${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'Password123!';

  if (admin) {
    // Create a real user via Supabase Auth API for integration tests
    console.log('Creating real user via Supabase Auth API');
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const userId = authData.user.id;
    console.log('User created with ID:', userId);

    // Create profile for the real user
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

    return {
      user: authData.user,
      email,
      password,
    };
  } else {
    // Create a mock user for unit tests (no database operations)
    const userId = crypto.randomUUID();
    const mockUser = {
      id: userId,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Created mock user for unit tests (no database operations)');

    return {
      user: mockUser,
      email,
      password,
    };
  }
}

export function uniqueUsername(base = 'user'): string {
  return `${base}_${Math.random().toString(36).slice(2, 8)}`.toLowerCase();
}
