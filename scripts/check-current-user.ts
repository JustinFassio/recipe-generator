#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkCurrentUser() {
  console.log('🔍 Checking current user state...\n');

  // Get all users
  const { data: users, error: usersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 50,
  });

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  console.log(`Found ${users.users.length} users:\n`);

  for (const user of users.users) {
    console.log(`👤 User: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Last Sign In: ${user.last_sign_in_at}`);
    console.log('');

    // Get profile data
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, username, full_name, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log(`   ❌ Profile error: ${profileError.message}`);
    } else {
      console.log(`   📋 Profile:`);
      console.log(`      Username: ${profile.username || 'NULL'}`);
      console.log(`      Full Name: ${profile.full_name || 'NULL'}`);
      console.log(`      Updated: ${profile.updated_at}`);
    }

    // Get username record
    const { data: usernameRecord, error: usernameError } = await admin
      .from('usernames')
      .select('username, user_id, created_at')
      .eq('user_id', user.id)
      .single();

    if (usernameError && usernameError.code !== 'PGRST116') {
      console.log(`   ❌ Username record error: ${usernameError.message}`);
    } else if (usernameRecord) {
      console.log(`   🏷️  Username record: ${usernameRecord.username}`);
    } else {
      console.log(`   🏷️  No username record found`);
    }

    console.log('---');
  }
}

checkCurrentUser().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
