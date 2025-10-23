import type { SupabaseClient } from '@supabase/supabase-js';

export async function createUserAndProfile(
  admin: SupabaseClient,
  opts?: { username?: string | null; fullName?: string }
) {
  const email = `test+${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'Password123!';
  const userId = crypto.randomUUID();

  // For testing purposes, we'll create a mock user object
  // In a real test environment, you would use the Supabase Auth API
  const mockUser = {
    id: userId,
    email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Create profile
  const { error: profErr } = await admin.from('profiles').insert({
    id: userId,
    username: opts?.username ?? null,
    full_name: opts?.fullName ?? 'Test User',
    units: 'imperial',
    time_per_meal: 30,
    skill_level: 'intermediate',
  });
  if (profErr) throw profErr;

  if (opts?.username) {
    const { error: unameErr } = await admin.from('usernames').insert({
      user_id: userId,
      username: opts.username,
    });
    if (unameErr) throw unameErr;
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
