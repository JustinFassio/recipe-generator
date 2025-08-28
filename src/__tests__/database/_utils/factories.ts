import type { SupabaseClient } from '@supabase/supabase-js';

export async function createUserAndProfile(
  admin: SupabaseClient,
  opts?: { username?: string | null; fullName?: string }
) {
  const email = `test+${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'Password123!';

  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userErr || !userRes?.user)
    throw userErr ?? new Error('Failed to create user');

  const { error: profErr } = await admin.from('profiles').insert({
    id: userRes.user.id,
    username: opts?.username ?? null,
    full_name: opts?.fullName ?? 'Test User',
    units: 'imperial',
    time_per_meal: 30,
    skill_level: 'intermediate',
  });
  if (profErr) throw profErr;

  if (opts?.username) {
    const { error: unameErr } = await admin.from('usernames').insert({
      user_id: userRes.user.id,
      username: opts.username,
    });
    if (unameErr) throw unameErr;
  }

  return { user: userRes.user, email, password };
}

export function uniqueUsername(base = 'user'): string {
  return `${base}_${Math.random().toString(36).slice(2, 8)}`.toLowerCase();
}
