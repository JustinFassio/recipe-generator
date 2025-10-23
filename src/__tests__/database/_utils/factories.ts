import { SupabaseClient } from '@supabase/supabase-js';

export async function createUserAndProfile(admin: SupabaseClient) {
  const email = `test+${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'Password123!';

  // Create user via Supabase Auth Admin API
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    throw new Error(`Failed to create user: ${authError.message}`);
  }

  const user = authData.user;
  if (!user) {
    throw new Error('User creation succeeded but no user returned');
  }

  // Create profile
  const { error: profileError } = await admin.from('profiles').insert({
    id: user.id,
    username: `user_${Math.random().toString(36).slice(2, 8)}`,
    full_name: 'Test User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.warn('Profile creation failed:', profileError.message);
  }

  return {
    user,
    email,
    password,
  };
}

export function uniqueUsername(base = 'user'): string {
  return `${base}_${Math.random().toString(36).slice(2, 8)}`.toLowerCase();
}
